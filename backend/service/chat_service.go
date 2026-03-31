package service

import (
	"context"
	"errors"
	"io"
	"strings"
	"unicode/utf8"

	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/repository"

	ark "github.com/sashabaranov/go-openai"
)

// QuickPrompt 定义快速提问模板
type QuickPrompt struct {
	Title   string `json:"title"`
	Message string `json:"message"`
}

type ChatService struct {
	configService *ConfigService
	taskRepo      *repository.TaskRepository
	chatRepo      *repository.ChatRepository
	eventEmitter  EventEmitter
}

func NewChatService(
	configService *ConfigService,
	taskRepo *repository.TaskRepository,
	chatRepo *repository.ChatRepository,
	eventEmitter EventEmitter,
) *ChatService {
	return &ChatService{
		configService: configService,
		taskRepo:      taskRepo,
		chatRepo:      chatRepo,
		eventEmitter:  eventEmitter,
	}
}

// SendChatMessage 接收用户消息，立即保存后在后台启动流式响应。
// 实际 AI 回复通过 Wails 事件推送：
//   - "chat_token": {"task_id": int, "token": string}
//   - "chat_done":  {"task_id": int}
//   - "chat_error": {"task_id": int, "error": string}
func (s *ChatService) SendChatMessage(taskID int, userMessage string) models.Response {
	if strings.TrimSpace(userMessage) == "" {
		return errorResponse("消息内容不能为空")
	}

	// 保存用户消息
	if err := s.chatRepo.SaveMessage(taskID, "user", userMessage); err != nil {
		return errorResponse("保存消息失败: " + err.Error())
	}

	// 获取任务上下文
	task, err := s.taskRepo.GetByID(taskID)
	if err != nil {
		return errorResponse("获取任务信息失败: " + err.Error())
	}

	// 获取历史记录（含刚保存的用户消息）
	history, err := s.chatRepo.GetHistory(taskID)
	if err != nil {
		return errorResponse("获取聊天历史失败: " + err.Error())
	}

	// 后台流式响应
	go s.streamResponse(taskID, task, history)

	return successResponse("消息已发送", nil)
}

func (s *ChatService) streamResponse(taskID int, task *models.TaskRecord, history []models.ChatMessage) {
	llmConfig, err := s.configService.GetLLMConfig()
	if err != nil || llmConfig.ApiKey == "" {
		s.eventEmitter.Emit("chat_error", map[string]interface{}{
			"task_id": taskID,
			"error":   "LLM 配置不完整，请先在设置中完成配置",
		})
		return
	}

	// 构建字幕摘要（取前 1000 字符）
	var sb strings.Builder
	for _, u := range task.TranscriptionText {
		if sb.Len() >= 1000 {
			break
		}
		sb.WriteString(u.Text)
		sb.WriteString(" ")
	}

	// 系统 Prompt
	systemPrompt := chatSystemPrompt(task.MarkdownContent, sb.String())

	// 构建消息列表：系统 Prompt + 历史记录（最近 20 条）
	messages := []ark.ChatCompletionMessage{
		{Role: ark.ChatMessageRoleSystem, Content: systemPrompt},
	}

	// history 最后一条是刚保存的用户消息，需要在下面单独追加，以便此处只保留历史对话
	historyWithoutLast := history
	if len(historyWithoutLast) > 0 {
		historyWithoutLast = historyWithoutLast[:len(historyWithoutLast)-1]
	}
	if len(historyWithoutLast) > 20 {
		historyWithoutLast = historyWithoutLast[len(historyWithoutLast)-20:]
	}
	for _, msg := range historyWithoutLast {
		role := ark.ChatMessageRoleUser
		if msg.Role == "assistant" {
			role = ark.ChatMessageRoleAssistant
		}
		messages = append(messages, ark.ChatCompletionMessage{Role: role, Content: msg.Content})
	}

	// 追加当前用户消息
	messages = append(messages, ark.ChatCompletionMessage{
		Role:    ark.ChatMessageRoleUser,
		Content: history[len(history)-1].Content,
	})

	// 创建流式请求
	config := ark.DefaultConfig(llmConfig.ApiKey)
	config.BaseURL = llmConfig.BaseURL
	client := ark.NewClientWithConfig(config)

	stream, err := client.CreateChatCompletionStream(
		context.Background(),
		ark.ChatCompletionRequest{
			Model:    llmConfig.ModelID,
			Messages: messages,
			Stream:   true,
		},
	)
	if err != nil {
		s.eventEmitter.Emit("chat_error", map[string]interface{}{
			"task_id": taskID,
			"error":   "AI 服务请求失败: " + err.Error(),
		})
		return
	}
	defer stream.Close()

	var fullResponse strings.Builder
	for {
		resp, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			s.eventEmitter.Emit("chat_error", map[string]interface{}{
				"task_id": taskID,
				"error":   "流式响应中断: " + err.Error(),
			})
			return
		}
		if len(resp.Choices) == 0 {
			continue
		}
		token := resp.Choices[0].Delta.Content
		if token != "" {
			// 防御性处理：确保推送到前端的 token 为有效 UTF-8，避免出现替换字符乱码。
			if !utf8.ValidString(token) {
				token = strings.ToValidUTF8(token, "")
			}
			fullResponse.WriteString(token)
			s.eventEmitter.Emit("chat_token", map[string]interface{}{
				"task_id": taskID,
				"token":   token,
			})
		}
	}

	// 保存完整的 AI 回复
	if err := s.chatRepo.SaveMessage(taskID, "assistant", fullResponse.String()); err != nil {
		s.eventEmitter.Emit("chat_error", map[string]interface{}{
			"task_id": taskID,
			"error":   "保存 AI 回复失败: " + err.Error(),
		})
		return
	}

	s.eventEmitter.Emit("chat_done", map[string]interface{}{"task_id": taskID})
}

func (s *ChatService) GetChatHistory(taskID int) models.Response {
	history, err := s.chatRepo.GetHistory(taskID)
	if err != nil {
		return errorResponse("获取聊天历史失败: " + err.Error())
	}
	return successResponse("获取聊天历史成功", history)
}

func (s *ChatService) ClearChatHistory(taskID int) models.Response {
	if err := s.chatRepo.ClearHistory(taskID); err != nil {
		return errorResponse("清除聊天历史失败: " + err.Error())
	}
	return successResponse("聊天历史已清除", nil)
}

func (s *ChatService) GetQuickPrompts() models.Response {
	prompts := []QuickPrompt{
		{
			Title:   "总结核心观点",
			Message: "请总结这个视频的核心观点和主要内容，用简洁的要点列出。",
		},
		{
			Title:   "翻译为英文",
			Message: "Please translate the main content and key points of this video summary into English.",
		},
		{
			Title:   "扩展阅读建议",
			Message: "基于这个视频的内容，你能推荐一些相关的扩展阅读方向或延伸学习的话题吗？",
		},
	}
	return successResponse("获取快速提问成功", prompts)
}
