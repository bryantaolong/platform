package service

import (
	"fmt"
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
	"platform/pkg/exception"
	"strings"
	"time"
)

type PostService struct {
	postRepo     *repository.PostRepository
	userRepo     *repository.UserRepository
	collectRepo  *repository.UserPostCollectRepository
	likeRepo     *repository.UserPostLikeRepository
	securityService *PostSecurityService
}

func NewPostService(
	postRepo *repository.PostRepository,
	userRepo *repository.UserRepository,
	collectRepo *repository.UserPostCollectRepository,
	likeRepo *repository.UserPostLikeRepository,
	securityService *PostSecurityService,
) *PostService {
	return &PostService{
		postRepo:        postRepo,
		userRepo:        userRepo,
		collectRepo:     collectRepo,
		likeRepo:        likeRepo,
		securityService: securityService,
	}
}

func (s *PostService) CreatePost(userID int64, req dto.CreatePostRequest) (*model.Post, error) {
	now := time.Now()
	tags := strings.Join(req.Tags, ",")

	post := &model.Post{
		UserID:            userID,
		Title:             req.Title,
		Content:           req.Content,
		Status:            req.Status,
		CategoryID:        req.CategoryID,
		Tags:              tags,
		CommentAreaStatus: req.CommentAreaStatus,
		Deleted:           0,
		Version:           0,
		CreatedAt:         now,
		UpdatedAt:         now,
		CreatedBy:         fmt.Sprintf("%d", userID),
		UpdatedBy:         fmt.Sprintf("%d", userID),
	}

	if post.Status == 0 {
		post.Status = model.PostStatusDraft
	}

	// Content security check for published posts
	if post.Status == model.PostStatusPublished {
		if err := s.securityService.CheckContent(post.Title, post.Content); err != nil {
			return nil, err
		}
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, exception.NewInternalError("创建帖子失败")
	}
	return post, nil
}

func (s *PostService) GetPostByID(id int64) (*model.Post, error) {
	post, err := s.postRepo.FindByID(id)
	if err != nil {
		return nil, exception.NewNotFoundError("帖子不存在")
	}
	// Increment view count
	s.postRepo.IncrementViewCount(id)
	return post, nil
}

func (s *PostService) GetPostByIDAnyStatus(id int64) (*model.Post, error) {
	post, err := s.postRepo.FindByIDAnyStatus(id)
	if err != nil {
		return nil, exception.NewNotFoundError("帖子不存在")
	}
	return post, nil
}

func (s *PostService) ListPosts(params dto.PostQueryParams) ([]model.Post, int64, error) {
	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)

	filter := repository.PostListFilter{
		Status:    params.Status,
		UserID:    params.UserID,
		Keyword:   params.Keyword,
		Tag:       params.Tag,
		SortBy:    params.SortBy,
		SortOrder: params.SortOrder,
		PageNum:   pageNum,
		PageSize:  pageSize,
	}

	return s.postRepo.FindAll(filter)
}

func (s *PostService) UpdatePost(userID, postID int64, req dto.PostUpdateDTO) (*model.Post, error) {
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return nil, exception.NewNotFoundError("帖子不存在")
	}
	if post.UserID != userID {
		return nil, exception.NewForbiddenError("只能修改自己的帖子")
	}

	now := time.Now()
	if req.Title != nil {
		post.Title = *req.Title
	}
	if req.Content != nil {
		post.Content = *req.Content
	}
	if req.Status != nil {
		post.Status = *req.Status
	}
	if req.CategoryID != nil {
		post.CategoryID = req.CategoryID
	}
	if req.Tags != nil {
		post.Tags = strings.Join(req.Tags, ",")
	}
	if req.CommentAreaStatus != nil {
		post.CommentAreaStatus = *req.CommentAreaStatus
	}

	post.Version = post.Version + 1
	post.UpdatedAt = now
	post.UpdatedBy = fmt.Sprintf("%d", userID)

	if err := s.postRepo.Update(post); err != nil {
		return nil, exception.NewInternalError("更新帖子失败")
	}
	return post, nil
}

func (s *PostService) DeletePost(userID, postID int64) error {
	post, err := s.postRepo.FindByID(postID)
	if err != nil {
		return exception.NewNotFoundError("帖子不存在")
	}
	if post.UserID != userID {
		return exception.NewForbiddenError("只能删除自己的帖子")
	}
	return s.postRepo.SoftDelete(postID, fmt.Sprintf("%d", userID))
}

// Admin methods
func (s *PostService) ListAllPosts(pageNum, pageSize int64, status *int) ([]model.Post, int64, error) {
	pn, ps := dto.DefaultPageParams(int(pageNum), int(pageSize))

	if status != nil {
		return s.postRepo.FindByStatus(*status, pn, ps)
	}
	return s.postRepo.FindAll(repository.PostListFilter{PageNum: pn, PageSize: ps})
}

func (s *PostService) AdminUpdatePostStatus(postID int64, status int, operatorID int64) error {
	post, err := s.postRepo.FindByIDAnyStatus(postID)
	if err != nil {
		return exception.NewNotFoundError("帖子不存在")
	}

	post.Status = status
	post.Version = post.Version + 1
	post.UpdatedAt = time.Now()
	post.UpdatedBy = fmt.Sprintf("%d", operatorID)

	return s.postRepo.Update(post)
}

func (s *PostService) AdminDeletePost(postID int64, operatorID int64) error {
	return s.postRepo.SoftDelete(postID, fmt.Sprintf("%d", operatorID))
}
