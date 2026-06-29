package project

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/gin-gonic/gin"
)

func (h *Handler) listMyProjects(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	items, err := h.service.ListOwnedByUser(c.Request.Context(), authUser.UserID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToProjectResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectListResponse{Items: responseItems})
	return nil
}

func (h *Handler) listParticipatingProjects(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	items, err := h.service.ListParticipating(c.Request.Context(), authUser.UserID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToProjectResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectListResponse{Items: responseItems})
	return nil
}
