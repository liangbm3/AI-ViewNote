package bindings

import (
	"AI-ViewNote/backend/models"
	"path/filepath"
	"time"
)

type ProcessBinding struct {
}

func NewProcessBinding() *ProcessBinding {
	return &ProcessBinding{}
}

type Response = models.Response

func (b *ProcessBinding) NewTask(filePath string, contentStyle string) Response {

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
