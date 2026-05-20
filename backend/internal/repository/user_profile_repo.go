package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserProfileRepository struct {
	db *gorm.DB
}

func NewUserProfileRepository(db *gorm.DB) *UserProfileRepository {
	return &UserProfileRepository{db: db}
}

func (r *UserProfileRepository) Create(profile *model.UserProfile) error {
	return r.db.Create(profile).Error
}

func (r *UserProfileRepository) Update(profile *model.UserProfile) error {
	return r.db.Save(profile).Error
}

func (r *UserProfileRepository) FindByUserID(userID int64) (*model.UserProfile, error) {
	var profile model.UserProfile
	err := r.db.Where("user_id = ? AND deleted = 0", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}
