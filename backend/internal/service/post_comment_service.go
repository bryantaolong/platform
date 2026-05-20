package service

import (
	"fmt"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type PostCommentService struct {
	commentRepo *repository.PostCommentRepository
	postRepo    *repository.PostRepository
	userRepo    *repository.UserRepository
	securityService *PostSecurityService
}

func NewPostCommentService(
	commentRepo *repository.PostCommentRepository,
	postRepo *repository.PostRepository,
	userRepo *repository.UserRepository,
	securityService *PostSecurityService,
) *PostCommentService {
	return &PostCommentService{
		commentRepo:     commentRepo,
		postRepo:        postRepo,
		userRepo:        userRepo,
		securityService: securityService,
	}
}

func (s *PostCommentService) CreateComment(userID int64, postID int64, req dto.CreateCommentRequest) (*model.PostComment, error) {
	// Check post exists
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, exception.NewNotFoundError("帖子不存在")
	}

	// Check comment area status
	if post.CommentAreaStatus == 1 {
		return nil, exception.NewBusinessError("该帖子已关闭评论")
	}

	// Content security check
	if err := s.securityService.CheckContent(req.Content, ""); err != nil {
		return nil, err
	}

	// Get user info
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, exception.NewNotFoundError("用户不存在")
	}

	// Get next floor number
	maxFloor, _ := s.commentRepo.GetMaxFloor(postID)
	floor := maxFloor + 1

	now := time.Now()
	comment := &model.PostComment{
		PostID:        postID,
		UserID:        userID,
		Username:      user.Username,
		Content:       req.Content,
		RootID:        req.RootID,
		ParentID:      req.ParentID,
		Floor:         floor,
		Status:        model.CommentStatusNormal,
		Deleted:       0,
		Version:       0,
		CreatedAt:     now,
		UpdatedAt:     now,
		CreatedBy:     fmt.Sprintf("%d", userID),
		UpdatedBy:     fmt.Sprintf("%d", userID),
	}

	if req.RootID != nil {
		comment.Type = 1 // reply
	} else {
		comment.Type = 0 // top-level comment
	}

	if req.ReplyToUserID != nil {
		comment.ReplyToUserID = req.ReplyToUserID
	}

	// Build path for tree structure
	if req.ParentID != nil {
		parentComment, err := s.commentRepo.FindByID(*req.ParentID)
		if err == nil {
			if parentComment.Path != "" {
				comment.Path = parentComment.Path + "/" + fmt.Sprintf("%d", *req.ParentID)
			} else {
				comment.Path = fmt.Sprintf("%d", *req.ParentID)
			}
			if parentComment.RootID != nil {
				comment.RootID = parentComment.RootID
			} else {
				comment.RootID = req.ParentID
			}
			// Set reply username if not provided
			if comment.ReplyToUsername == "" {
				comment.ReplyToUsername = parentComment.Username
			}
			if comment.ReplyToUserID == nil {
				comment.ReplyToUserID = &parentComment.UserID
			}
		}
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, exception.NewInternalError("评论失败")
	}

	// Increment post comment count
	s.postRepo.IncrementCommentCount(postID)

	// Increment parent child count
	if req.ParentID != nil {
		s.commentRepo.IncrementChildCount(*req.ParentID)
	}

	return comment, nil
}

func (s *PostCommentService) GetComments(postID int64, params dto.CommentQueryParams) ([]model.PostComment, int64, error) {
	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)
	return s.commentRepo.FindByPostID(postID, pageNum, pageSize, params.SortBy)
}

func (s *PostCommentService) GetReplies(rootID int64) ([]model.PostComment, error) {
	return s.commentRepo.FindReplies(rootID)
}

func (s *PostCommentService) DeleteComment(userID, commentID int64) error {
	comment, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		return exception.NewNotFoundError("评论不存在")
	}
	if comment.UserID != userID {
		return exception.NewForbiddenError("只能删除自己的评论")
	}

	if err := s.commentRepo.SoftDelete(commentID, fmt.Sprintf("%d", userID)); err != nil {
		return exception.NewInternalError("删除评论失败")
	}

	// Decrement post comment count
	s.postRepo.DecrementCommentCount(comment.PostID)
	return nil
}
