package project

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CreateDocumentParams struct {
	ProjectID   uuid.UUID
	Title       string
	URL         string
	Description *string
	CreatedBy   uuid.UUID
}

func (r *repository) ListDocuments(ctx context.Context, projectID uuid.UUID) ([]Document, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, title, url, description, created_by, created_at
		FROM project_documents
		WHERE project_id = $1
		ORDER BY created_at DESC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Document, 0)
	for rows.Next() {
		item, err := scanDocument(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *repository) CreateDocument(ctx context.Context, params CreateDocumentParams) (*Document, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO project_documents (project_id, title, url, description, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, project_id, title, url, description, created_by, created_at
	`, params.ProjectID, params.Title, params.URL, params.Description, params.CreatedBy)

	item, err := scanDocumentRow(row)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *repository) DeleteDocument(ctx context.Context, projectID, documentID uuid.UUID) error {
	result, err := r.db.Exec(ctx, `
		DELETE FROM project_documents
		WHERE project_id = $1 AND id = $2
	`, projectID, documentID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func scanDocument(rows pgx.Rows) (Document, error) {
	var item Document
	err := rows.Scan(
		&item.ID,
		&item.ProjectID,
		&item.Title,
		&item.URL,
		&item.Description,
		&item.CreatedBy,
		&item.CreatedAt,
	)
	return item, err
}

func scanDocumentRow(row pgx.Row) (Document, error) {
	var item Document
	err := row.Scan(
		&item.ID,
		&item.ProjectID,
		&item.Title,
		&item.URL,
		&item.Description,
		&item.CreatedBy,
		&item.CreatedAt,
	)
	return item, err
}

func normalizeURL(value string) string {
	return strings.TrimSpace(value)
}
