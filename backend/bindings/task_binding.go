package bindings

import (
	"AI-ViewNote/backend/models"
	"path/filepath"
	"time"
)

type TaskBinding struct {
}

func NewTaskBinding() *TaskBinding {
	return &TaskBinding{}
}

type Response = models.Response

func (b *TaskBinding) NewTask(filePath string, contentStyle string) Response {

	task := models.TaskRecord{
		ID:           1, 
		Title:        "Sample Task",
		FileName:     filepath.Base(filePath),
		ContentStyle: contentStyle,
		CreatedAt:    time.Now().Format(time.RFC3339),
		Progress:     models.NotStarted,
	}

	return successResponse("Task created successfully", task)
}

func (b* TaskBinding) GetTaskList() Response {
	taskList := []models.TaskRecord{
		{
			ID:           1, 
			Title:        "Sample Task 1",
			FileName:     "sample1.mp4",
			ContentStyle: "Style A",
			CreatedAt:    time.Now().Add(-time.Hour).Format(time.RFC3339),
			Progress:     models.ExtractingAudio,
		},
		{
			ID:           2,
			Title:        "Sample Task 2",
			FileName:     "sample2.mp4",
			ContentStyle: "Style B",
			CreatedAt:    time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			Progress:     models.Completed,
		},

	}
	return successResponse("Task list retrieved successfully", taskList)
}