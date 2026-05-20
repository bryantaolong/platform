package service

import (
	"platform/internal/model"
	"platform/internal/repository"
)

type UserRoleService struct {
	roleRepo *repository.UserRoleRepository
}

func NewUserRoleService(roleRepo *repository.UserRoleRepository) *UserRoleService {
	return &UserRoleService{roleRepo: roleRepo}
}

func (s *UserRoleService) GetAllRoles() ([]model.UserRole, error) {
	return s.roleRepo.FindAll()
}
