package project

import (
	"time"

	"github.com/google/uuid"
)

type ProjectDocumentURIParams struct {
	ID         string `uri:"id" validate:"required,uuid"`
	DocumentID string `uri:"documentId" validate:"required,uuid"`
}

type CreateDocumentRequest struct {
	Title       string  `json:"title" validate:"required,min=3,max=160"`
	URL         string  `json:"url" validate:"required,url,max=2000"`
	Description *string `json:"description" validate:"omitempty,max=1200"`
}

type ProjectDocumentResponse struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Description *string   `json:"description,omitempty"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

type ProjectDocumentListResponse struct {
	Items []ProjectDocumentResponse `json:"items"`
}

func ToDocumentResponse(item *Document) ProjectDocumentResponse {
	return ProjectDocumentResponse{
		ID:          item.ID,
		ProjectID:   item.ProjectID,
		Title:       item.Title,
		URL:         item.URL,
		Description: item.Description,
		CreatedBy:   item.CreatedBy,
		CreatedAt:   item.CreatedAt,
	}
}
