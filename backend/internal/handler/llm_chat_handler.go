package handler

import (
	"net/http"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type LlmChatHandler struct {
	llmSvc *service.LlmChatService
}

func NewLlmChatHandler(llmSvc *service.LlmChatService) *LlmChatHandler {
	return &LlmChatHandler{llmSvc: llmSvc}
}

func (h *LlmChatHandler) Chat(c *gin.Context) {
	var req dto.LlmChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	history := make([]model.LlmChatMessage, len(req.History))
	for i, item := range req.History {
		history[i] = model.LlmChatMessage{Role: item.Role, Content: item.Content}
	}

	resp, err := h.llmSvc.Chat(req.Provider, history, req.Message)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(resp))
}
