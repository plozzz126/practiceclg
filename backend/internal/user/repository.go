package user

import (
	"context"
	"fmt"
	"strings"

	"github.com/edumatch/backend/internal/skill"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	Create(ctx context.Context, params CreateParams) (*User, error)
	FindCredentialsByEmail(ctx context.Context, email string) (*Credentials, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	List(ctx context.Context, filters Filters) ([]User, error)
	UpdateProfile(ctx context.Context, id uuid.UUID, params UpdateProfileParams) (*User, error)
	ReplaceSkills(ctx context.Context, id uuid.UUID, skillIDs []string) (*User, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type CreateParams struct {
	Email        string
	PasswordHash string
	FullName     string
	University   *string
	Course       *int
	Bio          *string
	AvatarURL    *string
	SkillIDs     []string
}

type UpdateProfileParams struct {
	FullName   *string
	University *string
	Course     *int
	Bio        *string
	AvatarURL  *string
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

func (r *repository) Create(ctx context.Context, params CreateParams) (*User, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var id uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO users (email, password_hash, full_name, university, course, bio, avatar_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, params.Email, params.PasswordHash, params.FullName, params.University, params.Course, params.Bio, params.AvatarURL).Scan(&id)
	if err != nil {
		return nil, err
	}

	if err := syncUserSkills(ctx, tx, id, params.SkillIDs); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *repository) FindCredentialsByEmail(ctx context.Context, email string) (*Credentials, error) {
	var credentials Credentials
	err := r.db.QueryRow(ctx, `
		SELECT id, email, password_hash
		FROM users
		WHERE email = $1
	`, strings.ToLower(email)).Scan(&credentials.ID, &credentials.Email, &credentials.PasswordHash)
	if err != nil {
		return nil, err
	}

	return &credentials, nil
}

func (r *repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	user, err := getUserByID(ctx, r.db, id)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *repository) List(ctx context.Context, filters Filters) ([]User, error) {
	query := `
		SELECT DISTINCT u.id, u.email, u.full_name, u.university, u.course, u.bio, u.avatar_url, u.rating, u.created_at, u.updated_at
		FROM users u
	`

	args := make([]any, 0, 5)
	where := make([]string, 0, 5)

	if filters.SkillID != nil {
		query += ` INNER JOIN user_skills us ON us.user_id = u.id `
		args = append(args, filters.SkillID.String())
		where = append(where, fmt.Sprintf("us.skill_id = $%d::uuid", len(args)))
	}

	if filters.Query != "" {
		args = append(args, "%"+filters.Query+"%")
		where = append(where, fmt.Sprintf("u.full_name ILIKE $%d", len(args)))
	}

	if filters.University != "" {
		args = append(args, "%"+filters.University+"%")
		where = append(where, fmt.Sprintf("u.university ILIKE $%d", len(args)))
	}

	if filters.Course != nil {
		args = append(args, *filters.Course)
		where = append(where, fmt.Sprintf("u.course = $%d", len(args)))
	}

	if filters.Rating != nil {
		args = append(args, *filters.Rating)
		where = append(where, fmt.Sprintf("u.rating >= $%d", len(args)))
	}

	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}

	query += " ORDER BY u.rating DESC, u.created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]User, 0)
	ids := make([]uuid.UUID, 0)
	for rows.Next() {
		item, err := scanUser(rows)
		if err != nil {
			return nil, err
		}

		users = append(users, item)
		ids = append(ids, item.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	skillsMap, err := loadUserSkills(ctx, r.db, ids)
	if err != nil {
		return nil, err
	}

	for index := range users {
		users[index].Skills = skillsMap[users[index].ID]
	}

	return users, nil
}

func (r *repository) UpdateProfile(ctx context.Context, id uuid.UUID, params UpdateProfileParams) (*User, error) {
	setClauses := make([]string, 0, 5)
	args := make([]any, 0, 6)

	if params.FullName != nil {
		args = append(args, *params.FullName)
		setClauses = append(setClauses, fmt.Sprintf("full_name = $%d", len(args)))
	}

	if params.University != nil {
		args = append(args, nullIfBlank(*params.University))
		setClauses = append(setClauses, fmt.Sprintf("university = $%d", len(args)))
	}

	if params.Course != nil {
		args = append(args, *params.Course)
		setClauses = append(setClauses, fmt.Sprintf("course = $%d", len(args)))
	}

	if params.Bio != nil {
		args = append(args, nullIfBlank(*params.Bio))
		setClauses = append(setClauses, fmt.Sprintf("bio = $%d", len(args)))
	}

	if params.AvatarURL != nil {
		args = append(args, nullIfBlank(*params.AvatarURL))
		setClauses = append(setClauses, fmt.Sprintf("avatar_url = $%d", len(args)))
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	args = append(args, id)
	query := fmt.Sprintf(`
		UPDATE users
		SET %s, updated_at = now()
		WHERE id = $%d
	`, strings.Join(setClauses, ", "), len(args))

	commandTag, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, err
	}

	if commandTag.RowsAffected() == 0 {
		return nil, pgx.ErrNoRows
	}

	return r.GetByID(ctx, id)
}

func (r *repository) ReplaceSkills(ctx context.Context, id uuid.UUID, skillIDs []string) (*User, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if err := syncUserSkills(ctx, tx, id, skillIDs); err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE users SET updated_at = now() WHERE id = $1`, id); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *repository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}

func getUserByID(ctx context.Context, q dbQuerier, id uuid.UUID) (*User, error) {
	row := q.QueryRow(ctx, `
		SELECT id, email, full_name, university, course, bio, avatar_url, rating, created_at, updated_at
		FROM users
		WHERE id = $1
	`, id)

	var user User
	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.FullName,
		&user.University,
		&user.Course,
		&user.Bio,
		&user.AvatarURL,
		&user.Rating,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return nil, err
	}

	skillsMap, err := loadUserSkills(ctx, q, []uuid.UUID{id})
	if err != nil {
		return nil, err
	}

	user.Skills = skillsMap[id]
	return &user, nil
}

func loadUserSkills(ctx context.Context, q dbQuerier, userIDs []uuid.UUID) (map[uuid.UUID][]skill.Skill, error) {
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
		var userID uuid.UUID
		var item skill.Skill
		if err := rows.Scan(&userID, &item.ID, &item.Name); err != nil {
			return nil, err
		}

		result[userID] = append(result[userID], item)
	}

	return result, rows.Err()
}

func syncUserSkills(ctx context.Context, q dbQuerier, userID uuid.UUID, skillIDs []string) error {
	if _, err := q.Exec(ctx, `DELETE FROM user_skills WHERE user_id = $1`, userID); err != nil {
		return err
	}

	for _, skillID := range skillIDs {
		if _, err := q.Exec(ctx, `
			INSERT INTO user_skills (user_id, skill_id)
			VALUES ($1, $2::uuid)
		`, userID, skillID); err != nil {
			return err
		}
	}

	return nil
}

func scanUser(rows pgx.Rows) (User, error) {
	var user User
	err := rows.Scan(
		&user.ID,
		&user.Email,
		&user.FullName,
		&user.University,
		&user.Course,
		&user.Bio,
		&user.AvatarURL,
		&user.Rating,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	return user, err
}

func nullIfBlank(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}

	return &trimmed
}
