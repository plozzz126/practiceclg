package user

import (
	"time"

	"github.com/edumatch/backend/internal/skill"
	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID     `json:"id"`
	Email      string        `json:"email"`
	FullName   string        `json:"full_name"`
	University *string       `json:"university,omitempty"`
	Course     *int          `json:"course,omitempty"`
	Bio        *string       `json:"bio,omitempty"`
	AvatarURL  *string       `json:"avatar_url,omitempty"`
	Rating     float64       `json:"rating"`
	Skills     []skill.Skill `json:"skills"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
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
