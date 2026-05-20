package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserPostLikeService struct {
	likeRepo *repository.UserPostLikeRepository
	postRepo *repository.PostRepository
}

func NewUserPostLikeService(likeRepo *repository.UserPostLikeRepository, postRepo *repository.PostRepository) *UserPostLikeService {
	return &UserPostLikeService{likeRepo: likeRepo, postRepo: postRepo}
}

func (s *UserPostLikeService) Like(userID, postID int64) error {
	// Check if post exists
	if _, err := s.postRepo.FindByID(postID); err != nil {
		return exception.NewNotFoundError("帖子不存在")
	}

	// Check if already liked
	existing, _ := s.likeRepo.FindByUserAndPost(userID, postID)
	if existing != nil {
		return exception.NewBusinessError("已经点赞过了")
	}

	now := time.Now()
	like := &model.UserPostLike{
		UserID:    userID,
		PostID:    postID,
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

	return s.postRepo.IncrementLikeCount(postID, 1)
}

func (s *UserPostLikeService) Unlike(userID, postID int64) error {
	_, err := s.likeRepo.FindByUserAndPost(userID, postID)
	if err != nil {
		return exception.NewBusinessError("尚未点赞")
	}

	if err := s.likeRepo.SoftDelete(userID, postID, fmt.Sprintf("%d", userID)); err != nil {
		return exception.NewInternalError("取消点赞失败")
	}

	return s.postRepo.IncrementLikeCount(postID, -1)
}

func (s *UserPostLikeService) IsLiked(userID, postID int64) (bool, error) {
	_, err := s.likeRepo.FindByUserAndPost(userID, postID)
	if err != nil {
		return false, nil
	}
	return true, nil
}
