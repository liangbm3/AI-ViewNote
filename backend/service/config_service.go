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

// 获取TOS配置
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

// 获取ASR配置
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

// 获取LLM配置
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

// 获取是否开启桌面通知的配置
func (s *ConfigService) GetDesktopNotificationsConfig() (bool, error) {
	config, err := s.configRepo.GetConfig(models.DesktopNotifications)
	if err != nil {
		return false, err
	}
	return strings.EqualFold(strings.TrimSpace(config.Value), "true"), nil
}

// 确保配置项有默认值
func (s *ConfigService) EnsureConfigDefaultValue(key models.ConfigKey, defaultValue string) error {
	config, err := s.configRepo.GetConfig(key)
	if err != nil || config == (models.AppConfig{}) {
		return s.configRepo.SaveConfig(key, defaultValue)
	}
	return nil
}

// 获取布尔类型的配置项值，如果未设置或解析失败则返回默认值
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

func (s *ConfigService) GetCustomPrompt(style models.ContentStyle) (string, error) {
	key, err := promptConfigKeyByStyle(style)
	if err != nil {
		return "", err
	}

	config, err := s.configRepo.GetConfig(key)
	if err != nil {
		return "", err
	}
	if config == (models.AppConfig{}) {
		return "", nil
	}
	if strings.TrimSpace(config.Value) == "" {
		return "", nil
	}
	return config.Value, nil
}

func (s *ConfigService) GetEffectivePrompt(style models.ContentStyle) (string, error) {
	customPrompt, err := s.GetCustomPrompt(style)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(customPrompt) != "" {
		return customPrompt, nil
	}

	return defaultPromptByStyle(style)
}

func (s *ConfigService) BuildPromptProfile(style models.ContentStyle) (models.PromptProfile, error) {
	key, err := promptConfigKeyByStyle(style)
	if err != nil {
		return models.PromptProfile{}, err
	}

	defaultPrompt, err := defaultPromptByStyle(style)
	if err != nil {
		return models.PromptProfile{}, err
	}

	customPrompt, err := s.GetCustomPrompt(style)
	if err != nil {
		return models.PromptProfile{}, err
	}

	effectivePrompt := defaultPrompt
	if strings.TrimSpace(customPrompt) != "" {
		effectivePrompt = customPrompt
	}

	return models.PromptProfile{
		Style:           style,
		Label:           promptLabelByStyle(style),
		Description:     promptDescriptionByStyle(style),
		Key:             key,
		DefaultPrompt:   defaultPrompt,
		CustomPrompt:    customPrompt,
		EffectivePrompt: effectivePrompt,
	}, nil
}

func (s *ConfigService) GetPromptProfiles() models.Response {
	profiles := make([]models.PromptProfile, 0, len(promptStyles()))
	for _, style := range promptStyles() {
		profile, err := s.BuildPromptProfile(style)
		if err != nil {
			return models.Response{Success: false, Message: "Failed to build prompt profile: " + err.Error()}
		}
		profiles = append(profiles, profile)
	}

	return models.Response{Success: true, Message: "Prompt profiles retrieved successfully", Data: profiles}
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
