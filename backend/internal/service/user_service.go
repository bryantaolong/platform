package service

import (
	"fmt"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserService struct {
	userRepo    *repository.UserRepository
	userRoleRepo *repository.UserRoleRepository
}

func NewUserService(userRepo *repository.UserRepository, userRoleRepo *repository.UserRoleRepository) *UserService {
	return &UserService{userRepo: userRepo, userRoleRepo: userRoleRepo}
}

func (s *UserService) GetUserByID(id int64) (*model.SysUser, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, exception.NewNotFoundError("用户不存在")
	}
	return user, nil
}

func (s *UserService) ListUsers(pageNum, pageSize int64) ([]model.SysUser, int64, error) {
	return s.userRepo.FindAll(pageNum, pageSize)
}

func (s *UserService) UpdateUser(userID int64, dto dto.UserUpdateDTO) (*model.SysUser, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, exception.NewNotFoundError("用户不存在")
	}

	now := time.Now()
	user.Email = dto.Email
	user.Phone = dto.Phone
	user.Version = user.Version + 1
	user.UpdatedAt = now
	user.UpdatedBy = fmt.Sprintf("%d", userID)

	if err := s.userRepo.Update(user); err != nil {
		return nil, exception.NewInternalError("更新用户失败")
	}
	return user, nil
}

func (s *UserService) BanUser(userID int64, operatorID int64) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return exception.NewNotFoundError("用户不存在")
	}

	user.Status = model.UserStatusBanned
	user.Version = user.Version + 1
	user.UpdatedAt = time.Now()
	user.UpdatedBy = fmt.Sprintf("%d", operatorID)

	return s.userRepo.Update(user)
}

func (s *UserService) UnbanUser(userID int64, operatorID int64) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return exception.NewNotFoundError("用户不存在")
	}

	user.Status = model.UserStatusNormal
	user.LoginFailCount = 0
	user.Version = user.Version + 1
	user.UpdatedAt = time.Now()
	user.UpdatedBy = fmt.Sprintf("%d", operatorID)

	return s.userRepo.Update(user)
}

func (s *UserService) GetRoles() ([]model.UserRole, error) {
	return s.userRoleRepo.FindAll()
}
