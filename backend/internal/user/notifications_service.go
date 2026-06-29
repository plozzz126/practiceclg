package user

import (
	"context"

	"github.com/devlink/backend/internal/shared"
	"github.com/google/uuid"
)

func (s *service) ListNotifications(ctx context.Context, userID uuid.UUID) ([]Notification, error) {
	items, err := s.repo.ListNotifications(ctx, userID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load notifications")
	}

	return items, nil
}

func (s *service) CreateNotification(ctx context.Context, params NotificationCreateParams) error {
	if err := s.repo.CreateNotification(ctx, params); err != nil {
		return shared.WrapInternal(err, "Failed to create notification")
	}

	return nil
}

func (s *service) MarkNotificationRead(ctx context.Context, userID, notificationID uuid.UUID) error {
	if err := s.repo.MarkNotificationRead(ctx, userID, notificationID); err != nil {
		return mapUserError(err)
	}

	return nil
}

func (s *service) MarkAllNotificationsRead(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.MarkAllNotificationsRead(ctx, userID); err != nil {
		return shared.WrapInternal(err, "Failed to mark notifications as read")
	}

	return nil
}
