package handler

import (
	"net/http"
	"platform/internal/dto"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RecommendationHandler struct {
	recSvc *service.RecommendationService
}

func NewRecommendationHandler(recSvc *service.RecommendationService) *RecommendationHandler {
	return &RecommendationHandler{recSvc: recSvc}
}

func (h *RecommendationHandler) GetRecommendations(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		// Optional: return hot posts if not logged in
		c.JSON(http.StatusOK, response.Success(response.EmptyPageResult[any]()))
		return
	}

	var params dto.RecommendationQuery
	params.PageNum, _ = strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	params.PageSize, _ = strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	posts, total, err := h.recSvc.GetRecommendations(userID, params)
	if err != nil {
		handleError(c, err)
		return
	}

	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)
	c.JSON(http.StatusOK, response.Success(response.NewPageResult(posts, total, pageNum, pageSize)))
}

func (h *RecommendationHandler) LogBehavior(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req struct {
		PostID          int64  `json:"postId" binding:"required"`
		BehaviorType    string `json:"behaviorType" binding:"required"`
		DurationSeconds int    `json:"durationSeconds"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	if err := h.recSvc.LogBehavior(userID, req.PostID, req.BehaviorType, req.DurationSeconds); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}
