package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"path/filepath"
	"time"
)

// 发射器接口
type EventEmitter interface {
	Emit(event string, data interface{})
}

type TaskService struct {
	task_repo *repository.TaskRepository
	event_emitter EventEmitter
}

func NewTaskService(repo *repository.TaskRepository, emitter EventEmitter) *TaskService {
	return &TaskService{
		task_repo: repo,
		event_emitter: emitter,
	}
}

func (b *TaskService) NewTask(filePath string, contentStyle string) models.Response {

	task := models.TaskRecord{
		FileName:     filepath.Base(filePath),
		ContentStyle: contentStyle,
		CreatedAt:    time.Now().Format(time.RFC3339),
		Progress:     models.NotStarted,
	}

	id, err := b.task_repo.Create(&task)
	if err != nil {
		return errorResponse("Failed to create task: " + err.Error())
	}

	new_task, err := b.task_repo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}

	defer func ()  {
		resp := b.GetTaskList()
		b.event_emitter.Emit("task_list_update", resp)
	}()
	return successResponse("Task created successfully", new_task)
}

func (b *TaskService) GetTaskList() models.Response {
	taskList, err := b.task_repo.GetAll()
	if err != nil {
		return errorResponse("Failed to retrieve task list: " + err.Error())
	}
	return successResponse("Task list retrieved successfully", taskList)
}

func (b *TaskService) mockProcessTask(taskID int) {
	// 模拟任务处理流程，逐步更新进度
	task,err:= b.task_repo.GetByID(taskID)
	if err != nil {
		return
	}
	// 处理音频
	task.Progress = models.ExtractingAudio
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp := b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
	time.Sleep(1 * time.Second)
	task.Progress = models.ExtractingAudioSuccess
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)

	// 提取文本
	task.Progress = models.ExtractingText
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
	time.Sleep(2 * time.Second)
	task.Progress = models.ExtractingTextSuccess
	task.TranscriptionText = "{\"start\": 0.0,  \"text\": \"Hello, world!\"}"
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)

	task.Progress = models.GeneratingStyle
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
	time.Sleep(3 * time.Second)
	task.Progress = models.GeneratingStyleSuccess
	task.GeneratedContent = "{\"content\": \"This is a generated note based on the transcription.\"}"
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
}
