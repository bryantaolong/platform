package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type UserMessageRepository struct {
	db *gorm.DB
}

func NewUserMessageRepository(db *gorm.DB) *UserMessageRepository {
	return &UserMessageRepository{db: db}
}

func (r *UserMessageRepository) Create(msg *model.UserMessage) error {
	return r.db.Create(msg).Error
}

func (r *UserMessageRepository) Update(msg *model.UserMessage) error {
	return r.db.Save(msg).Error
}

func (r *UserMessageRepository) FindByID(id int64) (*model.UserMessage, error) {
	var msg model.UserMessage
	err := r.db.Where("id = ? AND deleted = 0", id).First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *UserMessageRepository) FindConversation(senderID, receiverID int64, pageNum, pageSize int64) ([]model.UserMessage, int64, error) {
	var msgs []model.UserMessage
	var total int64

	query := r.db.Model(&model.UserMessage{}).Where(
		"deleted = 0 AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))",
		senderID, receiverID, receiverID, senderID,
	)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&msgs).Error; err != nil {
		return nil, 0, err
	}
	return msgs, total, nil
}

func (r *UserMessageRepository) FindUnreadMessages(userID int64, pageNum, pageSize int64) ([]model.UserMessage, int64, error) {
	var msgs []model.UserMessage
	var total int64

	query := r.db.Model(&model.UserMessage{}).Where("receiver_id = ? AND read_status = 0 AND deleted = 0", userID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&msgs).Error; err != nil {
		return nil, 0, err
	}
	return msgs, total, nil
}

func (r *UserMessageRepository) MarkAsRead(id int64) error {
	return r.db.Model(&model.UserMessage{}).Where("id = ?", id).
		Update("read_status", 1).Update("read_at", gorm.Expr("NOW()")).Error
}

func (r *UserMessageRepository) CountUnread(userID int64) (int64, error) {
	var count int64
	err := r.db.Model(&model.UserMessage{}).Where("receiver_id = ? AND read_status = 0 AND deleted = 0", userID).Count(&count).Error
	return count, err
}
