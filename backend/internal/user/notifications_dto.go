package user

import (
	"time"

	"github.com/google/uuid"
)

type NotificationURIParams struct {
	ID string `uri:"id" validate:"required,uuid"`
}

type NotificationResponse struct {
	ID        uuid.UUID  `json:"id"`
	Type      string     `json:"type"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	Link      *string    `json:"link,omitempty"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

type NotificationListResponse struct {
	Items []NotificationResponse `json:"items"`
}

func ToNotificationResponse(item *Notification) NotificationResponse {
	return NotificationResponse{
		ID:        item.ID,
		Type:      item.Type,
		Title:     item.Title,
		Body:      item.Body,
		Link:      item.Link,
		ReadAt:    item.ReadAt,
		CreatedAt: item.CreatedAt,
	}
}
