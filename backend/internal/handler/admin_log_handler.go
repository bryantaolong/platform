package handler

import (
	"net/http"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AdminLogHandler struct {
	logSvc *service.LogService
}

func NewAdminLogHandler(logSvc *service.LogService) *AdminLogHandler {
	return &AdminLogHandler{logSvc: logSvc}
}

func (h *AdminLogHandler) ListLatestLogs(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	lines, _ := strconv.Atoi(c.DefaultQuery("lines", "200"))
	if lines <= 0 {
		lines = 200
	}
	if lines > 2000 {
		lines = 2000
	}

	file := c.Query("file")
	logs, err := h.logSvc.ListLatestLogs(file, lines)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(logs))
}

func (h *AdminLogHandler) ListLogFiles(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	files, err := h.logSvc.ListLogFiles()
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(files))
}
