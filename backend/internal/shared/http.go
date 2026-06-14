package shared

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type SuccessResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

type ErrorResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Errors  []ErrorDetail `json:"errors,omitempty"`
}

type HandlerFunc func(*gin.Context) error

func Wrap(logger *slog.Logger, fn HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := fn(c); err != nil {
			HandleError(c, logger, err)
		}
	}
}

func RespondSuccess(c *gin.Context, status int, data any) {
	c.JSON(status, SuccessResponse{
		Success: true,
		Data:    data,
	})
}

func HandleError(c *gin.Context, logger *slog.Logger, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		if appErr.Status >= http.StatusInternalServerError {
			logger.Error("request failed", "error", appErr.Error(), "path", c.FullPath(), "method", c.Request.Method)
		}

		c.JSON(appErr.Status, ErrorResponse{
			Success: false,
			Message: appErr.Message,
			Errors:  appErr.Errors,
		})
		return
	}

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Success: false,
			Message: "Resource not found",
		})
		return
	}

	logger.Error("unexpected request error", "error", err.Error(), "path", c.FullPath(), "method", c.Request.Method)
	c.JSON(http.StatusInternalServerError, ErrorResponse{
		Success: false,
		Message: "Internal server error",
	})
}
