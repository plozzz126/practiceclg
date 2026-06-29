package user

import (
	"time"

	"github.com/devlink/backend/internal/skill"
	"github.com/google/uuid"
)

type User struct {
	ID                  uuid.UUID     `json:"id"`
	Email               string        `json:"email"`
	FullName            string        `json:"full_name"`
	University          *string       `json:"university,omitempty"`
	Course              *int          `json:"course,omitempty"`
	Bio                 *string       `json:"bio,omitempty"`
	AvatarURL           *string       `json:"avatar_url,omitempty"`
	AllowProjectInvites bool          `json:"allow_project_invites"`
	Rating              float64       `json:"rating"`
	Skills              []skill.Skill `json:"skills"`
	CreatedAt           time.Time     `json:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at"`
}

type Credentials struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
}

type Filters struct {
	Query      string
	University string
	Course     *int
	Rating     *float64
	SkillID    *uuid.UUID
}

type Notification struct {
	ID          uuid.UUID  `json:"id"`
	RecipientID uuid.UUID  `json:"recipient_id"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Body        string     `json:"body"`
	Link        *string    `json:"link,omitempty"`
	ReadAt      *time.Time `json:"read_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}
