package models

// 字幕定义
type Utterance struct {
	StartTime int    `json:"start_time"`
	EndTime   int    `json:"end_time"`
	Text      string `json:"text"`
}

// 任务进度枚举
type TaskProgress int

const (
	NotStarted                   TaskProgress = iota // 任务未开始
	ExtractingAudio                                  // 提取音频中
	ExtractingAudioSuccess                           // 提取音频成功
	ExtractingAudioFailed                            // 提取音频失败
	ExtractingText                                   // 提取文本中
	ExtractingTextSuccess                            // 提取文本成功
	ExtractingTextFailed                             // 提取文本失败
	GeneratingMarkdown                               // 生成Markdown中
	GeneratingMarkdownSuccess                        // 生成Markdown成功
	GeneratingMarkdownFailed                         // 生成Markdown失败
	InterruptedFailed                                // 中断失败（应用意外关闭导致）
	ProcessingScreenshots                            // 处理截图中
	ProcessingScreenshotsSuccess                     // 处理截图成功
	ProcessingScreenshotsFailed                      // 处理截图失败
)

// 内容风格枚举
type ContentStyle string

const (
	NoteStyle        ContentStyle = "note"
	XiaohongshuStyle ContentStyle = "xiaohongshu"
	WeChatStyle      ContentStyle = "wechat"
	SummaryStyle     ContentStyle = "summary"
)

type PromptProfile struct {
	Style           ContentStyle `json:"style"`
	Label           string       `json:"label"`
	Description     string       `json:"description"`
	Key             ConfigKey    `json:"key"`
	DefaultPrompt   string       `json:"default_prompt"`
	CustomPrompt    string       `json:"custom_prompt"`
	EffectivePrompt string       `json:"effective_prompt"`
}

// 任务定义
type TaskRecord struct {
	ID                int          `json:"id"`
	Title             string       `json:"title"`
	FilePath          string       `json:"file_path"`
	Style             ContentStyle `json:"style"`
	CreatedAt         string       `json:"created_at"`
	UpdatedAt         string       `json:"updated_at"`
	Progress          TaskProgress `json:"progress"`
	TranscriptionText []Utterance  `json:"transcription_text"`
	MarkdownContent   string       `json:"markdown_content"`
}

// 配置项枚举
type ConfigKey string

const (
	StorageAccessKey     ConfigKey = "StorageAccessKey"
	StorageSecretKey     ConfigKey = "StorageSecretKey"
	StorageEndpoint      ConfigKey = "StorageEndpoint"
	StorageRegion        ConfigKey = "StorageRegion"
	StorageBucket        ConfigKey = "StorageBucket"
	AucAppID             ConfigKey = "AucAppID"
	AucAccessToken       ConfigKey = "AucAccessToken"
	AucClusterID         ConfigKey = "AucClusterID"
	LlmBaseURL           ConfigKey = "LlmBaseURL"
	LlmModelID           ConfigKey = "LlmModelID"
	LlmApiKey            ConfigKey = "LlmApiKey"
	RunInBackground      ConfigKey = "RunInBackground"
	DesktopNotifications ConfigKey = "DesktopNotifications"
	LogFolding           ConfigKey = "LogFolding"
	PromptNote           ConfigKey = "PromptNote"
	PromptXiaohongshu    ConfigKey = "PromptXiaohongshu"
	PromptWechat         ConfigKey = "PromptWechat"
	PromptSummary        ConfigKey = "PromptSummary"
)

// 配置项定义
type AppConfig struct {
	ID       int       `json:"id"`
	Key      ConfigKey `json:"key"`
	Value    string    `json:"value"`
	UpdateAt string    `json:"updated_at"`
}

// TOS配置定义
type TOSConfig struct {
	AccessKey string
	SecretKey string
	Endpoint  string
	Region    string
	Bucket    string
}

// ASR配置定义
type ASRConfig struct {
	AppID       string
	AccessToken string
	ClusterID   string
}

// LLM配置定义
type LLMConfig struct {
	BaseURL string
	ModelID string
	ApiKey  string
}

// 日志级别枚举
type LogLevel string

const (
	LogLevelInfo    LogLevel = "info"
	LogLevelWarning LogLevel = "warning"
	LogLevelError   LogLevel = "error"
)

// 日志消息定义
type LogMessage struct {
	Level   LogLevel `json:"level"`
	Message string   `json:"message"`
}

// 任务更新消息定义
type TaskUpdateMessage struct {
}

// 聊天消息定义
type ChatMessage struct {
	ID        int    `json:"id"`
	TaskID    int    `json:"task_id"`
	Role      string `json:"role"` // "user" | "assistant"
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
