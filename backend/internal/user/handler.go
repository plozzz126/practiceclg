package user

import (
	"log/slog"
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
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
	users := router.Group("/users")
	users.GET("", shared.Wrap(h.logger, h.listUsers))
	users.GET("/me", authMiddleware, shared.Wrap(h.logger, h.getCurrentProfile))
	users.PUT("/me", authMiddleware, shared.Wrap(h.logger, h.updateCurrentProfile))
	users.PUT("/me/privacy", authMiddleware, shared.Wrap(h.logger, h.updateCurrentPrivacy))
	users.PUT("/me/skills", authMiddleware, shared.Wrap(h.logger, h.updateCurrentSkills))
	users.GET("/me/notifications", authMiddleware, shared.Wrap(h.logger, h.listMyNotifications))
	users.POST("/me/notifications/read-all", authMiddleware, shared.Wrap(h.logger, h.markAllNotificationsRead))
	users.POST("/me/notifications/:id/read", authMiddleware, shared.Wrap(h.logger, h.markNotificationRead))
	users.DELETE("/me", authMiddleware, shared.Wrap(h.logger, h.deleteCurrentUser))
	users.GET("/:id", shared.Wrap(h.logger, h.getPublicProfile))
}

// listUsers godoc
// @Summary Search users
// @Description Search and filter public user profiles by skill, course, university, rating, or text query.
// @Tags Users
// @Produce json
// @Param query query string false "Text search by full name"
// @Param skill query string false "Skill UUID"
// @Param course query int false "Course number"
// @Param university query string false "University name"
// @Param rating query number false "Minimum rating"
// @Success 200 {object} shared.SuccessResponse{data=UserListResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /users [get]
func (h *Handler) listUsers(c *gin.Context) error {
	var query ListUsersQuery
	if err := shared.BindQuery(c, &query); err != nil {
		return err
	}

	users, err := h.service.List(c.Request.Context(), query)
	if err != nil {
		return err
	}

	items := make([]PublicUserResponse, 0, len(users))
	for index := range users {
		items = append(items, ToPublicUserResponse(&users[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, UserListResponse{Items: items})
	return nil
}

// getCurrentProfile godoc
// @Summary Get current user profile
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} shared.SuccessResponse{data=CurrentUserResponse}
// @Failure 401 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /users/me [get]
func (h *Handler) getCurrentProfile(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	user, err := h.service.GetCurrent(c.Request.Context(), authUser.UserID)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToCurrentUserResponse(user))
	return nil
}

// updateCurrentProfile godoc
// @Summary Update current user profile
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body UpdateProfileRequest true "Profile update"
// @Success 200 {object} shared.SuccessResponse{data=CurrentUserResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /users/me [put]
func (h *Handler) updateCurrentProfile(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var request UpdateProfileRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	user, err := h.service.UpdateProfile(c.Request.Context(), authUser.UserID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToCurrentUserResponse(user))
	return nil
}

// updateCurrentSkills godoc
// @Summary Replace current user skills
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body UpdateSkillsRequest true "Skill IDs"
// @Success 200 {object} shared.SuccessResponse{data=CurrentUserResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /users/me/skills [put]
func (h *Handler) updateCurrentSkills(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var request UpdateSkillsRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	user, err := h.service.UpdateSkills(c.Request.Context(), authUser.UserID, request.SkillIDs)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToCurrentUserResponse(user))
	return nil
}

// getPublicProfile godoc
// @Summary Get public user profile
// @Tags Users
// @Produce json
// @Param id path string true "User UUID"
// @Success 200 {object} shared.SuccessResponse{data=PublicUserResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /users/{id} [get]
func (h *Handler) getPublicProfile(c *gin.Context) error {
	var params UserURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	id, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	user, err := h.service.GetPublic(c.Request.Context(), id)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToPublicUserResponse(user))
	return nil
}

// deleteCurrentUser godoc
// @Summary Delete current user
// @Tags Users
// @Security BearerAuth
// @Success 200 {object} shared.SuccessResponse{data=map[string]string}
// @Failure 401 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /users/me [delete]
func (h *Handler) deleteCurrentUser(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	if err := h.service.Delete(c.Request.Context(), authUser.UserID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "User deleted successfully"})
	return nil
}
