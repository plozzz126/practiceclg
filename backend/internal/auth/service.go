package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/edumatch/backend/internal/shared"
	"github.com/edumatch/backend/internal/user"
	jwtpkg "github.com/edumatch/backend/pkg/jwt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	redislib "github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type Service interface {
	Register(ctx context.Context, request RegisterRequest) (*user.User, error)
	Login(ctx context.Context, request LoginRequest) (*user.User, TokenPair, error)
	Refresh(ctx context.Context, rawRefreshToken string) (*user.User, TokenPair, error)
	Logout(ctx context.Context, actorID uuid.UUID, accessTokenID string, accessExpiresAt time.Time, rawRefreshToken string) error
}

type service struct {
	repo     Repository
	userRepo user.Repository
	skillSvc interface {
		EnsureIDsExist(ctx context.Context, ids []string) error
	}
	jwtManager *jwtpkg.Manager
	cache      *redislib.Client
}

func NewService(
	repo Repository,
	userRepo user.Repository,
	skillSvc interface {
		EnsureIDsExist(ctx context.Context, ids []string) error
	},
	jwtManager *jwtpkg.Manager,
	cache *redislib.Client,
) Service {
	return &service{
		repo:       repo,
		userRepo:   userRepo,
		skillSvc:   skillSvc,
		jwtManager: jwtManager,
		cache:      cache,
	}
}

func (s *service) Register(ctx context.Context, request RegisterRequest) (*user.User, error) {
	email := strings.ToLower(strings.TrimSpace(request.Email))
	fullName := strings.TrimSpace(request.FullName)

	if fullName == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "full_name",
			Message: "full_name must not be blank",
		})
	}

	if err := s.skillSvc.EnsureIDsExist(ctx, request.SkillIDs); err != nil {
		return nil, err
	}

	_, err := s.userRepo.FindCredentialsByEmail(ctx, email)
	if err == nil {
		return nil, shared.NewAppError(http.StatusConflict, "A user with this email already exists")
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, shared.WrapInternal(err, "Failed to check user credentials")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to hash password")
	}

	createdUser, err := s.userRepo.Create(ctx, user.CreateParams{
		Email:        email,
		PasswordHash: string(passwordHash),
		FullName:     fullName,
		University:   normalizeOptional(request.University),
		Course:       request.Course,
		Bio:          normalizeOptional(request.Bio),
		AvatarURL:    normalizeOptional(request.AvatarURL),
		SkillIDs:     uniqueValues(request.SkillIDs),
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to create user")
	}

	return createdUser, nil
}

func (s *service) Login(ctx context.Context, request LoginRequest) (*user.User, TokenPair, error) {
	email := strings.ToLower(strings.TrimSpace(request.Email))

	credentials, err := s.userRepo.FindCredentialsByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Invalid email or password")
		}

		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to load credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(credentials.PasswordHash), []byte(request.Password)); err != nil {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Invalid email or password")
	}

	currentUser, err := s.userRepo.GetByID(ctx, credentials.ID)
	if err != nil {
		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to load user profile")
	}

	tokens, err := s.issueTokenPair(ctx, currentUser.ID)
	if err != nil {
		return nil, TokenPair{}, err
	}

	return currentUser, tokens, nil
}

func (s *service) Refresh(ctx context.Context, rawRefreshToken string) (*user.User, TokenPair, error) {
	claims, err := s.jwtManager.ParseRefreshToken(rawRefreshToken)
	if err != nil {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Invalid refresh token")
	}

	sessionID, err := uuid.Parse(claims.ID)
	if err != nil {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Invalid refresh token")
	}

	record, err := s.repo.GetRefreshTokenByID(ctx, sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Refresh token is not active")
		}

		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to load refresh token")
	}

	if record.RevokedAt != nil || time.Now().UTC().After(record.ExpiresAt) {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Refresh token is not active")
	}

	storedUserID, err := s.cache.Get(ctx, sessionKey(sessionID.String())).Result()
	if err != nil {
		if errors.Is(err, redislib.Nil) {
			return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Session has expired")
		}

		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to load session")
	}

	if storedUserID != record.UserID.String() || hashToken(rawRefreshToken) != record.TokenHash {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Refresh token is not active")
	}

	if claims.Subject != record.UserID.String() {
		return nil, TokenPair{}, shared.NewAppError(http.StatusUnauthorized, "Refresh token is not active")
	}

	if err := s.repo.RevokeRefreshToken(ctx, sessionID); err != nil {
		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to revoke refresh token")
	}

	if err := s.cache.Del(ctx, sessionKey(sessionID.String())).Err(); err != nil {
		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to clear session")
	}

	currentUser, err := s.userRepo.GetByID(ctx, record.UserID)
	if err != nil {
		return nil, TokenPair{}, shared.WrapInternal(err, "Failed to load user profile")
	}

	tokens, err := s.issueTokenPair(ctx, record.UserID)
	if err != nil {
		return nil, TokenPair{}, err
	}

	return currentUser, tokens, nil
}

