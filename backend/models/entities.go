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
	NotStarted TaskProgress = iota// 任务未开始
	ExtractingAudio // 提取音频中
	ExtractingAudioSuccess // 提取音频成功
	ExtractingAudioFailed // 提取音频失败
	ExtractingText // 提取文本中
	ExtractingTextSuccess // 提取文本成功
	ExtractingTextFailed // 提取文本失败
	GeneratingMarkdown // 生成Markdown中
	GeneratingMarkdownSuccess // 生成Markdown成功
	GeneratingMarkdownFailed // 生成Markdown失败
	InterruptedFailed // 中断失败（应用意外关闭导致）
)

// 内容风格枚举
type ContentStyle string
const (
	NoteStyle ContentStyle = "note"
	XiaohongshuStyle ContentStyle = "xiaohongshu"
	WeChatStyle ContentStyle = "wechat"
	SummaryStyle ContentStyle = "summary"
)

// 任务定义
type TaskRecord struct {
	ID		  int    `json:"id"`
	Title	 string `json:"title"`
	FilePath  string `json:"file_path"`
	Style ContentStyle `json:"style"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	Progress TaskProgress `json:"progress"`
	TranscriptionText []Utterance `json:"transcription_text"` 
	MarkdownContent string `json:"markdown_content"` 
}

// 配置项枚举
type ConfigKey string
const (
	StorageAccessKey ConfigKey = "StorageAccessKey"
	StorageSecretKey ConfigKey = "StorageSecretKey"
	StorageEndpoint ConfigKey = "StorageEndpoint"
	StorageRegion ConfigKey = "StorageRegion"
	StorageBucket ConfigKey = "StorageBucket"
	AucAppID ConfigKey = "AucAppID"
	AucAccessToken ConfigKey = "AucAccessToken"
	AucClusterID ConfigKey = "AucClusterID"
	LlmBaseURL ConfigKey = "LlmBaseURL"
	LlmModelID ConfigKey = "LlmModelID"
	LlmApiKey ConfigKey = "LlmApiKey"
	RunInBackground ConfigKey = "RunInBackground"
	DesktopNotifications ConfigKey = "DesktopNotifications"
	LogFolding ConfigKey = "LogFolding"
)

type AppConfig struct {
	ID int `json:"id"`
	Key ConfigKey `json:"key"`
	Value string `json:"value"`
	UpdateAt string `json:"updated_at"`
}

// 日志级别枚举
type LogLevel string
const (
	LogLevelInfo LogLevel = "info"
	LogLevelWarning LogLevel = "warning"
	LogLevelError LogLevel = "error"
)

// 日志消息定义
type LogMessage struct {
	Level LogLevel `json:"level"`
	Message string `json:"message"`
}

// 任务更新消息定义
type TaskUpdateMessage struct {
}