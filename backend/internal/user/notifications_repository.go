package user

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (r *repository) ListNotifications(ctx context.Context, recipientID uuid.UUID) ([]Notification, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, recipient_id, type, title, body, link, read_at, created_at
		FROM notifications
		WHERE recipient_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, recipientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Notification, 0)
	for rows.Next() {
		item, err := scanNotification(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, rows.Err()
}

func (r *repository) CreateNotification(ctx context.Context, params NotificationCreateParams) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO notifications (recipient_id, type, title, body, link)
		VALUES ($1, $2, $3, $4, $5)
	`, params.RecipientID, params.Type, params.Title, params.Body, params.Link)
	return err
}

func (r *repository) MarkNotificationRead(ctx context.Context, recipientID, notificationID uuid.UUID) error {
	result, err := r.db.Exec(ctx, `
		UPDATE notifications
		SET read_at = COALESCE(read_at, now())
		WHERE recipient_id = $1 AND id = $2
	`, recipientID, notificationID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func (r *repository) MarkAllNotificationsRead(ctx context.Context, recipientID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		UPDATE notifications
		SET read_at = COALESCE(read_at, now())
		WHERE recipient_id = $1 AND read_at IS NULL
	`, recipientID)
	return err
}

func scanNotification(rows pgx.Rows) (Notification, error) {
	var item Notification
	err := rows.Scan(
		&item.ID,
		&item.RecipientID,
		&item.Type,
		&item.Title,
		&item.Body,
		&item.Link,
		&item.ReadAt,
		&item.CreatedAt,
	)
	return item, err
}
