package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserPostCollectionRepository struct {
	db *gorm.DB
}

func NewUserPostCollectionRepository(db *gorm.DB) *UserPostCollectionRepository {
	return &UserPostCollectionRepository{db: db}
}

func (r *UserPostCollectionRepository) Create(collection *model.UserPostCollection) error {
	return r.db.Create(collection).Error
}

func (r *UserPostCollectionRepository) Update(collection *model.UserPostCollection) error {
	return r.db.Save(collection).Error
}

func (r *UserPostCollectionRepository) SoftDelete(id int64, operator string) error {
	return r.db.Model(&model.UserPostCollection{}).Where("id = ?", id).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *UserPostCollectionRepository) FindByID(id int64) (*model.UserPostCollection, error) {
	var collection model.UserPostCollection
	err := r.db.Where("id = ? AND deleted = 0", id).First(&collection).Error
	if err != nil {
		return nil, err
	}
	return &collection, nil
}

func (r *UserPostCollectionRepository) FindByUser(userID int64) ([]model.UserPostCollection, error) {
	var collections []model.UserPostCollection
	err := r.db.Where("user_id = ? AND deleted = 0", userID).
		Order("created_at DESC").Find(&collections).Error
	return collections, err
}
