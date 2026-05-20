package service

import (
	"fmt"
	"platform/internal/config"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	jwtutil "platform/pkg/jwt"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo       *repository.UserRepository
	userRoleRepo   *repository.UserRoleRepository
	redisService   *RedisService
	securityConfig config.SecurityConfig
}

func NewAuthService(
	userRepo *repository.UserRepository,
	userRoleRepo *repository.UserRoleRepository,
	redisService *RedisService,
	securityConfig config.SecurityConfig,
) *AuthService {
	return &AuthService{
		userRepo:       userRepo,
		userRoleRepo:   userRoleRepo,
		redisService:   redisService,
		securityConfig: securityConfig,
	}
}

func (s *AuthService) Register(req dto.RegisterRequest) (*model.SysUser, error) {
	// Check duplicate username
	existing, _ := s.userRepo.FindByUsername(req.Username)
	if existing != nil {
		return nil, exception.NewBusinessError("用户名已存在")
	}

	// Get default role
	defaultRole, err := s.userRoleRepo.FindDefault()
	if err != nil {
		return nil, exception.NewBusinessError("系统未配置默认角色")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, exception.NewInternalError("密码加密失败")
	}

	now := time.Now()
	user := &model.SysUser{
		Username:        req.Username,
		Password:        string(hashedPassword),
		Phone:           req.Phone,
		Email:           req.Email,
		Roles:           defaultRole.RoleName,
		Status:          model.UserStatusNormal,
		Deleted:         0,
		Version:         0,
		PasswordResetAt: &now,
		CreatedAt:       now,
		UpdatedAt:       now,
		CreatedBy:       req.Username,
		UpdatedBy:       req.Username,
	}

	if err := s.userRepo.Insert(user); err != nil {
		return nil, exception.NewBusinessError("用户注册失败")
	}

	return user, nil
}

func (s *AuthService) Login(req dto.LoginRequest) (string, error) {
	user, err := s.userRepo.FindByUsername(req.Username)
	if err != nil || user == nil {
		return "", exception.NewBusinessError("用户名或密码错误")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return s.handleLoginFail(user)
	}

	// Check existing token in Redis
	existingToken, err := s.redisService.Get(user.Username)
	if err == nil && existingToken != "" && jwtutil.ValidateToken(existingToken) {
		s.redisService.SetExpire(user.Username, jwtutil.GetExpirationMs())
		return existingToken, nil
	}

	// Update last login info
	now := time.Now()
	user.LastLoginAt = &now
	user.LoginFailCount = 0
	user.Version = user.Version + 1
	user.UpdatedAt = now
	user.UpdatedBy = fmt.Sprintf("%d", user.ID)

	if err := s.userRepo.Update(user); err != nil {
		return "", exception.NewInternalError("更新登录信息失败")
	}

	// Generate JWT
	claims := map[string]interface{}{
		"username": user.Username,
		"roles":    user.Roles,
	}
	token, err := jwtutil.GenerateToken(fmt.Sprintf("%d", user.ID), claims)
	if err != nil {
		return "", exception.NewInternalError("Token生成失败")
	}

	// Store in Redis
	if err := s.redisService.Set(user.Username, token, jwtutil.GetExpirationMs()); err != nil {
		return "", exception.NewBusinessError("Token存储失败")
	}

	return token, nil
}

func (s *AuthService) handleLoginFail(user *model.SysUser) (string, error) {
	now := time.Now()
	user.LoginFailCount++
	user.UpdatedAt = now
	user.UpdatedBy = fmt.Sprintf("%d", user.ID)

	if user.LoginFailCount >= s.securityConfig.LoginFailLimit {
		user.Status = model.UserStatusLocked
		user.LockedAt = &now
		s.userRepo.Update(user)
		return "", exception.NewBusinessError("输入密码错误次数过多，账号锁定")
	}

	s.userRepo.Update(user)
	return "", exception.NewBusinessError("用户名或密码错误")
}

func (s *AuthService) GetCurrentUser(userID int64) (*model.SysUser, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, exception.NewNotFoundError("用户不存在")
	}
	return user, nil
}

func (s *AuthService) ChangePassword(userID int64, oldPassword, newPassword string) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return exception.NewNotFoundError("用户不存在")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return exception.NewBusinessError("旧密码不正确")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return exception.NewInternalError("密码加密失败")
	}

	now := time.Now()
	user.Password = string(hashedPassword)
	user.PasswordResetAt = &now
	user.Version = user.Version + 1
	user.UpdatedAt = now
	user.UpdatedBy = fmt.Sprintf("%d", userID)

	if err := s.userRepo.Update(user); err != nil {
		return exception.NewInternalError("密码更新失败")
	}

	// Clear old token
	s.redisService.Delete(user.Username)

	return nil
}

func (s *AuthService) Logout(username string) error {
	if err := s.redisService.Delete(username); err != nil {
		return exception.NewBusinessError("Token清除失败")
	}
	return nil
}

func (s *AuthService) DeleteAccount(userID int64) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return exception.NewNotFoundError("用户状态异常，无法注销")
	}

	now := time.Now()
	return s.userRepo.DeleteByID(user.ID, now, fmt.Sprintf("%d", userID))
}
