package service

import (
	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"
	"errors"
	"strings"
)

type ConfigService struct {
	configRepo *repository.ConfigRepository
}

func NewConfigService(configRepo *repository.ConfigRepository) *ConfigService {
	return &ConfigService{
		configRepo: configRepo,
	}
}

func (s *ConfigService) GetTOSConfig() (*models.TOSConfig, error) {
	accessKeyCfg, err := s.configRepo.GetConfig(models.StorageAccessKey)
	if err != nil {
		return nil, errors.New("Failed to get StorageAccessKey config: " + err.Error())
	}
	secretKeyCfg, err := s.configRepo.GetConfig(models.StorageSecretKey)
	if err != nil {
		return nil, errors.New("Failed to get StorageSecretKey config: " + err.Error())
	}
	endpointCfg, err := s.configRepo.GetConfig(models.StorageEndpoint)
	if err != nil {
		return nil, errors.New("Failed to get StorageEndpoint config: " + err.Error())
	}
	regionCfg, err := s.configRepo.GetConfig(models.StorageRegion)
	if err != nil {
		return nil, errors.New("Failed to get StorageRegion config: " + err.Error())
	}
	bucketCfg, err := s.configRepo.GetConfig(models.StorageBucket)
	if err != nil {
		return nil, errors.New("Failed to get StorageBucket config: " + err.Error())
	}

	return &models.TOSConfig{
		AccessKey: accessKeyCfg.Value,
		SecretKey: secretKeyCfg.Value,
		Endpoint:  endpointCfg.Value,
		Region:    regionCfg.Value,
		Bucket:    bucketCfg.Value,
	}, nil
}

func (s *ConfigService) GetASRConfig() (*models.ASRConfig, error) {
	appIDCfg, err := s.configRepo.GetConfig(models.AucAppID)
	if err != nil {
		return nil, errors.New("Failed to get AucAppID config: " + err.Error())
	}
	accessTokenCfg, err := s.configRepo.GetConfig(models.AucAccessToken)
	if err != nil {
		return nil, errors.New("Failed to get AucAccessToken config: " + err.Error())
	}
	clusterIDCfg, err := s.configRepo.GetConfig(models.AucClusterID)
	if err != nil {
		return nil, errors.New("Failed to get AucClusterID config: " + err.Error())
	}

	return &models.ASRConfig{
		AppID:       appIDCfg.Value,
		AccessToken: accessTokenCfg.Value,
		ClusterID:   clusterIDCfg.Value,
	}, nil
}

func (s *ConfigService) GetLLMConfig() (*models.LLMConfig, error) {
	baseURLCfg, err := s.configRepo.GetConfig(models.LlmBaseURL)
	if err != nil {
		return nil, errors.New("Failed to get LlmBaseURL config: " + err.Error())
	}
	modelIDCfg, err := s.configRepo.GetConfig(models.LlmModelID)
	if err != nil {
		return nil, errors.New("Failed to get LlmModelID config: " + err.Error())
	}
	apiKeyCfg, err := s.configRepo.GetConfig(models.LlmApiKey)
	if err != nil {
		return nil, errors.New("Failed to get LlmApiKey config: " + err.Error())
	}

	return &models.LLMConfig{
		BaseURL: baseURLCfg.Value,
		ModelID: modelIDCfg.Value,
		ApiKey:  apiKeyCfg.Value,
	}, nil
}

func (s *ConfigService) GetDesktopNotificationsConfig() (bool, error) {
	config, err := s.configRepo.GetConfig(models.DesktopNotifications)
	if err != nil {
		return false, err
	}
	return strings.EqualFold(strings.TrimSpace(config.Value), "true"), nil
}


func (s *ConfigService) EnsureConfigDefaultValue(key models.ConfigKey, defaultValue string) error {
	config, err := s.configRepo.GetConfig(key)
	if err != nil || config == (models.AppConfig{}) {
		return s.configRepo.SaveConfig(key, defaultValue)
	}
	return nil
}

func (s *ConfigService) GetBoolConfig(key models.ConfigKey, defaultValue bool) (bool, error) {
	config, err := s.configRepo.GetConfig(key)
	if err != nil || config == (models.AppConfig{}) {
		return defaultValue, nil
	}

	switch config.Value {
	case "true":
		return true, nil
	case "false":
		return false, nil
	default:
		return defaultValue, nil
	}
}

// Legacy compatibility methods that return models.Response
func (s *ConfigService) EnsureConfigDefaultValueResp(key models.ConfigKey, defaultValue string) models.Response {
	err := s.EnsureConfigDefaultValue(key, defaultValue)
	if err != nil {
		return models.Response{Success: false, Message: err.Error()}
	}
	return models.Response{Success: true, Message: "Config ensured successfully"}
}

func (s *ConfigService) GetBoolConfigResp(key models.ConfigKey, defaultValue bool) models.Response {
	value, err := s.GetBoolConfig(key, defaultValue)
	if err != nil {
		return models.Response{Success: false, Message: err.Error()}
	}
	return models.Response{Success: true, Message: "Config retrieved successfully", Data: value}
}

// Frontend compatibility methods
func (s *ConfigService) SaveConfig(key models.ConfigKey, value string) models.Response {
	err := s.configRepo.SaveConfig(key, value)
	if err != nil {
		return models.Response{Success: false, Message: "Failed to save config: " + err.Error()}
	}
	return models.Response{Success: true, Message: "Config saved successfully"}
}

func (s *ConfigService) GetConfig(key models.ConfigKey) models.Response {
	config, err := s.configRepo.GetConfig(key)
	if err != nil {
		return models.Response{Success: false, Message: "Failed to get config: " + err.Error()}
	}
	return models.Response{Success: true, Message: "Config retrieved successfully", Data: config}
}