package main

import (
	"fmt"
	"log"
	"os"
	"platform/internal/config"
	"platform/internal/handler"
	"platform/internal/job"
	"platform/internal/repository"
	"platform/internal/router"
	"platform/internal/service"
	jwtutil "platform/pkg/jwt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/robfig/cron/v3"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// Load config
	cfgPath := "config.yaml"
	if v := os.Getenv("CONFIG_PATH"); v != "" {
		cfgPath = v
	}

	cfg, err := config.LoadConfig(cfgPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize JWT
	jwtutil.Init(cfg.JWT.SecretKey, cfg.JWT.ExpirationMs, cfg.JWT.TokenPrefix)

	// Initialize database
	logLevel := logger.Info
	if cfg.Server.Mode == "release" {
		logLevel = logger.Warn
	}
	db, err := gorm.Open(postgres.Open(cfg.Database.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetimeMin) * time.Minute)

	log.Println("Database connected successfully")

	// Initialize Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr(),
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	log.Println("Redis connected successfully")

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	userRoleRepo := repository.NewUserRoleRepository(db)
	userProfileRepo := repository.NewUserProfileRepository(db)
	userFollowRepo := repository.NewUserFollowRepository(db)
	userMessageRepo := repository.NewUserMessageRepository(db)
	userProfileInterestRepo := repository.NewUserProfileInterestRepository(db)
	userBehaviorLogRepo := repository.NewUserBehaviorLogRepository(db)
	postRepo := repository.NewPostRepository(db)
	postCommentRepo := repository.NewPostCommentRepository(db)
	userPostLikeRepo := repository.NewUserPostLikeRepository(db)
	userCommentLikeRepo := repository.NewUserCommentLikeRepository(db)
	userPostCollectRepo := repository.NewUserPostCollectRepository(db)
	userPostCollectionRepo := repository.NewUserPostCollectionRepository(db)
	postHotRankAlgoRepo := repository.NewPostHotRankAlgorithmRepository(db)

	// Initialize services
	redisSvc := service.NewRedisService(rdb)

	authSvc := service.NewAuthService(userRepo, userRoleRepo, redisSvc, cfg.Security)
	userSvc := service.NewUserService(userRepo, userRoleRepo)
	userProfileSvc := service.NewUserProfileService(userProfileRepo)
	userFollowSvc := service.NewUserFollowService(userFollowRepo, userRepo)
	userMessageSvc := service.NewUserMessageService(userMessageRepo, userFollowRepo)
	userRoleSvc := service.NewUserRoleService(userRoleRepo)
	userExportSvc := service.NewUserExportService()
	userBehaviorSvc := service.NewUserBehaviorService(userBehaviorLogRepo)
	userInterestProfileSvc := service.NewUserInterestProfileService(userProfileInterestRepo)

	hotRankAlgoSvc := service.NewHotRankAlgorithmService(postHotRankAlgoRepo)
	// Load algorithm weights on startup
	if err := hotRankAlgoSvc.LoadWeights(); err != nil {
		log.Printf("Warning: Failed to load hot rank algorithm weights: %v", err)
	}

	postSecuritySvc := service.NewPostSecurityService()
	postSvc := service.NewPostService(postRepo, userRepo, userPostCollectRepo, userPostLikeRepo, postSecuritySvc)
	postCommentSvc := service.NewPostCommentService(postCommentRepo, postRepo, userRepo, postSecuritySvc)
	postHotRankSvc := service.NewPostHotRankService(postRepo, redisSvc, hotRankAlgoSvc)
	userPostLikeSvc := service.NewUserPostLikeService(userPostLikeRepo, postRepo)
	userCommentLikeSvc := service.NewUserCommentLikeService(userCommentLikeRepo, postCommentRepo)
	userPostCollectSvc := service.NewUserPostCollectService(userPostCollectRepo, userPostCollectionRepo, postRepo)
	userPostCollectionSvc := service.NewUserPostCollectionService(userPostCollectionRepo)

	llmChatSvc := service.NewLlmChatService(cfg.LLM)
	recommendationSvc := service.NewRecommendationService(postRepo, userProfileInterestRepo, userBehaviorLogRepo, userBehaviorSvc)
	fileSvc := service.NewFileService(cfg.File)
	logSvc := service.NewLogService()

	// Warm up hot post cache
	if err := postHotRankSvc.WarmUpCache(); err != nil {
		log.Printf("Warning: Failed to warm up hot post cache: %v", err)
	}

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authSvc, userProfileSvc)
	userHandler := handler.NewUserHandler(userSvc, userProfileSvc)
	userFollowHandler := handler.NewUserFollowHandler(userFollowSvc)
	userMessageHandler := handler.NewUserMessageHandler(userMessageSvc)
	userRoleHandler := handler.NewUserRoleHandler(userRoleSvc)
	userExportHandler := handler.NewUserExportHandler(userExportSvc, userSvc)
	postHandler := handler.NewPostHandler(postSvc, userPostLikeSvc, userPostCollectSvc)
	postCommentHandler := handler.NewPostCommentHandler(postCommentSvc, userCommentLikeSvc)
	postHotRankHandler := handler.NewPostHotRankHandler(postHotRankSvc)
	postAlgorithmAdminHandler := handler.NewPostAlgorithmAdminHandler(hotRankAlgoSvc)
	userPostCollectionHandler := handler.NewUserPostCollectionHandler(userPostCollectionSvc, userPostCollectSvc)
	llmChatHandler := handler.NewLlmChatHandler(llmChatSvc)
	recommendationHandler := handler.NewRecommendationHandler(recommendationSvc)
	fileHandler := handler.NewFileHandler(fileSvc)
	adminLogHandler := handler.NewAdminLogHandler(logSvc)

	// Setup router
	r := router.SetupRouter(
		authHandler,
		userHandler,
		userFollowHandler,
		userMessageHandler,
		userRoleHandler,
		userExportHandler,
		postHandler,
		postCommentHandler,
		postHotRankHandler,
		postAlgorithmAdminHandler,
		userPostCollectionHandler,
		llmChatHandler,
		recommendationHandler,
		fileHandler,
		adminLogHandler,
		cfg.CORS.AllowedOrigins,
	)

	// Setup scheduled jobs
	cronScheduler := cron.New()

	userProfileJob := job.NewUserProfileUpdateJob(userBehaviorSvc, userInterestProfileSvc, cfg.Job.UserProfileUpdate)
	if cfg.Job.UserProfileUpdate.Enabled {
		_, err := cronScheduler.AddFunc(cfg.Job.UserProfileUpdate.Cron, userProfileJob.Run)
		if err != nil {
			log.Printf("Warning: Failed to schedule UserProfileUpdateJob: %v", err)
		}
	}

	orphanImageJob := job.NewOrphanImageCleanupJob(fileSvc, cfg.Job.OrphanImageCleanup)
	if cfg.Job.OrphanImageCleanup.Enabled {
		_, err := cronScheduler.AddFunc(cfg.Job.OrphanImageCleanup.Cron, orphanImageJob.Run)
		if err != nil {
			log.Printf("Warning: Failed to schedule OrphanImageCleanupJob: %v", err)
		}
	}

	cronScheduler.Start()
	log.Println("Scheduled jobs started")

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
