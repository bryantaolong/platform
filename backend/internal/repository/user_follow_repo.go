package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserFollowRepository struct {
	db *gorm.DB
}

func NewUserFollowRepository(db *gorm.DB) *UserFollowRepository {
	return &UserFollowRepository{db: db}
}

func (r *UserFollowRepository) Create(follow *model.UserFollow) error {
	return r.db.Create(follow).Error
}

func (r *UserFollowRepository) SoftDeleteByFollowerAndFollowing(followerID, followingID int64, operator string) error {
	return r.db.Model(&model.UserFollow{}).
		Where("follower_id = ? AND following_id = ? AND deleted = 0", followerID, followingID).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *UserFollowRepository) FindByFollowerAndFollowing(followerID, followingID int64) (*model.UserFollow, error) {
	var follow model.UserFollow
	err := r.db.Where("follower_id = ? AND following_id = ? AND deleted = 0", followerID, followingID).First(&follow).Error
	if err != nil {
		return nil, err
	}
	return &follow, nil
}

func (r *UserFollowRepository) FindFollowers(userID int64, pageNum, pageSize int64) ([]model.UserFollow, int64, error) {
	var follows []model.UserFollow
	var total int64

	query := r.db.Model(&model.UserFollow{}).Where("following_id = ? AND deleted = 0", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&follows).Error; err != nil {
		return nil, 0, err
	}
	return follows, total, nil
}

func (r *UserFollowRepository) FindFollowing(userID int64, pageNum, pageSize int64) ([]model.UserFollow, int64, error) {
	var follows []model.UserFollow
	var total int64

	query := r.db.Model(&model.UserFollow{}).Where("follower_id = ? AND deleted = 0", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&follows).Error; err != nil {
		return nil, 0, err
	}
	return follows, total, nil
}

func (r *UserFollowRepository) CountFollowers(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.UserFollow{}).Where("following_id = ? AND deleted = 0", userID).Count(&count).Error
	return count, err
}

func (r *UserFollowRepository) CountFollowing(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.UserFollow{}).Where("follower_id = ? AND deleted = 0", userID).Count(&count).Error
	return count, err
}

func (r *UserFollowRepository) IsMutualFollowing(userID1, userID2 int64) (bool, error) {
	var count int64
	err := r.db.Model(&model.UserFollow{}).
		Where("(follower_id = ? AND following_id = ? AND deleted = 0) OR (follower_id = ? AND following_id = ? AND deleted = 0)",
			userID1, userID2, userID2, userID1).
		Count(&count).Error
	return count == 2, err
}
