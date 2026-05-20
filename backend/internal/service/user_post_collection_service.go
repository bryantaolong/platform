package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserPostCollectionService struct {
	collectionRepo *repository.UserPostCollectionRepository
}

func NewUserPostCollectionService(collectionRepo *repository.UserPostCollectionRepository) *UserPostCollectionService {
	return &UserPostCollectionService{collectionRepo: collectionRepo}
}

func (s *UserPostCollectionService) Create(userID int64, folderName string) (*model.UserPostCollection, error) {
	now := time.Now()
	collection := &model.UserPostCollection{
		UserID:     userID,
		FolderName: folderName,
		Deleted:    0,
		Version:    0,
		CreatedAt:  now,
		UpdatedAt:  now,
		CreatedBy:  fmt.Sprintf("%d", userID),
		UpdatedBy:  fmt.Sprintf("%d", userID),
	}

	if err := s.collectionRepo.Create(collection); err != nil {
		return nil, exception.NewInternalError("创建收藏夹失败")
	}
	return collection, nil
}

func (s *UserPostCollectionService) Update(userID, collectionID int64, folderName string) (*model.UserPostCollection, error) {
	collection, err := s.collectionRepo.FindByID(collectionID)
	if err != nil {
		return nil, exception.NewNotFoundError("收藏夹不存在")
	}
	if collection.UserID != userID {
		return nil, exception.NewForbiddenError("只能修改自己的收藏夹")
	}

	collection.FolderName = folderName
	collection.Version = collection.Version + 1
	collection.UpdatedAt = time.Now()
	collection.UpdatedBy = fmt.Sprintf("%d", userID)

	if err := s.collectionRepo.Update(collection); err != nil {
		return nil, exception.NewInternalError("更新收藏夹失败")
	}
	return collection, nil
}

func (s *UserPostCollectionService) Delete(userID, collectionID int64) error {
	collection, err := s.collectionRepo.FindByID(collectionID)
	if err != nil {
		return exception.NewNotFoundError("收藏夹不存在")
	}
	if collection.UserID != userID {
		return exception.NewForbiddenError("只能删除自己的收藏夹")
	}

	return s.collectionRepo.SoftDelete(collectionID, fmt.Sprintf("%d", userID))
}

func (s *UserPostCollectionService) List(userID int64) ([]model.UserPostCollection, error) {
	return s.collectionRepo.FindByUser(userID)
}
