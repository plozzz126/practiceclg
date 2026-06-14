package skill

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	ListAll(ctx context.Context) ([]Skill, error)
	ListByIDs(ctx context.Context, ids []string) ([]Skill, error)
	CountByIDs(ctx context.Context, ids []string) (int, error)
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) ListAll(ctx context.Context) ([]Skill, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name FROM skills ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	skills := make([]Skill, 0)
	for rows.Next() {
		var item Skill
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}

		skills = append(skills, item)
	}

	return skills, rows.Err()
}

func (r *repository) ListByIDs(ctx context.Context, ids []string) ([]Skill, error) {
	if len(ids) == 0 {
		return []Skill{}, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, name FROM skills WHERE id = ANY($1::uuid[]) ORDER BY name ASC`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	skills := make([]Skill, 0, len(ids))
	for rows.Next() {
		var item Skill
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}

		skills = append(skills, item)
	}

	return skills, rows.Err()
}

func (r *repository) CountByIDs(ctx context.Context, ids []string) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	var count int
	if err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM skills WHERE id = ANY($1::uuid[])`, ids).Scan(&count); err != nil {
		return 0, fmt.Errorf("count skills: %w", err)
	}

	return count, nil
}
