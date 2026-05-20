package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserBehaviorLogRepository struct {
	db *gorm.DB
}

func NewUserBehaviorLogRepository(db *gorm.DB) *UserBehaviorLogRepository {
	return &UserBehaviorLogRepository{db: db}
}

func (r *UserBehaviorLogRepository) Create(log *model.UserBehaviorLog) error {
	return r.db.Create(log).Error
}

func (r *UserBehaviorLogRepository) FindByUserID(userID int64, days int) ([]model.UserBehaviorLog, error) {
	var logs []model.UserBehaviorLog
	err := r.db.Where("user_id = ? AND deleted = 0 AND created_at >= NOW() - INTERVAL '1 day' * ?", userID, days).
		Order("created_at DESC").Find(&logs).Error
	return logs, err
}

func (r *UserBehaviorLogRepository) FindActiveUserIDs(days int) ([]int64, error) {
	var userIDs []int64
	err := r.db.Model(&model.UserBehaviorLog{}).
		Where("deleted = 0 AND created_at >= NOW() - INTERVAL '1 day' * ?", days).
		Distinct("user_id").Pluck("user_id", &userIDs).Error
	return userIDs, err
}
