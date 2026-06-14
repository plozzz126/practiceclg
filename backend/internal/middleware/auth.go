package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/edumatch/backend/internal/shared"
	jwtpkg "github.com/edumatch/backend/pkg/jwt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	redislib "github.com/redis/go-redis/v9"
)

const authUserContextKey = "auth_user"

type AuthUser struct {
	UserID    uuid.UUID
	TokenID   string
	ExpiresAt time.Time
	RawToken  string
}

func NewAuthMiddleware(jwtManager *jwtpkg.Manager, cache *redislib.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := extractBearerToken(c.GetHeader("Authorization"))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, shared.ErrorResponse{
				Success: false,
				Message: "Authentication required",
			})
			return
		}

		claims, err := jwtManager.ParseAccessToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, shared.ErrorResponse{
				Success: false,
				Message: "Invalid access token",
			})
			return
		}

		isBlacklisted, err := cache.Exists(c.Request.Context(), blacklistKey(claims.ID)).Result()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, shared.ErrorResponse{
				Success: false,
				Message: "Failed to validate user session",
			})
			return
		}

		if isBlacklisted > 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, shared.ErrorResponse{
				Success: false,
				Message: "Access token has been revoked",
			})
			return
		}

		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, shared.ErrorResponse{
				Success: false,
				Message: "Invalid access token",
			})
			return
		}

		expiresAt := time.Time{}
		if claims.ExpiresAt != nil {
			expiresAt = claims.ExpiresAt.Time
		}

		c.Set(authUserContextKey, AuthUser{
			UserID:    userID,
			TokenID:   claims.ID,
			ExpiresAt: expiresAt,
			RawToken:  token,
		})
		c.Next()
	}
}

func GetAuthUser(c *gin.Context) (AuthUser, bool) {
	value, exists := c.Get(authUserContextKey)
	if !exists {
		return AuthUser{}, false
	}

	authUser, ok := value.(AuthUser)
	return authUser, ok
}

func extractBearerToken(header string) (string, error) {
	if strings.TrimSpace(header) == "" {
		return "", errors.New("authorization header is required")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
		return "", errors.New("invalid authorization header")
	}

	return parts[1], nil
}

func blacklistKey(tokenID string) string {
	return "blacklist:" + tokenID
}
