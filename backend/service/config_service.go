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
	config, err := s.config_repo.GetConfig(key)
	if err != nil {
		return errorResponse("Failed to get config: " + err.Error())
	}
	return successResponse("Config retrieved successfully", config)
}

func (s *ConfigService) SaveConfig(key string, value string) models.Response {
	err := s.config_repo.SaveConfig(key, value)
	if err != nil {
		return errorResponse("Failed to save config: " + err.Error())
	}
	return successResponse("Config saved successfully", nil)
}

func (s *ConfigService) DeleteConfig(key string) models.Response {
	err := s.config_repo.DeleteConfig(key)
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