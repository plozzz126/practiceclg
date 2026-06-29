package project

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type CreateTaskParams struct {
	ProjectID   uuid.UUID
	Title       string
	Description *string
	DueDate     *time.Time
	CreatedBy   uuid.UUID
}

type UpdateTaskParams struct {
	Title            *string
	Description      *string
	DueDate          *time.Time
	ClearDueDate     bool
	Done             *bool
	ClearDescription bool
}

type SaveJoinRequestParams struct {
	ProjectID uuid.UUID
	UserID    uuid.UUID
	Message   *string
}

type CreateMessageParams struct {
	ProjectID uuid.UUID
	SenderID  uuid.UUID
	Body      string
}

func (r *repository) IsMember(ctx context.Context, projectID, userID uuid.UUID) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM project_members
			WHERE project_id = $1 AND user_id = $2
		)
	`, projectID, userID).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

func (r *repository) ListTasks(ctx context.Context, projectID uuid.UUID) ([]Task, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, title, description, due_date, done, created_by, created_at, updated_at
		FROM project_tasks
		WHERE project_id = $1
		ORDER BY done ASC, due_date ASC NULLS LAST, created_at ASC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Task, 0)
	for rows.Next() {
		item, err := scanTask(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *repository) CreateTask(ctx context.Context, params CreateTaskParams) (*Task, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO project_tasks (project_id, title, description, due_date, created_by)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, project_id, title, description, due_date, done, created_by, created_at, updated_at
	`, params.ProjectID, params.Title, params.Description, params.DueDate, params.CreatedBy)

	task, err := scanTaskRow(row)
	if err != nil {
		return nil, err
	}

	return &task, nil
}

func (r *repository) UpdateTask(ctx context.Context, projectID, taskID uuid.UUID, params UpdateTaskParams) (*Task, error) {
	setClauses := make([]string, 0, 5)
	args := make([]any, 0, 7)

	if params.Title != nil {
		args = append(args, *params.Title)
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", len(args)))
	}

	if params.Description != nil || params.ClearDescription {
		if params.ClearDescription {
			args = append(args, nil)
		} else {
			args = append(args, params.Description)
		}
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", len(args)))
	}

	if params.DueDate != nil || params.ClearDueDate {
		if params.ClearDueDate {
			args = append(args, nil)
		} else {
			args = append(args, params.DueDate)
		}
		setClauses = append(setClauses, fmt.Sprintf("due_date = $%d", len(args)))
	}

	if params.Done != nil {
		args = append(args, *params.Done)
		setClauses = append(setClauses, fmt.Sprintf("done = $%d", len(args)))
	}

	if len(setClauses) == 0 {
		row := r.db.QueryRow(ctx, `
			SELECT id, project_id, title, description, due_date, done, created_by, created_at, updated_at
			FROM project_tasks
			WHERE project_id = $1 AND id = $2
		`, projectID, taskID)
		task, err := scanTaskRow(row)
		if err != nil {
			return nil, err
		}

		return &task, nil
	}

	args = append(args, projectID, taskID)
	query := fmt.Sprintf(`
		UPDATE project_tasks
		SET %s, updated_at = now()
		WHERE project_id = $%d AND id = $%d
		RETURNING id, project_id, title, description, due_date, done, created_by, created_at, updated_at
	`, strings.Join(setClauses, ", "), len(args)-1, len(args))

	row := r.db.QueryRow(ctx, query, args...)
	task, err := scanTaskRow(row)
	if err != nil {
		return nil, err
	}

	return &task, nil
}

func (r *repository) DeleteTask(ctx context.Context, projectID, taskID uuid.UUID) error {
	result, err := r.db.Exec(ctx, `
		DELETE FROM project_tasks
		WHERE project_id = $1 AND id = $2
	`, projectID, taskID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *repository) GetJoinRequestByUser(ctx context.Context, projectID, userID uuid.UUID) (*JoinRequestDetail, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, project_id, user_id, message, status, created_at, decided_at
		FROM join_requests
		WHERE project_id = $1 AND user_id = $2
	`, projectID, userID)

	item, err := scanJoinRequestRow(row)
	if err != nil {
		return nil, err
	}

	usersMap, err := loadOwners(ctx, r.db, []uuid.UUID{item.UserID})
	if err != nil {
		return nil, err
	}

	return &JoinRequestDetail{
		Request: item,
		User:    usersMap[item.UserID],
	}, nil
}

func (r *repository) GetJoinRequestByID(ctx context.Context, projectID, requestID uuid.UUID) (*JoinRequestDetail, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, project_id, user_id, message, status, created_at, decided_at
		FROM join_requests
		WHERE project_id = $1 AND id = $2
	`, projectID, requestID)

	item, err := scanJoinRequestRow(row)
	if err != nil {
		return nil, err
	}

	usersMap, err := loadOwners(ctx, r.db, []uuid.UUID{item.UserID})
	if err != nil {
		return nil, err
	}

	return &JoinRequestDetail{
		Request: item,
		User:    usersMap[item.UserID],
	}, nil
}

