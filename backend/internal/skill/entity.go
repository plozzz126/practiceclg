package skill

import "github.com/google/uuid"

type Skill struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}
