package repository

import (
	"fmt"
	"platform/internal/model"
	"strings"

	"gorm.io/gorm"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) Create(post *model.Post) error {
	return r.db.Create(post).Error
}

func (r *PostRepository) Update(post *model.Post) error {
	return r.db.Save(post).Error
}

func (r *PostRepository) SoftDelete(id int64, operator string) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		Updates(map[string]interface{}{"deleted": 1, "updated_by": operator}).Error
}

func (r *PostRepository) FindByID(id int64) (*model.Post, error) {
	var post model.Post
	err := r.db.Where("id = ? AND deleted = 0", id).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) FindByIDAnyStatus(id int64) (*model.Post, error) {
	var post model.Post
	err := r.db.Where("id = ?", id).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

type PostListFilter struct {
	Status   *int
	UserID   *int64
	Keyword  string
	Tag      string
	SortBy   string
	SortOrder string
	PageNum   int64
	PageSize  int64
}

func (r *PostRepository) FindAll(filter PostListFilter) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	query := r.db.Model(&model.Post{}).Where("deleted = 0")

	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.UserID != nil {
		query = query.Where("user_id = ?", *filter.UserID)
	}
	if filter.Keyword != "" {
		query = query.Where("(title ILIKE ? OR content ILIKE ?)", "%"+filter.Keyword+"%", "%"+filter.Keyword+"%")
	}
	if filter.Tag != "" {
		query = query.Where("tags ILIKE ?", "%"+filter.Tag+"%")
	}

	query = query.Where("status = ?", model.PostStatusPublished)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := "created_at"
	sortOrder := "DESC"
	if filter.SortBy == "hot" {
		sortBy = "weight"
	}
	if filter.SortOrder != "" {
		sortOrder = strings.ToUpper(filter.SortOrder)
	}

	offset := (filter.PageNum - 1) * filter.PageSize
	if err := query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder)).
		Offset(int(offset)).Limit(int(filter.PageSize)).Find(&posts).Error; err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}

func (r *PostRepository) FindByStatus(status int, pageNum, pageSize int64) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	query := r.db.Model(&model.Post{}).Where("deleted = 0 AND status = ?", status)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (pageNum - 1) * pageSize
	if err := query.Offset(int(offset)).Limit(int(pageSize)).Order("created_at DESC").Find(&posts).Error; err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}

func (r *PostRepository) IncrementViewCount(id int64) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *PostRepository) IncrementLikeCount(id int64, delta int) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("like_count", gorm.Expr("like_count + ?", delta)).Error
}

func (r *PostRepository) IncrementCommentCount(id int64) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("comment_count", gorm.Expr("comment_count + 1")).Error
}

func (r *PostRepository) DecrementCommentCount(id int64) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("comment_count", gorm.Expr("GREATEST(comment_count - 1, 0)")).Error
}

func (r *PostRepository) IncrementCollectCount(id int64) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("collect_count", gorm.Expr("collect_count + 1")).Error
}

func (r *PostRepository) DecrementCollectCount(id int64) error {
	return r.db.Model(&model.Post{}).Where("id = ?", id).
		UpdateColumn("collect_count", gorm.Expr("GREATEST(collect_count - 1, 0)")).Error
}

func (r *PostRepository) FindByTag(tag string, pageNum, pageSize int64) ([]model.Post, int64, error) {
	filter := PostListFilter{
		Tag:      tag,
		PageNum:  pageNum,
		PageSize: pageSize,
	}
	return r.FindAll(filter)
}
