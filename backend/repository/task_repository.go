package repository

import (
	"AI-ViewNote/backend/models"
	"database/sql"
	"encoding/json"
)

type TaskRepository struct {
	DB *sql.DB
}

func NewTaskRepository(db *sql.DB) *TaskRepository {
	return &TaskRepository{
		DB: db,
	}
}

func (r *TaskRepository) Create(task *models.TaskRecord) (int, error) {
	utterancesJSON, err := json.Marshal(task.TranscriptionText)
	if err != nil {
		return 0, err
	}

	query := `INSERT INTO tasks (title, file_path, style, created_at, updated_at, progress, 
	transcription_text, markdown_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	res, err := r.DB.Exec(query, task.Title, task.FilePath, task.Style, task.CreatedAt,
		task.UpdatedAt, task.Progress, string(utterancesJSON), task.MarkdownContent)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return int(id), nil
}

func (r *TaskRepository) GetAll() ([]*models.TaskRecord, error) {
	query := `SELECT id, title, file_path, style, created_at, updated_at, 
	progress, transcription_text, markdown_content FROM tasks ORDER BY created_at DESC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tasks []*models.TaskRecord
	for rows.Next() {
		task := &models.TaskRecord{}
		var utterancesJSON string
		if err := rows.Scan(&task.ID, &task.Title, &task.FilePath, &task.Style, &task.CreatedAt,
			&task.UpdatedAt, &task.Progress, &utterancesJSON, &task.MarkdownContent); err != nil {
			return nil, err
		}
		if err != nil {
			return nil, err
		}
		if utterancesJSON != "" {
			err = json.Unmarshal([]byte(utterancesJSON), &task.TranscriptionText)
			if err != nil {
				return nil, err
			}
		}
		tasks = append(tasks, task)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *TaskRepository) GetByID(id int) (*models.TaskRecord, error) {
	query := `SELECT id, title, file_path, style, created_at, updated_at, 
	progress, transcription_text, markdown_content FROM tasks WHERE id = ?`
	row := r.DB.QueryRow(query, id)
	task := &models.TaskRecord{}
	var utterancesJSON string
	if err := row.Scan(&task.ID, &task.Title, &task.FilePath, &task.Style, &task.CreatedAt,
		&task.UpdatedAt, &task.Progress, &utterancesJSON, &task.MarkdownContent); err != nil {
		return nil, err
	}
	if utterancesJSON != "" {
		err := json.Unmarshal([]byte(utterancesJSON), &task.TranscriptionText)
		if err != nil {
			return nil, err
		}
	}
	return task, nil
}

func (r *TaskRepository) DeleteByID(id int) error {
	query := `DELETE FROM tasks WHERE id = ?`
	_, err := r.DB.Exec(query, id)
	return err
}

func (r *TaskRepository) Update(task *models.TaskRecord) error {
	utterancesJSON, err := json.Marshal(task.TranscriptionText)
	if err != nil {
		return err
	}

	query := `UPDATE tasks SET title = ?, file_path = ?, style = ?, created_at = ?,
	updated_at = ?, progress = ?, transcription_text = ?, markdown_content = ? WHERE id = ?`
	_, err = r.DB.Exec(query, task.Title, task.FilePath, task.Style, task.CreatedAt,
		task.UpdatedAt, task.Progress, string(utterancesJSON), task.MarkdownContent, task.ID)
	if err != nil {
		return err
	}
	return nil
}
