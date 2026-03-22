package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
)

type ConfigService struct {
	config_repo *repository.ConfigRepository
}

func NewConfigService(repo *repository.ConfigRepository) *ConfigService {
	return &ConfigService{
		config_repo: repo,
	}
}

func (s *ConfigService) GetConfig(key string) models.Response {
	config, err := s.config_repo.GetConfig(findConfigKey(key))
	if err != nil {
		return errorResponse("Failed to get config: " + err.Error())
	}
	return successResponse("Config retrieved successfully", config)
}

func (s *ConfigService) SaveConfig(key string, value string) models.Response {
	err := s.config_repo.SaveConfig(findConfigKey(key), value)
	if err != nil {
		return errorResponse("Failed to save config: " + err.Error())
	}
	return successResponse("Config saved successfully", nil)
}

func (s *ConfigService) DeleteConfig(key string) models.Response {
	err := s.config_repo.DeleteConfig(findConfigKey(key))
	if err != nil {
		return errorResponse("Failed to delete config: " + err.Error())
	}
	return successResponse("Config deleted successfully", nil)
}

func (s *ConfigService) GetAllConfigs() models.Response {
	configs, err := s.config_repo.GetAllConfigs()
	if err != nil {
		return errorResponse("Failed to get configs: " + err.Error())
	}
	return successResponse("Configs retrieved successfully", configs)
}

func (s *ConfigService) ConfigExists(key string) models.Response{
	_, err := s.config_repo.GetConfig(findConfigKey(key))
	if err != nil {
		return errorResponse("Failed to check config existence: " + err.Error())
	}
	return successResponse("Config exists", nil)
}

func findConfigKey(key string) models.ConfigKey {
	switch key {
	case string(models.StorageAccessKey):
		return models.StorageAccessKey
	case string(models.StorageSecretKey):
		return models.StorageSecretKey
	case string(models.StorageEndpoint):
		return models.StorageEndpoint
	case string(models.StorageRegion):
		return models.StorageRegion
	case string(models.StorageBucket):
		return models.StorageBucket
	case string(models.AucAppID):
		return models.AucAppID
	case string(models.AucAccessToken):
		return models.AucAccessToken
	case string(models.AucClusterID):
		return models.AucClusterID
	case string(models.LlmBaseURL):
		return models.LlmBaseURL
	case string(models.LlmModelID):
		return models.LlmModelID
	case string(models.LlmApiKey):
		return models.LlmApiKey
	case string(models.RunInBackground):
		return models.RunInBackground
	case string(models.DesktopNotifications):
		return models.DesktopNotifications
	default:
		return ""
	}
}