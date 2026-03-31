package repository

import (
	"AI-ViewNote/backend/models"
	"database/sql"
	"time"
)

type ChatRepository struct {
	DB *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{DB: db}
}

func (r *ChatRepository) SaveMessage(taskID int, role, content string) error {
	query := `INSERT INTO chat_messages (task_id, role, content, created_at) VALUES (?, ?, ?, ?)`
	_, err := r.DB.Exec(query, taskID, role, content, time.Now().Format(time.RFC3339))
	return err
}

func (r *ChatRepository) GetHistory(taskID int) ([]models.ChatMessage, error) {
	query := `SELECT id, task_id, role, content, created_at FROM chat_messages WHERE task_id = ? ORDER BY id ASC`
	rows, err := r.DB.Query(query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var msg models.ChatMessage
		if err := rows.Scan(&msg.ID, &msg.TaskID, &msg.Role, &msg.Content, &msg.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if messages == nil {
		messages = []models.ChatMessage{}
	}
	return messages, nil
}

func (r *ChatRepository) ClearHistory(taskID int) error {
	query := `DELETE FROM chat_messages WHERE task_id = ?`
	_, err := r.DB.Exec(query, taskID)
	return err
}
