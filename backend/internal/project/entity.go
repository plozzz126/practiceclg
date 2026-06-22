package project

import (
	"time"

	"github.com/devlink/backend/internal/skill"
	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
)

const (
	StatusDraft    = "draft"
	StatusOpen     = "open"
	StatusClosed   = "closed"
	StatusArchived = "archived"
)

const (
	DirectionWeb           = "web"
	DirectionMobile        = "mobile"
	DirectionAI            = "ai"
	DirectionData          = "data"
	DirectionDesign        = "design"
	DirectionHackathon     = "hackathon"
	DirectionCTF           = "ctf"
	DirectionCybersecurity = "cybersecurity"
	DirectionStartup       = "startup"
	DirectionEducation     = "education"
	DirectionResearch      = "research"
	DirectionOpenSource    = "open_source"
)

type Project struct {
	ID            uuid.UUID  `json:"id"`
	OwnerID       uuid.UUID  `json:"owner_id"`
	Title         string     `json:"title"`
	Description   string     `json:"description"`
	Deadline      *time.Time `json:"deadline,omitempty"`
	Status        string     `json:"status"`
	Direction     string     `json:"direction"`
	TeamSize      int        `json:"team_size"`
	RequiredRoles []string   `json:"required_roles"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type Detail struct {
	Project           Project       `json:"project"`
	Owner             user.User     `json:"owner"`
	RequiredSkills    []skill.Skill `json:"required_skills"`
	ParticipantsCount int           `json:"participants_count"`
}

type Filters struct {
	Query     string
	Status    string
	Direction string
	Sort      string
	SkillIDs  []uuid.UUID
}
