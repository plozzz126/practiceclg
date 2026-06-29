package project

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/gin-gonic/gin"
)

func (h *Handler) listDocuments(c *gin.Context) error {
	var params ProjectURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	items, err := h.service.ListDocuments(c.Request.Context(), projectID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectDocumentResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToDocumentResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectDocumentListResponse{Items: responseItems})
	return nil
}

func (h *Handler) createDocument(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	var request CreateDocumentRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.CreateDocument(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToDocumentResponse(item))
	return nil
}

func (h *Handler) deleteDocument(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectDocumentURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	documentID, err := shared.ParseUUID(params.DocumentID, "documentId")
	if err != nil {
		return err
	}

	if err := h.service.DeleteDocument(c.Request.Context(), authUser.UserID, projectID, documentID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "Document deleted successfully"})
	return nil
}
