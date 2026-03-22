package repository

import (
	"database/sql"
	"os"
	"path/filepath"
	"time"

	_ "modernc.org/sqlite"
)

func InitDB(dbPath string) (*sql.DB, error) {
	// 确保目录存在
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return nil, err
	}

	// 连接数据库
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	// 配置连接池
	db.SetMaxOpenConns(1) // SQLite 适合单连接
	db.SetMaxIdleConns(1)
	db.SetConnMaxLifetime(time.Hour)

	// 开启 WAL (Write-Ahead Logging) 模式能极大提升 SQLite 的并发读写性能
	pragmas := `
	PRAGMA journal_mode = WAL;
	PRAGMA synchronous = NORMAL;
	PRAGMA foreign_keys = ON;
	`
	if _, err := db.Exec(pragmas); err != nil {
		return nil, err
	}
	// 创建表：任务记录表，对应 models.TaskRecord
	createTasksTable := `CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			file_path TEXT NOT NULL,
			content_style TEXT NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL,
			progress INTEGER NOT NULL,
			transcription_text TEXT,
			markdown_content TEXT
			);`
	if _, err := db.Exec(createTasksTable); err != nil {
		return nil, err
	}
	// 创建表：应用配置表，对应 models.AppConfig
	createConfigTable := `CREATE TABLE IF NOT EXISTS configs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			key TEXT NOT NULL UNIQUE,
			value TEXT NOT NULL,
			updated_at TEXT NOT NULL
			);`
	if _, err := db.Exec(createConfigTable); err != nil {
		return nil, err
	}

	return db, nil
}
