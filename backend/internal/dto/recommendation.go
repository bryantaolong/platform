package dto

// LlmChatRequest LLM chat request
type LlmChatRequest struct {
	Message  string           `json:"message" binding:"required"`
	Provider string           `json:"provider"`
	History  []ChatHistoryItem `json:"history"`
}

// ChatHistoryItem history message
type ChatHistoryItem struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// RecommendationQuery recommendation request params
type RecommendationQuery struct {
	PageNum  int `form:"pageNum"`
	PageSize int `form:"pageSize"`
}

// AlgorithmUpdateRequest update algorithm weight request
type AlgorithmUpdateRequest struct {
	MetricKey   string  `json:"metricKey" binding:"required"`
	MetricValue float64 `json:"metricValue" binding:"required"`
	Description string  `json:"description"`
}
