package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserCommentLikeRepository struct {
	db *gorm.DB
}

func NewUserCommentLikeRepository(db *gorm.DB) *UserCommentLikeRepository {
	return &UserCommentLikeRepository{db: db}
}

func (r *UserCommentLikeRepository) Create(like *model.UserCommentLike) error {
	return r.db.Create(like).Error
}

func (r *UserCommentLikeRepository) SoftDelete(userID, commentID int64, operator string) error {
	return r.db.Model(&model.UserCommentLike{}).
		Where("user_id = ? AND comment_id = ? AND deleted = 0", userID, commentID).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *UserCommentLikeRepository) FindByUserAndComment(userID, commentID int64) (*model.UserCommentLike, error) {
	var like model.UserCommentLike
	err := r.db.Where("user_id = ? AND comment_id = ? AND deleted = 0", userID, commentID).First(&like).Error
	if err != nil {
		return nil, err
	}
	return &like, nil
}
