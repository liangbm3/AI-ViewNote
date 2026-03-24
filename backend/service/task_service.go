package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"AI-ViewNote/backend/utils"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	ark "github.com/sashabaranov/go-openai"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos/enum"
	wnotifications "github.com/wailsapp/wails/v3/pkg/services/notifications"
)

type submitResponse struct {
	Resp struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
		ID      string `json:"id"`
	} `json:"resp"`
}

type queryResponse struct {
	Resp struct {
		Code       int                `json:"code"`
		Message    string             `json:"message"`
		Utterances []models.Utterance `json:"utterances"`
	} `json:"resp"`
}

// 发射器接口
type EventEmitter interface {
	Emit(event string, data interface{})
}

type TaskService struct {
	task_repo            *repository.TaskRepository
	config_repo          *repository.ConfigRepository
	event_emitter        EventEmitter
	notification_service *wnotifications.NotificationService
}

func NewTaskService(repo *repository.TaskRepository, config_repo *repository.ConfigRepository, emitter EventEmitter, notification_service *wnotifications.NotificationService) *TaskService {
	return &TaskService{
		task_repo:            repo,
		config_repo:          config_repo,
		event_emitter:        emitter,
		notification_service: notification_service,
	}
}

func (s *TaskService) NewTask(filePath string, contentStyle string) models.Response {

	task := models.TaskRecord{
		FilePath:  filePath,
		Style:     models.ContentStyle(contentStyle),
		CreatedAt: time.Now().Format(time.RFC3339),
		Progress:  models.NotStarted,
	}

	id, err := s.task_repo.Create(&task)
	if err != nil {
		return errorResponse("Failed to create task: " + err.Error())
	}

	new_task, err := s.task_repo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}

	defer func() {
		go s.task(id)
	}()
	return successResponse("Task created successfully", new_task)
}

func (s *TaskService) GetTaskList() models.Response {
	taskList, err := s.task_repo.GetAll()
	if err != nil {
		return errorResponse("Failed to retrieve task list: " + err.Error())
	}
	return successResponse("Task list retrieved successfully", taskList)
}

func (s *TaskService) GetTaskByID(id int) models.Response {
	task, err := s.task_repo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}
	return successResponse("Task retrieved successfully", task)
}

func (s *TaskService) GetFileSize(filePath string) (int64, error) {
	cleanedPath := strings.TrimSpace(filePath)
	if cleanedPath == "" {
		return 0, errors.New("file path is empty")
	}
	if !filepath.IsAbs(cleanedPath) {
		return 0, fmt.Errorf("invalid file path: expected absolute path but got %q", cleanedPath)
	}

	fileInfo, err := os.Stat(cleanedPath)
	if err != nil {
		return 0, fmt.Errorf("failed to stat file: %w", err)
	}
	if fileInfo.IsDir() {
		return 0, errors.New("path points to a directory, not a file")
	}

	return fileInfo.Size(), nil
}

func (s *TaskService) task(taskID int) {
	task, err := s.task_repo.GetByID(taskID)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Failed to retrieve task for processing: " + err.Error()})
		return
	}

	// 创建临时目录
	tempDir, err := os.MkdirTemp("", "AI-ViewNote-ffmpeg-")
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Failed to create temporary directory for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		return
	}

	audioPath := filepath.Join(tempDir, "output_audio.mp3")

	// 处理视频（提取音频）
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Starting audio extraction for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingAudio
	err = s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新
	err = s.extractAudioWithFFmpeg(task.FilePath, audioPath)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Audio extraction failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		task.Progress = models.ExtractingAudioFailed
		s.task_repo.Update(task)
		s.event_emitter.Emit("task_update", nil) // 触发前端更新
		return
	}
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Audio extraction completed for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingAudioSuccess
	s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新

	// 处理音频（上传到TOS并调用ASR）
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Starting audio processing for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingText
	s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新
	data, err := s.processAudio(audioPath)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Audio processing failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		task.Progress = models.ExtractingTextFailed
		s.task_repo.Update(task)
		s.event_emitter.Emit("task_update", nil) // 触发前端更新
		return
	}
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Audio processing completed for task ID " + strconv.Itoa(taskID)})
	task.TranscriptionText = data
	task.Progress = models.ExtractingTextSuccess
	s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新

	// 生成Markdown内容
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Starting markdown generation for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.GeneratingMarkdown
	s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新

	markdown, err := s.generateMarkdown(data, task.Style)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Markdown generation failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		task.Progress = models.GeneratingMarkdownFailed
		s.task_repo.Update(task)
		s.event_emitter.Emit("task_update", nil) // 触发前端更新
		return
	}
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Markdown generation completed for task ID " + strconv.Itoa(taskID)})
	task.MarkdownContent = markdown
	task.Progress = models.GeneratingMarkdownSuccess
	s.task_repo.Update(task)
	s.event_emitter.Emit("task_update", nil) // 触发前端更新
	go s.sendTaskCompletedNotification(*task)
}

