package shared

import (
	"strings"

	"github.com/google/uuid"
)

func ParseUUID(value, field string) (uuid.UUID, error) {
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, ValidationError("Validation failed", ErrorDetail{Field: field, Message: field + " must be a valid UUID"})
	}

	return id, nil
}

func ParseUUIDCSV(value, field string) ([]uuid.UUID, error) {
	if strings.TrimSpace(value) == "" {
		return nil, nil
	}

	parts := strings.Split(value, ",")
	ids := make([]uuid.UUID, 0, len(parts))
	for _, part := range parts {
		id, err := ParseUUID(strings.TrimSpace(part), field)
		if err != nil {
			return nil, err
		}

		ids = append(ids, id)
	}

	return ids, nil
}
