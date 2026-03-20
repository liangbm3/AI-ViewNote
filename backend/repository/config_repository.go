package repository

import (
	"AI-ViewNote/backend/models"
	"database/sql"
)

type ConfigRepository struct {
	DB *sql.DB
}

func (r *ConfigRepository) GetConfig(moduleName string) (*models.AppConfig, error) {
	query := `SELECT id, module_name, config_data, updated_at FROM configs WHERE module_name = ?`
	row := r.DB.QueryRow(query, moduleName)
	config := &models.AppConfig{}
	if err := row.Scan(&config.ID, &config.ModuleName, &config.ConfigData, &config.UpdateAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 没有找到配置，返回 nil
		}
		return nil, err
	}
	return config, nil
}

func (r *ConfigRepository) SaveConfig(moduleName string, configData string) error {
	// 先检查是否存在
	existingConfig, err := r.GetConfig(moduleName)
	if err != nil {
		return err
	}
	if existingConfig == nil {
		// 不存在，插入新记录
		query := `INSERT INTO configs (module_name, config_data, updated_at) VALUES (?, ?, datetime('now'))`
		_, err := r.DB.Exec(query, moduleName, configData)
		return err
	}
	// 存在，更新记录
	query := `UPDATE configs SET config_data = ?, updated_at = datetime('now') WHERE module_name = ?`
	_, err = r.DB.Exec(query, configData, moduleName)
	return err
}

func (r *ConfigRepository) DeleteConfig(moduleName string) error {
	query := `DELETE FROM configs WHERE module_name = ?`
	_, err := r.DB.Exec(query, moduleName)
	return err
}

func (r *ConfigRepository) GetAllConfigs() ([]*models.AppConfig, error) {
	query := `SELECT id, module_name, config_data, updated_at FROM configs ORDER BY updated_at DESC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var configs []*models.AppConfig
	for rows.Next() {
		config := &models.AppConfig{}
		if err := rows.Scan(&config.ID, &config.ModuleName, &config.ConfigData, &config.UpdateAt); err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}
	return configs, nil
}

