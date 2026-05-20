package jwt

import (
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	jwtSecretKey   string
	jwtExpiration  time.Duration
	jwtTokenPrefix string
)

// Init initializes JWT config
func Init(secretKey string, expirationMs int64, tokenPrefix string) {
	jwtSecretKey = secretKey
	jwtExpiration = time.Duration(expirationMs) * time.Millisecond
	jwtTokenPrefix = tokenPrefix
}

func GetTokenPrefix() string {
	return jwtTokenPrefix
}

func GetExpirationMs() time.Duration {
	return jwtExpiration
}

// GenerateToken generates a JWT token with claims
func GenerateToken(userID string, claims map[string]interface{}) (string, error) {
	now := time.Now()
	mapClaims := jwt.MapClaims{
		"sub": userID,
		"iat": now.Unix(),
		"exp": now.Add(jwtExpiration).Unix(),
	}
	for k, v := range claims {
		mapClaims[k] = v
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, mapClaims)
	return token.SignedString([]byte(jwtSecretKey))
}

// GenerateTokenSimple generates a JWT token without extra claims
func GenerateTokenSimple(userID string) (string, error) {
	return GenerateToken(userID, map[string]interface{}{})
}

// ParseToken parses and validates a JWT token string
func ParseToken(tokenString string) (*jwt.Token, jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecretKey), nil
	})
	if err != nil {
		return nil, nil, err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return token, claims, nil
	}
	return nil, nil, fmt.Errorf("invalid token")
}

// ValidateToken checks if a token is valid
func ValidateToken(tokenString string) bool {
	_, _, err := ParseToken(tokenString)
	return err == nil
}

// GetUserIDFromToken extracts user ID from token
func GetUserIDFromToken(tokenString string) (string, error) {
	_, claims, err := ParseToken(tokenString)
	if err != nil {
		return "", err
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return "", fmt.Errorf("subject not found in token")
	}
	return sub, nil
}

// GetUsernameFromToken extracts username from token
func GetUsernameFromToken(tokenString string) (string, error) {
	_, claims, err := ParseToken(tokenString)
	if err != nil {
		return "", err
	}
	username, ok := claims["username"].(string)
	if !ok {
		return "", fmt.Errorf("username not found in token")
	}
	return username, nil
}

// GetRolesFromToken extracts roles from token
func GetRolesFromToken(tokenString string) []string {
	_, claims, err := ParseToken(tokenString)
	if err != nil {
		return nil
	}
	rolesStr, ok := claims["roles"].(string)
	if !ok || rolesStr == "" {
		return nil
	}
	rolesRaw := strings.Split(rolesStr, ",")
	var roles []string
	for _, r := range rolesRaw {
		r = strings.TrimSpace(r)
		if !strings.HasPrefix(r, "ROLE_") {
			r = "ROLE_" + r
		}
		roles = append(roles, r)
	}
	return roles
}

// ExtractBearerToken extracts the token from "Bearer <token>" header
func ExtractBearerToken(authHeader string) string {
	if strings.HasPrefix(authHeader, jwtTokenPrefix) {
		return strings.TrimPrefix(authHeader, jwtTokenPrefix)
	}
	return ""
}
