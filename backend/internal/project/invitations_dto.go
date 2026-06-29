package project

import (
	"time"

	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
)

type ProjectInvitationURIParams struct {
	ID string `uri:"id" validate:"required,uuid"`
}

type ProjectInvitationDecisionURIParams struct {
	InvitationID string `uri:"invitationId" validate:"required,uuid"`
}

type ListInviteCandidatesQuery struct {
	Query      string   `form:"query" validate:"omitempty,min=1,max=120"`
	Skills     string   `form:"skills" validate:"omitempty,max=800"`
	Course     *int     `form:"course" validate:"omitempty,gte=1,lte=8"`
	University string   `form:"university" validate:"omitempty,max=180"`
	Rating     *float64 `form:"rating" validate:"omitempty,gte=0,lte=5"`
}

type CreateInvitationRequest struct {
	RecipientID string  `json:"recipient_id" validate:"required,uuid"`
	Message     *string `json:"message" validate:"omitempty,max=2000"`
}

type ReviewInvitationRequest struct {
	Decision string `json:"decision" validate:"required,oneof=accepted rejected"`
}

type InviteCandidateListResponse struct {
	Items []user.PublicUserResponse `json:"items"`
}

type InvitationProjectResponse struct {
	ID                uuid.UUID `json:"id"`
	Title             string    `json:"title"`
	Direction         string    `json:"direction"`
	Status            string    `json:"status"`
	Deadline          *string   `json:"deadline,omitempty"`
	TeamSize          int       `json:"team_size"`
	ParticipantsCount int       `json:"participants_count"`
}

type ProjectInvitationResponse struct {
	ID          uuid.UUID                 `json:"id"`
	ProjectID   uuid.UUID                 `json:"project_id"`
	SenderID    uuid.UUID                 `json:"sender_id"`
	RecipientID uuid.UUID                 `json:"recipient_id"`
	Message     *string                   `json:"message,omitempty"`
	Status      string                    `json:"status"`
	CreatedAt   time.Time                 `json:"created_at"`
	DecidedAt   *time.Time                `json:"decided_at,omitempty"`
	Project     InvitationProjectResponse `json:"project"`
	Sender      user.PublicUserResponse   `json:"sender"`
	Recipient   user.PublicUserResponse   `json:"recipient"`
}

type ProjectInvitationListResponse struct {
	Items []ProjectInvitationResponse `json:"items"`
}

func ToInvitationProjectResponse(project Project, participantsCount int) InvitationProjectResponse {
	var deadline *string
	if project.Deadline != nil {
		formatted := project.Deadline.Format("2006-01-02")
		deadline = &formatted
	}

	return InvitationProjectResponse{
		ID:                project.ID,
		Title:             project.Title,
		Direction:         project.Direction,
		Status:            project.Status,
		Deadline:          deadline,
		TeamSize:          project.TeamSize,
		ParticipantsCount: participantsCount,
	}
}

func ToInvitationResponse(detail *InvitationDetail) ProjectInvitationResponse {
	return ProjectInvitationResponse{
		ID:          detail.Invitation.ID,
		ProjectID:   detail.Invitation.ProjectID,
		SenderID:    detail.Invitation.SenderID,
		RecipientID: detail.Invitation.RecipientID,
		Message:     detail.Invitation.Message,
		Status:      detail.Invitation.Status,
		CreatedAt:   detail.Invitation.CreatedAt,
		DecidedAt:   detail.Invitation.DecidedAt,
		Project:     ToInvitationProjectResponse(detail.Project, detail.ParticipantsCount),
		Sender:      user.ToPublicUserResponse(&detail.Sender),
		Recipient:   user.ToPublicUserResponse(&detail.Recipient),
	}
}
