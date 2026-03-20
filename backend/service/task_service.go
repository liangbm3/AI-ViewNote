package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"path/filepath"
	"time"
)

type TaskService struct {
	task_repo *repository.TaskRepository
}

func NewTaskService(repo *repository.TaskRepository) *TaskService {
	return &TaskService{
		task_repo: repo,
	}
}


func (b *TaskService) NewTask(filePath string, contentStyle string) models.Response {

	task := models.TaskRecord{
		FileName:     filepath.Base(filePath),
		ContentStyle: contentStyle,
		CreatedAt:    time.Now().Format(time.RFC3339),
		Progress:     models.Failed,
	}

	id, err := b.task_repo.Create(&task)
	if err != nil {
		return errorResponse("Failed to create task: " + err.Error())
	}

	new_task, err := b.task_repo.GetByID(id)
	if err != nil {
		return errorResponse("Failed to retrieve task: " + err.Error())
	}
	return successResponse("Task created successfully", new_task)
}

func (b *TaskService) GetTaskList() models.Response {
	taskList, err := b.task_repo.GetAll()
	if err != nil {
		return errorResponse("Failed to retrieve task list: " + err.Error())
	}
	return successResponse("Task list retrieved successfully", taskList)
}
