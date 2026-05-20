package model

// LlmChatMessage represents a single chat message
type LlmChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}
