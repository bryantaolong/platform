package model

import "time"

// SysUser user entity
type SysUser struct {
	ID              int64      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Username        string     `gorm:"column:username;uniqueIndex;not null" json:"username"`
	Password        string     `gorm:"column:password;not null" json:"-"`
	Phone           string     `gorm:"column:phone" json:"phone"`
	Email           string     `gorm:"column:email" json:"email"`
	Status          int        `gorm:"column:status;default:0" json:"status"` // 0-normal 1-banned 2-locked
	Roles           string     `gorm:"column:roles" json:"roles"`
	LastLoginAt     *time.Time `gorm:"column:last_login_at" json:"lastLoginAt"`
	LastLoginIP     string     `gorm:"column:last_login_ip" json:"lastLoginIp"`
	LastLoginDevice string     `gorm:"column:last_login_device" json:"lastLoginDevice"`
	PasswordResetAt *time.Time `gorm:"column:password_reset_at" json:"passwordResetAt"`
	LoginFailCount  int        `gorm:"column:login_fail_count;default:0" json:"loginFailCount"`
	LockedAt        *time.Time `gorm:"column:locked_at" json:"lockedAt"`
	Deleted         int        `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version         int        `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt       time.Time  `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy       string     `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy       string     `gorm:"column:updated_by" json:"updatedBy"`
}

func (SysUser) TableName() string {
	return "sys_user"
}

// User status constants
const (
	UserStatusNormal = 0
	UserStatusBanned = 1
	UserStatusLocked = 2
)

// UserRole entity
type UserRole struct {
	ID        int64     `gorm:"column:id;primaryKey" json:"id"`
	RoleName  string    `gorm:"column:role_name;not null" json:"roleName"`
	IsDefault bool      `gorm:"column:is_default;default:false;not null" json:"isDefault"`
	Deleted   int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version   int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserRole) TableName() string {
	return "user_role"
}

// UserProfile entity
type UserProfile struct {
	UserID    int64      `gorm:"column:user_id;primaryKey" json:"userId"`
	RealName  string     `gorm:"column:real_name" json:"realName"`
	Gender    *int       `gorm:"column:gender" json:"gender"` // 0-female 1-male
	Birthday  *time.Time `gorm:"column:birthday" json:"birthday"`
	Avatar    string     `gorm:"column:avatar" json:"avatar"`
	Deleted   int        `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version   int        `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy string     `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy string     `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserProfile) TableName() string {
	return "user_profile"
}

// UserFollow entity
type UserFollow struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	FollowerID  int64     `gorm:"column:follower_id;not null;index" json:"followerId"`
	FollowingID int64     `gorm:"column:following_id;not null;index" json:"followingId"`
	Deleted     int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version     int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy   string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy   string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserFollow) TableName() string {
	return "user_follow"
}

// UserMessage entity
type UserMessage struct {
	ID         int64      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	SenderID   int64      `gorm:"column:sender_id;not null;index" json:"senderId"`
	ReceiverID int64      `gorm:"column:receiver_id;not null;index" json:"receiverId"`
	Content    string     `gorm:"column:content" json:"content"`
	Status     int        `gorm:"column:status;default:0" json:"status"`      // 0-normal 1-recalled
	ReadStatus int        `gorm:"column:read_status;default:0" json:"readStatus"` // 0-unread 1-read
	ReadAt     *time.Time `gorm:"column:read_at" json:"readAt"`
	RecalledAt *time.Time `gorm:"column:recalled_at" json:"recalledAt"`
	Deleted    int        `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version    int        `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt  time.Time  `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy  string     `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy  string     `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserMessage) TableName() string {
	return "user_message"
}

// UserProfileInterest entity
type UserProfileInterest struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID      int64     `gorm:"column:user_id;not null;index" json:"userId"`
	InterestTag string    `gorm:"column:interest_tag" json:"interestTag"`
	Weight      float64   `gorm:"column:weight" json:"weight"`
	Source      string    `gorm:"column:source" json:"source"`
	Deleted     int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version     int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy   string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy   string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserProfileInterest) TableName() string {
	return "user_profile_interest"
}

// UserBehaviorLog entity
type UserBehaviorLog struct {
	ID              int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID          int64     `gorm:"column:user_id;not null;index" json:"userId"`
	PostID          int64     `gorm:"column:post_id" json:"postId"`
	BehaviorType    string    `gorm:"column:behavior_type" json:"behaviorType"`
	DurationSeconds int       `gorm:"column:duration_seconds" json:"durationSeconds"`
	Deleted         int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version         int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy       string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy       string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserBehaviorLog) TableName() string {
	return "user_behavior_log"
}
