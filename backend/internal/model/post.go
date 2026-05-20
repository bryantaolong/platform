package model

import (
	"time"

	"gorm.io/gorm"
)

// Post entity
type Post struct {
	ID               int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID           int64     `gorm:"column:user_id;not null;index" json:"userId"`
	Title            string    `gorm:"column:title" json:"title"`
	Content          string    `gorm:"column:content" json:"content"`
	Status           int       `gorm:"column:status;default:0" json:"status"` // 0-draft 1-published 2-hidden 3-auditing
	CategoryID       *int64    `gorm:"column:category_id" json:"categoryId"`
	Tags             string    `gorm:"column:tags" json:"tags"` // PostgreSQL text array as comma-separated string
	CommentAreaStatus int      `gorm:"column:comment_area_status;default:0" json:"commentAreaStatus"` // 0-open 1-closed
	ViewCount        int64     `gorm:"column:view_count;default:0" json:"viewCount"`
	LikeCount        int64     `gorm:"column:like_count;default:0" json:"likeCount"`
	CommentCount     int64     `gorm:"column:comment_count;default:0" json:"commentCount"`
	CollectCount     int64     `gorm:"column:collect_count;default:0" json:"collectCount"`
	ShareCount       int64     `gorm:"column:share_count;default:0" json:"shareCount"`
	Weight           int       `gorm:"column:weight;default:0" json:"weight"`
	Deleted          int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version          int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt        time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy        string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy        string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (Post) TableName() string {
	return "post"
}

// Post status constants
const (
	PostStatusDraft     = 0
	PostStatusPublished = 1
	PostStatusHidden    = 2
	PostStatusAuditing  = 3
)

// PostComment entity
type PostComment struct {
	ID              int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	PostID          int64     `gorm:"column:post_id;not null;index" json:"postId"`
	UserID          int64     `gorm:"column:user_id;not null" json:"userId"`
	Username        string    `gorm:"column:username" json:"username"`
	Avatar          string    `gorm:"column:avatar" json:"avatar"`
	RootID          *int64    `gorm:"column:root_id" json:"rootId"`
	ParentID        *int64    `gorm:"column:parent_id" json:"parentId"`
	Type            int       `gorm:"column:type;default:0" json:"type"` // 0-comment 1-reply
	Content         string    `gorm:"column:content" json:"content"`
	ReplyToUserID   *int64    `gorm:"column:reply_to_user_id" json:"replyToUserId"`
	ReplyToUsername string    `gorm:"column:reply_to_username" json:"replyToUsername"`
	Floor           int       `gorm:"column:floor" json:"floor"`
	LikeCount       int64     `gorm:"column:like_count;default:0" json:"likeCount"`
	DislikeCount    int64     `gorm:"column:dislike_count;default:0" json:"dislikeCount"`
	ChildCount      int64     `gorm:"column:child_count;default:0" json:"childCount"`
	Path            string    `gorm:"column:path" json:"path"`
	Status          int       `gorm:"column:status;default:0" json:"status"` // 0-normal 1-deleted 2-pending
	Deleted         int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version         int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy       string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy       string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (PostComment) TableName() string {
	return "post_comment"
}

// CommentStatus constants
const (
	CommentStatusNormal  = 0
	CommentStatusDeleted = 1
	CommentStatusPending = 2
)

// UserPostLike entity
type UserPostLike struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID    int64     `gorm:"column:user_id;not null;uniqueIndex:uk_user_post" json:"userId"`
	PostID    int64     `gorm:"column:post_id;not null;uniqueIndex:uk_user_post" json:"postId"`
	Deleted   int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version   int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserPostLike) TableName() string {
	return "user_post_like"
}

// UserCommentLike entity
type UserCommentLike struct {
	ID        int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID    int64     `gorm:"column:user_id;not null;uniqueIndex:uk_user_comment" json:"userId"`
	CommentID int64     `gorm:"column:comment_id;not null;uniqueIndex:uk_user_comment" json:"commentId"`
	Deleted   int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version   int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserCommentLike) TableName() string {
	return "user_comment_like"
}

// UserPostCollect entity
type UserPostCollect struct {
	ID           int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID       int64     `gorm:"column:user_id;not null;index" json:"userId"`
	PostID       int64     `gorm:"column:post_id;not null" json:"postId"`
	CollectionID int64     `gorm:"column:collection_id;default:0" json:"collectionId"`
	PostTitle    string    `gorm:"column:post_title" json:"postTitle"`
	Deleted      int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version      int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt    time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy    string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy    string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserPostCollect) TableName() string {
	return "user_post_collect"
}

// UserPostCollection entity
type UserPostCollection struct {
	ID         int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	UserID     int64     `gorm:"column:user_id;not null;index" json:"userId"`
	FolderName string    `gorm:"column:folder_name" json:"folderName"`
	Deleted    int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version    int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt  time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy  string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy  string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (UserPostCollection) TableName() string {
	return "user_post_collection"
}

// BeforeCreate hook for filling audit fields
func fillInsertCommon(db *gorm.DB) {
	db.Statement.SetColumn("deleted", 0)
	db.Statement.SetColumn("version", 0)
}

func (p *Post) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
func (c *PostComment) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
func (l *UserPostLike) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
func (cl *UserCommentLike) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
func (pc *UserPostCollect) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
func (pco *UserPostCollection) BeforeCreate(tx *gorm.DB) error { fillInsertCommon(tx); return nil }
