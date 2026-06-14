package project

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/edumatch/backend/internal/skill"
	"github.com/edumatch/backend/internal/user"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, params CreateParams) (*Detail, error)
	List(ctx context.Context, filters Filters) ([]Detail, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Detail, error)
	Update(ctx context.Context, id uuid.UUID, params UpdateParams) (*Detail, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type CreateParams struct {
	OwnerID          uuid.UUID
	Title            string
	Description      string
	Deadline         *time.Time
	Status           string
	RequiredSkillIDs []string
}

type UpdateParams struct {
	Title            *string
	Description      *string
	Deadline         *time.Time
	ClearDeadline    bool
	Status           *string
	RequiredSkillIDs []string
	ReplaceSkills    bool
}

type repository struct {
	db *pgxpool.Pool
}

type dbQuerier interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) Create(ctx context.Context, params CreateParams) (*Detail, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var projectID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO projects (owner_id, title, description, deadline, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, params.OwnerID, params.Title, params.Description, params.Deadline, params.Status).Scan(&projectID)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO project_members (project_id, user_id, role)
		VALUES ($1, $2, 'owner')
	`, projectID, params.OwnerID); err != nil {
		return nil, err
	}

	if err := syncRequiredSkills(ctx, tx, projectID, params.RequiredSkillIDs); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, projectID)
}

func (r *repository) List(ctx context.Context, filters Filters) ([]Detail, error) {
	query := `
		SELECT DISTINCT p.id, p.owner_id, p.title, p.description, p.deadline, p.status, p.created_at, p.updated_at
		FROM projects p
	`

	args := make([]any, 0, 4)
	where := make([]string, 0, 4)

	if len(filters.SkillIDs) > 0 {
		query += ` INNER JOIN project_required_skills prs ON prs.project_id = p.id `
		skillIDs := make([]string, 0, len(filters.SkillIDs))
		for _, id := range filters.SkillIDs {
			skillIDs = append(skillIDs, id.String())
		}
		args = append(args, skillIDs)
		where = append(where, fmt.Sprintf("prs.skill_id = ANY($%d::uuid[])", len(args)))
	}

	if filters.Query != "" {
		args = append(args, "%"+filters.Query+"%")
		where = append(where, fmt.Sprintf("p.title ILIKE $%d", len(args)))
	}

	if filters.Status != "" {
		args = append(args, filters.Status)
		where = append(where, fmt.Sprintf("p.status = $%d", len(args)))
	}

	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}

	sortOrder := "DESC"
	if strings.EqualFold(filters.Sort, "asc") {
		sortOrder = "ASC"
	}
	query += " ORDER BY p.created_at " + sortOrder

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	projects := make([]Project, 0)
	projectIDs := make([]uuid.UUID, 0)
	ownerIDs := make([]uuid.UUID, 0)

	for rows.Next() {
		item, err := scanProject(rows)
		if err != nil {
			return nil, err
		}

		projects = append(projects, item)
		projectIDs = append(projectIDs, item.ID)
		ownerIDs = append(ownerIDs, item.OwnerID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	ownersMap, err := loadOwners(ctx, r.db, ownerIDs)
	if err != nil {
		return nil, err
	}

	skillsMap, err := loadRequiredSkills(ctx, r.db, projectIDs)
	if err != nil {
		return nil, err
	}

	participantsMap, err := loadParticipantCounts(ctx, r.db, projectIDs)
	if err != nil {
		return nil, err
	}

	details := make([]Detail, 0, len(projects))
	for _, item := range projects {
		details = append(details, Detail{
			Project:           item,
			Owner:             ownersMap[item.OwnerID],
			RequiredSkills:    skillsMap[item.ID],
			ParticipantsCount: participantsMap[item.ID],
		})
	}

	return details, nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*Detail, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, owner_id, title, description, deadline, status, created_at, updated_at
		FROM projects
		WHERE id = $1
	`, id)

	project, err := scanProjectRow(row)
	if err != nil {
		return nil, err
	}

	ownersMap, err := loadOwners(ctx, r.db, []uuid.UUID{project.OwnerID})
	if err != nil {
		return nil, err
	}

	skillsMap, err := loadRequiredSkills(ctx, r.db, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}

	participantsMap, err := loadParticipantCounts(ctx, r.db, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}

	return &Detail{
		Project:           project,
		Owner:             ownersMap[project.OwnerID],
		RequiredSkills:    skillsMap[id],
		ParticipantsCount: participantsMap[id],
	}, nil
}

