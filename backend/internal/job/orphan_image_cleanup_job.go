package job

import (
	"log"
	"platform/internal/config"
	"platform/internal/service"
)

// OrphanImageCleanupJob periodically removes orphan image files
type OrphanImageCleanupJob struct {
	fileSvc *service.FileService
	config   config.OrphanImageCleanupJobConfig
}

func NewOrphanImageCleanupJob(
	fileSvc *service.FileService,
	cfg config.OrphanImageCleanupJobConfig,
) *OrphanImageCleanupJob {
	return &OrphanImageCleanupJob{
		fileSvc: fileSvc,
		config:  cfg,
	}
}

func (j *OrphanImageCleanupJob) Run() {
	if !j.config.Enabled {
		return
	}

	log.Println("[Job] OrphanImageCleanupJob starting...")

	dir := j.config.UploadDir
	if dir == "" {
		dir = "post-images"
	}

	if err := j.fileSvc.CleanOrphanImages(dir, j.config.OrphanFileAgeDays); err != nil {
		log.Printf("[Job] OrphanImageCleanupJob failed: %v", err)
		return
	}

	log.Println("[Job] OrphanImageCleanupJob completed")
}
