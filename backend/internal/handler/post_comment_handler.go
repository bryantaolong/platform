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

type PostCommentHandler struct {
	commentSvc *service.PostCommentService
	likeSvc    *service.UserCommentLikeService
}

func NewPostCommentHandler(commentSvc *service.PostCommentService, likeSvc *service.UserCommentLikeService) *PostCommentHandler {
	return &PostCommentHandler{commentSvc: commentSvc, likeSvc: likeSvc}
}

func (h *PostCommentHandler) CreateComment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	postID, err := strconv.ParseInt(c.Param("postId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	var req dto.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "参数错误"))
		return
	}

	comment, err := h.commentSvc.CreateComment(userID, postID, req)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(comment))
}

func (h *PostCommentHandler) GetComments(c *gin.Context) {
	postID, err := strconv.ParseInt(c.Param("postId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "帖子ID无效"))
		return
	}

	var params dto.CommentQueryParams
	params.PostID = postID
	if err := c.ShouldBindQuery(&params); err != nil {
		// fill defaults
	}

	comments, total, err := h.commentSvc.GetComments(postID, params)
	if err != nil {
		handleError(c, err)
		return
	}

	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)
	c.JSON(http.StatusOK, response.Success(response.NewPageResult(comments, total, pageNum, pageSize)))
}

func (h *PostCommentHandler) GetReplies(c *gin.Context) {
	rootID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "评论ID无效"))
		return
	}

	replies, err := h.commentSvc.GetReplies(rootID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success(replies))
}

func (h *PostCommentHandler) DeleteComment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "评论ID无效"))
		return
	}

	if err := h.commentSvc.DeleteComment(userID, commentID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

// Like comment
func (h *PostCommentHandler) LikeComment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "评论ID无效"))
		return
	}

	if err := h.likeSvc.Like(userID, commentID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}

func (h *PostCommentHandler) UnlikeComment(c *gin.Context) {
	userID, err := middleware.GetCurrentUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Error(response.CodeUnauthorized, "未登录"))
		return
	}

	commentID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Error(response.CodeBadRequest, "评论ID无效"))
		return
	}

	if err := h.likeSvc.Unlike(userID, commentID); err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, response.Success[any](nil))
}
