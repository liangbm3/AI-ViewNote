package service

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strconv"

	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/utils"

	ark "github.com/sashabaranov/go-openai"
)

type MarkdownGenerationService struct {
	config        *models.LLMConfig
	configService *ConfigService
}

func NewMarkdownGenerationService(config *models.LLMConfig, configService *ConfigService) *MarkdownGenerationService {
	return &MarkdownGenerationService{
		config:        config,
		configService: configService,
	}
}

// 根据ASR结果和指定的内容风格生成Markdown格式的文本
func (s *MarkdownGenerationService) GenerateMarkdown(utterances []models.Utterance, style models.ContentStyle) (string, error) {
	text, err := utils.UtterancesToText(utterances)
	if err != nil {
		return "", errors.New("Failed to convert utterances to text: " + err.Error())
	}

	config := ark.DefaultConfig(s.config.ApiKey)
	config.BaseURL = s.config.BaseURL
	client := ark.NewClientWithConfig(config)

	content, err := s.configService.GetEffectivePrompt(style)
	if err != nil {
		return "", errors.New("Failed to resolve prompt: " + err.Error())
	}

	resp, err := client.CreateChatCompletion(
		context.Background(),
		ark.ChatCompletionRequest{
			Model: s.config.ModelID,
			Messages: []ark.ChatCompletionMessage{
				{
					Role:    ark.ChatMessageRoleSystem,
					Content: "你是人工智能助手，请按照用户的要求准确回答问题",
				},
				{
					Role:    ark.ChatMessageRoleUser,
					Content: content + "\n\n" + text,
				},
			},
		},
	)
	if err != nil {
		return "", errors.New("Failed to generate markdown content: " + err.Error())
	}

	// Return the first choice's content
	return resp.Choices[0].Message.Content, nil
}

// imageTagRe 匹配 #image[秒数] 标记（单独占一行或内联均可）
var imageTagRe = regexp.MustCompile(`#image\[(\d+)\]`)

// ProcessScreenshots 解析 Markdown 中的 #image[N] 标记，用 ffmpeg 截图并替换为内嵌 base64 图片。
// 截图临时文件写入 tempDir，函数返回后由调用方负责清理。
// 单张截图失败时会静默跳过（删除该标记行），不影响整体流程。
func (s *MarkdownGenerationService) ProcessScreenshots(markdown, videoPath, tempDir string) (string, error) {
	// 收集所有不重复的时间戳
	matches := imageTagRe.FindAllStringSubmatch(markdown, -1)
	if len(matches) == 0 {
		return markdown, nil
	}

	// 去重并截图：timestamp -> base64
	screenshotCache := make(map[int]string)
	for _, m := range matches {
		ts, err := strconv.Atoi(m[1])
		if err != nil {
			continue
		}
		if _, done := screenshotCache[ts]; done {
			continue
		}

		imgPath := filepath.Join(tempDir, fmt.Sprintf("screenshot_%d.jpg", ts))
		err = utils.CaptureScreenshot(videoPath, ts, imgPath)
		if err != nil {
			// 截图失败：记录空值，后续将删除该标记
			screenshotCache[ts] = ""
			continue
		}

		data, err := os.ReadFile(imgPath)
		if err != nil {
			screenshotCache[ts] = ""
			continue
		}
		screenshotCache[ts] = base64.StdEncoding.EncodeToString(data)
	}

	// 逐个替换标记
	result := imageTagRe.ReplaceAllStringFunc(markdown, func(tag string) string {
		sub := imageTagRe.FindStringSubmatch(tag)
		if len(sub) < 2 {
			return ""
		}
		ts, err := strconv.Atoi(sub[1])
		if err != nil {
			return ""
		}
		b64, ok := screenshotCache[ts]
		if !ok || b64 == "" {
			return "" // 截图失败，删除标记
		}
		return fmt.Sprintf("![视频第%ds帧](data:image/jpeg;base64,%s)", ts, b64)
	})

	return result, nil
}