func (s *TaskService) sendTaskCompletedNotification(task models.TaskRecord) {
	if s.notification_service == nil {
		return
	}

	desktopNotificationsCfg, err := s.config_repo.GetConfig(models.DesktopNotifications)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{
			Level:   models.LogLevelWarning,
			Message: "Failed to get desktop notification config: " + err.Error(),
		})
		return
	}

	if !strings.EqualFold(strings.TrimSpace(desktopNotificationsCfg.Value), "true") {
		return
	}

	authorized, err := s.notification_service.CheckNotificationAuthorization()
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{
			Level:   models.LogLevelWarning,
			Message: "Failed to check notification authorization: " + err.Error(),
		})
		return
	}

	if !authorized {
		granted, requestErr := s.notification_service.RequestNotificationAuthorization()
		if requestErr != nil {
			s.event_emitter.Emit("log", models.LogMessage{
				Level:   models.LogLevelWarning,
				Message: "Failed to request notification authorization: " + requestErr.Error(),
			})
			return
		}
		if !granted {
			s.event_emitter.Emit("log", models.LogMessage{
				Level:   models.LogLevelWarning,
				Message: "Desktop notification authorization not granted",
			})
			return
		}
	}

	fileName := filepath.Base(strings.TrimSpace(task.FilePath))
	if fileName == "" || fileName == "." || fileName == string(filepath.Separator) {
		fileName = "video"
	}

	err = s.notification_service.SendNotification(wnotifications.NotificationOptions{
		ID:    fmt.Sprintf("task-%d-%d", task.ID, time.Now().UnixNano()),
		Title: "AI-ViewNote 转换完成",
		Body:  fmt.Sprintf("%s 已处理完成。", fileName),
		Data: map[string]interface{}{
			"task_id":   task.ID,
			"file_path": task.FilePath,
			"style":     task.Style,
		},
	})
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{
			Level:   models.LogLevelWarning,
			Message: "Failed to send desktop notification: " + err.Error(),
		})
	}
}

// 提取音频
func (s *TaskService) extractAudioWithFFmpeg(videoPath string, audioPath string) error {
	cleanedPath := strings.TrimSpace(videoPath)
	if cleanedPath == "" {
		return errors.New("video path is empty")
	}
	if !filepath.IsAbs(cleanedPath) {
		return fmt.Errorf("invalid video path: expected absolute path but got %q", cleanedPath)
	}
	if _, err := os.Stat(cleanedPath); err != nil {
		return fmt.Errorf("video file not found: %s (%w)", cleanedPath, err)
	}

	ffmpegPath := utils.GetFFmpegPath()
	if ffmpegPath == "" {
		return errors.New("FFmpeg path not configured")
	}
	err := utils.ExtractAudioWithFFmpeg(cleanedPath, audioPath)
	if err != nil {
		return err
	}
	return nil
}

func (s *TaskService) processAudio(audioPath string) ([]models.Utterance, error) {

	signedURL, err := s.uploadAudioToTOS(audioPath)
	if err != nil {
		return nil, errors.New("Failed to upload audio to TOS: " + err.Error())
	}
	asrID, err := s.startAsr(signedURL)
	if err != nil {
		return nil, errors.New("Failed to start ASR task: " + err.Error())
	}
	for {
		utterances, err := s.queryAsr(asrID)
		if err != nil {
			return nil, err
		}
		if utterances != nil {
			return utterances, nil
		}
		// ASR 任务仍在进行中，等待一段时间后继续查询
		time.Sleep(5 * time.Second)
	}
}

