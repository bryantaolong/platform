package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserPostLikeRepository struct {
	db *gorm.DB
}

func NewUserPostLikeRepository(db *gorm.DB) *UserPostLikeRepository {
	return &UserPostLikeRepository{db: db}
}

func (r *UserPostLikeRepository) Create(like *model.UserPostLike) error {
	return r.db.Create(like).Error
}

func (r *UserPostLikeRepository) SoftDelete(userID, postID int64, operator string) error {
	return r.db.Model(&model.UserPostLike{}).
		Where("user_id = ? AND post_id = ? AND deleted = 0", userID, postID).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *UserPostLikeRepository) FindByUserAndPost(userID, postID int64) (*model.UserPostLike, error) {
	var like model.UserPostLike
	err := r.db.Where("user_id = ? AND post_id = ? AND deleted = 0", userID, postID).First(&like).Error
	if err != nil {
		return nil, err
	}
	return &like, nil
}

func (r *UserPostLikeRepository) CountByUser(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.UserPostLike{}).Where("user_id = ? AND deleted = 0", userID).Count(&count).Error
	return count, err
}
