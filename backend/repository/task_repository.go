package repository

import (
	"AI-ViewNote/backend/models"
	"database/sql"
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
	query := `INSERT INTO tasks (title, file_name, content_style, created_at, updated_at, progress, 
	transcription_text, markdown_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	res, err := r.DB.Exec(query, task.Title, task.FileName, task.ContentStyle, task.CreatedAt,
		task.UpdatedAt, task.Progress, task.TranscriptionText, task.MarkdownContent)
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
	query := `SELECT id, title, file_name, content_style, created_at, updated_at, 
	progress, transcription_text, markdown_content FROM tasks ORDER BY created_at DESC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tasks []*models.TaskRecord
	for rows.Next() {
		task := &models.TaskRecord{}
		var transcriptionText sql.NullString
		var markdownContent sql.NullString
		if err := rows.Scan(&task.ID, &task.Title, &task.FileName, &task.ContentStyle, &task.CreatedAt,
			&task.UpdatedAt, &task.Progress, &transcriptionText, &markdownContent); err != nil {
			return nil, err
		}
		if transcriptionText.Valid {
			task.TranscriptionText = []byte(transcriptionText.String)
		}
		if markdownContent.Valid {
			task.MarkdownContent = markdownContent.String
		}
		tasks = append(tasks, task)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tasks, nil
}

func (r *TaskRepository) UpdateProgress(id int, progress models.TaskProgress) error {
	query := `UPDATE tasks SET progress = ? WHERE id = ?`
	_, err := r.DB.Exec(query, progress, id)
	return err
}

func (r *TaskRepository) UpdateTranscriptionText(id int, text string) error {
	query := `UPDATE tasks SET transcription_text = ?, updated_at = datetime('now') WHERE id = ?`
	_, err := r.DB.Exec(query, text, id)
	return err
}

func (r *TaskRepository) UpdateMarkdownContent(id int, content string) error {
	query := `UPDATE tasks SET markdown_content = ?, updated_at = datetime('now') WHERE id = ?`
	_, err := r.DB.Exec(query, content, id)
	return err
}

func (r *TaskRepository) GetByID(id int) (*models.TaskRecord, error) {
	query := `SELECT id, title, file_name, content_style, created_at, updated_at, 
	progress, transcription_text, markdown_content FROM tasks WHERE id = ?`
	row := r.DB.QueryRow(query, id)
	task := &models.TaskRecord{}
	var transcriptionText sql.NullString
	var markdownContent sql.NullString
	if err := row.Scan(&task.ID, &task.Title, &task.FileName, &task.ContentStyle, &task.CreatedAt,
		&task.UpdatedAt, &task.Progress, &transcriptionText, &markdownContent); err != nil {
		return nil, err
	}
	if transcriptionText.Valid {
		task.TranscriptionText = []byte(transcriptionText.String)
	}
	if markdownContent.Valid {
		task.MarkdownContent = markdownContent.String
	}
	return task, nil
}

func (r *TaskRepository) DeleteByID(id int) error {
	query := `DELETE FROM tasks WHERE id = ?`
	_, err := r.DB.Exec(query, id)
	return err
}
