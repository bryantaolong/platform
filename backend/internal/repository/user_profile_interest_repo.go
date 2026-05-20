package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserProfileInterestRepository struct {
	db *gorm.DB
}

func NewUserProfileInterestRepository(db *gorm.DB) *UserProfileInterestRepository {
	return &UserProfileInterestRepository{db: db}
}

func (r *UserProfileInterestRepository) BatchUpsert(interests []model.UserProfileInterest) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, interest := range interests {
			var existing model.UserProfileInterest
			err := tx.Where("user_id = ? AND interest_tag = ? AND deleted = 0", interest.UserID, interest.InterestTag).First(&existing).Error
			if err == gorm.ErrRecordNotFound {
				if err := tx.Create(&interest).Error; err != nil {
					return err
				}
			} else if err != nil {
				return err
			} else {
				existing.Weight = interest.Weight
				existing.Source = interest.Source
				existing.UpdatedBy = interest.UpdatedBy
				if err := tx.Save(&existing).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *UserProfileInterestRepository) FindByUserID(userID int64) ([]model.UserProfileInterest, error) {
	var interests []model.UserProfileInterest
	err := r.db.Where("user_id = ? AND deleted = 0", userID).Order("weight DESC").Find(&interests).Error
	return interests, err
}

func (r *UserProfileInterestRepository) FindAllActiveUserIDs(days int) ([]int64, error) {
	var userIDs []int64
	err := r.db.Model(&model.UserProfileInterest{}).
		Where("deleted = 0 AND updated_at >= NOW() - INTERVAL '1 day' * ?", days).
		Distinct("user_id").Pluck("user_id", &userIDs).Error
	return userIDs, err
}
