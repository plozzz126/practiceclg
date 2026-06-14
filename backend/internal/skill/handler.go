package skill

import (
	"log/slog"
	"net/http"

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

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	router.GET("/skills", shared.Wrap(h.logger, h.listSkills))
}

// listSkills godoc
// @Summary Get all skills
// @Description Returns the full reference list of skills. The response is served from Redis cache when available.
// @Tags Skills
// @Produce json
// @Success 200 {object} shared.SuccessResponse{data=ListSkillsResponse}
// @Failure 500 {object} shared.ErrorResponse
// @Router /skills [get]
func (h *Handler) listSkills(c *gin.Context) error {
	items, err := h.service.List(c.Request.Context())
	if err != nil {
		return err
	}

	shared.RespondSuccess(c, http.StatusOK, ListSkillsResponse{Items: items})
	return nil
}
