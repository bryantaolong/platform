package model

import "time"

// PostHotRankAlgorithm entity
type PostHotRankAlgorithm struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	MetricKey   string    `gorm:"column:metric_key;not null" json:"metricKey"`
	MetricValue float64   `gorm:"column:metric_value" json:"metricValue"`
	Description string    `gorm:"column:description" json:"description"`
	Deleted     int       `gorm:"column:deleted;default:0;not null" json:"deleted"`
	Version     int       `gorm:"column:version;default:0;not null" json:"version"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	CreatedBy   string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedBy   string    `gorm:"column:updated_by" json:"updatedBy"`
}

func (PostHotRankAlgorithm) TableName() string {
	return "post_hot_rank_algorithm"
}
