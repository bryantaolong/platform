package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserCommentLikeService struct {
	likeRepo    *repository.UserCommentLikeRepository
	commentRepo *repository.PostCommentRepository
}

func NewUserCommentLikeService(likeRepo *repository.UserCommentLikeRepository, commentRepo *repository.PostCommentRepository) *UserCommentLikeService {
	return &UserCommentLikeService{likeRepo: likeRepo, commentRepo: commentRepo}
}

func (s *UserCommentLikeService) Like(userID, commentID int64) error {
	if _, err := s.commentRepo.FindByID(commentID); err != nil {
		return exception.NewNotFoundError("评论不存在")
	}

	existing, _ := s.likeRepo.FindByUserAndComment(userID, commentID)
	if existing != nil {
		return exception.NewBusinessError("已经点赞过了")
	}

	now := time.Now()
	like := &model.UserCommentLike{
		UserID:    userID,
		CommentID: commentID,
		Deleted:   0,
		Version:   0,
		CreatedAt: now,
		UpdatedAt: now,
		CreatedBy: fmt.Sprintf("%d", userID),
		UpdatedBy: fmt.Sprintf("%d", userID),
	}

	if err := s.likeRepo.Create(like); err != nil {
		return exception.NewInternalError("点赞失败")
	}

	return s.commentRepo.IncrementLikeCount(commentID)
}

func (s *UserCommentLikeService) Unlike(userID, commentID int64) error {
	_, err := s.likeRepo.FindByUserAndComment(userID, commentID)
	if err != nil {
		return exception.NewBusinessError("尚未点赞")
	}

	if err := s.likeRepo.SoftDelete(userID, commentID, fmt.Sprintf("%d", userID)); err != nil {
		return exception.NewInternalError("取消点赞失败")
	}

	return s.commentRepo.DecrementLikeCount(commentID)
}
