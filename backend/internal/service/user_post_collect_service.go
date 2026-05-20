package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserPostCollectService struct {
	collectRepo    *repository.UserPostCollectRepository
	collectionRepo *repository.UserPostCollectionRepository
	postRepo       *repository.PostRepository
}

func NewUserPostCollectService(
	collectRepo *repository.UserPostCollectRepository,
	collectionRepo *repository.UserPostCollectionRepository,
	postRepo *repository.PostRepository,
) *UserPostCollectService {
	return &UserPostCollectService{
		collectRepo:    collectRepo,
		collectionRepo: collectionRepo,
		postRepo:       postRepo,
	}
}

func (s *UserPostCollectService) Collect(userID, postID, collectionID int64) error {
	// Check post exists
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return exception.NewNotFoundError("帖子不存在")
	}

	// Check if collection folder exists
	if collectionID > 0 {
		folder, err := s.collectionRepo.FindByID(collectionID)
		if err != nil || folder.UserID != userID {
			return exception.NewNotFoundError("收藏夹不存在")
		}
	}

	// Check if already collected
	existing, _ := s.collectRepo.FindByUserAndPost(userID, postID)
	if existing != nil {
		return exception.NewBusinessError("已经收藏过了")
	}

	now := time.Now()
	collect := &model.UserPostCollect{
		UserID:       userID,
		PostID:       postID,
		CollectionID: collectionID,
		PostTitle:    post.Title,
		Deleted:      0,
		Version:      0,
		CreatedAt:    now,
		UpdatedAt:    now,
		CreatedBy:    fmt.Sprintf("%d", userID),
		UpdatedBy:    fmt.Sprintf("%d", userID),
	}

	if err := s.collectRepo.Create(collect); err != nil {
		return exception.NewInternalError("收藏失败")
	}

	return s.postRepo.IncrementCollectCount(postID)
}

func (s *UserPostCollectService) Uncollect(userID, collectID int64) error {
	collect, err := s.collectRepo.FindByID(collectID)
	if err != nil {
		return exception.NewNotFoundError("收藏记录不存在")
	}
	if collect.UserID != userID {
		return exception.NewForbiddenError("只能取消自己的收藏")
	}

	if err := s.collectRepo.SoftDelete(collectID, fmt.Sprintf("%d", userID)); err != nil {
		return exception.NewInternalError("取消收藏失败")
	}

	return s.postRepo.DecrementCollectCount(collect.PostID)
}

func (s *UserPostCollectService) ListCollects(userID int64, pageNum, pageSize int64) ([]model.UserPostCollect, int64, error) {
	return s.collectRepo.FindByUser(userID, pageNum, pageSize)
}

func (s *UserPostCollectService) ListCollectsByCollection(userID, collectionID int64, pageNum, pageSize int64) ([]model.UserPostCollect, int64, error) {
	return s.collectRepo.FindByUserAndCollection(userID, collectionID, pageNum, pageSize)
}

func (s *UserPostCollectService) IsCollected(userID, postID int64) (bool, error) {
	_, err := s.collectRepo.FindByUserAndPost(userID, postID)
	if err != nil {
		return false, nil
	}
	return true, nil
}
