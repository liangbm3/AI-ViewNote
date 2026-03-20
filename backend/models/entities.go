package models

// 任务进度枚举
type TaskProgress int
const (
	NotStarted TaskProgress = iota// 任务未开始
	ExtractingAudio // 提取音频中
	ExtractingText // 提取文本中
	GeneratingStyle // 生成目标样式中
	Completed // 任务完成
	Failed // 任务失败
)

// 任务定义
type TaskRecord struct {
	ID		  int    `json:"id"`
	Title	 string `json:"title"`
	FileName  string `json:"file_name"`
	ContentStyle string `json:"content_style"`
	CreatedAt string `json:"created_at"`
	Progress TaskProgress `json:"progress"`
}