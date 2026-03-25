package service

import "AI-ViewNote/backend/models"

// EventEmitter interface for event handling
type EventEmitter interface {
	Emit(event string, data interface{})
}

// ASR response structures
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