package auth

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository interface {
	CreateRefreshToken(ctx context.Context, record RefreshTokenRecord) error
	GetRefreshTokenByID(ctx context.Context, id uuid.UUID) (*RefreshTokenRecord, error)
	RevokeRefreshToken(ctx context.Context, id uuid.UUID) error
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &repository{db: db}
}

func (r *repository) CreateRefreshToken(ctx context.Context, record RefreshTokenRecord) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, record.ID, record.UserID, record.TokenHash, record.ExpiresAt)
	return err
}

func (r *repository) GetRefreshTokenByID(ctx context.Context, id uuid.UUID) (*RefreshTokenRecord, error) {
	var record RefreshTokenRecord
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE id = $1
	`, id).Scan(&record.ID, &record.UserID, &record.TokenHash, &record.ExpiresAt, &record.RevokedAt, &record.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

func (r *repository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	commandTag, err := r.db.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = COALESCE(revoked_at, now())
		WHERE id = $1
	`, id)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	return nil
}
