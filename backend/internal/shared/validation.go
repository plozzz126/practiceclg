package shared

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New(validator.WithRequiredStructEnabled())

func BindJSON(c *gin.Context, target any) error {
	if err := c.ShouldBindJSON(target); err != nil {
		return mapBindError(err)
	}

	if err := validate.Struct(target); err != nil {
		return ValidationErrors(err)
	}

	return nil
}

func BindQuery(c *gin.Context, target any) error {
	if err := c.ShouldBindQuery(target); err != nil {
		return mapBindError(err)
	}

	if err := validate.Struct(target); err != nil {
		return ValidationErrors(err)
	}

	return nil
}

func BindURI(c *gin.Context, target any) error {
	if err := c.ShouldBindUri(target); err != nil {
		return mapBindError(err)
	}

	if err := validate.Struct(target); err != nil {
		return ValidationErrors(err)
	}

	return nil
}

func mapBindError(err error) error {
	var syntaxError *json.SyntaxError
	switch {
	case errors.Is(err, io.EOF):
		return ValidationError("Validation failed", ErrorDetail{Field: "body", Message: "request body is required"})
	case errors.As(err, &syntaxError):
		return ValidationError("Validation failed", ErrorDetail{Field: "body", Message: "request body contains malformed JSON"})
	default:
		var appErr *AppError
		if errors.As(err, &appErr) {
			return appErr
		}

		return NewAppError(http.StatusBadRequest, "Validation failed", ErrorDetail{Message: err.Error()})
	}
}
