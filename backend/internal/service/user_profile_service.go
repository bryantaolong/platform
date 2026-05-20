package service

import (
	"fmt"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserProfileService struct {
	profileRepo *repository.UserProfileRepository
}

func NewUserProfileService(profileRepo *repository.UserProfileRepository) *UserProfileService {
	return &UserProfileService{profileRepo: profileRepo}
}

func (s *UserProfileService) CreateUserProfile(profile *model.UserProfile) (*model.UserProfile, error) {
	now := time.Now()
	profile.Deleted = 0
	profile.Version = 0
	profile.CreatedAt = now
	profile.UpdatedAt = now
	profile.CreatedBy = fmt.Sprintf("%d", profile.UserID)
	profile.UpdatedBy = fmt.Sprintf("%d", profile.UserID)

	if err := s.profileRepo.Create(profile); err != nil {
		return nil, exception.NewInternalError("创建用户资料失败")
	}
	return profile, nil
}

func (s *UserProfileService) GetProfile(userID int64) (*model.UserProfile, error) {
	profile, err := s.profileRepo.FindByUserID(userID)
	if err != nil {
		return nil, exception.NewNotFoundError("用户资料不存在")
	}
	return profile, nil
}

func (s *UserProfileService) UpdateProfile(userID int64, dto dto.UserProfileUpdateDTO) (*model.UserProfile, error) {
	profile, err := s.profileRepo.FindByUserID(userID)
	if err != nil {
		// Auto-create if not exists
		profile = &model.UserProfile{UserID: userID}
		if err := s.profileRepo.Create(profile); err != nil {
			return nil, exception.NewInternalError("创建用户资料失败")
		}
		profile, _ = s.profileRepo.FindByUserID(userID)
	}

	now := time.Now()
	if dto.RealName != "" {
		profile.RealName = dto.RealName
	}
	if dto.Gender != nil {
		profile.Gender = dto.Gender
	}
	if dto.Birthday != "" {
		if t, err := time.Parse("2006-01-02", dto.Birthday); err == nil {
			profile.Birthday = &t
		}
	}
	if dto.Avatar != "" {
		profile.Avatar = dto.Avatar
	}

	profile.Version = profile.Version + 1
	profile.UpdatedAt = now
	profile.UpdatedBy = fmt.Sprintf("%d", userID)

	if err := s.profileRepo.Update(profile); err != nil {
		return nil, exception.NewInternalError("更新用户资料失败")
	}
	return profile, nil
}
