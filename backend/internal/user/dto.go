package user

import (
	"time"

	"github.com/devlink/backend/internal/skill"
	"github.com/google/uuid"
)

type UserURIParams struct {
	ID string `uri:"id" validate:"required,uuid"`
}

type ListUsersQuery struct {
	Query      string   `form:"query" validate:"omitempty,min=1,max=120"`
	Skill      string   `form:"skill" validate:"omitempty,uuid"`
	Course     *int     `form:"course" validate:"omitempty,gte=1,lte=8"`
	University string   `form:"university" validate:"omitempty,max=180"`
	Rating     *float64 `form:"rating" validate:"omitempty,gte=0,lte=5"`
}

type UpdateProfileRequest struct {
	FullName   *string `json:"full_name" validate:"omitempty,min=2,max=160"`
	University *string `json:"university" validate:"omitempty,max=180"`
	Course     *int    `json:"course" validate:"omitempty,gte=1,lte=8"`
	Bio        *string `json:"bio" validate:"omitempty,max=1200"`
	AvatarURL  *string `json:"avatar_url" validate:"omitempty,url,max=1000"`
}

type UpdateSkillsRequest struct {
	SkillIDs []string `json:"skill_ids" validate:"required,max=20,dive,uuid"`
}

type CurrentUserResponse struct {
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

type PublicUserResponse struct {
	ID         uuid.UUID     `json:"id"`
	FullName   string        `json:"full_name"`
	University *string       `json:"university,omitempty"`
	Course     *int          `json:"course,omitempty"`
	Bio        *string       `json:"bio,omitempty"`
	AvatarURL  *string       `json:"avatar_url,omitempty"`
	Rating     float64       `json:"rating"`
	Skills     []skill.Skill `json:"skills"`
	CreatedAt  time.Time     `json:"created_at"`
}

type UserListResponse struct {
	Items []PublicUserResponse `json:"items"`
}

func ToCurrentUserResponse(user *User) CurrentUserResponse {
	return CurrentUserResponse{
		ID:         user.ID,
		Email:      user.Email,
		FullName:   user.FullName,
		University: user.University,
		Course:     user.Course,
		Bio:        user.Bio,
		AvatarURL:  user.AvatarURL,
		Rating:     user.Rating,
		Skills:     user.Skills,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}
}

func ToPublicUserResponse(user *User) PublicUserResponse {
	return PublicUserResponse{
		ID:         user.ID,
		FullName:   user.FullName,
		University: user.University,
		Course:     user.Course,
		Bio:        user.Bio,
		AvatarURL:  user.AvatarURL,
		Rating:     user.Rating,
		Skills:     user.Skills,
		CreatedAt:  user.CreatedAt,
	}
}
