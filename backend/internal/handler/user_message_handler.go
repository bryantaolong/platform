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

type UserMessageHandler struct {
	msgSvc *service.UserMessageService
}

func NewUserMessageHandler(msgSvc *service.UserMessageService) *UserMessageHandler {
	return &UserMessageHandler{msgSvc: msgSvc}
}

func (h *UserMessageHandler) SendMessage(c *gin.Context) {
	senderID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req dto.SendMessageDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	msg, err := h.msgSvc.SendMessage(senderID, req.ReceiverID, req.Content)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(msg))
}

func (h *UserMessageHandler) GetConversation(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	otherUserID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	msgs, total, err := h.msgSvc.GetConversation(userID, otherUserID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(msgs, total, pn, ps)))
}

func (h *UserMessageHandler) GetUnreadMessages(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	msgs, total, err := h.msgSvc.GetUnreadMessages(userID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(msgs, total, pn, ps)))
}

func (h *UserMessageHandler) MarkAsRead(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	msgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "消息ID无效"))
		return
	}

	if err := h.msgSvc.MarkAsRead(msgID, userID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserMessageHandler) RecallMessage(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	msgID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "消息ID无效"))
		return
	}

	if err := h.msgSvc.RecallMessage(msgID, userID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserMessageHandler) CountUnread(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	count, err := h.msgSvc.CountUnread(userID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(map[string]int64{"count": count}))
}
