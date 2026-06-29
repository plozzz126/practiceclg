package project

import (
	"time"

	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
)

type ProjectTaskURIParams struct {
	ID     string `uri:"id" validate:"required,uuid"`
	TaskID string `uri:"taskId" validate:"required,uuid"`
}

type ProjectJoinRequestDecisionURIParams struct {
	ID        string `uri:"id" validate:"required,uuid"`
	RequestID string `uri:"requestId" validate:"required,uuid"`
}

type CreateTaskRequest struct {
	Title       string  `json:"title" validate:"required,min=3,max=160"`
	Description *string `json:"description" validate:"omitempty,max=2000"`
	DueDate     *string `json:"due_date" validate:"omitempty,datetime=2006-01-02"`
}

type UpdateTaskRequest struct {
	Title       *string `json:"title" validate:"omitempty,min=3,max=160"`
	Description *string `json:"description" validate:"omitempty,max=2000"`
	DueDate     *string `json:"due_date" validate:"omitempty,datetime=2006-01-02"`
	Done        *bool   `json:"done"`
}

type CreateJoinRequestRequest struct {
	Message *string `json:"message" validate:"omitempty,max=2000"`
}

type ReviewJoinRequestRequest struct {
	Decision string `json:"decision" validate:"required,oneof=accepted rejected"`
}

type CreateMessageRequest struct {
	Body string `json:"body" validate:"required,min=1,max=4000"`
}

type ProjectTaskResponse struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	DueDate     *string   `json:"due_date,omitempty"`
	Done        bool      `json:"done"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProjectTaskListResponse struct {
	Items []ProjectTaskResponse `json:"items"`
}

type ProjectJoinRequestResponse struct {
	ID        uuid.UUID               `json:"id"`
	ProjectID uuid.UUID               `json:"project_id"`
	UserID    uuid.UUID               `json:"user_id"`
	Message   *string                 `json:"message,omitempty"`
	Status    string                  `json:"status"`
	CreatedAt time.Time               `json:"created_at"`
	DecidedAt *time.Time              `json:"decided_at,omitempty"`
	User      user.PublicUserResponse `json:"user"`
}

type ProjectJoinRequestListResponse struct {
	Items []ProjectJoinRequestResponse `json:"items"`
}

type ProjectMessageResponse struct {
	ID        uuid.UUID               `json:"id"`
	ProjectID uuid.UUID               `json:"project_id"`
	SenderID  uuid.UUID               `json:"sender_id"`
	Body      string                  `json:"body"`
	CreatedAt time.Time               `json:"created_at"`
	Sender    user.PublicUserResponse `json:"sender"`
}

type ProjectMessageListResponse struct {
	Items []ProjectMessageResponse `json:"items"`
}

func ToTaskResponse(task *Task) ProjectTaskResponse {
	var dueDate *string
	if task.DueDate != nil {
		formatted := task.DueDate.Format("2006-01-02")
		dueDate = &formatted
	}

	return ProjectTaskResponse{
		ID:          task.ID,
		ProjectID:   task.ProjectID,
		Title:       task.Title,
		Description: task.Description,
		DueDate:     dueDate,
		Done:        task.Done,
		CreatedBy:   task.CreatedBy,
		CreatedAt:   task.CreatedAt,
		UpdatedAt:   task.UpdatedAt,
	}
}

func ToJoinRequestResponse(detail *JoinRequestDetail) ProjectJoinRequestResponse {
	return ProjectJoinRequestResponse{
		ID:        detail.Request.ID,
		ProjectID: detail.Request.ProjectID,
		UserID:    detail.Request.UserID,
		Message:   detail.Request.Message,
		Status:    detail.Request.Status,
		CreatedAt: detail.Request.CreatedAt,
		DecidedAt: detail.Request.DecidedAt,
		User:      user.ToPublicUserResponse(&detail.User),
	}
}

func ToMessageResponse(detail *MessageDetail) ProjectMessageResponse {
	return ProjectMessageResponse{
		ID:        detail.Message.ID,
		ProjectID: detail.Message.ProjectID,
		SenderID:  detail.Message.SenderID,
		Body:      detail.Message.Body,
		CreatedAt: detail.Message.CreatedAt,
		Sender:    user.ToPublicUserResponse(&detail.Sender),
	}
}
