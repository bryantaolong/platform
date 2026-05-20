package repository

import (
	"platform/internal/model"
	"time"

	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Insert(user *model.SysUser) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) Update(user *model.SysUser) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) DeleteByID(id int64, now time.Time, operator string) error {
	return r.db.Model(&model.SysUser{}).Where("id = ?", id).Updates(map[string]interface{}{
		"deleted":    1,
		"updated_at": now,
		"updated_by": operator,
	}).Error
}

func (r *UserRepository) FindByID(id int64) (*model.SysUser, error) {
	var user model.SysUser
	err := r.db.Where("id = ? AND deleted = 0", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByIDIncludeDeleted(id int64) (*model.SysUser, error) {
	var user model.SysUser
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(username string) (*model.SysUser, error) {
	var user model.SysUser
	err := r.db.Where("username = ? AND deleted = 0", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindAll(pageNum, pageSize int64) ([]model.SysUser, int64, error) {
	var users []model.SysUser
	var total int64

	query := r.db.Model(&model.SysUser{}).Where("deleted = 0")
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}