func (s *service) Logout(ctx context.Context, actorID uuid.UUID, accessTokenID string, accessExpiresAt time.Time, rawRefreshToken string) error {
	refreshClaims, err := s.jwtManager.ParseRefreshToken(rawRefreshToken)
	if err != nil {
		return shared.NewAppError(http.StatusUnauthorized, "Invalid refresh token")
	}

	sessionID, err := uuid.Parse(refreshClaims.ID)
	if err != nil {
		return shared.NewAppError(http.StatusUnauthorized, "Invalid refresh token")
	}

	if refreshClaims.Subject != actorID.String() {
		return shared.NewAppError(http.StatusUnauthorized, "Refresh token does not belong to the current user")
	}

	if err := s.repo.RevokeRefreshToken(ctx, sessionID); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return shared.WrapInternal(err, "Failed to revoke refresh token")
	}

	if err := s.cache.Del(ctx, sessionKey(sessionID.String())).Err(); err != nil {
		return shared.WrapInternal(err, "Failed to clear session")
	}

	if accessTokenID != "" {
		ttl := time.Until(accessExpiresAt)
		if ttl > 0 {
			if err := s.cache.Set(ctx, blacklistKey(accessTokenID), "1", ttl).Err(); err != nil {
				return shared.WrapInternal(err, "Failed to blacklist access token")
			}
		}
	}

	return nil
}

func (s *service) issueTokenPair(ctx context.Context, userID uuid.UUID) (TokenPair, error) {
	sessionID := uuid.NewString()

	accessToken, err := s.jwtManager.CreateAccessToken(userID)
	if err != nil {
		return TokenPair{}, shared.WrapInternal(err, "Failed to create access token")
	}

	refreshToken, err := s.jwtManager.CreateRefreshToken(userID, sessionID)
	if err != nil {
		return TokenPair{}, shared.WrapInternal(err, "Failed to create refresh token")
	}

	sessionUUID, err := uuid.Parse(sessionID)
	if err != nil {
		return TokenPair{}, shared.WrapInternal(err, "Failed to create session")
	}

	if err := s.repo.CreateRefreshToken(ctx, RefreshTokenRecord{
		ID:        sessionUUID,
		UserID:    userID,
		TokenHash: hashToken(refreshToken.Token),
		ExpiresAt: refreshToken.ExpiresAt,
	}); err != nil {
		return TokenPair{}, shared.WrapInternal(err, "Failed to persist refresh token")
	}

	if err := s.cache.Set(ctx, sessionKey(sessionID), userID.String(), time.Until(refreshToken.ExpiresAt)).Err(); err != nil {
		return TokenPair{}, shared.WrapInternal(err, "Failed to create user session")
	}

	return TokenPair{
		AccessToken:           accessToken.Token,
		RefreshToken:          refreshToken.Token,
		TokenType:             "Bearer",
		AccessTokenExpiresAt:  accessToken.ExpiresAt,
		RefreshTokenExpiresAt: refreshToken.ExpiresAt,
	}, nil
}

func sessionKey(id string) string {
	return "session:" + id
}

func blacklistKey(id string) string {
	return "blacklist:" + id
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func normalizeOptional(value *string) *string {
	if value == nil {
		return nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}

func uniqueValues(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		if _, exists := seen[value]; exists {
			continue
		}

		seen[value] = struct{}{}
		result = append(result, value)
	}

	return result
}
