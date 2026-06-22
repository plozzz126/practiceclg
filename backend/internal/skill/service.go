package skill

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/devlink/backend/internal/shared"
	redislib "github.com/redis/go-redis/v9"
)

const skillsCacheKey = "skills:all"

type Service interface {
	List(ctx context.Context) ([]Skill, error)
	EnsureIDsExist(ctx context.Context, ids []string) error
	ListByIDs(ctx context.Context, ids []string) ([]Skill, error)
	InvalidateCache(ctx context.Context) error
}

type service struct {
	repo     Repository
	cache    *redislib.Client
	cacheTTL time.Duration
}

func NewService(repo Repository, cache *redislib.Client, cacheTTL time.Duration) Service {
	return &service{
		repo:     repo,
		cache:    cache,
		cacheTTL: cacheTTL,
	}
}

func (s *service) List(ctx context.Context) ([]Skill, error) {
	cachedValue, err := s.cache.Get(ctx, skillsCacheKey).Result()
	if err == nil {
		var cachedSkills []Skill
		if unmarshalErr := json.Unmarshal([]byte(cachedValue), &cachedSkills); unmarshalErr == nil {
			return cachedSkills, nil
		}
	}

	if err != nil && !errors.Is(err, redislib.Nil) {
		return nil, shared.WrapInternal(err, "Failed to fetch skills cache")
	}

	items, err := s.repo.ListAll(ctx)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load skills")
	}

	payload, err := json.Marshal(items)
	if err == nil {
		_ = s.cache.Set(ctx, skillsCacheKey, payload, s.cacheTTL).Err()
	}

	return items, nil
}

func (s *service) EnsureIDsExist(ctx context.Context, ids []string) error {
	count, err := s.repo.CountByIDs(ctx, ids)
	if err != nil {
		return shared.WrapInternal(err, "Failed to validate skills")
	}

	if count != len(ids) {
		return shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "skill_ids",
			Message: "one or more skills do not exist",
		})
	}

	return nil
}

func (s *service) ListByIDs(ctx context.Context, ids []string) ([]Skill, error) {
	items, err := s.repo.ListByIDs(ctx, ids)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load skills")
	}

	return items, nil
}

func (s *service) InvalidateCache(ctx context.Context) error {
	if err := s.cache.Del(ctx, skillsCacheKey).Err(); err != nil {
		return shared.WrapInternal(err, "Failed to invalidate skills cache")
	}

	return nil
}
