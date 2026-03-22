package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"AI-ViewNote/backend/utils"
	"context"
	"encoding/json"
	"errors"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos/enum"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
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
	task_repo     *repository.TaskRepository
	config_repo   *repository.ConfigRepository
	event_emitter EventEmitter
}

func NewTaskService(repo *repository.TaskRepository, config_repo *repository.ConfigRepository, emitter EventEmitter) *TaskService {
	return &TaskService{
		task_repo:     repo,
		config_repo:   config_repo,
		event_emitter: emitter,
	}
}

func (s *TaskService) NewTask(filePath string, contentStyle string) models.Response {

	task := models.TaskRecord{
		FilePath:     filePath,
		ContentStyle: contentStyle,
		CreatedAt:    time.Now().Format(time.RFC3339),
		Progress:     models.NotStarted,
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
		resp := s.GetTaskList()
		s.event_emitter.Emit("task_list_update", resp)
		go s.processTask(id)
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

func (s *TaskService) processTask(taskID int) {
	task, err := s.task_repo.GetByID(taskID)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Failed to retrieve task for processing: " + err.Error()})
		return
	}

	// 提取视频音频
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Starting audio extraction for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingAudio
	err = s.task_repo.Update(task)
	audioPath, err := s.extractAudioWithFFmpeg(task.FilePath)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Audio extraction failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		task.Progress = models.ExtractingAudioFailed
		s.task_repo.Update(task)
		return
	}
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Audio extraction completed for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingAudioSuccess
	s.task_repo.Update(task)

	// 处理音频（上传到TOS并调用ASR）
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Starting audio processing for task ID " + strconv.Itoa(taskID)})
	task.Progress = models.ExtractingText
	s.task_repo.Update(task)
	data, err := s.processAudio(audioPath)
	if err != nil {
		s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Audio processing failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
		task.Progress = models.ExtractingTextFailed
		s.task_repo.Update(task)
		return
	}
	s.event_emitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Audio processing completed for task ID " + strconv.Itoa(taskID)})
	task.TranscriptionText = data
	task.Progress = models.ExtractingTextSuccess
	s.task_repo.Update(task)

}

// 提取音频
func (s *TaskService) extractAudioWithFFmpeg(videoPath string) (string, error) {
	ffmpegPath := utils.GetFFmpegPath()
	if ffmpegPath == "" {
		return "", errors.New("FFmpeg path not configured")
	}

	tempDir, err := os.MkdirTemp("", "AI-ViewNote-ffmpeg-")
	if err != nil {
		return "", errors.New("Failed to create temp directory: " + err.Error())
	}

	outputFile := filepath.Join(tempDir, "output_audio.mp3")
	utils.ExtractAudioWithFFmpeg(videoPath, outputFile)
	return outputFile, nil
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

	output, err := client.PutObjectV2(ctx, &tos.PutObjectV2Input{
		PutObjectBasicInput: tos.PutObjectBasicInput{
			Bucket: StorageBucketCfg.Value,
			Key:    filepath.Base(audioPath),
		},
		Content: f,
	})
	if err != nil {
		return "", errors.New("Failed to upload audio file: " + err.Error())
	}
	log.Println("PutObjectV2 Request ID:", output.RequestID)

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
