package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type PostCommentRepository struct {
	db *gorm.DB
}

func NewPostCommentRepository(db *gorm.DB) *PostCommentRepository {
	return &PostCommentRepository{db: db}
}

func (r *PostCommentRepository) Create(comment *model.PostComment) error {
	return r.db.Create(comment).Error
}

func (r *PostCommentRepository) Update(comment *model.PostComment) error {
	return r.db.Save(comment).Error
}

func (r *PostCommentRepository) SoftDelete(id int64, operator string) error {
	return r.db.Model(&model.PostComment{}).Where("id = ?", id).
		Updates(map[string]interface{}{"deleted": 1, "status": model.CommentStatusDeleted, "updated_by": operator}).Error
}

func (r *PostCommentRepository) FindByID(id int64) (*model.PostComment, error) {
	var comment model.PostComment
	err := r.db.Where("id = ? AND deleted = 0", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *PostCommentRepository) FindByPostID(postID int64, pageNum, pageSize int64, sortBy string) ([]model.PostComment, int64, error) {
	var comments []model.PostComment
	var total int64

	query := r.db.Model(&model.PostComment{}).Where("post_id = ? AND deleted = 0 AND type = 0", postID)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	order := "created_at ASC"
	if sortBy == "like" {
		order = "like_count DESC"
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order(order).Find(&comments).Error; err != nil {
		return nil, 0, err
	}
	return comments, total, nil
}

func (r *PostCommentRepository) FindReplies(rootID int64) ([]model.PostComment, error) {
	var comments []model.PostComment
	err := r.db.Where("root_id = ? AND deleted = 0", rootID).
		Order("created_at ASC").Find(&comments).Error
	return comments, err
}

func (r *PostCommentRepository) GetMaxFloor(postID int64) (int, error) {
	var maxFloor int
	err := r.db.Model(&model.PostComment{}).Where("post_id = ? AND deleted = 0", postID).
		Select("COALESCE(MAX(floor), 0)").Scan(&maxFloor).Error
	return maxFloor, err
}

func (r *PostCommentRepository) IncrementChildCount(id int64) error {
	return r.db.Model(&model.PostComment{}).Where("id = ?", id).
		UpdateColumn("child_count", gorm.Expr("child_count + 1")).Error
}

func (r *PostCommentRepository) IncrementLikeCount(id int64) error {
	return r.db.Model(&model.PostComment{}).Where("id = ?", id).
		UpdateColumn("like_count", gorm.Expr("like_count + 1")).Error
}

func (r *PostCommentRepository) DecrementLikeCount(id int64) error {
	return r.db.Model(&model.PostComment{}).Where("id = ?", id).
		UpdateColumn("like_count", gorm.Expr("GREATEST(like_count - 1, 0)")).Error
}
