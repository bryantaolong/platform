package job

import (
	"log"
	"platform/internal/config"
	"platform/internal/service"
)

// UserProfileUpdateJob periodically updates user interest profiles
type UserProfileUpdateJob struct {
	behaviorSvc  *service.UserBehaviorService
	interestSvc  *service.UserInterestProfileService
	config        config.UserProfileUpdateJobConfig
}

func NewUserProfileUpdateJob(
	behaviorSvc *service.UserBehaviorService,
	interestSvc *service.UserInterestProfileService,
	cfg config.UserProfileUpdateJobConfig,
) *UserProfileUpdateJob {
	return &UserProfileUpdateJob{
		behaviorSvc: behaviorSvc,
		interestSvc: interestSvc,
		config:      cfg,
	}
}

func (j *UserProfileUpdateJob) Run() {
	if !j.config.Enabled {
		return
	}

	log.Println("[Job] UserProfileUpdateJob starting...")

	// Get active users
	activeUserIDs, err := j.behaviorSvc.GetActiveUserIDs(j.config.ActiveUserDays)
	if err != nil {
		log.Printf("[Job] UserProfileUpdateJob failed to get active users: %v", err)
		return
	}

	log.Printf("[Job] UserProfileUpdateJob found %d active users", len(activeUserIDs))

	// Process in batches
	for i := 0; i < len(activeUserIDs); i += j.config.BatchSize {
		end := i + j.config.BatchSize
		if end > len(activeUserIDs) {
			end = len(activeUserIDs)
		}
		batch := activeUserIDs[i:end]

		for _, userID := range batch {
			_ = userID // In real implementation, analyze behavior and update interests
		}

		log.Printf("[Job] UserProfileUpdateJob processed batch %d-%d", i, end)
	}

	log.Println("[Job] UserProfileUpdateJob completed")
}
