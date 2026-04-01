package service

import (
	"fmt"
	"os"
	"path/filepath"

	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
)

type TaskProcessor struct {
	audioService        *AudioProcessingService
	cloudStorage        *CloudStorageService
	asrService          *ASRService
	markdownService     *MarkdownGenerationService
	taskRepo            *repository.TaskRepository
	eventEmitter        EventEmitter
	notificationService *NotificationService
}

func NewTaskProcessor(
	audioService *AudioProcessingService,
	cloudStorage *CloudStorageService,
	asrService *ASRService,
	markdownService *MarkdownGenerationService,
	taskRepo *repository.TaskRepository,
	eventEmitter EventEmitter,
	notificationService *NotificationService,
) *TaskProcessor {
	return &TaskProcessor{
		audioService:        audioService,
		cloudStorage:        cloudStorage,
		asrService:          asrService,
		markdownService:     markdownService,
		taskRepo:            taskRepo,
		eventEmitter:        eventEmitter,
		notificationService: notificationService,
	}
}

func (p *TaskProcessor) ProcessTask(taskID int) error {
	task, err := p.taskRepo.GetByID(taskID)
	if err != nil {
		p.emitLog("Failed to retrieve task for processing: "+err.Error(), models.LogLevelError)
		return err
	}

	// Create temporary directory with task-specific name
	tempDir, err := os.MkdirTemp("", fmt.Sprintf("AI-ViewNote-ffmpeg-task%d-", taskID))
	if err != nil {
		p.emitLog(fmt.Sprintf("Failed to create temporary directory for task ID %d: %s", taskID, err.Error()), models.LogLevelError)
		return err
	}
	defer os.RemoveAll(tempDir)

	audioPath := filepath.Join(tempDir, fmt.Sprintf("output_audio_task%d.mp3", taskID))

	// Step 1: Extract audio
	err = p.handleAudioExtraction(task, audioPath)
	if err != nil {
		return err
	}

	// Step 2: Process audio (upload to TOS and call ASR)
	err = p.handleASRProcessing(task, audioPath)
	if err != nil {
		return err
	}

	// Step 3: Generate markdown content
	err = p.handleMarkdownGeneration(task)
	if err != nil {
		return err
	}

	// Step 4: Process screenshots embedded in markdown
	err = p.handleScreenshotProcessing(task, tempDir)
	if err != nil {
		return err
	}

	// Send completion notification
	go p.sendCompletionNotification(*task)

	return nil
}

func (p *TaskProcessor) handleAudioExtraction(task *models.TaskRecord, audioPath string) error {
	p.emitLog(fmt.Sprintf("Starting audio extraction for task ID %d", task.ID), models.LogLevelInfo)
	task.Progress = models.ExtractingAudio
	p.updateTask(task)

	err := p.audioService.ExtractAudio(task.FilePath, audioPath)
	if err != nil {
		p.emitLog(fmt.Sprintf("Audio extraction failed for task ID %d: %s", task.ID, err.Error()), models.LogLevelError)
		task.Progress = models.ExtractingAudioFailed
		p.updateTask(task)
		return err
	}

	p.emitLog(fmt.Sprintf("Audio extraction completed for task ID %d", task.ID), models.LogLevelInfo)
	task.Progress = models.ExtractingAudioSuccess
	p.updateTask(task)
	return nil
}

func (p *TaskProcessor) handleASRProcessing(task *models.TaskRecord, audioPath string) error {
	p.emitLog(fmt.Sprintf("Starting audio processing for task ID %d", task.ID), models.LogLevelInfo)
	task.Progress = models.ExtractingText
	p.updateTask(task)

	// Upload audio to TOS
	signedURL, err := p.cloudStorage.UploadAudio(audioPath)
	if err != nil {
		return fmt.Errorf("failed to upload audio to TOS: %w", err)
	}

	// Start ASR task
	asrID, err := p.asrService.SubmitTask(signedURL)
	if err != nil {
		return fmt.Errorf("failed to start ASR task: %w", err)
	}

	// Poll for ASR results
	data, err := p.asrService.PollResult(asrID)
	if err != nil {
		p.emitLog(fmt.Sprintf("Audio processing failed for task ID %d: %s", task.ID, err.Error()), models.LogLevelError)
		task.Progress = models.ExtractingTextFailed
		p.updateTask(task)
		return err
	}

	p.emitLog(fmt.Sprintf("Audio processing completed for task ID %d", task.ID), models.LogLevelInfo)
	task.TranscriptionText = data
	task.Progress = models.ExtractingTextSuccess
	p.updateTask(task)
	return nil
}

func (p *TaskProcessor) handleMarkdownGeneration(task *models.TaskRecord) error {
	p.emitLog(fmt.Sprintf("Starting markdown generation for task ID %d", task.ID), models.LogLevelInfo)
	task.Progress = models.GeneratingMarkdown
	p.updateTask(task)

	markdown, err := p.markdownService.GenerateMarkdown(task.TranscriptionText, task.Style)
	if err != nil {
		p.emitLog(fmt.Sprintf("Markdown generation failed for task ID %d: %s", task.ID, err.Error()), models.LogLevelError)
		task.Progress = models.GeneratingMarkdownFailed
		p.updateTask(task)
		return err
	}

	p.emitLog(fmt.Sprintf("Markdown generation completed for task ID %d", task.ID), models.LogLevelInfo)
	task.MarkdownContent = markdown
	task.Progress = models.GeneratingMarkdownSuccess
	p.updateTask(task)
	return nil
}

func (p *TaskProcessor) handleScreenshotProcessing(task *models.TaskRecord, tempDir string) error {
	p.emitLog(fmt.Sprintf("Starting screenshot processing for task ID %d", task.ID), models.LogLevelInfo)
	task.Progress = models.ProcessingScreenshots
	p.updateTask(task)

	processed, err := p.markdownService.ProcessScreenshots(task.MarkdownContent, task.FilePath, tempDir)
	if err != nil {
		p.emitLog(fmt.Sprintf("Screenshot processing failed for task ID %d: %s", task.ID, err.Error()), models.LogLevelError)
		task.Progress = models.ProcessingScreenshotsFailed
		p.updateTask(task)
		return err
	}

	p.emitLog(fmt.Sprintf("Screenshot processing completed for task ID %d", task.ID), models.LogLevelInfo)
	task.MarkdownContent = processed
	task.Progress = models.ProcessingScreenshotsSuccess
	p.updateTask(task)
	return nil
}

func (p *TaskProcessor) updateTask(task *models.TaskRecord) error {
	err := p.taskRepo.Update(task)
	if err != nil {
		return err
	}
	p.eventEmitter.Emit("task_update", nil)
	return nil
}

func (p *TaskProcessor) emitLog(message string, level models.LogLevel) {
	if p.eventEmitter != nil {
		p.eventEmitter.Emit("log", models.LogMessage{Level: level, Message: message})
	}
}

func (p *TaskProcessor) sendCompletionNotification(task models.TaskRecord) {
	if p.notificationService != nil {
		err := p.notificationService.SendTaskCompletedNotification(task)
		if err != nil {
			p.emitLog(fmt.Sprintf("Failed to send completion notification: %s", err.Error()), models.LogLevelWarning)
		}
	}
}
