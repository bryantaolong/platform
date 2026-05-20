package handler

import (
	"net/http"
	"platform/internal/service"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type UserRoleHandler struct {
	roleSvc *service.UserRoleService
}

func NewUserRoleHandler(roleSvc *service.UserRoleService) *UserRoleHandler {
	return &UserRoleHandler{roleSvc: roleSvc}
}

func (h *UserRoleHandler) GetRoles(c *gin.Context) {
	roles, err := h.roleSvc.GetAllRoles()
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, response.Success(roles))
}
