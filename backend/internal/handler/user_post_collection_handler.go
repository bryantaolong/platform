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

type UserPostCollectionHandler struct {
	collectionSvc *service.UserPostCollectionService
	collectSvc    *service.UserPostCollectService
}

func NewUserPostCollectionHandler(collectionSvc *service.UserPostCollectionService, collectSvc *service.UserPostCollectService) *UserPostCollectionHandler {
	return &UserPostCollectionHandler{collectionSvc: collectionSvc, collectSvc: collectSvc}
}

func (h *UserPostCollectionHandler) CreateCollection(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req struct {
		FolderName string `json:"folderName" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	collection, err := h.collectionSvc.Create(userID, req.FolderName)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(collection))
}

func (h *UserPostCollectionHandler) UpdateCollection(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	collectionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "收藏夹ID无效"))
		return
	}

	var req struct {
		FolderName string `json:"folderName" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	collection, err := h.collectionSvc.Update(userID, collectionID, req.FolderName)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(collection))
}

func (h *UserPostCollectionHandler) DeleteCollection(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	collectionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "收藏夹ID无效"))
		return
	}

	if err := h.collectionSvc.Delete(userID, collectionID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *UserPostCollectionHandler) ListCollections(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	collections, err := h.collectionSvc.List(userID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(collections))
}

func (h *UserPostCollectionHandler) ListCollectsByCollection(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	collectionID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "收藏夹ID无效"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	collects, total, err := h.collectSvc.ListCollectsByCollection(userID, collectionID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(collects, total, pn, ps)))
}
