package project

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/devlink/backend/internal/shared"
	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *service) ListTasks(ctx context.Context, projectID uuid.UUID) ([]Task, error) {
	if _, err := s.repo.GetByID(ctx, projectID); err != nil {
		return nil, mapProjectError(err)
	}

	tasks, err := s.repo.ListTasks(ctx, projectID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load project tasks")
	}

	return tasks, nil
}

func (s *service) CreateTask(ctx context.Context, actorID, projectID uuid.UUID, request CreateTaskRequest) (*Task, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can create tasks")
	}

	title := strings.TrimSpace(request.Title)
	if title == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "title",
			Message: "title must not be blank",
		})
	}

	dueDate, clearDueDate, err := parseOptionalDate(request.DueDate)
	if err != nil {
		return nil, err
	}
	_ = clearDueDate

	task, err := s.repo.CreateTask(ctx, CreateTaskParams{
		ProjectID:   projectID,
		Title:       title,
		Description: normalizeOptional(request.Description),
		DueDate:     dueDate,
		CreatedBy:   actorID,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to create project task")
	}

	return task, nil
}

func (s *service) UpdateTask(ctx context.Context, actorID, projectID, taskID uuid.UUID, request UpdateTaskRequest) (*Task, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can update tasks")
	}

	if request.Title != nil && strings.TrimSpace(*request.Title) == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "title",
			Message: "title must not be blank",
		})
	}

	dueDate, clearDueDate, err := parseOptionalDate(request.DueDate)
	if err != nil {
		return nil, err
	}

	task, err := s.repo.UpdateTask(ctx, projectID, taskID, UpdateTaskParams{
		Title:            normalizeOptional(request.Title),
		Description:      normalizeOptional(request.Description),
		DueDate:          dueDate,
		ClearDueDate:     clearDueDate,
		Done:             request.Done,
		ClearDescription: request.Description != nil && strings.TrimSpace(*request.Description) == "",
	})
	if err != nil {
		return nil, mapProjectError(err)
	}

	return task, nil
}

func (s *service) DeleteTask(ctx context.Context, actorID, projectID, taskID uuid.UUID) error {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return shared.NewAppError(http.StatusForbidden, "Only the project owner can delete tasks")
	}

	if err := s.repo.DeleteTask(ctx, projectID, taskID); err != nil {
		return mapProjectError(err)
	}

	return nil
}

func (s *service) GetMyJoinRequest(ctx context.Context, actorID, projectID uuid.UUID) (*JoinRequestDetail, error) {
	if _, err := s.repo.GetByID(ctx, projectID); err != nil {
		return nil, mapProjectError(err)
	}

	item, err := s.repo.GetJoinRequestByUser(ctx, projectID, actorID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}

		return nil, shared.WrapInternal(err, "Failed to load join request")
	}

	return item, nil
}

func (s *service) ListJoinRequests(ctx context.Context, actorID, projectID uuid.UUID) ([]JoinRequestDetail, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can view join requests")
	}

	items, err := s.repo.ListJoinRequests(ctx, projectID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load join requests")
	}

	return items, nil
}

