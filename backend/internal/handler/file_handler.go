package handler

import (
	"net/http"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	fileSvc *service.FileService
}

func NewFileHandler(fileSvc *service.FileService) *FileHandler {
	return &FileHandler{fileSvc: fileSvc}
}

func (h *FileHandler) UploadImage(c *gin.Context) {
	if _, err := middleware.GetCurrentUserID(c); err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "请选择文件"))
		return
	}

	url, err := h.fileSvc.UploadImage(file)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(map[string]string{"url": url}))
}

func (h *FileHandler) UploadAvatar(c *gin.Context) {
	if _, err := middleware.GetCurrentUserID(c); err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "请选择文件"))
		return
	}

	url, err := h.fileSvc.UploadAvatar(file)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(map[string]string{"url": url}))
}
