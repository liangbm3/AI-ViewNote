package service

import (
	"context"
	"errors"

	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/utils"

	ark "github.com/sashabaranov/go-openai"
)

type MarkdownGenerationService struct {
	config *models.LLMConfig
}

func NewMarkdownGenerationService(config *models.LLMConfig) *MarkdownGenerationService {
	return &MarkdownGenerationService{
		config: config,
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

	var content string
	switch style {
	case models.NoteStyle:
		content = noteDefaultPrompt()
	case models.XiaohongshuStyle:
		content = xiaohongshuDefaultPrompt()
	case models.WeChatStyle:
		content = wechatDefaultPrompt()
	case models.SummaryStyle:
		content = summaryDefaultPrompt()
	default:
		return "", errors.New("Unsupported content style: " + string(style))
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