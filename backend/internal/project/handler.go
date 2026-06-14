package project

import (
	"log/slog"
	"net/http"

	"github.com/edumatch/backend/internal/middleware"
	"github.com/edumatch/backend/internal/shared"
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
	projects := router.Group("/projects")
	projects.GET("", shared.Wrap(h.logger, h.listProjects))
	projects.GET("/:id", shared.Wrap(h.logger, h.getProjectByID))
	projects.POST("", authMiddleware, shared.Wrap(h.logger, h.createProject))
	projects.PUT("/:id", authMiddleware, shared.Wrap(h.logger, h.updateProject))
	projects.DELETE("/:id", authMiddleware, shared.Wrap(h.logger, h.deleteProject))
}

// listProjects godoc
// @Summary Search projects
// @Tags Projects
// @Produce json
// @Param query query string false "Search by title"
// @Param skills query string false "Comma-separated skill UUIDs"
// @Param status query string false "Project status"
// @Param sort query string false "Sort by created_at: asc or desc"
// @Success 200 {object} shared.SuccessResponse{data=ProjectListResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /projects [get]
func (h *Handler) listProjects(c *gin.Context) error {
	var query ListProjectsQuery
	if err := shared.BindQuery(c, &query); err != nil {
		return err
	}

	projects, err := h.service.List(c.Request.Context(), query)
	if err != nil {
		return err
	}

	items := make([]ProjectResponse, 0, len(projects))
	for index := range projects {
		items = append(items, ToProjectResponse(&projects[index]))
	}

	shared.RespondSuccess(c, http.StatusOK, ProjectListResponse{Items: items})
	return nil
}

// getProjectByID godoc
// @Summary Get project details
// @Tags Projects
// @Produce json
// @Param id path string true "Project UUID"
// @Success 200 {object} shared.SuccessResponse{data=ProjectResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /projects/{id} [get]
func (h *Handler) getProjectByID(c *gin.Context) error {
	var params ProjectURIParams
	if err := shared.BindURI(c, &params); err != nil {
		return err
	}

	id, err := shared.ParseUUID(params.ID, "id")
	if err != nil {
		return err
	}

	project, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToProjectResponse(project))
	return nil
}

// createProject godoc
// @Summary Create a project
// @Tags Projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body CreateProjectRequest true "Project payload"
// @Success 201 {object} shared.SuccessResponse{data=ProjectResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 500 {object} shared.ErrorResponse
// @Router /projects [post]
func (h *Handler) createProject(c *gin.Context) error {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return shared.NewAppError(http.StatusUnauthorized, "Authentication required")
	}

	var request CreateProjectRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	project, err := h.service.Create(c.Request.Context(), authUser.UserID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusCreated, ToProjectResponse(project))
	return nil
}

// updateProject godoc
// @Summary Update a project
// @Tags Projects
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Project UUID"
// @Param payload body UpdateProjectRequest true "Project update payload"
// @Success 200 {object} shared.SuccessResponse{data=ProjectResponse}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 403 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /projects/{id} [put]
func (h *Handler) updateProject(c *gin.Context) error {
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

	var request UpdateProjectRequest
	if err := shared.BindJSON(c, &request); err != nil {
		return err
	}

	project, err := h.service.Update(c.Request.Context(), authUser.UserID, projectID, request)
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ToProjectResponse(project))
	return nil
}

// deleteProject godoc
// @Summary Delete a project
// @Tags Projects
// @Security BearerAuth
// @Param id path string true "Project UUID"
// @Success 200 {object} shared.SuccessResponse{data=map[string]string}
// @Failure 400 {object} shared.ErrorResponse
// @Failure 401 {object} shared.ErrorResponse
// @Failure 403 {object} shared.ErrorResponse
// @Failure 404 {object} shared.ErrorResponse
// @Router /projects/{id} [delete]
func (h *Handler) deleteProject(c *gin.Context) error {
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

	if err := h.service.Delete(c.Request.Context(), authUser.UserID, projectID); err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, gin.H{"message": "Project deleted successfully"})
	return nil
}
