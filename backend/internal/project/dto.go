package project

import (
	"time"

	"github.com/devlink/backend/internal/skill"
	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
)

type ProjectURIParams struct {
	ID string `uri:"id" validate:"required,uuid"`
}

type ListProjectsQuery struct {
	Query     string `form:"query" validate:"omitempty,min=1,max=160"`
	Skills    string `form:"skills" validate:"omitempty,max=800"`
	Status    string `form:"status" validate:"omitempty,oneof=draft open closed archived"`
	Direction string `form:"direction" validate:"omitempty,oneof=web mobile ai data design hackathon ctf cybersecurity startup education research open_source"`
	Sort      string `form:"sort" validate:"omitempty,oneof=asc desc deadline"`
}

type CreateProjectRequest struct {
	Title            string   `json:"title" validate:"required,min=3,max=160"`
	Description      string   `json:"description" validate:"required,min=10,max=5000"`
	Deadline         *string  `json:"deadline" validate:"omitempty,datetime=2006-01-02"`
	Status           string   `json:"status" validate:"omitempty,oneof=draft open closed archived"`
	Direction        string   `json:"direction" validate:"omitempty,oneof=web mobile ai data design hackathon ctf cybersecurity startup education research open_source"`
	TeamSize         int      `json:"team_size" validate:"omitempty,min=1,max=12"`
	RequiredRoles    []string `json:"required_roles" validate:"omitempty,max=12,dive,min=2,max=80"`
	RequiredSkillIDs []string `json:"required_skill_ids" validate:"omitempty,max=20,dive,uuid"`
}

type UpdateProjectRequest struct {
	Title            *string  `json:"title" validate:"omitempty,min=3,max=160"`
	Description      *string  `json:"description" validate:"omitempty,min=10,max=5000"`
	Deadline         *string  `json:"deadline" validate:"omitempty,datetime=2006-01-02"`
	Status           *string  `json:"status" validate:"omitempty,oneof=draft open closed archived"`
	Direction        *string  `json:"direction" validate:"omitempty,oneof=web mobile ai data design hackathon ctf cybersecurity startup education research open_source"`
	TeamSize         *int     `json:"team_size" validate:"omitempty,min=1,max=12"`
	RequiredRoles    []string `json:"required_roles" validate:"omitempty,max=12,dive,min=2,max=80"`
	RequiredSkillIDs []string `json:"required_skill_ids" validate:"omitempty,max=20,dive,uuid"`
}

type ProjectResponse struct {
	ID                uuid.UUID               `json:"id"`
	OwnerID           uuid.UUID               `json:"owner_id"`
	Title             string                  `json:"title"`
	Description       string                  `json:"description"`
	Deadline          *string                 `json:"deadline,omitempty"`
	Status            string                  `json:"status"`
	Direction         string                  `json:"direction"`
	TeamSize          int                     `json:"team_size"`
	RequiredRoles     []string                `json:"required_roles"`
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
		Direction:         detail.Project.Direction,
		TeamSize:          detail.Project.TeamSize,
		RequiredRoles:     detail.Project.RequiredRoles,
		CreatedAt:         detail.Project.CreatedAt,
		UpdatedAt:         detail.Project.UpdatedAt,
		Owner:             user.ToPublicUserResponse(&detail.Owner),
		RequiredSkills:    detail.RequiredSkills,
		ParticipantsCount: detail.ParticipantsCount,
	}
}
