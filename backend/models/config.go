package models

type StorageConfig struct {
	StorageAccessKey string `json:"storage_access_key"`
	StorageSecretKey string `json:"storage_secret_key"`
	StorageEndpoint  string `json:"storage_endpoint"`
	StorageRegion    string `json:"storage_region"`
	StorageBucket    string `json:"storage_bucket"`
}

type AucConfig struct {
	AucAppID       string `json:"auc_app_id"`
	AucAccessToken string `json:"auc_access_token"`
	AucClusterID   string `json:"auc_cluster_id"`
}

type LlmConfig struct {
	LlmBaseURL string `json:"llm_base_url"`
	LlmModelID string `json:"llm_model_id"`
	LlmApiKey  string `json:"llm_api_key"`
}

type GeneralConfig struct{
	RunInBackground bool `json:"run_in_background"`
	DesktopNotifications bool `json:"desktop_notifications"`
}