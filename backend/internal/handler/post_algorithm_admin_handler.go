package handler

import (
	"fmt"
	"net/http"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type PostAlgorithmAdminHandler struct {
	algoSvc *service.HotRankAlgorithmService
}

func NewPostAlgorithmAdminHandler(algoSvc *service.HotRankAlgorithmService) *PostAlgorithmAdminHandler {
	return &PostAlgorithmAdminHandler{algoSvc: algoSvc}
}

func (h *PostAlgorithmAdminHandler) GetAllAlgorithms(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	algorithms, err := h.algoSvc.GetAllAlgorithms()
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(algorithms))
}

func (h *PostAlgorithmAdminHandler) UpdateAlgorithm(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	var req struct {
		MetricKey   string  `json:"metricKey" binding:"required"`
		MetricValue float64 `json:"metricValue" binding:"required"`
		Description string  `json:"description"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	operatorID, _ := middleware.GetCurrentUserID(c)
	operator := fmt.Sprintf("%d", operatorID)

	if err := h.algoSvc.UpdateAlgorithm(req.MetricKey, req.MetricValue, req.Description, operator); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}
