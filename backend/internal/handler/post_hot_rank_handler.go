package handler

import (
	"net/http"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type PostHotRankHandler struct {
	rankSvc *service.PostHotRankService
}

func NewPostHotRankHandler(rankSvc *service.PostHotRankService) *PostHotRankHandler {
	return &PostHotRankHandler{rankSvc: rankSvc}
}

func (h *PostHotRankHandler) GetHotPosts(c *gin.Context) {
	limit := int64(20)
	posts, err := h.rankSvc.GetHotPosts(limit)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(posts))
}

func (h *PostHotRankHandler) RefreshHotRank(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	if err := h.rankSvc.RefreshCache(); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}
