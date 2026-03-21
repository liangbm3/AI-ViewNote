package models

import "encoding/json"

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
	GeneratingStyle // 生成目标样式中
	GeneratingStyleSuccess // 生成目标样式成功
	GeneratingStyleFailed // 生成目标样式失败
)

// 任务定义
type TaskRecord struct {
	ID		  int    `json:"id"`
	Title	 string `json:"title"`
	FileName  string `json:"file_name"`
	ContentStyle string `json:"content_style"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
	Progress TaskProgress `json:"progress"`
	TranscriptionText json.RawMessage `json:"transcription_text"` 
	MarkdownContent string `json:"markdown_content"` 
}

type AppConfig struct {
	ID int `json:"id"`
	Key string `json:"key"`
	Value string `json:"value"`
	UpdateAt string `json:"updated_at"`
}