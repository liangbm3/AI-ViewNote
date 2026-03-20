package service

import (
	"AI-ViewNote/backend/models"
)

func successResponse(message string, data interface{}) models.Response {
	return models.Response{
		Success: true,
		Message: message,
		Data:    data,
	}
}

func errorResponse(message string) models.Response {
	return models.Response{
		Success: false,
		Message: message,
	}
}
