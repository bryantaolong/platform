package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"platform/internal/config"
	"platform/internal/model"
)

type LlmChatService struct {
	config    config.LLMConfig
	client    *http.Client
}

func NewLlmChatService(cfg config.LLMConfig) *LlmChatService {
	return &LlmChatService{
		config: cfg,
		client: &http.Client{Timeout: 120 * 1000000000}, // 120s timeout
	}
}

type LlmChatResponse struct {
	Message string `json:"message"`
	Usage   *Usage `json:"usage,omitempty"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

func (s *LlmChatService) Chat(provider string, history []model.LlmChatMessage, userMessage string) (*LlmChatResponse, error) {
	if provider == "" {
		provider = s.config.API.DefaultProvider
	}

	p, ok := s.config.API.Providers[provider]
	if !ok {
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}

	messages := append(history, model.LlmChatMessage{Role: "user", Content: userMessage})

	reqBody := map[string]interface{}{
		"model":    p.Model,
		"messages": messages,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request failed: %w", err)
	}

	req, err := http.NewRequest("POST", p.URL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("create request failed: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.Key)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("api request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response failed: %w", err)
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("no response from LLM")
	}

	return &LlmChatResponse{
		Message: result.Choices[0].Message.Content,
	}, nil
}
