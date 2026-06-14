package project

import (
	"time"

	"github.com/edumatch/backend/internal/skill"
	"github.com/edumatch/backend/internal/user"
	"github.com/google/uuid"
)

type ProjectURIParams struct {
	ID string `uri:"id" validate:"required,uuid"`
}

type ListProjectsQuery struct {
	Query  string `form:"query" validate:"omitempty,min=1,max=160"`
	Skills string `form:"skills" validate:"omitempty,max=800"`
	Status string `form:"status" validate:"omitempty,oneof=draft open closed archived"`
	Sort   string `form:"sort" validate:"omitempty,oneof=asc desc"`
}

type CreateProjectRequest struct {
	Title            string   `json:"title" validate:"required,min=3,max=160"`
	Description      string   `json:"description" validate:"required,min=10,max=5000"`
	Deadline         *string  `json:"deadline" validate:"omitempty,datetime=2006-01-02"`
	Status           string   `json:"status" validate:"omitempty,oneof=draft open closed archived"`
	RequiredSkillIDs []string `json:"required_skill_ids" validate:"omitempty,max=20,dive,uuid"`
}

type UpdateProjectRequest struct {
	Title            *string  `json:"title" validate:"omitempty,min=3,max=160"`
	Description      *string  `json:"description" validate:"omitempty,min=10,max=5000"`
	Deadline         *string  `json:"deadline" validate:"omitempty,datetime=2006-01-02"`
	Status           *string  `json:"status" validate:"omitempty,oneof=draft open closed archived"`
	RequiredSkillIDs []string `json:"required_skill_ids" validate:"omitempty,max=20,dive,uuid"`
}

type ProjectResponse struct {
	ID                uuid.UUID               `json:"id"`
	OwnerID           uuid.UUID               `json:"owner_id"`
	Title             string                  `json:"title"`
	Description       string                  `json:"description"`
	Deadline          *string                 `json:"deadline,omitempty"`
	Status            string                  `json:"status"`
	CreatedAt         time.Time               `json:"created_at"`
	UpdatedAt         time.Time               `json:"updated_at"`
	Owner             user.PublicUserResponse `json:"owner"`
	RequiredSkills    []skill.Skill           `json:"required_skills"`
	ParticipantsCount int                     `json:"participants_count"`
}

type ProjectListResponse struct {
	Items []ProjectResponse `json:"items"`
}

func ToProjectResponse(detail *Detail) ProjectResponse {
	var deadline *string
	if detail.Project.Deadline != nil {
		formatted := detail.Project.Deadline.Format("2006-01-02")
		deadline = &formatted
	}

	return ProjectResponse{
		ID:                detail.Project.ID,
		OwnerID:           detail.Project.OwnerID,
		Title:             detail.Project.Title,
		Description:       detail.Project.Description,
		Deadline:          deadline,
		Status:            detail.Project.Status,
		CreatedAt:         detail.Project.CreatedAt,
		UpdatedAt:         detail.Project.UpdatedAt,
		Owner:             user.ToPublicUserResponse(&detail.Owner),
		RequiredSkills:    detail.RequiredSkills,
		ParticipantsCount: detail.ParticipantsCount,
	}
}
