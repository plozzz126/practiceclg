package user

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/gin-gonic/gin"
)

func (h *Handler) updateCurrentPrivacy(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var request UpdatePrivacyRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	user, err := h.service.UpdatePrivacy(c.Request.Context(), authUser.UserID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToCurrentUserResponse(user))
	return nil
}