// 上传到tos并获取URL
func (s *TaskService) uploadAudioToTOS(audioPath string) (string, error) {
	StorageAccessKeyCfg, err := s.config_repo.GetConfig(models.StorageAccessKey)
	if err != nil {
		return "", errors.New("Failed to get StorageAccessKey config: " + err.Error())
	}
	StorageSecretKeyCfg, err := s.config_repo.GetConfig(models.StorageSecretKey)
	if err != nil {
		return "", errors.New("Failed to get StorageSecretKey config: " + err.Error())
	}
	StorageEndpointCfg, err := s.config_repo.GetConfig(models.StorageEndpoint)
	if err != nil {
		return "", errors.New("Failed to get StorageEndpoint config: " + err.Error())
	}
	StorageRegionCfg, err := s.config_repo.GetConfig(models.StorageRegion)
	if err != nil {
		return "", errors.New("Failed to get StorageRegion config: " + err.Error())
	}
	StorageBucketCfg, err := s.config_repo.GetConfig(models.StorageBucket)
	if err != nil {
		return "", errors.New("Failed to get StorageBucket config: " + err.Error())
	}

	ctx := context.Background()
	credential := tos.NewStaticCredentials(StorageAccessKeyCfg.Value, StorageSecretKeyCfg.Value)
	client, err := tos.NewClientV2(StorageEndpointCfg.Value, tos.WithCredentials(credential), tos.WithRegion(StorageRegionCfg.Value))
	if err != nil {
		return "", errors.New("Failed to create TOS client: " + err.Error())
	}

	f, err := os.Open(audioPath)
	if err != nil {
		return "", errors.New("Failed to open audio file: " + err.Error())
	}
	defer f.Close()

	_, err = client.PutObjectV2(ctx, &tos.PutObjectV2Input{
		PutObjectBasicInput: tos.PutObjectBasicInput{
			Bucket: StorageBucketCfg.Value,
			Key:    filepath.Base(audioPath),
		},
		Content: f,
	})
	if err != nil {
		return "", errors.New("Failed to upload audio file: " + err.Error())
	}

	url, err := client.PreSignedURL(&tos.PreSignedURLInput{
		HTTPMethod: enum.HttpMethodGet,
		Bucket:     StorageBucketCfg.Value,
		Key:        filepath.Base(audioPath),
	})
	if err != nil {
		return "", errors.New("Failed to generate pre-signed URL: " + err.Error())
	}
	return url.SignedUrl, nil

}

func (s *TaskService) startAsr(audioURL string) (string, error) {
	volcengineSubmitURL := "https://openspeech.bytedance.com/api/v1/auc/submit"
	aucAppIDCfg, err := s.config_repo.GetConfig(models.AucAppID)
	if err != nil {
		return "", errors.New("Failed to get AucAppID config: " + err.Error())
	}
	aucAccessTokenCfg, err := s.config_repo.GetConfig(models.AucAccessToken)
	if err != nil {
		return "", errors.New("Failed to get AucAccessToken config: " + err.Error())
	}
	aucClusterIDCfg, err := s.config_repo.GetConfig(models.AucClusterID)
	if err != nil {
		return "", errors.New("Failed to get AucClusterID config: " + err.Error())
	}

	payload := map[string]interface{}{
		"app": map[string]string{
			"appid":   aucAppIDCfg.Value,
			"token":   aucAccessTokenCfg.Value,
			"cluster": aucClusterIDCfg.Value,
		},
		"user": map[string]string{
			"uid": utils.GenerateLocalUUID(),
		},
		"audio": map[string]string{
			"format": "mp3",
			"url":    audioURL,
		},
		"request": map[string]interface{}{
			"enable_itn": true,
		},
	}
	respBody, err := utils.PostJSON(volcengineSubmitURL, payload, aucAccessTokenCfg.Value)
	if err != nil {
		return "", errors.New("Failed to submit ASR task: " + err.Error())
	}

	var submitResp submitResponse
	if err := json.Unmarshal(respBody, &submitResp); err != nil {
		return "", errors.New("Failed to parse ASR submission response: " + err.Error())
	}
	return submitResp.Resp.ID, nil
}

