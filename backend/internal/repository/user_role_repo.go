package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserRoleRepository struct {
	db *gorm.DB
}

func NewUserRoleRepository(db *gorm.DB) *UserRoleRepository {
	return &UserRoleRepository{db: db}
}

func (r *UserRoleRepository) FindAll() ([]model.UserRole, error) {
	var roles []model.UserRole
	err := r.db.Where("deleted = 0").Find(&roles).Error
	return roles, err
}

func (r *UserRoleRepository) FindByID(id int64) (*model.UserRole, error) {
	var role model.UserRole
	err := r.db.Where("id = ? AND deleted = 0", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *UserRoleRepository) FindDefault() (*model.UserRole, error) {
	var role model.UserRole
	err := r.db.Where("is_default = true AND deleted = 0").First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}
