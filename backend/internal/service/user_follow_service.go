package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserFollowService struct {
	followRepo *repository.UserFollowRepository
	userRepo   *repository.UserRepository
}

func NewUserFollowService(followRepo *repository.UserFollowRepository, userRepo *repository.UserRepository) *UserFollowService {
	return &UserFollowService{followRepo: followRepo, userRepo: userRepo}
}

func (s *UserFollowService) Follow(followerID, followingID int64) error {
	if followerID == followingID {
		return exception.NewBusinessError("不能关注自己")
	}

	// Check if target exists
	if _, err := s.userRepo.FindByID(followingID); err != nil {
		return exception.NewNotFoundError("被关注用户不存在")
	}

	// Check if already following
	existing, _ := s.followRepo.FindByFollowerAndFollowing(followerID, followingID)
	if existing != nil {
		return exception.NewBusinessError("已关注该用户")
	}

	now := time.Now()
	follow := &model.UserFollow{
		FollowerID:  followerID,
		FollowingID: followingID,
		Deleted:     0,
		Version:     0,
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   fmt.Sprintf("%d", followerID),
		UpdatedBy:   fmt.Sprintf("%d", followerID),
	}

	if err := s.followRepo.Create(follow); err != nil {
		return exception.NewInternalError("关注失败")
	}
	return nil
}

func (s *UserFollowService) Unfollow(followerID, followingID int64) error {
	err := s.followRepo.SoftDeleteByFollowerAndFollowing(followerID, followingID, fmt.Sprintf("%d", followerID))
	if err != nil {
		return exception.NewInternalError("取消关注失败")
	}
	return nil
}

func (s *UserFollowService) GetFollowers(userID int64, pageNum, pageSize int64) ([]model.UserFollow, int64, error) {
	return s.followRepo.FindFollowers(userID, pageNum, pageSize)
}

func (s *UserFollowService) GetFollowing(userID int64, pageNum, pageSize int64) ([]model.UserFollow, int64, error) {
	return s.followRepo.FindFollowing(userID, pageNum, pageSize)
}

func (s *UserFollowService) IsFollowing(followerID, followingID int64) (bool, error) {
	_, err := s.followRepo.FindByFollowerAndFollowing(followerID, followingID)
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (s *UserFollowService) IsMutualFollowing(userID1, userID2 int64) (bool, error) {
	return s.followRepo.IsMutualFollowing(userID1, userID2)
}
