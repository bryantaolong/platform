package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"time"
)

type UserInterestProfileService struct {
	interestRepo *repository.UserProfileInterestRepository
}

func NewUserInterestProfileService(interestRepo *repository.UserProfileInterestRepository) *UserInterestProfileService {
	return &UserInterestProfileService{interestRepo: interestRepo}
}

func (s *UserInterestProfileService) GetInterests(userID int64) ([]model.UserProfileInterest, error) {
	return s.interestRepo.FindByUserID(userID)
}

func (s *UserInterestProfileService) UpdateInterests(userID int64, interests []model.UserProfileInterest) error {
	now := time.Now()
	operator := fmt.Sprintf("%d", userID)
	for i := range interests {
		interests[i].UserID = userID
		interests[i].UpdatedAt = now
		interests[i].UpdatedBy = operator
		if interests[i].CreatedAt.IsZero() {
			interests[i].CreatedAt = now
			interests[i].CreatedBy = operator
		}
	}
	return s.interestRepo.BatchUpsert(interests)
}

func (s *UserInterestProfileService) GetActiveUserIDs(days int) ([]int64, error) {
	return s.interestRepo.FindAllActiveUserIDs(days)
}
