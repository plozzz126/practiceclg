package user

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/gin-gonic/gin"
)

func (h *Handler) listMyNotifications(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	items, err := h.service.ListNotifications(c.Request.Context(), authUser.UserID)
	if err != nil {
		return err
	}

	responseItems := make([]NotificationResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToNotificationResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, NotificationListResponse{Items: responseItems})
	return nil
}

func (h *Handler) markNotificationRead(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params NotificationURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	notificationID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	if err := h.service.MarkNotificationRead(c.Request.Context(), authUser.UserID, notificationID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "Notification marked as read"})
	return nil
}

func (h *Handler) markAllNotificationsRead(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	if err := h.service.MarkAllNotificationsRead(c.Request.Context(), authUser.UserID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "All notifications marked as read"})
	return nil
}
