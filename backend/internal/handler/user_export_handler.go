package handler

import (
	"net/http"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type UserExportHandler struct {
	exportSvc *service.UserExportService
	userSvc   *service.UserService
}

func NewUserExportHandler(exportSvc *service.UserExportService, userSvc *service.UserService) *UserExportHandler {
	return &UserExportHandler{exportSvc: exportSvc, userSvc: userSvc}
}

func (h *UserExportHandler) ExportUsers(c *gin.Context) {
	if !middleware.IsAdmin(c) {
		c.JSON(http.StatusForbidden, response.Error(response.CodeForbidden, "无权操作"))
		return
	}

	// Get all users (simplified: first 10000)
	users, _, err := h.userSvc.ListUsers(1, 10000)
	if err != nil {
		handleError(c, err)
		return
	}

	var exportData []service.ExportUserData
	for _, u := range users {
		exportData = append(exportData, service.ExportUserData{
			ID:        u.ID,
			Username:  u.Username,
			Email:     u.Email,
			Phone:     u.Phone,
			Status:    u.Status,
			Roles:     u.Roles,
			CreatedAt: u.CreatedAt,
		})
	}

	data, filename, err := h.exportSvc.ExportToCSV(exportData)
	if err != nil {
		handleError(c, err)
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "text/csv", data)
}
