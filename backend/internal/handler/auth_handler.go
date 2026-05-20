package handler

import (
	"net/http"
	"platform/internal/dto"
	"platform/internal/middleware"
	"platform/internal/model"
	"platform/internal/service"
	"platform/pkg/exception"
	"platform/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
	profileSvc  *service.UserProfileService
}

func NewAuthHandler(authService *service.AuthService, profileSvc *service.UserProfileService) *AuthHandler {
	return &AuthHandler{authService: authService, profileSvc: profileSvc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	user, err := h.authService.Register(req)
	if err != nil {
		handleError(c, err)
		return
	}

	// Auto-create profile
	profile := model.UserProfile{UserID: user.ID}
	h.profileSvc.CreateUserProfile(&profile)

	c.JSON(http.StatusOK, response.Success(toUserVO(user)))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	token, err := h.authService.Login(req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(token))
}

func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	user, err := h.authService.GetCurrentUser(userID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(toUserVO(user)))
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	if err := h.authService.ChangePassword(userID, req.OldPassword, req.NewPassword); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	username, err := middleware.GetCurrentUsername(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	if err := h.authService.Logout(username); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	if err := h.authService.DeleteAccount(userID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

// toUserVO converts SysUser to a safe view object
func toUserVO(u *model.SysUser) map[string]interface{} {
	return map[string]interface{}{
		"id":        u.ID,
		"username":  u.Username,
		"email":     u.Email,
		"phone":     u.Phone,
		"status":    u.Status,
		"roles":     u.Roles,
		"createdAt": u.CreatedAt,
		"updatedAt": u.UpdatedAt,
	}
}

// handleError converts AppError to appropriate HTTP response
func handleError(c *gin.Context, err error) {
	if appErr, ok := err.(*exception.AppError); ok {
		c.JSON(appErr.Code, response.Error(appErr.Code, appErr.Message))
		return
	}
	c.JSON(http.StatusInternalServerError, response.Error(response.CodeInternalErr, err.Error()))
}
