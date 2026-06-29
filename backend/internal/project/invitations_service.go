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

func (s *service) ListInviteCandidates(ctx context.Context, actorID, projectID uuid.UUID, query ListInviteCandidatesQuery) ([]user.User, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can search invite candidates")
	}

	skillIDs, err := shared.ParseUUIDCSV(query.Skills, "skills")
	if err != nil {
		return nil, err
	}

	items, err := s.repo.ListInviteCandidates(ctx, projectID, actorID, InviteCandidateFilters{
		Query:      strings.TrimSpace(query.Query),
		University: strings.TrimSpace(query.University),
		Course:     query.Course,
		Rating:     query.Rating,
		SkillIDs:   skillIDs,
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load invite candidates")
	}

	return items, nil
}

func (s *service) ListProjectInvitations(ctx context.Context, actorID, projectID uuid.UUID) ([]InvitationDetail, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can view invitations")
	}

	items, err := s.repo.ListProjectInvitations(ctx, projectID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load project invitations")
	}

	return items, nil
}

func (s *service) CreateInvitation(ctx context.Context, actorID, projectID uuid.UUID, request CreateInvitationRequest) (*InvitationDetail, error) {
	projectDetail, err := s.repo.GetByID(ctx, projectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if projectDetail.Project.OwnerID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the project owner can send invitations")
	}

	if projectDetail.ParticipantsCount >= projectDetail.Project.TeamSize {
		return nil, shared.NewAppError(http.StatusConflict, "Project team is already full")
	}

	recipientID, err := shared.ParseUUID(request.RecipientID, "recipient_id")
	if err != nil {
		return nil, err
	}

	if recipientID == actorID {
		return nil, shared.NewAppError(http.StatusConflict, "Project owner cannot invite themselves")
	}

	recipient, err := s.repo.GetInvitableUser(ctx, projectID, recipientID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, shared.NewAppError(http.StatusConflict, "This user is unavailable for project invitations")
		}
		return nil, shared.WrapInternal(err, "Failed to validate invitation recipient")
	}

	existing, err := s.repo.GetInvitationByRecipient(ctx, projectID, recipientID)
	if err == nil {
		switch existing.Status {
		case RequestPending:
			return nil, shared.NewAppError(http.StatusConflict, "Invitation is already pending for this user")
		case RequestAccepted:
			return nil, shared.NewAppError(http.StatusConflict, "This user is already accepted to the project")
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return nil, shared.WrapInternal(err, "Failed to validate existing invitation")
	}

	item, err := s.repo.SaveInvitation(ctx, SaveInvitationParams{
		ProjectID:   projectID,
		SenderID:    actorID,
		RecipientID: recipientID,
		Message:     normalizeOptional(request.Message),
	})
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to create invitation")
	}

	if s.notifier != nil {
		link := fmt.Sprintf("/projects/%s", projectID.String())
		body := fmt.Sprintf("Тебя пригласили в проект \"%s\".", projectDetail.Project.Title)
		if request.Message != nil && strings.TrimSpace(*request.Message) != "" {
			body = fmt.Sprintf("Тебя пригласили в проект \"%s\": %s", projectDetail.Project.Title, strings.TrimSpace(*request.Message))
		}
		_ = s.notifier.CreateNotification(ctx, user.NotificationCreateParams{
			RecipientID: recipient.ID,
			Type:        "project_invitation_sent",
			Title:       "Новое приглашение в проект",
			Body:        body,
			Link:        &link,
		})
	}

	return item, nil
}

func (s *service) ListMyInvitations(ctx context.Context, userID uuid.UUID) ([]InvitationDetail, error) {
	items, err := s.repo.ListUserInvitations(ctx, userID)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to load invitations")
	}

	return items, nil
}

func (s *service) ReviewInvitation(ctx context.Context, actorID, invitationID uuid.UUID, request ReviewInvitationRequest) (*InvitationDetail, error) {
	invitation, err := s.repo.GetInvitationByID(ctx, invitationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, shared.NewAppError(http.StatusNotFound, "Invitation not found")
		}
		return nil, shared.WrapInternal(err, "Failed to load invitation")
	}

	if invitation.RecipientID != actorID {
		return nil, shared.NewAppError(http.StatusForbidden, "Only the invited user can respond to this invitation")
	}

	if invitation.Status != RequestPending {
		return nil, shared.NewAppError(http.StatusConflict, "This invitation has already been reviewed")
	}

	projectDetail, err := s.repo.GetByID(ctx, invitation.ProjectID)
	if err != nil {
		return nil, mapProjectError(err)
	}

	if request.Decision == RequestAccepted {
		if projectDetail.ParticipantsCount >= projectDetail.Project.TeamSize {
			return nil, shared.NewAppError(http.StatusConflict, "Project team is already full")
		}

		isMember, err := s.repo.IsMember(ctx, invitation.ProjectID, actorID)
		if err != nil {
			return nil, shared.WrapInternal(err, "Failed to validate project membership")
		}
		if isMember {
			return nil, shared.NewAppError(http.StatusConflict, "You are already a member of this project")
		}
	}

	item, err := s.repo.ReviewInvitation(ctx, invitationID, request.Decision)
	if err != nil {
		return nil, shared.WrapInternal(err, "Failed to review invitation")
	}

	if s.notifier != nil {
		link := fmt.Sprintf("/projects/%s", invitation.ProjectID.String())
		body := fmt.Sprintf("%s отклонил приглашение в проект \"%s\".", item.Recipient.FullName, item.Project.Title)
		if request.Decision == RequestAccepted {
			body = fmt.Sprintf("%s принял приглашение в проект \"%s\".", item.Recipient.FullName, item.Project.Title)
		}
		_ = s.notifier.CreateNotification(ctx, user.NotificationCreateParams{
			RecipientID: item.Sender.ID,
			Type:        "project_invitation_reviewed",
			Title:       "Ответ на приглашение",
			Body:        body,
			Link:        &link,
		})
	}

	return item, nil
}
