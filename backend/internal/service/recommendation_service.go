package service

import (
	"platform/internal/dto"
	"platform/internal/model"
	"platform/internal/repository"
)

type RecommendationService struct {
	postRepo     *repository.PostRepository
	interestRepo *repository.UserProfileInterestRepository
	behaviorRepo *repository.UserBehaviorLogRepository
	behaviorSvc  *UserBehaviorService
}

func NewRecommendationService(
	postRepo *repository.PostRepository,
	interestRepo *repository.UserProfileInterestRepository,
	behaviorRepo *repository.UserBehaviorLogRepository,
	behaviorSvc *UserBehaviorService,
) *RecommendationService {
	return &RecommendationService{
		postRepo:     postRepo,
		interestRepo: interestRepo,
		behaviorRepo: behaviorRepo,
		behaviorSvc:  behaviorSvc,
	}
}

// GetRecommendations returns personalized recommendations for a user
func (s *RecommendationService) GetRecommendations(userID int64, params dto.RecommendationQuery) ([]model.Post, int64, error) {
	pageNum, pageSize := dto.DefaultPageParams(params.PageNum, params.PageSize)

	// Get user interests
	interests, err := s.interestRepo.FindByUserID(userID)
	if err != nil || len(interests) == 0 {
		// No interests: return hot posts
		return s.getHotPosts(pageNum, pageSize)
	}

	// Get recent behaviors
	excludeIDs := make([]int64, 0)
	behaviors, err := s.behaviorRepo.FindByUserID(userID, 30)
	if err == nil && len(behaviors) > 0 {
		// Exclude recently viewed posts
		for _, b := range behaviors {
			excludeIDs = append(excludeIDs, b.PostID)
		}
	}

	// Use top interests as tags for filtering
	var allPosts []model.Post
	var total int64

	for _, interest := range interests {
		if total >= pageSize {
			break
		}
		posts, count, err := s.postRepo.FindByTag(interest.InterestTag, 1, pageSize)
		if err != nil {
			continue
		}
		// Filter out excluded posts
		for _, p := range posts {
			excluded := false
			for _, eid := range excludeIDs {
				if p.ID == eid {
					excluded = true
					break
				}
			}
			if !excluded {
				allPosts = append(allPosts, p)
			}
		}
		total += count
	}

	if len(allPosts) == 0 {
		return s.getHotPosts(pageNum, pageSize)
	}

	// Apply pagination
	offset := (pageNum - 1) * pageSize
	if offset >= int64(len(allPosts)) {
		return []model.Post{}, total, nil
	}
	end := offset + pageSize
	if end > int64(len(allPosts)) {
		end = int64(len(allPosts))
	}
	return allPosts[offset:end], total, nil
}

func (s *RecommendationService) getHotPosts(pageNum, pageSize int64) ([]model.Post, int64, error) {
	filter := repository.PostListFilter{
		SortBy:   "hot",
		PageNum:  pageNum,
		PageSize: pageSize,
	}
	return s.postRepo.FindAll(filter)
}

// LogUserBehavior logs a user behavior event
func (s *RecommendationService) LogBehavior(userID, postID int64, behaviorType string, duration int) error {
	return s.behaviorSvc.Log(userID, postID, behaviorType, duration)
}
