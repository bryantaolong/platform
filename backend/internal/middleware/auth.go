package middleware

import (
	"fmt"
	"net/http"
	"platform/pkg/exception"
	jwtutil "platform/pkg/jwt"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware JWT authentication middleware
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, jwtutil.GetTokenPrefix()) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "未授权，请先登录",
				"data":    nil,
			})
			return
		}

		token := jwtutil.ExtractBearerToken(authHeader)
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Token格式错误",
				"data":    nil,
			})
			return
		}

		if !jwtutil.ValidateToken(token) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Token无效或已过期",
				"data":    nil,
			})
			return
		}

		// Set user info in context
		userID, err := jwtutil.GetUserIDFromToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Token解析失败",
				"data":    nil,
			})
			return
		}

		username, _ := jwtutil.GetUsernameFromToken(token)
		roles := jwtutil.GetRolesFromToken(token)

		c.Set("userId", userID)
		c.Set("username", username)
		c.Set("roles", roles)
		c.Set("token", token)
		c.Next()
	}
}

// OptionalAuthMiddleware optional auth - doesn't block if not authenticated
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, jwtutil.GetTokenPrefix()) {
			c.Next()
			return
		}

		token := jwtutil.ExtractBearerToken(authHeader)
		if token == "" || !jwtutil.ValidateToken(token) {
			c.Next()
			return
		}

		userID, err := jwtutil.GetUserIDFromToken(token)
		if err == nil {
			c.Set("userId", userID)
			username, _ := jwtutil.GetUsernameFromToken(token)
			c.Set("username", username)
			c.Set("roles", jwtutil.GetRolesFromToken(token))
		}
		c.Next()
	}
}

// RequireRole middleware for role-based access control
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		rolesVal, exists := c.Get("roles")
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "禁止访问，权限不足",
				"data":    nil,
			})
			return
		}
		roles, ok := rolesVal.([]string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "禁止访问，权限不足",
				"data":    nil,
			})
			return
		}
		for _, r := range roles {
			if r == role {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"code":    403,
			"message": "禁止访问，权限不足",
			"data":    nil,
		})
	}
}

// GetCurrentUserID helper to get current user ID from context
func GetCurrentUserID(c *gin.Context) (int64, error) {
	userIDVal, exists := c.Get("userId")
	if !exists {
		return 0, exception.NewUnauthorizedError("未登录")
	}
	userIDStr, ok := userIDVal.(string)
	if !ok {
		return 0, exception.NewUnauthorizedError("用户ID格式错误")
	}
	var userID int64
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil {
		return 0, exception.NewUnauthorizedError("用户ID解析错误")
	}
	return userID, nil
}

// GetCurrentUsername helper
func GetCurrentUsername(c *gin.Context) (string, error) {
	usernameVal, exists := c.Get("username")
	if !exists {
		return "", exception.NewUnauthorizedError("未登录")
	}
	username, ok := usernameVal.(string)
	if !ok {
		return "", exception.NewUnauthorizedError("用户名格式错误")
	}
	return username, nil
}

// IsAdmin checks if current user has admin role
func IsAdmin(c *gin.Context) bool {
	rolesVal, exists := c.Get("roles")
	if !exists {
		return false
	}
	roles, ok := rolesVal.([]string)
	if !ok {
		return false
	}
	for _, r := range roles {
		if r == "ROLE_ADMIN" {
			return true
		}
	}
	return false
}
