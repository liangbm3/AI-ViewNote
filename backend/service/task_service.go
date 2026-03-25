package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"fmt"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	wnotifications "github.com/wailsapp/wails/v3/pkg/services/notifications"
)

type TaskService struct {
	taskRepo              *repository.TaskRepository
	configService         *ConfigService
	taskProcessor         *TaskProcessor
	fileService           *FileService
	subtitleService       *SubtitleService
	eventEmitter          EventEmitter
	notificationService   *NotificationService
}

func NewTaskService(
	taskRepo *repository.TaskRepository,
	configRepo *repository.ConfigRepository,
	eventEmitter EventEmitter,
	notificationService *wnotifications.NotificationService,
) *TaskService {
	configService := NewConfigService(configRepo)

	// Initialize all the modular services
	audioService := NewAudioProcessingService()

	// Get configurations for services that need them
	tosConfig := &models.TOSConfig{}
	if tosCfg, err := configService.GetTOSConfig(); err == nil {
		tosConfig = tosCfg
	}
	cloudStorage := NewCloudStorageService(tosConfig)

	asrConfig := &models.ASRConfig{}
	if asrCfg, err := configService.GetASRConfig(); err == nil {
		asrConfig = asrCfg
	}
	asrService := NewASRService(asrConfig)

	llmConfig := &models.LLMConfig{}
	if llmCfg, err := configService.GetLLMConfig(); err == nil {
		llmConfig = llmCfg
	}
	markdownService := NewMarkdownGenerationService(llmConfig)

	fileService := NewFileService()
	subtitleService := NewSubtitleService()

	appNotificationService := NewNotificationService(notificationService, configService)

	taskProcessor := NewTaskProcessor(
		audioService,
		cloudStorage,
		asrService,
		markdownService,
		taskRepo,
		eventEmitter,
		appNotificationService,
	)

	return &TaskService{
		taskRepo:            taskRepo,
		configService:       configService,
		taskProcessor:       taskProcessor,
		fileService:         fileService,
		subtitleService:     subtitleService,
		eventEmitter:        eventEmitter,
		notificationService: appNotificationService,
	}
}

func (s *TaskService) ResetStuckTasks() models.Response {
	err := s.taskRepo.ResetStuckTasks()
	if err != nil {
		return errorResponse("Failed to reset stuck tasks: " + err.Error())
	}
	s.eventEmitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
		Message: "Reset stuck tasks on application startup"})
	return successResponse("Stuck tasks reset successfully", nil)
}

func (s *TaskService) NewTask(filePath string, contentStyle string) models.Response {
	task := models.TaskRecord{
		FilePath:  filePath,
		Style:     models.ContentStyle(contentStyle),
		CreatedAt: time.Now().Format(time.RFC3339),
		Progress:  models.NotStarted,
	}

	id, err := s.taskRepo.Create(&task)
	if err != nil {
		return errorResponse("Failed to create task: " + err.Error())
	}

	newTask, err := s.taskRepo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}

	defer func() {
		go s.task(id)
	}()
	return successResponse("Task created successfully", newTask)
}

func (s *TaskService) GetTaskList() models.Response {
	taskList, err := s.taskRepo.GetAll()
	if err != nil {
		return errorResponse("Failed to retrieve task list: " + err.Error())
	}
	return successResponse("Task list retrieved successfully", taskList)
}

func (s *TaskService) GetTaskByID(id int) models.Response {
	task, err := s.taskRepo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}
	return successResponse("Task retrieved successfully", task)
}

func (s *TaskService) GetFileSize(filePath string) (int64, error) {
	return s.fileService.GetFileSize(filePath)
}

func (s *TaskService) task(taskID int) {
	err := s.taskProcessor.ProcessTask(taskID)
	if err != nil {
		s.eventEmitter.Emit("log", models.LogMessage{Level: models.LogLevelError,
			Message: "Task processing failed for task ID " + strconv.Itoa(taskID) + ": " + err.Error()})
	}
}

func (s *TaskService) sendTaskCompletedNotification(task models.TaskRecord) {
	err := s.notificationService.SendTaskCompletedNotification(task)
	if err != nil {
		s.eventEmitter.Emit("log", models.LogMessage{
			Level:   models.LogLevelWarning,
			Message: "Failed to send completion notification: " + err.Error(),
		})
	}
}

func (s *TaskService) DownloadMarkdown(taskID int) models.Response {
	task, err := s.taskRepo.GetByID(taskID)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}

	if task.MarkdownContent == "" {
		return errorResponse("No markdown content available for this task")
	}

	// 获取文件名
	fileName := filepath.Base(task.FilePath)
	if fileName == "." || fileName == string(filepath.Separator) {
		fileName = fmt.Sprintf("task_%d", taskID)
	}
	fileName = strings.TrimSuffix(fileName, filepath.Ext(fileName))
	markdownFileName := fileName + ".md"

	// 获取用户下载目录
	downloadDir, err := s.fileService.GetDownloadDir()
	if err != nil {
		return errorResponse("Failed to get download directory: " + err.Error())
	}

	filePath := filepath.Join(downloadDir, markdownFileName)

	// 保存文件
	err = s.fileService.SaveFile(task.MarkdownContent, filePath)
	if err != nil {
		return errorResponse("Failed to save markdown file: " + err.Error())
	}

	if s.eventEmitter != nil {
		s.eventEmitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
			Message: fmt.Sprintf("Markdown file saved to: %s", filePath)})
	}

	return successResponse("Markdown file saved successfully", map[string]interface{}{
		"file_path":   filePath,
		"filename":    markdownFileName,
		"task_id":     taskID,
	})
}

func (s *TaskService) DownloadSubtitles(taskID int, format string) models.Response {
	task, err := s.taskRepo.GetByID(taskID)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}

	if len(task.TranscriptionText) == 0 {
		return errorResponse("No subtitle content available for this task")
	}

	// 获取文件名
	fileName := filepath.Base(task.FilePath)
	if fileName == "." || fileName == string(filepath.Separator) {
		fileName = fmt.Sprintf("task_%d", taskID)
	}
	fileName = strings.TrimSuffix(fileName, filepath.Ext(fileName))

	var content string
	var fileExtension string

	switch format {
	case "srt":
		content = s.subtitleService.GenerateSRT(task.TranscriptionText)
		fileExtension = ".srt"
	case "vtt":
		content = s.subtitleService.GenerateVTT(task.TranscriptionText)
		fileExtension = ".vtt"
	case "txt":
		content = s.subtitleService.GeneratePlainText(task.TranscriptionText)
		fileExtension = ".txt"
	default:
		return errorResponse("Unsupported subtitle format: " + format)
	}

	subtitleFileName := fileName + fileExtension

	// 获取用户下载目录
	downloadDir, err := s.fileService.GetDownloadDir()
	if err != nil {
		return errorResponse("Failed to get download directory: " + err.Error())
	}

	filePath := filepath.Join(downloadDir, subtitleFileName)

	// 保存文件
	err = s.fileService.SaveFile(content, filePath)
	if err != nil {
		return errorResponse("Failed to save subtitle file: " + err.Error())
	}

	if s.eventEmitter != nil {
		s.eventEmitter.Emit("log", models.LogMessage{Level: models.LogLevelInfo,
			Message: fmt.Sprintf("Subtitle file saved to: %s", filePath)})
	}

	return successResponse("Subtitle file saved successfully", map[string]interface{}{
		"file_path":   filePath,
		"filename":    subtitleFileName,
		"format":      format,
		"task_id":     taskID,
	})
}