func (r *repository) Update(ctx context.Context, id uuid.UUID, params UpdateParams) (*Detail, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	setClauses := make([]string, 0, 5)
	args := make([]any, 0, 6)

	if params.Title != nil {
		args = append(args, *params.Title)
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", len(args)))
	}

	if params.Description != nil {
		args = append(args, *params.Description)
		setClauses = append(setClauses, fmt.Sprintf("description = $%d", len(args)))
	}

	if params.Deadline != nil || params.ClearDeadline {
		if params.ClearDeadline {
			args = append(args, nil)
		} else {
			args = append(args, params.Deadline)
		}
		setClauses = append(setClauses, fmt.Sprintf("deadline = $%d", len(args)))
	}

	if params.Status != nil {
		args = append(args, *params.Status)
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", len(args)))
	}

	if len(setClauses) > 0 {
		args = append(args, id)
		query := fmt.Sprintf(`
			UPDATE projects
			SET %s, updated_at = now()
			WHERE id = $%d
		`, strings.Join(setClauses, ", "), len(args))

		commandTag, err := tx.Exec(ctx, query, args...)
		if err != nil {
			return nil, err
		}

		if commandTag.RowsAffected() == 0 {
			return nil, pgx.ErrNoRows
		}
	}

	if params.ReplaceSkills {
		if err := syncRequiredSkills(ctx, tx, id, params.RequiredSkillIDs); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func syncRequiredSkills(ctx context.Context, q dbQuerier, projectID uuid.UUID, skillIDs []string) error {
	if _, err := q.Exec(ctx, `DELETE FROM project_required_skills WHERE project_id = $1`, projectID); err != nil {
		return err
	}

	for _, skillID := range skillIDs {
		if _, err := q.Exec(ctx, `
			INSERT INTO project_required_skills (project_id, skill_id)
			VALUES ($1, $2::uuid)
		`, projectID, skillID); err != nil {
			return err
		}
	}

	return nil
}

func loadRequiredSkills(ctx context.Context, q dbQuerier, projectIDs []uuid.UUID) (map[uuid.UUID][]skill.Skill, error) {
	result := make(map[uuid.UUID][]skill.Skill, len(projectIDs))
	if len(projectIDs) == 0 {
		return result, nil
	}

	stringIDs := make([]string, 0, len(projectIDs))
	for _, id := range projectIDs {
		stringIDs = append(stringIDs, id.String())
		result[id] = []skill.Skill{}
	}

	rows, err := q.Query(ctx, `
		SELECT prs.project_id, s.id, s.name
		FROM project_required_skills prs
		INNER JOIN skills s ON s.id = prs.skill_id
		WHERE prs.project_id = ANY($1::uuid[])
		ORDER BY s.name ASC
	`, stringIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var projectID uuid.UUID
		var item skill.Skill
		if err := rows.Scan(&projectID, &item.ID, &item.Name); err != nil {
			return nil, err
		}

		result[projectID] = append(result[projectID], item)
	}

	return result, rows.Err()
}

func loadParticipantCounts(ctx context.Context, q dbQuerier, projectIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	result := make(map[uuid.UUID]int, len(projectIDs))
	if len(projectIDs) == 0 {
		return result, nil
	}

	stringIDs := make([]string, 0, len(projectIDs))
	for _, id := range projectIDs {
		stringIDs = append(stringIDs, id.String())
		result[id] = 0
	}

	rows, err := q.Query(ctx, `
		SELECT project_id, COUNT(*)
		FROM project_members
		WHERE project_id = ANY($1::uuid[])
		GROUP BY project_id
	`, stringIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var projectID uuid.UUID
		var count int
		if err := rows.Scan(&projectID, &count); err != nil {
			return nil, err
		}

		result[projectID] = count
	}

	return result, rows.Err()
}

func loadOwners(ctx context.Context, q dbQuerier, userIDs []uuid.UUID) (map[uuid.UUID]user.User, error) {
	result := make(map[uuid.UUID]user.User, len(userIDs))
	if len(userIDs) == 0 {
		return result, nil
	}

	stringIDs := make([]string, 0, len(userIDs))
	for _, id := range userIDs {
		stringIDs = append(stringIDs, id.String())
	}

	rows, err := q.Query(ctx, `
		SELECT id, email, full_name, university, course, bio, avatar_url, rating, created_at, updated_at
		FROM users
		WHERE id = ANY($1::uuid[])
	`, stringIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ownerIDs := make([]uuid.UUID, 0)
	for rows.Next() {
		var item user.User
		if err := rows.Scan(
			&item.ID,
			&item.Email,
			&item.FullName,
			&item.University,
			&item.Course,
			&item.Bio,
			&item.AvatarURL,
			&item.Rating,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}

		result[item.ID] = item
		ownerIDs = append(ownerIDs, item.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	skillsMap, err := loadOwnerSkills(ctx, q, ownerIDs)
	if err != nil {
		return nil, err
	}

	for id, owner := range result {
		owner.Skills = skillsMap[id]
		result[id] = owner
	}

	return result, nil
}

func loadOwnerSkills(ctx context.Context, q dbQuerier, userIDs []uuid.UUID) (map[uuid.UUID][]skill.Skill, error) {
	result := make(map[uuid.UUID][]skill.Skill, len(userIDs))
	if len(userIDs) == 0 {
		return result, nil
	}

	stringIDs := make([]string, 0, len(userIDs))
	for _, id := range userIDs {
		stringIDs = append(stringIDs, id.String())
		result[id] = []skill.Skill{}
	}

	rows, err := q.Query(ctx, `
		SELECT us.user_id, s.id, s.name
		FROM user_skills us
		INNER JOIN skills s ON s.id = us.skill_id
		WHERE us.user_id = ANY($1::uuid[])
		ORDER BY s.name ASC
	`, stringIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var ownerID uuid.UUID
		var item skill.Skill
		if err := rows.Scan(&ownerID, &item.ID, &item.Name); err != nil {
			return nil, err
		}

		result[ownerID] = append(result[ownerID], item)
	}

	return result, rows.Err()
}

func scanProject(rows pgx.Rows) (Project, error) {
	var project Project
	err := rows.Scan(
		&project.ID,
		&project.OwnerID,
		&project.Title,
		&project.Description,
		&project.Deadline,
		&project.Status,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	return project, err
}

func scanProjectRow(row pgx.Row) (Project, error) {
	var project Project
	err := row.Scan(
		&project.ID,
		&project.OwnerID,
		&project.Title,
		&project.Description,
		&project.Deadline,
		&project.Status,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	return project, err
}
