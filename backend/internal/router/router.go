package router

import (
	"platform/internal/handler"
	"platform/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	userFollowHandler *handler.UserFollowHandler,
	userMessageHandler *handler.UserMessageHandler,
	userRoleHandler *handler.UserRoleHandler,
	userExportHandler *handler.UserExportHandler,
	postHandler *handler.PostHandler,
	postCommentHandler *handler.PostCommentHandler,
	postHotRankHandler *handler.PostHotRankHandler,
	postAlgorithmAdminHandler *handler.PostAlgorithmAdminHandler,
	userPostCollectionHandler *handler.UserPostCollectionHandler,
	llmChatHandler *handler.LlmChatHandler,
	recommendationHandler *handler.RecommendationHandler,
	fileHandler *handler.FileHandler,
	adminLogHandler *handler.AdminLogHandler,
	allowedOrigins string,
) *gin.Engine {
	r := gin.Default()

	// CORS
	r.Use(middleware.CORSMiddleware(allowedOrigins))

	// Static file serving
	r.Static("/uploads", "./uploads")

	// API v1
	api := r.Group("/api")

	// Auth routes (public + authenticated)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.AuthMiddleware(), authHandler.GetCurrentUser)
		auth.PUT("/change-password", middleware.AuthMiddleware(), authHandler.ChangePassword)
		auth.POST("/logout", middleware.AuthMiddleware(), authHandler.Logout)
		auth.DELETE("/delete-account", middleware.AuthMiddleware(), authHandler.DeleteAccount)
	}

	// User routes
	users := api.Group("/users")
	{
		users.GET("", middleware.AuthMiddleware(), userHandler.ListUsers)
		users.GET("/:id", userHandler.GetUser)
		users.PUT("/profile", middleware.AuthMiddleware(), userHandler.UpdateUser)
	}

	// User profile routes
	userProfiles := api.Group("/user-profiles")
	{
		userProfiles.GET("/me", middleware.AuthMiddleware(), userHandler.GetProfile)
		userProfiles.PUT("/me", middleware.AuthMiddleware(), userHandler.UpdateProfile)
	}

	// User follow routes
	userFollows := api.Group("/user-follows")
	{
		userFollows.POST("/:id", middleware.AuthMiddleware(), userFollowHandler.Follow)
		userFollows.DELETE("/:id", middleware.AuthMiddleware(), userFollowHandler.Unfollow)
		userFollows.GET("/followers/:id", userFollowHandler.GetFollowers)
		userFollows.GET("/following/:id", userFollowHandler.GetFollowing)
		userFollows.GET("/check/:id", middleware.AuthMiddleware(), userFollowHandler.IsFollowing)
	}

	// User message routes
	userMessages := api.Group("/user-messages")
	{
		userMessages.POST("", middleware.AuthMiddleware(), userMessageHandler.SendMessage)
		userMessages.GET("/conversation/:id", middleware.AuthMiddleware(), userMessageHandler.GetConversation)
		userMessages.GET("/unread", middleware.AuthMiddleware(), userMessageHandler.GetUnreadMessages)
		userMessages.GET("/unread/count", middleware.AuthMiddleware(), userMessageHandler.CountUnread)
		userMessages.PUT("/:id/read", middleware.AuthMiddleware(), userMessageHandler.MarkAsRead)
		userMessages.PUT("/:id/recall", middleware.AuthMiddleware(), userMessageHandler.RecallMessage)
	}

	// User role routes
	userRoles := api.Group("/user-roles")
	{
		userRoles.GET("", middleware.AuthMiddleware(), userRoleHandler.GetRoles)
	}

	// Post routes
	posts := api.Group("/posts")
	{
		posts.POST("", middleware.AuthMiddleware(), postHandler.CreatePost)
		posts.GET("", postHandler.ListPosts)
		posts.GET("/:id", postHandler.GetPost)
		posts.PUT("/:id", middleware.AuthMiddleware(), postHandler.UpdatePost)
		posts.DELETE("/:id", middleware.AuthMiddleware(), postHandler.DeletePost)

		// Like
		posts.POST("/:id/like", middleware.AuthMiddleware(), postHandler.LikePost)
		posts.DELETE("/:id/like", middleware.AuthMiddleware(), postHandler.UnlikePost)

		// Collect
		posts.POST("/:id/collect", middleware.AuthMiddleware(), postHandler.CollectPost)
	}

	// Post hot rank
	postsHot := api.Group("/posts/hot")
	{
		postsHot.GET("", postHotRankHandler.GetHotPosts)
		postsHot.POST("/refresh", middleware.AuthMiddleware(), postHotRankHandler.RefreshHotRank)
	}

	// Comments
	comments := api.Group("/comments")
	{
		comments.POST("/post/:postId", middleware.AuthMiddleware(), postCommentHandler.CreateComment)
		comments.GET("/post/:postId", postCommentHandler.GetComments)
		comments.GET("/replies/:id", postCommentHandler.GetReplies)
		comments.DELETE("/:id", middleware.AuthMiddleware(), postCommentHandler.DeleteComment)
		comments.POST("/:id/like", middleware.AuthMiddleware(), postCommentHandler.LikeComment)
		comments.DELETE("/:id/like", middleware.AuthMiddleware(), postCommentHandler.UnlikeComment)
	}

	// User post collections
	userCollections := api.Group("/user/post-collections")
	{
		userCollections.POST("", middleware.AuthMiddleware(), userPostCollectionHandler.CreateCollection)
		userCollections.GET("", middleware.AuthMiddleware(), userPostCollectionHandler.ListCollections)
		userCollections.PUT("/:id", middleware.AuthMiddleware(), userPostCollectionHandler.UpdateCollection)
		userCollections.DELETE("/:id", middleware.AuthMiddleware(), userPostCollectionHandler.DeleteCollection)
		userCollections.GET("/:id/posts", middleware.AuthMiddleware(), userPostCollectionHandler.ListCollectsByCollection)
	}

	// User post collects
	userCollects := api.Group("/user/post-collects")
	{
		userCollects.GET("", middleware.AuthMiddleware(), postHandler.ListCollectedPosts)
		userCollects.DELETE("/:id", middleware.AuthMiddleware(), postHandler.UncollectPost)
	}

	// LLM Chat
	llm := api.Group("/llm")
	{
		llm.POST("/chat", middleware.AuthMiddleware(), llmChatHandler.Chat)
	}

	// Recommendation
	rec := api.Group("/recommendation")
	{
		rec.GET("", middleware.OptionalAuthMiddleware(), recommendationHandler.GetRecommendations)
		rec.POST("/behavior", middleware.AuthMiddleware(), recommendationHandler.LogBehavior)
	}

	// File upload
	files := api.Group("/files")
	{
		files.POST("/upload/image", middleware.AuthMiddleware(), fileHandler.UploadImage)
		files.POST("/upload/avatar", middleware.AuthMiddleware(), fileHandler.UploadAvatar)
	}

	// Admin routes
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(), middleware.RequireRole("ROLE_ADMIN"))
	{
		// Post algorithm admin
		admin.GET("/post-algorithm", postAlgorithmAdminHandler.GetAllAlgorithms)
		admin.PUT("/post-algorithm", postAlgorithmAdminHandler.UpdateAlgorithm)

		// Post management
		admin.GET("/posts", postHandler.AdminListPosts)
		admin.PUT("/posts/:id/status", postHandler.AdminUpdatePostStatus)
		admin.DELETE("/posts/:id", postHandler.AdminDeletePost)

		// System logs
		admin.GET("/logs", adminLogHandler.ListLatestLogs)
		admin.GET("/logs/files", adminLogHandler.ListLogFiles)

		// User export
		admin.GET("/users/export", userExportHandler.ExportUsers)
	}

	// Admin user ban/unban
	api.PUT("/users/:id/ban", middleware.AuthMiddleware(), middleware.RequireRole("ROLE_ADMIN"), userHandler.BanUser)
	api.PUT("/users/:id/unban", middleware.AuthMiddleware(), middleware.RequireRole("ROLE_ADMIN"), userHandler.UnbanUser)

	return r
}
