package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserPostCollectRepository struct {
	db *gorm.DB
}

func NewUserPostCollectRepository(db *gorm.DB) *UserPostCollectRepository {
	return &UserPostCollectRepository{db: db}
}

func (r *UserPostCollectRepository) Create(collect *model.UserPostCollect) error {
	return r.db.Create(collect).Error
}

func (r *UserPostCollectRepository) SoftDelete(id int64, operator string) error {
	return r.db.Model(&model.UserPostCollect{}).Where("id = ?", id).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *UserPostCollectRepository) FindByID(id int64) (*model.UserPostCollect, error) {
	var collect model.UserPostCollect
	err := r.db.Where("id = ? AND deleted = 0", id).First(&collect).Error
	if err != nil {
		return nil, err
	}
	return &collect, nil
}

func (r *UserPostCollectRepository) FindByUserAndPost(userID, postID int64) (*model.UserPostCollect, error) {
	var collect model.UserPostCollect
	err := r.db.Where("user_id = ? AND post_id = ? AND deleted = 0", userID, postID).First(&collect).Error
	if err != nil {
		return nil, err
	}
	return &collect, nil
}

func (r *UserPostCollectRepository) FindByUser(userID int64, pageNum, pageSize int64) ([]model.UserPostCollect, int64, error) {
	var collects []model.UserPostCollect
	var total int64

	query := r.db.Model(&model.UserPostCollect{}).Where("user_id = ? AND deleted = 0", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&collects).Error; err != nil {
		return nil, 0, err
	}
	return collects, total, nil
}

func (r *UserPostCollectRepository) FindByUserAndCollection(userID, collectionID int64, pageNum, pageSize int64) ([]model.UserPostCollect, int64, error) {
	var collects []model.UserPostCollect
	var total int64

	query := r.db.Model(&model.UserPostCollect{}).Where("user_id = ? AND collection_id = ? AND deleted = 0", userID, collectionID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&collects).Error; err != nil {
		return nil, 0, err
	}
	return collects, total, nil
}
