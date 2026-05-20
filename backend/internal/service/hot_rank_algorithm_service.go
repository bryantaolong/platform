package service

import (
	"platform/internal/model"
	"platform/internal/repository"
	"sync"
)

type HotRankAlgorithmService struct {
	algoRepo  *repository.PostHotRankAlgorithmRepository
	weights   map[string]float64
	mu        sync.RWMutex
}

func NewHotRankAlgorithmService(algoRepo *repository.PostHotRankAlgorithmRepository) *HotRankAlgorithmService {
	return &HotRankAlgorithmService{
		algoRepo: algoRepo,
		weights:  make(map[string]float64),
	}
}

// LoadWeights loads algorithm weights from DB into memory
func (s *HotRankAlgorithmService) LoadWeights() error {
	algorithms, err := s.algoRepo.FindAll()
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.weights = make(map[string]float64)
	for _, algo := range algorithms {
		s.weights[algo.MetricKey] = algo.MetricValue
	}
	return nil
}

// GetWeight gets a weight by metric key
func (s *HotRankAlgorithmService) GetWeight(key string) float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if w, ok := s.weights[key]; ok {
		return w
	}
	return 0
}

// GetAllWeights returns all weights
func (s *HotRankAlgorithmService) GetAllWeights() map[string]float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	copy := make(map[string]float64)
	for k, v := range s.weights {
		copy[k] = v
	}
	return copy
}

// CalculateHotScore calculates hot score for a post
func (s *HotRankAlgorithmService) CalculateHotScore(post *model.Post) float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var score float64
	score += float64(post.ViewCount) * s.getWeightSafe("view")
	score += float64(post.LikeCount) * s.getWeightSafe("like")
	score += float64(post.CommentCount) * s.getWeightSafe("comment")
	score += float64(post.CollectCount) * s.getWeightSafe("collect")
	score += float64(post.ShareCount) * s.getWeightSafe("share")
	score += float64(post.Weight) * s.getWeightSafe("manual")

	return score
}

func (s *HotRankAlgorithmService) getWeightSafe(key string) float64 {
	if w, ok := s.weights[key]; ok {
		return w
	}
	return 0
}

// GetAllAlgorithms returns all algorithm configs
func (s *HotRankAlgorithmService) GetAllAlgorithms() ([]model.PostHotRankAlgorithm, error) {
	return s.algoRepo.FindAll()
}

// UpdateAlgorithm updates a single algorithm weight
func (s *HotRankAlgorithmService) UpdateAlgorithm(metricKey string, value float64, description, operator string) error {
	algo, err := s.algoRepo.FindByMetricKey(metricKey)
	if err != nil {
		return err
	}

	algo.MetricValue = value
	if description != "" {
		algo.Description = description
	}
	algo.UpdatedBy = operator

	if err := s.algoRepo.Update(algo); err != nil {
		return err
	}

	// Reload weights
	return s.LoadWeights()
}
