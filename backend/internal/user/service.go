package user

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/devlink/backend/internal/shared"
	"github.com/devlink/backend/internal/skill"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Service interface {
	GetCurrent(ctx context.Context, userID uuid.UUID) (*User, error)
	GetPublic(ctx context.Context, userID uuid.UUID) (*User, error)
	List(ctx context.Context, query ListUsersQuery) ([]User, error)
	UpdateProfile(ctx context.Context, userID uuid.UUID, request UpdateProfileRequest) (*User, error)
	UpdateSkills(ctx context.Context, userID uuid.UUID, skillIDs []string) (*User, error)
	Delete(ctx context.Context, userID uuid.UUID) error
}

type service struct {
	repo         Repository
	skillService skill.Service
}

func NewService(repo Repository, skillService skill.Service) Service {
	return &service{repo: repo, skillService: skillService}
}

func (s *service) GetCurrent(ctx context.Context, userID uuid.UUID) (*User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, mapUserError(err)
	}

	return user, nil
}

func (s *service) GetPublic(ctx context.Context, userID uuid.UUID) (*User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, mapUserError(err)
	}

	return user, nil
}

func (s *service) List(ctx context.Context, query ListUsersQuery) ([]User, error) {
	var skillID *uuid.UUID
	if query.Skill != "" {
		id, err := uuid.Parse(query.Skill)
		if err != nil {
			return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
				Field:   "skill",
				Message: "skill must be a valid UUID",
			})
		}

		skillID = &id
	}

	users, err := s.repo.List(ctx, Filters{
		Query:      strings.TrimSpace(query.Query),
		University: strings.TrimSpace(query.University),
		Course:     query.Course,
		Rating:     query.Rating,
		SkillID:    skillID,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load users")
	}

	return users, nil
}

func (s *service) UpdateProfile(ctx context.Context, userID uuid.UUID, request UpdateProfileRequest) (*User, error) {
	if request.FullName != nil && strings.TrimSpace(*request.FullName) == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "full_name",
			Message: "full_name must not be blank",
		})
	}

	user, err := s.repo.UpdateProfile(ctx, userID, UpdateProfileParams{
		FullName:   normalizeOptionalString(request.FullName),
		University: normalizeOptionalString(request.University),
		Course:     request.Course,
		Bio:        normalizeOptionalString(request.Bio),
		AvatarURL:  normalizeOptionalString(request.AvatarURL),
	})
	if err != nil {
		return nil, mapUserError(err)
	}

	return user, nil
}

func (s *service) UpdateSkills(ctx context.Context, userID uuid.UUID, skillIDs []string) (*User, error) {
	if err := s.skillService.EnsureIDsExist(ctx, skillIDs); err != nil {
		return nil, err
	}

	user, err := s.repo.ReplaceSkills(ctx, userID, uniqueValues(skillIDs))
	if err != nil {
		return nil, mapUserError(err)
	}

	return user, nil
}

func (s *service) Delete(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.Delete(ctx, userID); err != nil {
		return mapUserError(err)
	}

	return nil
}

func mapUserError(err error) error {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		return shared.NewAppError(http.StatusNotFound, "User not found")
	default:
		return shared.WrapInternal(err, "Failed to process user request")
	}
}

func normalizeOptionalString(value *string) *string {
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
