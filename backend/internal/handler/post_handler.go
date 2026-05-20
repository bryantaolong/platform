package handler

import (
	"net/http"
	"platform/internal/dto"
	"platform/internal/middleware"
	"platform/internal/model"
	"platform/internal/service"
	"platform/pkg/response"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type PostHandler struct {
	postSvc     *service.PostService
	likeSvc     *service.UserPostLikeService
	collectSvc  *service.UserPostCollectService
}

func NewPostHandler(postSvc *service.PostService, likeSvc *service.UserPostLikeService, collectSvc *service.UserPostCollectService) *PostHandler {
	return &PostHandler{postSvc: postSvc, likeSvc: likeSvc, collectSvc: collectSvc}
}

func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	var req dto.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	post, err := h.postSvc.CreatePost(userID, req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(toPostVO(post, false, false)))
}

func (h *PostHandler) GetPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	post, err := h.postSvc.GetPostByID(id)
	if err != nil {
		handleError(c, err)
		return
	}

	// Check if current user liked/collected
	isLiked, isCollected := false, false
	if userID, err := middleware.GetCurrentUserID(c); err == nil {
		isLiked, _ = h.likeSvc.IsLiked(userID, post.ID)
		isCollected, _ = h.collectSvc.IsCollected(userID, post.ID)
	}

	c.JSON(http.StatusOK, response.Success(toPostVO(post, isLiked, isCollected)))
}

func (h *PostHandler) ListPosts(c *gin.Context) {
	var params dto.PostQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	posts, total, err := h.postSvc.ListPosts(params)
	if err != nil {
		handleError(c, err)
		return
	}

	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)
	var vos []map[string]interface{}
	for _, p := range posts {
		vos = append(vos, toPostVO(&p, false, false))
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(vos, total, pageNum, pageSize)))
}

func (h *PostHandler) UpdatePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	var req dto.PostUpdateDTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	post, err := h.postSvc.UpdatePost(userID, postID, req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(toPostVO(post, false, false)))
}

func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	if err := h.postSvc.DeletePost(userID, postID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

// Admin endpoints
func (h *PostHandler) AdminListPosts(c *gin.Context) {
	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	var status *int
	if statusStr := c.Query("status"); statusStr != "" {
		if s, err := strconv.Atoi(statusStr); err == nil {
			status = &s
		}
	}

	posts, total, err := h.postSvc.ListAllPosts(pn, ps, status)
	if err != nil {
		handleError(c, err)
		return
	}

	var vos []map[string]interface{}
	for _, p := range posts {
		vos = append(vos, toPostVO(&p, false, false))
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(vos, total, pn, ps)))
}

func (h *PostHandler) AdminUpdatePostStatus(c *gin.Context) {
	operatorID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	var req struct {
		Status int `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	if err := h.postSvc.AdminUpdatePostStatus(postID, req.Status, operatorID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *PostHandler) AdminDeletePost(c *gin.Context) {
	operatorID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	if err := h.postSvc.AdminDeletePost(postID, operatorID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

// Like endpoints
func (h *PostHandler) LikePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	if err := h.likeSvc.Like(userID, postID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *PostHandler) UnlikePost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	if err := h.likeSvc.Unlike(userID, postID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

// Collect endpoints
func (h *PostHandler) CollectPost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	var req struct {
		CollectionID int64 `json:"collectionId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// Allow empty body (default collection)
	}

	if err := h.collectSvc.Collect(userID, postID, req.CollectionID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *PostHandler) UncollectPost(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	collectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "收藏ID无效"))
		return
	}

	if err := h.collectSvc.Uncollect(userID, collectID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *PostHandler) ListCollectedPosts(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	pageNum, _ := strconv.Atoi(c.DefaultQuery("pageNum", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	pn, ps := dto.DefaultPageParams(pageNum, pageSize)

	collects, total, err := h.collectSvc.ListCollects(userID, pn, ps)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(response.NewPageResult(collects, total, pn, ps)))
}

func toPostVO(post *model.Post, isLiked, isCollected bool) map[string]interface{} {
	var tags []string
	if post.Tags != "" {
		tags = strings.Split(post.Tags, ",")
	}
	return map[string]interface{}{
		"id":               post.ID,
		"userId":           post.UserID,
		"title":            post.Title,
		"content":          post.Content,
		"status":           post.Status,
		"categoryId":       post.CategoryID,
		"tags":             tags,
		"commentAreaStatus": post.CommentAreaStatus,
		"viewCount":        post.ViewCount,
		"likeCount":        post.LikeCount,
		"commentCount":     post.CommentCount,
		"collectCount":     post.CollectCount,
		"shareCount":       post.ShareCount,
		"weight":           post.Weight,
		"isLiked":          isLiked,
		"isCollected":      isCollected,
		"createdAt":        post.CreatedAt,
		"updatedAt":        post.UpdatedAt,
	}
}
