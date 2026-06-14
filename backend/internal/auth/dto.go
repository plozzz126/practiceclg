package auth

import "github.com/edumatch/backend/internal/user"

type RegisterRequest struct {
	Email      string   `json:"email" validate:"required,email,max=255"`
	Password   string   `json:"password" validate:"required,min=8,max=72"`
	FullName   string   `json:"full_name" validate:"required,min=2,max=160"`
	University *string  `json:"university" validate:"omitempty,max=180"`
	Course     *int     `json:"course" validate:"omitempty,gte=1,lte=8"`
	Bio        *string  `json:"bio" validate:"omitempty,max=1200"`
	AvatarURL  *string  `json:"avatar_url" validate:"omitempty,url,max=1000"`
	SkillIDs   []string `json:"skill_ids" validate:"omitempty,max=20,dive,uuid"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email,max=255"`
	Password string `json:"password" validate:"required,min=8,max=72"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required,min=20"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required,min=20"`
}

type AuthResponse struct {
	User   user.CurrentUserResponse `json:"user"`
	Tokens TokenPair                `json:"tokens"`
}
