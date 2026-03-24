package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"fmt"
)

type ConfigService struct {
	config_repo *repository.ConfigRepository
}

func NewConfigService(repo *repository.ConfigRepository) *ConfigService {
	return &ConfigService{
		config_repo: repo,
	}
}

func (s *ConfigService) GetConfig(key models.ConfigKey) models.Response {
	config, err := s.config_repo.GetConfig(key)
	if err != nil {
		return errorResponse("Failed to get config: " + err.Error())
	}
	return successResponse("Config retrieved successfully", config)
}

func (s *ConfigService) SaveConfig(key models.ConfigKey, value string) models.Response {
	err := s.config_repo.SaveConfig(key, value)
	if err != nil {
		return errorResponse("Failed to save config: " + err.Error())
	}
	return successResponse("Config saved successfully", nil)
}

func (s *ConfigService) DeleteConfig(key models.ConfigKey) models.Response {
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

func (s *ConfigService) ConfigExists(key models.ConfigKey) models.Response {
	config, err := s.config_repo.GetConfig(key)
	if err != nil {
		return errorResponse("Failed to check config existence: " + err.Error())
	}
	return successResponse("Config existence checked successfully", config != (models.AppConfig{}))
}

func (s *ConfigService) GetBoolConfig(key models.ConfigKey, defaultValue bool) models.Response {
	resp := s.GetConfig(key)
	if !resp.Success {
		return resp
	}

	config, ok := resp.Data.(models.AppConfig)
	if !ok || config == (models.AppConfig{}) {
		return successResponse("Bool config retrieved successfully", defaultValue)
	}

	switch config.Value {
	case "true":
		return successResponse("Bool config retrieved successfully", true)
	case "false":
		return successResponse("Bool config retrieved successfully", false)
	default:
		return errorResponse(fmt.Sprintf("Invalid bool config value for key '%s': %s", key, config.Value))
	}
}

func (s *ConfigService) EnsureConfigDefaultValue(key models.ConfigKey, defaultValue string) models.Response {
	existsResp := s.ConfigExists(key)
	if !existsResp.Success {
		return existsResp
	}

	exists, ok := existsResp.Data.(bool)
	if ok && exists {
		return successResponse("Config already exists", nil)
	}

	return s.SaveConfig(key, defaultValue)
}
