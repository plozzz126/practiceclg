package project

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/devlink/backend/internal/user"
	"github.com/gin-gonic/gin"
)

func (h *Handler) listInviteCandidates(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectInvitationURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	var query ListInviteCandidatesQuery
	if err := shared.BindQuery(c, &query); err != nil {
		return err
	}

	items, err := h.service.ListInviteCandidates(c.Request.Context(), authUser.UserID, projectID, query)
	if err != nil {
		return err
	}

	responseItems := make([]user.PublicUserResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, user.ToPublicUserResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, InviteCandidateListResponse{Items: responseItems})
	return nil
}

func (h *Handler) listProjectInvitations(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectInvitationURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	items, err := h.service.ListProjectInvitations(c.Request.Context(), authUser.UserID, projectID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectInvitationResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToInvitationResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectInvitationListResponse{Items: responseItems})
	return nil
}

func (h *Handler) createInvitation(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectInvitationURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	var request CreateInvitationRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.CreateInvitation(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToInvitationResponse(item))
	return nil
}

func (h *Handler) listMyInvitations(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	items, err := h.service.ListMyInvitations(c.Request.Context(), authUser.UserID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectInvitationResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToInvitationResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectInvitationListResponse{Items: responseItems})
	return nil
}

func (h *Handler) reviewInvitation(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectInvitationDecisionURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	invitationID, err := shared.ParseUUID(params.InvitationID, "invitationId")
	if err != nil {
		return err
	}

	var request ReviewInvitationRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.ReviewInvitation(c.Request.Context(), authUser.UserID, invitationID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToInvitationResponse(item))
	return nil
}
