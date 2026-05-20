package service

import (
	"fmt"
	"platform/internal/model"
	"platform/internal/repository"
	"sync"
)

type PostHotRankService struct {
	postRepo   *repository.PostRepository
	redisService *RedisService
	algoSvc    *HotRankAlgorithmService
	mu         sync.Mutex
}

const hotRankCacheKey = "post:hot_rank"

func NewPostHotRankService(
	postRepo *repository.PostRepository,
	redisService *RedisService,
	algoSvc *HotRankAlgorithmService,
) *PostHotRankService {
	return &PostHotRankService{
		postRepo:     postRepo,
		redisService: redisService,
		algoSvc:      algoSvc,
	}
}

// WarmUpCache calculates hot scores for all published posts and caches them
func (s *PostHotRankService) WarmUpCache() error {
	var allPosts []model.Post

	// Fetch all published posts in batches
	pageNum := int64(1)
	pageSize := int64(100)
	for {
		posts, total, err := s.postRepo.FindByStatus(model.PostStatusPublished, pageNum, pageSize)
		if err != nil {
			return err
		}
		allPosts = append(allPosts, posts...)
		if int64(len(allPosts)) >= total || len(posts) == 0 {
			break
		}
		pageNum++
	}

	// Calculate scores and cache in Redis sorted set
	for _, post := range allPosts {
		score := s.algoSvc.CalculateHotScore(&post)
		s.redisService.ZAddScore(hotRankCacheKey, score, post.ID)
	}

	return nil
}

func (s *PostHotRankService) GetHotPosts(limit int64) ([]model.Post, error) {
	// Try Redis first
	ids, err := s.redisService.ZRevRange(hotRankCacheKey, 0, limit-1)
	if err == nil && len(ids) > 0 {
		var posts []model.Post
		for _, idStr := range ids {
			var id int64
			if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
				continue
			}
			post, err := s.postRepo.FindByID(id)
			if err == nil {
				posts = append(posts, *post)
			}
		}
		return posts, nil
	}

	// Fallback to DB
	posts, _, err := s.postRepo.FindAll(repository.PostListFilter{
		SortBy:   "hot",
		PageNum:  1,
		PageSize: limit,
	})
	return posts, err
}

func (s *PostHotRankService) RefreshCache() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Clear old cache
	s.redisService.Delete(hotRankCacheKey)
	return s.WarmUpCache()
}
