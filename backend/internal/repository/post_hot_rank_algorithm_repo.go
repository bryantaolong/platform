package repository

import (
	"platform/internal/model"

	"gorm.io/gorm"
)

type PostHotRankAlgorithmRepository struct {
	db *gorm.DB
}

func NewPostHotRankAlgorithmRepository(db *gorm.DB) *PostHotRankAlgorithmRepository {
	return &PostHotRankAlgorithmRepository{db: db}
}

func (r *PostHotRankAlgorithmRepository) FindAll() ([]model.PostHotRankAlgorithm, error) {
	var algorithms []model.PostHotRankAlgorithm
	err := r.db.Where("deleted = 0").Order("id ASC").Find(&algorithms).Error
	return algorithms, err
}

func (r *PostHotRankAlgorithmRepository) FindByMetricKey(key string) (*model.PostHotRankAlgorithm, error) {
	var algo model.PostHotRankAlgorithm
	err := r.db.Where("metric_key = ? AND deleted = 0", key).First(&algo).Error
	if err != nil {
		return nil, err
	}
	return &algo, nil
}

func (r *PostHotRankAlgorithmRepository) Update(algo *model.PostHotRankAlgorithm) error {
	return r.db.Save(algo).Error
}

func (r *PostHotRankAlgorithmRepository) BatchUpdate(algorithms []model.PostHotRankAlgorithm) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, algo := range algorithms {
			if err := tx.Model(&model.PostHotRankAlgorithm{}).Where("metric_key = ?", algo.MetricKey).
				Updates(map[string]interface{}{
					"metric_value": algo.MetricValue,
					"description":  algo.Description,
					"updated_by":   algo.UpdatedBy,
				}).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
