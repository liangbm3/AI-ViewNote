package service

import (
	"context"
	"errors"

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
