package service

import (
	"encoding/json"
	"errors"
	"time"

	"AI-ViewNote/backend/models"
	"AI-ViewNote/backend/utils"
)

type ASRService struct {
	config *models.ASRConfig
}

func NewASRService(config *models.ASRConfig) *ASRService {
	return &ASRService{
		config: config,
	}
}

// 提交ASR任务，返回任务ID
func (s *ASRService) SubmitTask(audioURL string) (string, error) {
	volcengineSubmitURL := "https://openspeech.bytedance.com/api/v1/auc/submit"

	payload := map[string]interface{}{
		"app": map[string]string{
			"appid":   s.config.AppID,
			"token":   s.config.AccessToken,
			"cluster": s.config.ClusterID,
		},
		"user": map[string]string{
			"uid": utils.GenerateLocalUUID(),
		},
		"audio": map[string]string{
			"format": "mp3",
			"url":    audioURL,
		},
		"request": map[string]interface{}{
			"enable_itn": true,
		},
	}

	respBody, err := utils.PostJSON(volcengineSubmitURL, payload, s.config.AccessToken)
	if err != nil {
		return "", errors.New("Failed to submit ASR task: " + err.Error())
	}

	var submitResp struct {
		Resp struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
			ID      string `json:"id"`
		} `json:"resp"`
	}
	if err := json.Unmarshal(respBody, &submitResp); err != nil {
		return "", errors.New("Failed to parse ASR submission response: " + err.Error())
	}

	return submitResp.Resp.ID, nil
}

// 根据任务ID查询ASR结果
func (s *ASRService) QueryResult(taskID string) ([]models.Utterance, error) {
	volcengineQueryURL := "https://openspeech.bytedance.com/api/v1/auc/query"

	payload := map[string]string{
		"appid":   s.config.AppID,
		"token":   s.config.AccessToken,
		"cluster": s.config.ClusterID,
		"id":      taskID,
	}

	respBody, err := utils.PostJSON(volcengineQueryURL, payload, s.config.AccessToken)
	if err != nil {
		return nil, errors.New("Failed to query ASR task: " + err.Error())
	}

	var queryResp struct {
		Resp struct {
			Code       int                `json:"code"`
			Message    string             `json:"message"`
			Utterances []models.Utterance `json:"utterances"`
		} `json:"resp"`
	}
	if err := json.Unmarshal(respBody, &queryResp); err != nil {
		return nil, errors.New("Failed to parse ASR query response: " + err.Error())
	}

	const (
		volcSuccessCode = 1000
		volcRunningCode = 2000
		volcPendingCode = 2001
	)

	switch queryResp.Resp.Code {
	case volcSuccessCode:
		return queryResp.Resp.Utterances, nil
	case volcRunningCode:
		return nil, nil
	case volcPendingCode:
		return nil, nil
	default:
		return nil, errors.New("ASR task failed with message: " + queryResp.Resp.Message)
	}
}

// 轮询ASR结果，直到完成或失败
func (s *ASRService) PollResult(taskID string) ([]models.Utterance, error) {
	for {
		utterances, err := s.QueryResult(taskID)
		if err != nil {
			return nil, err
		}
		if utterances != nil {
			return utterances, nil
		}
		time.Sleep(5 * time.Second)
	}
}