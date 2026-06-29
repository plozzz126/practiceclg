package project

import (
	"net/http"

	"github.com/devlink/backend/internal/middleware"
	"github.com/devlink/backend/internal/shared"
	"github.com/gin-gonic/gin"
)

func (h *Handler) listTasks(c *gin.Context) error {
	var params ProjectURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	items, err := h.service.ListTasks(c.Request.Context(), projectID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectTaskResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToTaskResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectTaskListResponse{Items: responseItems})
	return nil
}

func (h *Handler) createTask(c *gin.Context) error {
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

	var request CreateTaskRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	task, err := h.service.CreateTask(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToTaskResponse(task))
	return nil
}

func (h *Handler) updateTask(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectTaskURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	taskID, err := shared.ParseUUID(params.TaskID, "taskId")
	if err != nil {
		return err
	}

	var request UpdateTaskRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	task, err := h.service.UpdateTask(c.Request.Context(), authUser.UserID, projectID, taskID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToTaskResponse(task))
	return nil
}

func (h *Handler) deleteTask(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectTaskURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	taskID, err := shared.ParseUUID(params.TaskID, "taskId")
	if err != nil {
		return err
	}

	if err := h.service.DeleteTask(c.Request.Context(), authUser.UserID, projectID, taskID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "Task deleted successfully"})
	return nil
}

func (h *Handler) getMyJoinRequest(c *gin.Context) error {
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

	item, err := h.service.GetMyJoinRequest(c.Request.Context(), authUser.UserID, projectID)
	if err != nil {
		return err
	}

	if item == nil {
		shared.RespondSuccess(c, http.StatusOK, nil)
		return nil
	}

	shared.RespondSuccess(c, http.StatusOK, ToJoinRequestResponse(item))
	return nil
}

func (h *Handler) listJoinRequests(c *gin.Context) error {
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

	items, err := h.service.ListJoinRequests(c.Request.Context(), authUser.UserID, projectID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectJoinRequestResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToJoinRequestResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectJoinRequestListResponse{Items: responseItems})
	return nil
}

func (h *Handler) submitJoinRequest(c *gin.Context) error {
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

	var request CreateJoinRequestRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.SubmitJoinRequest(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToJoinRequestResponse(item))
	return nil
}

func (h *Handler) reviewJoinRequest(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var params ProjectJoinRequestDecisionURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	projectID, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	requestID, err := shared.ParseUUID(params.RequestID, "requestId")
	if err != nil {
		return err
	}

	var request ReviewJoinRequestRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.ReviewJoinRequest(c.Request.Context(), authUser.UserID, projectID, requestID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToJoinRequestResponse(item))
	return nil
}

func (h *Handler) listMessages(c *gin.Context) error {
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

	items, err := h.service.ListMessages(c.Request.Context(), authUser.UserID, projectID)
	if err != nil {
		return err
	}

	responseItems := make([]ProjectMessageResponse, 0, len(items))
	for index := range items {
		responseItems = append(responseItems, ToMessageResponse(&items[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectMessageListResponse{Items: responseItems})
	return nil
}

func (h *Handler) createMessage(c *gin.Context) error {
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

	var request CreateMessageRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	item, err := h.service.CreateMessage(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToMessageResponse(item))
	return nil
}
