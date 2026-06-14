package jwt

import (
	"errors"
	"time"

	jwtlib "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

type Claims struct {
	TokenType string `json:"token_type"`
	SessionID string `json:"session_id,omitempty"`
	jwtlib.RegisteredClaims
}

type Manager struct {
	accessSecret  []byte
	refreshSecret []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
}

type TokenPayload struct {
	Token     string
	TokenID   string
	ExpiresAt time.Time
}

func NewManager(accessSecret, refreshSecret string, accessTTL, refreshTTL time.Duration) *Manager {
	return &Manager{
		accessSecret:  []byte(accessSecret),
		refreshSecret: []byte(refreshSecret),
		accessTTL:     accessTTL,
		refreshTTL:    refreshTTL,
	}
}

func (m *Manager) CreateAccessToken(userID uuid.UUID) (TokenPayload, error) {
	now := time.Now().UTC()
	tokenID := uuid.NewString()
	claims := Claims{
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Subject:   userID.String(),
			ID:        tokenID,
			IssuedAt:  jwtlib.NewNumericDate(now),
			ExpiresAt: jwtlib.NewNumericDate(now.Add(m.accessTTL)),
		},
	}

	token, err := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims).SignedString(m.accessSecret)
	if err != nil {
		return TokenPayload{}, err
	}

	return TokenPayload{Token: token, TokenID: tokenID, ExpiresAt: now.Add(m.accessTTL)}, nil
}

func (m *Manager) CreateRefreshToken(userID uuid.UUID, sessionID string) (TokenPayload, error) {
	now := time.Now().UTC()
	claims := Claims{
		TokenType: TokenTypeRefresh,
		SessionID: sessionID,
		RegisteredClaims: jwtlib.RegisteredClaims{
			Subject:   userID.String(),
			ID:        sessionID,
			IssuedAt:  jwtlib.NewNumericDate(now),
			ExpiresAt: jwtlib.NewNumericDate(now.Add(m.refreshTTL)),
		},
	}

	token, err := jwtlib.NewWithClaims(jwtlib.SigningMethodHS256, claims).SignedString(m.refreshSecret)
	if err != nil {
		return TokenPayload{}, err
	}

	return TokenPayload{Token: token, TokenID: sessionID, ExpiresAt: now.Add(m.refreshTTL)}, nil
}

func (m *Manager) ParseAccessToken(token string) (*Claims, error) {
	return m.parse(token, TokenTypeAccess, m.accessSecret)
}

func (m *Manager) ParseRefreshToken(token string) (*Claims, error) {
	return m.parse(token, TokenTypeRefresh, m.refreshSecret)
}

func (m *Manager) parse(token, expectedType string, secret []byte) (*Claims, error) {
	parsedToken, err := jwtlib.ParseWithClaims(token, &Claims{}, func(parsed *jwtlib.Token) (any, error) {
		if parsed.Method != jwtlib.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}

		return secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*Claims)
	if !ok || !parsedToken.Valid {
		return nil, errors.New("invalid token")
	}

	if claims.TokenType != expectedType {
		return nil, errors.New("invalid token type")
	}

	return claims, nil
}
