package project

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/edumatch/backend/internal/shared"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type Service interface {
	Create(ctx context.Context, ownerID uuid.UUID, request CreateProjectRequest) (*Detail, error)
	List(ctx context.Context, query ListProjectsQuery) ([]Detail, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Detail, error)
	Update(ctx context.Context, actorID, projectID uuid.UUID, request UpdateProjectRequest) (*Detail, error)
	Delete(ctx context.Context, actorID, projectID uuid.UUID) error
}

type skillValidator interface {
	EnsureIDsExist(ctx context.Context, ids []string) error
}

type service struct {
	repo     Repository
	skillSvc skillValidator
}

func NewService(repo Repository, skillSvc skillValidator) Service {
	return &service{repo: repo, skillSvc: skillSvc}
}

func (s *service) Create(ctx context.Context, ownerID uuid.UUID, request CreateProjectRequest) (*Detail, error) {
	title := strings.TrimSpace(request.Title)
	description := strings.TrimSpace(request.Description)
	if title == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "title",
			Message: "title must not be blank",
		})
	}

	if description == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "description",
			Message: "description must not be blank",
		})
	}

	if err := s.skillSvc.EnsureIDsExist(ctx, request.RequiredSkillIDs); err != nil {
		return nil, err
	}

	deadline, clearDeadline, err := parseOptionalDate(request.Deadline)
	if err != nil {
		return nil, err
	}

	_ = clearDeadline
	status := request.Status
	if status == "" {
		status = StatusOpen
	}

	project, err := s.repo.Create(ctx, CreateParams{
		OwnerID:          ownerID,
		Title:            title,
		Description:      description,
		Deadline:         deadline,
		Status:           status,
		RequiredSkillIDs: uniqueValues(request.RequiredSkillIDs),
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to create project")
	}

	return project, nil
}

func (s *service) List(ctx context.Context, query ListProjectsQuery) ([]Detail, error) {
	skillIDs, err := shared.ParseUUIDCSV(query.Skills, "skills")
	if err != nil {
		return nil, err
	}

	projects, err := s.repo.List(ctx, Filters{
		Query:    strings.TrimSpace(query.Query),
		Status:   strings.TrimSpace(query.Status),
		Sort:     strings.TrimSpace(query.Sort),
		SkillIDs: skillIDs,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load projects")
	}

	return projects, nil
}

func (s *service) GetByID(ctx context.Context, id uuid.UUID) (*Detail, error) {
	project, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, mapProjectError(err)
	}

	return project, nil
}

func (s *service) Update(ctx context.Context, actorID, projectID uuid.UUID, request UpdateProjectRequest) (*Detail, error) {
	currentProject, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if currentProject.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can update this project")
	}

	if len(request.RequiredSkillIDs) > 0 {
		if err := s.skillSvc.EnsureIDsExist(ctx, request.RequiredSkillIDs); err != nil {
			return nil, err
		}
	}

	if request.Title != nil && strings.TrimSpace(*request.Title) == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "title",
			Message: "title must not be blank",
		})
	}

	if request.Description != nil && strings.TrimSpace(*request.Description) == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "description",
			Message: "description must not be blank",
		})
	}

	deadline, clearDeadline, err := parseOptionalDate(request.Deadline)
	if err != nil {
		return nil, err
	}

	project, err := s.repo.Update(ctx, projectID, UpdateParams{
		Title:            normalizeOptional(request.Title),
		Description:      normalizeOptional(request.Description),
		Deadline:         deadline,
		ClearDeadline:    clearDeadline,
		Status:           normalizeOptional(request.Status),
		RequiredSkillIDs: uniqueValues(request.RequiredSkillIDs),
		ReplaceSkills:    request.RequiredSkillIDs != nil,
	})
	if err != nil {
		return nil, mapProjectError(err)
	}

	return project, nil
}

func (s *service) Delete(ctx context.Context, actorID, projectID uuid.UUID) error {
	currentProject, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return mapProjectError(err)
	}

	if currentProject.Project.OwnerID != actorID {
		return shared.NewAppError(http.StatusForbidden, "Only the project owner can delete this project")
	}

	if err := s.repo.Delete(ctx, projectID); err != nil {
		return mapProjectError(err)
	}

	return nil
}

func parseOptionalDate(value *string) (*time.Time, bool, error) {
	if value == nil {
		return nil, false, nil
	}

	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil, true, nil
	}

	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return nil, false, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "deadline",
			Message: "deadline must match format 2006-01-02",
		})
	}

	return &parsed, false, nil
}

func mapProjectError(err error) error {
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		return shared.NewAppError(http.StatusNotFound, "Project not found")
	default:
		return shared.WrapInternal(err, "Failed to process project request")
	}
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