func (s *service) SubmitJoinRequest(ctx context.Context, actorID, projectID uuid.UUID, request CreateJoinRequestRequest) (*JoinRequestDetail, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID == actorID {
		return nil, shared.NewAppError(http.StatusConflict, "Project owner is already in the team")
	}

	isMember, err := s.repo.IsMember(ctx, projectID, actorID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to validate project membership")
	}

	if isMember {
		return nil, shared.NewAppError(http.StatusConflict, "You are already a member of this project")
	}

	existing, err := s.repo.GetJoinRequestByUser(ctx, projectID, actorID)
	if err == nil {
		switch existing.Request.Status {
		case RequestPending:
			return nil, shared.NewAppError(http.StatusConflict, "Join request is already pending")
		case RequestAccepted:
			return nil, shared.NewAppError(http.StatusConflict, "You are already accepted to this project")
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, shared.WrapInternal(err, "Failed to validate join request")
	}

	item, err := s.repo.SaveJoinRequest(ctx, SaveJoinRequestParams{
		ProjectID: projectID,
		UserID:    actorID,
		Message:   normalizeOptional(request.Message),
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to submit join request")
	}

	if s.notifier != nil {
		link := fmt.Sprintf("/projects/%s", projectID.String())
		_ = s.notifier.CreateNotification(ctx, user.NotificationCreateParams{
			RecipientID: projectDetail.Project.OwnerID,
			Type:        "join_request_submitted",
			Title:       "Новая заявка в проект",
			Body:        fmt.Sprintf("%s подал заявку в проект \"%s\".", item.User.FullName, projectDetail.Project.Title),
			Link:        &link,
		})
	}

	return item, nil
}

func (s *service) ReviewJoinRequest(ctx context.Context, actorID, projectID, requestID uuid.UUID, request ReviewJoinRequestRequest) (*JoinRequestDetail, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can review join requests")
	}

	item, err := s.repo.GetJoinRequestByID(ctx, projectID, requestID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if item.Request.Status != RequestPending {
		return nil, shared.NewAppError(http.StatusConflict, "This join request has already been reviewed")
	}

	if request.Decision == RequestAccepted && projectDetail.ParticipantsCount >= projectDetail.Project.TeamSize {
		return nil, shared.NewAppError(http.StatusConflict, "Project team is already full")
	}

	updated, err := s.repo.ReviewJoinRequest(ctx, projectID, requestID, request.Decision)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to review join request")
	}

	if s.notifier != nil {
		link := fmt.Sprintf("/projects/%s", projectID.String())
		title := "Заявка в проект обновлена"
		body := fmt.Sprintf("Твоя заявка в проект \"%s\" была отклонена.", projectDetail.Project.Title)
		if request.Decision == RequestAccepted {
			body = fmt.Sprintf("Твоя заявка в проект \"%s\" была принята. Теперь у тебя есть доступ к чату команды.", projectDetail.Project.Title)
		}

		_ = s.notifier.CreateNotification(ctx, user.NotificationCreateParams{
			RecipientID: updated.Request.UserID,
			Type:        "join_request_reviewed",
			Title:       title,
			Body:        body,
			Link:        &link,
		})
	}

	return updated, nil
}

func (s *service) ListMessages(ctx context.Context, actorID, projectID uuid.UUID) ([]MessageDetail, error) {
	if _, err := s.repo.GetByID(ctx, projectID); err != nil {
		return nil, mapProjectError(err)
	}

	isMember, err := s.repo.IsMember(ctx, projectID, actorID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to validate chat access")
	}

	if !isMember {
		return nil, shared.NewAppError(http.StatusForbidden, "Only project members can access the team chat")
	}

	items, err := s.repo.ListMessages(ctx, projectID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load project chat")
	}

	return items, nil
}

func (s *service) CreateMessage(ctx context.Context, actorID, projectID uuid.UUID, request CreateMessageRequest) (*MessageDetail, error) {
	if _, err := s.repo.GetByID(ctx, projectID); err != nil {
		return nil, mapProjectError(err)
	}

	isMember, err := s.repo.IsMember(ctx, projectID, actorID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to validate chat access")
	}

	if !isMember {
		return nil, shared.NewAppError(http.StatusForbidden, "Only project members can send messages")
	}

	body := strings.TrimSpace(request.Body)
	if body == "" {
		return nil, shared.ValidationError("Validation failed", shared.ErrorDetail{
			Field:   "body",
			Message: "body must not be blank",
		})
	}

	message, err := s.repo.CreateMessage(ctx, CreateMessageParams{
		ProjectID: projectID,
		SenderID:  actorID,
		Body:      body,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to send project message")
	}

	return message, nil
}
