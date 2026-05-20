package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"time"
)

type UserBehaviorService struct {
	behaviorLogRepo *repository.UserBehaviorLogRepository
}

func NewUserBehaviorService(behaviorLogRepo *repository.UserBehaviorLogRepository) *UserBehaviorService {
	return &UserBehaviorService{behaviorLogRepo: behaviorLogRepo}
}

func (s *UserBehaviorService) Log(userID, postID int64, behaviorType string, durationSeconds int) error {
	now := time.Now()
	log := &model.UserBehaviorLog{
		UserID:          userID,
		PostID:          postID,
		BehaviorType:    behaviorType,
		DurationSeconds: durationSeconds,
		Deleted:         0,
		Version:         0,
		CreatedAt:       now,
		UpdatedAt:       now,
		CreatedBy:       fmt.Sprintf("%d", userID),
		UpdatedBy:       fmt.Sprintf("%d", userID),
	}
	return s.behaviorLogRepo.Create(log)
}

func (s *UserBehaviorService) GetActiveUserIDs(days int) ([]int64, error) {
	return s.behaviorLogRepo.FindActiveUserIDs(days)
}
