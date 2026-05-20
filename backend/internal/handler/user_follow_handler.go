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

type UserFollowHandler struct {
	followSvc *service.UserFollowService
}

func NewUserFollowHandler(followSvc *service.UserFollowService) *UserFollowHandler {
	return &UserFollowHandler{followSvc: followSvc}
}

func (h *UserFollowHandler) Follow(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	if err := h.followSvc.Follow(followerID, followingID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserFollowHandler) Unfollow(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	if err := h.followSvc.Unfollow(followerID, followingID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserFollowHandler) GetFollowers(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	followers, total, err := h.followSvc.GetFollowers(userID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(followers, total, pn, ps)))
}

func (h *UserFollowHandler) GetFollowing(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	following, total, err := h.followSvc.GetFollowing(userID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(following, total, pn, ps)))
}

func (h *UserFollowHandler) IsFollowing(c *gin.Context) {
	followerID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	followingID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	isFollowing, _ := h.followSvc.IsFollowing(followerID, followingID)
	c.JSON(http.StatusOK, response.Success(map[string]bool{"isFollowing": isFollowing}))
}
