package service

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"AI-ViewNote/backend/models"
	wnotifications "github.com/wailsapp/wails/v3/pkg/services/notifications"
)

type NotificationService struct {
	notificationService *wnotifications.NotificationService
	configService       *ConfigService
}

func NewNotificationService(notificationService *wnotifications.NotificationService, configService *ConfigService) *NotificationService {
	return &NotificationService{
		notificationService: notificationService,
		configService:       configService,
	}
}

func (s *NotificationService) SendTaskCompletedNotification(task models.TaskRecord) error {
	if s.notificationService == nil {
		return nil
	}

	desktopNotificationsEnabled, err := s.configService.GetDesktopNotificationsConfig()
	if err != nil {
		return fmt.Errorf("failed to get desktop notification config: %w", err)
	}

	if !desktopNotificationsEnabled {
		return nil
	}

	authorized, err := s.notificationService.CheckNotificationAuthorization()
	if err != nil {
		return fmt.Errorf("failed to check notification authorization: %w", err)
	}

	if !authorized {
		granted, requestErr := s.notificationService.RequestNotificationAuthorization()
		if requestErr != nil {
			return fmt.Errorf("failed to request notification authorization: %w", requestErr)
		}
		if !granted {
			return fmt.Errorf("desktop notification authorization not granted")
		}
	}

	fileName := filepath.Base(strings.TrimSpace(task.FilePath))
	if fileName == "" || fileName == "." || fileName == string(filepath.Separator) {
		fileName = "video"
	}

	err = s.notificationService.SendNotification(wnotifications.NotificationOptions{
		ID:    fmt.Sprintf("task-%d-%d", task.ID, time.Now().UnixNano()),
		Title: "AI-ViewNote 转换完成",
		Body:  fmt.Sprintf("%s 已处理完成。", fileName),
		Data: map[string]interface{}{
			"task_id":   task.ID,
			"file_path": task.FilePath,
			"style":     task.Style,
		},
	})

	if err != nil {
		return fmt.Errorf("failed to send desktop notification: %w", err)
	}

	return nil
}
