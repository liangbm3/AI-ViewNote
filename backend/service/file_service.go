package service

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type FileService struct{}

func NewFileService() *FileService {
	return &FileService{}
}

// 获取文件大小
func (s *FileService) GetFileSize(filePath string) (int64, error) {
	cleanedPath := strings.TrimSpace(filePath)
	if cleanedPath == "" {
		return 0, errors.New("file path is empty")
	}
	if !filepath.IsAbs(cleanedPath) {
		return 0, fmt.Errorf("invalid file path: expected absolute path but got %q", cleanedPath)
	}

	fileInfo, err := os.Stat(cleanedPath)
	if err != nil {
		return 0, fmt.Errorf("failed to stat file: %w", err)
	}
	if fileInfo.IsDir() {
		return 0, errors.New("path points to a directory, not a file")
	}

	return fileInfo.Size(), nil
}

// 获取下载目录路径
func (s *FileService) GetDownloadDir() (string, error) {
	// Get user home directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	// Build download directory path
	downloadDir := filepath.Join(homeDir, "Downloads")

	// Check if download directory exists, create if it doesn't
	if _, err := os.Stat(downloadDir); os.IsNotExist(err) {
		err = os.MkdirAll(downloadDir, 0755)
		if err != nil {
			return "", err
		}
	}

	return downloadDir, nil
}

// 将内容保存到指定文件路径
func (s *FileService) SaveFile(content string, filePath string) error {
	return os.WriteFile(filePath, []byte(content), 0644)
}