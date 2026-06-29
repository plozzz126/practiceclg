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
	RequestPending  = "pending"
	RequestAccepted = "accepted"
	RequestRejected = "rejected"
)

const (
	MemberRoleOwner  = "owner"
	MemberRoleMember = "member"
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

type Task struct {
	ID          uuid.UUID  `json:"id"`
	ProjectID   uuid.UUID  `json:"project_id"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueDate     *time.Time `json:"due_date,omitempty"`
	Done        bool       `json:"done"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type JoinRequest struct {
	ID        uuid.UUID  `json:"id"`
	ProjectID uuid.UUID  `json:"project_id"`
	UserID    uuid.UUID  `json:"user_id"`
	Message   *string    `json:"message,omitempty"`
	Status    string     `json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	DecidedAt *time.Time `json:"decided_at,omitempty"`
}

type JoinRequestDetail struct {
	Request JoinRequest `json:"request"`
	User    user.User   `json:"user"`
}

type Message struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	SenderID  uuid.UUID `json:"sender_id"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

type MessageDetail struct {
	Message Message   `json:"message"`
	Sender  user.User `json:"sender"`
}

type Document struct {
	ID          uuid.UUID `json:"id"`
	ProjectID   uuid.UUID `json:"project_id"`
	Title       string    `json:"title"`
	URL         string    `json:"url"`
	Description *string   `json:"description,omitempty"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
}

type Invitation struct {
	ID          uuid.UUID  `json:"id"`
	ProjectID   uuid.UUID  `json:"project_id"`
	SenderID    uuid.UUID  `json:"sender_id"`
	RecipientID uuid.UUID  `json:"recipient_id"`
	Message     *string    `json:"message,omitempty"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	DecidedAt   *time.Time `json:"decided_at,omitempty"`
}

type InvitationDetail struct {
	Invitation        Invitation `json:"invitation"`
	Project           Project    `json:"project"`
	ParticipantsCount int        `json:"participants_count"`
	Sender            user.User  `json:"sender"`
	Recipient         user.User  `json:"recipient"`
}

type Filters struct {
	Query     string
	Status    string
	Direction string
	Sort      string
	SkillIDs  []uuid.UUID
}

type InviteCandidateFilters struct {
	Query      string
	University string
	Course     *int
	Rating     *float64
	SkillIDs   []uuid.UUID
}
