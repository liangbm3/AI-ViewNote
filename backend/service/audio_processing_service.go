package service

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"AI-ViewNote/backend/utils"
)

type AudioProcessingService struct{}

func NewAudioProcessingService() *AudioProcessingService {
	return &AudioProcessingService{}
}

func (s *AudioProcessingService) ExtractAudio(videoPath string, audioPath string) error {
	cleanedPath := strings.TrimSpace(videoPath)
	if cleanedPath == "" {
		return errors.New("video path is empty")
	}
	if !filepath.IsAbs(cleanedPath) {
		return fmt.Errorf("invalid video path: expected absolute path but got %q", cleanedPath)
	}
	if _, err := os.Stat(cleanedPath); err != nil {
		return fmt.Errorf("video file not found: %s (%w)", cleanedPath, err)
	}

	ffmpegPath := utils.GetFFmpegPath()
	if ffmpegPath == "" {
		return errors.New("FFmpeg path not configured")
	}

	return utils.ExtractAudioWithFFmpeg(cleanedPath, audioPath)
}

func (s *AudioProcessingService) ValidateAudioFile(audioPath string) error {
	if audioPath == "" {
		return errors.New("audio path is empty")
	}

	fileInfo, err := os.Stat(audioPath)
	if err != nil {
		return fmt.Errorf("failed to stat audio file: %w", err)
	}

	if fileInfo.IsDir() {
		return errors.New("audio path points to a directory, not a file")
	}

	if fileInfo.Size() == 0 {
		return errors.New("audio file is empty")
	}

	return nil
}