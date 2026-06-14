package shared

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type ErrorDetail struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

type AppError struct {
	Status  int
	Message string
	Errors  []ErrorDetail
	Err     error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}

	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewAppError(status int, message string, details ...ErrorDetail) *AppError {
	return &AppError{
		Status:  status,
		Message: message,
		Errors:  details,
	}
}

func WrapInternal(err error, message string) *AppError {
	return &AppError{
		Status:  http.StatusInternalServerError,
		Message: message,
		Err:     err,
	}
}

func ValidationError(message string, details ...ErrorDetail) *AppError {
	return NewAppError(http.StatusBadRequest, message, details...)
}

func ValidationErrors(err error) *AppError {
	validationErrors := validator.ValidationErrors{}
	if !errors.As(err, &validationErrors) {
		return ValidationError("Validation failed", ErrorDetail{Message: err.Error()})
	}

	details := make([]ErrorDetail, 0, len(validationErrors))
	for _, fieldErr := range validationErrors {
		field := jsonFieldName(fieldErr)
		details = append(details, ErrorDetail{
			Field:   field,
			Message: humanizeValidationMessage(fieldErr, field),
		})
	}

	return ValidationError("Validation failed", details...)
}

func humanizeValidationMessage(fieldErr validator.FieldError, field string) string {
	switch fieldErr.Tag() {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters long", field, fieldErr.Param())
	case "max":
		return fmt.Sprintf("%s must be at most %s characters long", field, fieldErr.Param())
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, fieldErr.Param())
	case "url":
		return fmt.Sprintf("%s must be a valid URL", field)
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", field, fieldErr.Param())
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", field, fieldErr.Param())
	case "datetime":
		return fmt.Sprintf("%s must match format %s", field, fieldErr.Param())
	default:
		return fmt.Sprintf("%s is invalid", field)
	}
}

func jsonFieldName(fieldErr validator.FieldError) string {
	field := fieldErr.Field()
	if field == "" {
		return "field"
	}

	return toSnakeCase(field)
}

func toSnakeCase(value string) string {
	var builder strings.Builder
	for index, r := range value {
		if index > 0 && r >= 'A' && r <= 'Z' {
			builder.WriteByte('_')
		}
		builder.WriteRune(r)
	}

	return strings.ToLower(builder.String())
}
