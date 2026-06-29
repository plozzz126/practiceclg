package project

import (
	"context"
	"net/http"
	"strings"

	"github.com/devlink/backend/internal/shared"
	"github.com/google/uuid"
)

func (s *service) ListDocuments(ctx context.Context, projectID uuid.UUID) ([]Document, error) {
	if _, err := s.repo.GetByID(ctx, projectID); err != nil {
		return nil, mapProjectError(err)
	}

	items, err := s.repo.ListDocuments(ctx, projectID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load project documents")
	}

	return items, nil
}

func (s *service) CreateDocument(ctx context.Context, actorID, projectID uuid.UUID, request CreateDocumentRequest) (*Document, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can manage documentation")
	}

	title := strings.TrimSpace(request.Title)
	if title == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "title",
			Message: "title must not be blank",
		})
	}

	item, err := s.repo.CreateDocument(ctx, CreateDocumentParams{
		ProjectID:   projectID,
		Title:       title,
		URL:         normalizeURL(request.URL),
		Description: normalizeOptional(request.Description),
		CreatedBy:   actorID,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to add project document")
	}

	return item, nil
}

func (s *service) DeleteDocument(ctx context.Context, actorID, projectID, documentID uuid.UUID) error {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return shared.NewAppError(http.StatusForbidden, "Only the project owner can manage documentation")
	}

	if err := s.repo.DeleteDocument(ctx, projectID, documentID); err != nil {
		return mapProjectError(err)
	}

	return nil
}