func (s *TaskService) queryAsr(taskID string) ([]models.Utterance, error) {
	aucAppIDCfg, err := s.config_repo.GetConfig(models.AucAppID)
	if err != nil {
		return nil, errors.New("Failed to get AucAppID config: " + err.Error())
	}
	aucAccessTokenCfg, err := s.config_repo.GetConfig(models.AucAccessToken)
	if err != nil {
		return nil, errors.New("Failed to get AucAccessToken config: " + err.Error())
	}
	aucClusterIDCfg, err := s.config_repo.GetConfig(models.AucClusterID)
	if err != nil {
		return nil, errors.New("Failed to get AucClusterID config: " + err.Error())
	}

	var (
		volcSuccessCode = 1000
		volcRunningCode = 2000
		volcPendingCode = 2001
	)
	volcengineQueryURL := "https://openspeech.bytedance.com/api/v1/auc/query"
	payload := map[string]string{
		"appid":   aucAppIDCfg.Value,
		"token":   aucAccessTokenCfg.Value,
		"cluster": aucClusterIDCfg.Value,
		"id":      taskID,
	}
	respBody, err := utils.PostJSON(volcengineQueryURL, payload, aucAccessTokenCfg.Value)
	if err != nil {
		return nil, errors.New("Failed to query ASR task: " + err.Error())
	}
	var queryResp queryResponse
	if err := json.Unmarshal(respBody, &queryResp); err != nil {
		return nil, errors.New("Failed to parse ASR query response: " + err.Error())
	}
	switch queryResp.Resp.Code {
	case volcSuccessCode:
		return queryResp.Resp.Utterances, nil
	case volcRunningCode:
		return nil, nil
	case volcPendingCode:
		return nil, nil
	default:
		return nil, errors.New("ASR task failed with message: " + queryResp.Resp.Message)
	}
}

func (s *TaskService) generateMarkdown(data []models.Utterance, style models.ContentStyle) (string, error) {
	text, err := utils.UtterancesToText(data)
	if err != nil {
		return "", errors.New("Failed to convert utterances to text: " + err.Error())
	}

	LlmBaseURL, err := s.config_repo.GetConfig(models.LlmBaseURL)
	if err != nil {
		return "", errors.New("Failed to get LlmBaseURL config: " + err.Error())
	}
	LlmModelID, err := s.config_repo.GetConfig(models.LlmModelID)
	if err != nil {
		return "", errors.New("Failed to get LlmModelID config: " + err.Error())
	}
	LlmApiKey, err := s.config_repo.GetConfig(models.LlmApiKey)
	if err != nil {
		return "", errors.New("Failed to get LlmApiKey config: " + err.Error())
	}

	config := ark.DefaultConfig(LlmApiKey.Value)
	config.BaseURL = LlmBaseURL.Value
	client := ark.NewClientWithConfig(config)

	var content string
	switch style {
	case models.NoteStyle:
		content = noteDefaultPrompt()
	case models.XiaohongshuStyle:
		content = xiaohongshuDefaultPrompt()
	case models.WeChatStyle:
		content = wechatDefaultPrompt()
	case models.SummaryStyle:
		content = summaryDefaultPrompt()
	default:
		return "", errors.New("Unsupported content style: " + string(style))
	}

	resp, err := client.CreateChatCompletion(
		context.Background(),
		ark.ChatCompletionRequest{
			Model: LlmModelID.Value,
			Messages: []ark.ChatCompletionMessage{
				{
					Role:    ark.ChatMessageRoleSystem,
					Content: "你是人工智能助手，请按照用户的要求准确回答问题",
				},
				{
					Role:    ark.ChatMessageRoleUser,
					Content: content + "\n\n" + text,
				},
			},
		},
	)
	if err != nil {
		return "", errors.New("Failed to generate markdown content: " + err.Error())
	}

	// 这里只取第一个回答
	return resp.Choices[0].Message.Content, nil
}
