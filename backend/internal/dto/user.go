package dto

// UserUpdateDTO user update request
type UserUpdateDTO struct {
	Email string `json:"email"`
	Phone string `json:"phone"`
}

// UserProfileUpdateDTO profile update request
type UserProfileUpdateDTO struct {
	RealName string `json:"realName"`
	Gender   *int   `json:"gender"`
	Birthday string `json:"birthday"`
	Avatar   string `json:"avatar"`
}

// SendMessageDTO send message request
type SendMessageDTO struct {
	ReceiverID int64  `json:"receiverId" binding:"required"`
	Content    string `json:"content" binding:"required,min=1,max=5000"`
}