func (r *repository) ListJoinRequests(ctx context.Context, projectID uuid.UUID) ([]JoinRequestDetail, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, user_id, message, status, created_at, decided_at
		FROM join_requests
		WHERE project_id = $1
		ORDER BY
			CASE status
				WHEN 'pending' THEN 0
				WHEN 'accepted' THEN 1
				ELSE 2
			END,
			created_at DESC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]JoinRequest, 0)
	userIDs := make([]uuid.UUID, 0)
	for rows.Next() {
		item, err := scanJoinRequest(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
		userIDs = append(userIDs, item.UserID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	usersMap, err := loadOwners(ctx, r.db, userIDs)
	if err != nil {
		return nil, err
	}

	result := make([]JoinRequestDetail, 0, len(items))
	for _, item := range items {
		result = append(result, JoinRequestDetail{
			Request: item,
			User:    usersMap[item.UserID],
		})
	}

	return result, nil
}

func (r *repository) SaveJoinRequest(ctx context.Context, params SaveJoinRequestParams) (*JoinRequestDetail, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO join_requests (project_id, user_id, message, status)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (project_id, user_id)
		DO UPDATE SET
			message = EXCLUDED.message,
			status = EXCLUDED.status,
			decided_at = NULL
		RETURNING id, project_id, user_id, message, status, created_at, decided_at
	`, params.ProjectID, params.UserID, params.Message, RequestPending)

	item, err := scanJoinRequestRow(row)
	if err != nil {
		return nil, err
	}

	usersMap, err := loadOwners(ctx, r.db, []uuid.UUID{item.UserID})
	if err != nil {
		return nil, err
	}

	return &JoinRequestDetail{
		Request: item,
		User:    usersMap[item.UserID],
	}, nil
}

func (r *repository) ReviewJoinRequest(ctx context.Context, projectID, requestID uuid.UUID, decision string) (*JoinRequestDetail, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		UPDATE join_requests
		SET status = $3, decided_at = now()
		WHERE project_id = $1 AND id = $2
		RETURNING id, project_id, user_id, message, status, created_at, decided_at
	`, projectID, requestID, decision)

	item, err := scanJoinRequestRow(row)
	if err != nil {
		return nil, err
	}

	if decision == RequestAccepted {
		if _, err := tx.Exec(ctx, `
			INSERT INTO project_members (project_id, user_id, role)
			VALUES ($1, $2, $3)
			ON CONFLICT (project_id, user_id) DO NOTHING
		`, projectID, item.UserID, MemberRoleMember); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetJoinRequestByID(ctx, projectID, requestID)
}

func (r *repository) ListMessages(ctx context.Context, projectID uuid.UUID) ([]MessageDetail, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, sender_id, body, created_at
		FROM messages
		WHERE project_id = $1
		ORDER BY created_at ASC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Message, 0)
	senderIDs := make([]uuid.UUID, 0)
	for rows.Next() {
		item, err := scanMessage(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
		senderIDs = append(senderIDs, item.SenderID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	sendersMap, err := loadOwners(ctx, r.db, senderIDs)
	if err != nil {
		return nil, err
	}

	result := make([]MessageDetail, 0, len(items))
	for _, item := range items {
		result = append(result, MessageDetail{
			Message: item,
			Sender:  sendersMap[item.SenderID],
		})
	}

	return result, nil
}

func (r *repository) CreateMessage(ctx context.Context, params CreateMessageParams) (*MessageDetail, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO messages (project_id, sender_id, body)
		VALUES ($1, $2, $3)
		RETURNING id, project_id, sender_id, body, created_at
	`, params.ProjectID, params.SenderID, params.Body)

	item, err := scanMessageRow(row)
	if err != nil {
		return nil, err
	}

	sendersMap, err := loadOwners(ctx, r.db, []uuid.UUID{item.SenderID})
	if err != nil {
		return nil, err
	}

	return &MessageDetail{
		Message: item,
		Sender:  sendersMap[item.SenderID],
	}, nil
}

func scanTask(rows pgx.Rows) (Task, error) {
	var item Task
	err := rows.Scan(
		&item.ID,
		&item.ProjectID,
		&item.Title,
		&item.Description,
		&item.DueDate,
		&item.Done,
		&item.CreatedBy,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	return item, err
}

func scanTaskRow(row pgx.Row) (Task, error) {
	var item Task
	err := row.Scan(
		&item.ID,
		&item.ProjectID,
		&item.Title,
		&item.Description,
		&item.DueDate,
		&item.Done,
		&item.CreatedBy,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	return item, err
}

func scanJoinRequest(rows pgx.Rows) (JoinRequest, error) {
	var item JoinRequest
	err := rows.Scan(
		&item.ID,
		&item.ProjectID,
		&item.UserID,
		&item.Message,
		&item.Status,
		&item.CreatedAt,
		&item.DecidedAt,
	)
	return item, err
}

func scanJoinRequestRow(row pgx.Row) (JoinRequest, error) {
	var item JoinRequest
	err := row.Scan(
		&item.ID,
		&item.ProjectID,
		&item.UserID,
		&item.Message,
		&item.Status,
		&item.CreatedAt,
		&item.DecidedAt,
	)
	return item, err
}

func scanMessage(rows pgx.Rows) (Message, error) {
	var item Message
	err := rows.Scan(
		&item.ID,
		&item.ProjectID,
		&item.SenderID,
		&item.Body,
		&item.CreatedAt,
	)
	return item, err
}

func scanMessageRow(row pgx.Row) (Message, error) {
	var item Message
	err := row.Scan(
		&item.ID,
		&item.ProjectID,
		&item.SenderID,
		&item.Body,
		&item.CreatedAt,
	)
	return item, err
}
