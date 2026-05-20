package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"time"
)

type UserMessageService struct {
	messageRepo *repository.UserMessageRepository
	followRepo  *repository.UserFollowRepository
}

func NewUserMessageService(messageRepo *repository.UserMessageRepository, followRepo *repository.UserFollowRepository) *UserMessageService {
	return &UserMessageService{messageRepo: messageRepo, followRepo: followRepo}
}

func (s *UserMessageService) SendMessage(senderID, receiverID int64, content string) (*model.UserMessage, error) {
	if senderID == receiverID {
		return nil, exception.NewBusinessError("不能给自己发消息")
	}

	// Check mutual following
	isMutual, err := s.followRepo.IsMutualFollowing(senderID, receiverID)
	if err != nil || !isMutual {
		return nil, exception.NewBusinessError("只能给互相关注的用户发送消息")
	}

	now := time.Now()
	msg := &model.UserMessage{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Content:    content,
		Status:     0,
		ReadStatus: 0,
		Deleted:    0,
		Version:    0,
		CreatedAt:  now,
		UpdatedAt:  now,
		CreatedBy:  fmt.Sprintf("%d", senderID),
		UpdatedBy:  fmt.Sprintf("%d", senderID),
	}

	if err := s.messageRepo.Create(msg); err != nil {
		return nil, exception.NewInternalError("发送消息失败")
	}
	return msg, nil
}

func (s *UserMessageService) GetConversation(userID, otherUserID int64, pageNum, pageSize int64) ([]model.UserMessage, int64, error) {
	return s.messageRepo.FindConversation(userID, otherUserID, pageNum, pageSize)
}

func (s *UserMessageService) GetUnreadMessages(userID int64, pageNum, pageSize int64) ([]model.UserMessage, int64, error) {
	return s.messageRepo.FindUnreadMessages(userID, pageNum, pageSize)
}

func (s *UserMessageService) MarkAsRead(messageID int64, userID int64) error {
	msg, err := s.messageRepo.FindByID(messageID)
	if err != nil {
		return exception.NewNotFoundError("消息不存在")
	}
	if msg.ReceiverID != userID {
		return exception.NewForbiddenError("无权操作此消息")
	}
	return s.messageRepo.MarkAsRead(messageID)
}

func (s *UserMessageService) RecallMessage(messageID int64, userID int64) error {
	msg, err := s.messageRepo.FindByID(messageID)
	if err != nil {
		return exception.NewNotFoundError("消息不存在")
	}
	if msg.SenderID != userID {
		return exception.NewForbiddenError("只能撤回自己的消息")
	}

	now := time.Now()
	msg.Status = 1
	msg.RecalledAt = &now
	msg.UpdatedAt = now
	msg.UpdatedBy = fmt.Sprintf("%d", userID)

	return s.messageRepo.Update(msg)
}

func (s *UserMessageService) CountUnread(userID int64) (int64, error) {
	return s.messageRepo.CountUnread(userID)
}
