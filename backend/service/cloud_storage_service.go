package service

import (
	"context"
	"errors"
	"os"
	"path/filepath"

	"AI-ViewNote/backend/models"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos"
	"github.com/volcengine/ve-tos-golang-sdk/v2/tos/enum"
)

type CloudStorageService struct {
	config *models.TOSConfig
}

func NewCloudStorageService(config *models.TOSConfig) *CloudStorageService {
	return &CloudStorageService{
		config: config,
	}
}

// 将音频文件上传到云存储，并返回可访问的URL
func (s *CloudStorageService) UploadAudio(audioPath string) (string, error) {
	ctx := context.Background()

	credential := tos.NewStaticCredentials(s.config.AccessKey, s.config.SecretKey)
	client, err := tos.NewClientV2(s.config.Endpoint, tos.WithCredentials(credential), tos.WithRegion(s.config.Region))
	if err != nil {
		return "", errors.New("Failed to create TOS client: " + err.Error())
	}

	f, err := os.Open(audioPath)
	if err != nil {
		return "", errors.New("Failed to open audio file: " + err.Error())
	}
	defer f.Close()

	_, err = client.PutObjectV2(ctx, &tos.PutObjectV2Input{
		PutObjectBasicInput: tos.PutObjectBasicInput{
			Bucket: s.config.Bucket,
			Key:    filepath.Base(audioPath),
		},
		Content: f,
	})
	if err != nil {
		return "", errors.New("Failed to upload audio file: " + err.Error())
	}

	url, err := client.PreSignedURL(&tos.PreSignedURLInput{
		HTTPMethod: enum.HttpMethodGet,
		Bucket:     s.config.Bucket,
		Key:        filepath.Base(audioPath),
	})
	if err != nil {
		return "", errors.New("Failed to generate pre-signed URL: " + err.Error())
	}

	return url.SignedUrl, nil
}