package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"path/filepath"
	"time"
	"log"
	"encoding/json"
	"strconv"
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
		go b.mockProcessTask(id)
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

func (b *TaskService) GetTaskByID(id int) models.Response {
	task, err := b.task_repo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}
	return successResponse("Task retrieved successfully", task)
}

func (b *TaskService) mockProcessTask(taskID int) {
	log.Println("Starting mock processing for task ID:", taskID)
	// 模拟任务处理流程，逐步更新进度
	task,err:= b.task_repo.GetByID(taskID)
	if err != nil {
		log.Println("Error retrieving task:", err)
		return
	}
	// 处理音频
	log.Println("Processing audio for task ID:", taskID)
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
	log.Println("Extracting text for task ID:", taskID)
	task.Progress = models.ExtractingText
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
	time.Sleep(2 * time.Second)
	task.Progress = models.ExtractingTextSuccess
	task.TranscriptionText = json.RawMessage([]byte(`[{"start_time": 0, "text": "大家好，今天我们来学习人工智能的基础知识"}, {"start_time": 3000, "text": "人工智能是指由人制造出来的机器所表现出来的智能"}, {"start_time": 6000, "text": "它通过学习、推理、感知等能力模拟人类的思维过程"}]`))
	b.task_repo.UpdateProgress(taskID, task.Progress)
	b.task_repo.UpdateTranscriptionText(taskID, string(task.TranscriptionText))
	log.Println("Updated transcription text for task ID:", taskID)

	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)

	// 生成内容
	log.Println("Generating content for task ID:", taskID)
	task.Progress = models.GeneratingStyle
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
	time.Sleep(3 * time.Second)
	task.Progress = models.GeneratingStyleSuccess
	task.MarkdownContent = "## This is a generated note based on the transcription.\n id:"+ strconv.Itoa(task.ID)
	b.task_repo.UpdateMarkdownContent(taskID, task.MarkdownContent)
	b.task_repo.UpdateProgress(taskID, task.Progress)
	resp = b.GetTaskList()
	b.event_emitter.Emit("task_list_update", resp)
}
