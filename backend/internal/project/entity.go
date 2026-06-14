package project

import (
	"time"

	"github.com/edumatch/backend/internal/skill"
	"github.com/edumatch/backend/internal/user"
	"github.com/google/uuid"
)

const (
	StatusDraft    = "draft"
	StatusOpen     = "open"
	StatusClosed   = "closed"
	StatusArchived = "archived"
)

type Project struct {
	ID          uuid.UUID  `json:"id"`
	OwnerID     uuid.UUID  `json:"owner_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Detail struct {
	Project           Project       `json:"project"`
	Owner             user.User     `json:"owner"`
	RequiredSkills    []skill.Skill `json:"required_skills"`
	ParticipantsCount int           `json:"participants_count"`
}

type Filters struct {
	Query    string
	Status   string
	Sort     string
	SkillIDs []uuid.UUID
}
