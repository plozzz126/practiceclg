package auth

import (
	"log/slog"
	"net/http"

	"github.com/edumatch/backend/internal/middleware"
	"github.com/edumatch/backend/internal/shared"
	"github.com/edumatch/backend/internal/user"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
	logger  *slog.Logger
}

func NewHandler(service Service, logger *slog.Logger) *Handler {
	return &Handler{service: service, logger: logger}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	auth := router.Group("/auth")
	auth.POST("/register", shared.Wrap(h.logger, h.register))
	auth.POST("/login", shared.Wrap(h.logger, h.login))
	auth.POST("/refresh", shared.Wrap(h.logger, h.refresh))
	auth.POST("/logout", authMiddleware, shared.Wrap(h.logger, h.logout))
}

// register godoc
// @Summary Register a user
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body RegisterRequest true "Registration payload"
// @Success 201 {object} shared.SuccessResponse{data=user.CurrentUserResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 409 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /auth/register [post]
func (h *Handler) register(c *gin.Context) error {
	var request RegisterRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	createdUser, err := h.service.Register(c.Request.Context(), request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, user.ToCurrentUserResponse(createdUser))
	return nil
}

// login godoc
// @Summary Login user
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body LoginRequest true "Login payload"
// @Success 200 {object} shared.SuccessResponse{data=AuthResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /auth/login [post]
func (h *Handler) login(c *gin.Context) error {
	var request LoginRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	currentUser, tokens, err := h.service.Login(c.Request.Context(), request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, AuthResponse{
		User:   user.ToCurrentUserResponse(currentUser),
		Tokens: tokens,
	})
	return nil
}

// refresh godoc
// @Summary Refresh JWT tokens
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body RefreshRequest true "Refresh token payload"
// @Success 200 {object} shared.SuccessResponse{data=AuthResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /auth/refresh [post]
func (h *Handler) refresh(c *gin.Context) error {
	var request RefreshRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	currentUser, tokens, err := h.service.Refresh(c.Request.Context(), request.RefreshToken)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, AuthResponse{
		User:   user.ToCurrentUserResponse(currentUser),
		Tokens: tokens,
	})
	return nil
}

// logout godoc
// @Summary Logout user
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body LogoutRequest true "Refresh token payload"
// @Success 200 {object} shared.SuccessResponse{data=map[string]string}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /auth/logout [post]
func (h *Handler) logout(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var request LogoutRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	if err := h.service.Logout(c.Request.Context(), authUser.UserID, authUser.TokenID, authUser.ExpiresAt, request.RefreshToken); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
	return nil
}
