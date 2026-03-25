package service

import (
	"fmt"
	"strings"

	"AI-ViewNote/backend/models"
)

type SubtitleService struct{}

func NewSubtitleService() *SubtitleService {
	return &SubtitleService{}
}

func (s *SubtitleService) GenerateSRT(utterances []models.Utterance) string {
	var result strings.Builder

	for i, utterance := range utterances {
		index := i + 1
		startTime := s.FormatSRTTime(utterance.StartTime)
		endTime := s.FormatSRTTime(utterance.EndTime)

		result.WriteString(fmt.Sprintf("%d\n", index))
		result.WriteString(fmt.Sprintf("%s --> %s\n", startTime, endTime))
		result.WriteString(fmt.Sprintf("%s\n\n", utterance.Text))
	}

	return result.String()
}

func (s *SubtitleService) GenerateVTT(utterances []models.Utterance) string {
	var result strings.Builder

	result.WriteString("WEBVTT\n\n")

	for i, utterance := range utterances {
		index := i + 1
		startTime := s.FormatVTTTime(utterance.StartTime)
		endTime := s.FormatVTTTime(utterance.EndTime)

		result.WriteString(fmt.Sprintf("%d\n", index))
		result.WriteString(fmt.Sprintf("%s --> %s\n", startTime, endTime))
		result.WriteString(fmt.Sprintf("%s\n\n", utterance.Text))
	}

	return result.String()
}

func (s *SubtitleService) GeneratePlainText(utterances []models.Utterance) string {
	var result strings.Builder

	for _, utterance := range utterances {
		timeStamp := s.FormatPlainTime(utterance.StartTime)
		result.WriteString(fmt.Sprintf("[%s] %s\n", timeStamp, utterance.Text))
	}

	return result.String()
}

func (s *SubtitleService) FormatSRTTime(milliseconds int) string {
	totalSeconds := milliseconds / 1000
	hours := totalSeconds / 3600
	minutes := (totalSeconds % 3600) / 60
	seconds := totalSeconds % 60
	ms := milliseconds % 1000

	return fmt.Sprintf("%02d:%02d:%02d,%03d", hours, minutes, seconds, ms)
}

func (s *SubtitleService) FormatVTTTime(milliseconds int) string {
	totalSeconds := milliseconds / 1000
	hours := totalSeconds / 3600
	minutes := (totalSeconds % 3600) / 60
	seconds := totalSeconds % 60
	ms := milliseconds % 1000

	return fmt.Sprintf("%02d:%02d:%02d.%03d", hours, minutes, seconds, ms)
}

func (s *SubtitleService) FormatPlainTime(milliseconds int) string {
	totalSeconds := milliseconds / 1000
	minutes := totalSeconds / 60
	seconds := totalSeconds % 60

	return fmt.Sprintf("%02d:%02d", minutes, seconds)
}