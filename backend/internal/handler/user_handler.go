package handler

import (
	"fmt"
	"net/http"
	"platform/internal/dto"
	"platform/internal/middleware"
	"platform/internal/service"
	"platform/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userSvc    *service.UserService
	profileSvc *service.UserProfileService
}

func NewUserHandler(userSvc *service.UserService, profileSvc *service.UserProfileService) *UserHandler {
	return &UserHandler{userSvc: userSvc, profileSvc: profileSvc}
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	user, err := h.userSvc.GetUserByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(toUserVO(user)))
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	users, total, err := h.userSvc.ListUsers(pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	var vos []map[string]interface{}
	for _, u := range users {
		vos = append(vos, toUserVO(&u))
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(vos, total, pn, ps)))
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req dto.UserUpdateDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	user, err := h.userSvc.UpdateUser(userID, req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(toUserVO(user)))
}

func (h *UserHandler) BanUser(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	operatorID, _ := middleware.GetCurrentUserID(c)
	if err := h.userSvc.BanUser(userID, operatorID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserHandler) UnbanUser(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "用户ID无效"))
		return
	}

	operatorID, _ := middleware.GetCurrentUserID(c)
	if err := h.userSvc.UnbanUser(userID, operatorID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	profile, err := h.profileSvc.GetProfile(userID)
	if err != nil {
		handleError(c, err)
		return
	}

	fmt.Println(profile) // use profile
	c.JSON(http.StatusOK, response.Success(profile))
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req dto.UserProfileUpdateDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	profile, err := h.profileSvc.UpdateProfile(userID, req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(profile))
}
