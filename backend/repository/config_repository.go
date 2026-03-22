package repository

import (
	"AI-ViewNote/backend/models"
	"database/sql"
)

type ConfigRepository struct {
	DB *sql.DB
}

func NewConfigRepository(db *sql.DB) *ConfigRepository {
	return &ConfigRepository{
		DB: db,
	}
}

func (r *ConfigRepository) GetConfig(key models.ConfigKey) (models.AppConfig, error) {
	query := `SELECT id, key, value, updated_at FROM configs WHERE key = ?`
	row := r.DB.QueryRow(query, key)
	config := &models.AppConfig{}
	if err := row.Scan(&config.ID, &config.Key, &config.Value, &config.UpdateAt); err != nil {
		if err == sql.ErrNoRows {
			return models.AppConfig{}, nil // 没有找到配置，返回空配置
		}
		return models.AppConfig{}, err
	}
	return *config, nil
}

func (r *ConfigRepository) SaveConfig(key models.ConfigKey, value string) error {
	// 先检查是否存在
	existingConfig, err := r.GetConfig(key)
	if err != nil {
		return err
	}
	if existingConfig == (models.AppConfig{}) {
		// 不存在，插入新记录
		query := `INSERT INTO configs (key, value, updated_at) VALUES (?, ?, datetime('now'))`
		_, err := r.DB.Exec(query, key, value)
		return err
	}
	// 存在，更新记录
	query := `UPDATE configs SET value = ?, updated_at = datetime('now') WHERE key = ?`
	_, err = r.DB.Exec(query, value, key)
	return err
}

func (r *ConfigRepository) DeleteConfig(key models.ConfigKey) error {
	query := `DELETE FROM configs WHERE key = ?`
	_, err := r.DB.Exec(query, key)
	return err
}

func (r *ConfigRepository) GetAllConfigs() ([]*models.AppConfig, error) {
	query := `SELECT id, key, value, updated_at FROM configs ORDER BY updated_at DESC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var configs []*models.AppConfig
	for rows.Next() {
		config := &models.AppConfig{}
		if err := rows.Scan(&config.ID, &config.Key, &config.Value, &config.UpdateAt); err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}
	return configs, nil
}

