package project

import (
	"context"
	"fmt"
	"strings"

	"github.com/devlink/backend/internal/user"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type SaveInvitationParams struct {
	ProjectID   uuid.UUID
	SenderID    uuid.UUID
	RecipientID uuid.UUID
	Message     *string
}

func (r *repository) ListInviteCandidates(ctx context.Context, projectID, actorID uuid.UUID, filters InviteCandidateFilters) ([]user.User, error) {
	query := `
		SELECT DISTINCT u.id, u.email, u.full_name, u.university, u.course, u.bio, u.avatar_url, u.allow_project_invites, u.rating, u.created_at, u.updated_at
		FROM users u
	`

	args := []any{projectID, actorID}
	where := []string{
		"u.allow_project_invites = true",
		"u.id <> $2",
		`NOT EXISTS (
			SELECT 1
			FROM project_members pm
			WHERE pm.project_id = $1 AND pm.user_id = u.id
		)`,
		`NOT EXISTS (
			SELECT 1
			FROM project_invitations pi
			WHERE pi.project_id = $1 AND pi.recipient_id = u.id AND pi.status = 'pending'
		)`,
	}

	if len(filters.SkillIDs) > 0 {
		query += ` INNER JOIN user_skills us ON us.user_id = u.id `
		skillIDs := make([]string, 0, len(filters.SkillIDs))
		for _, id := range filters.SkillIDs {
			skillIDs = append(skillIDs, id.String())
		}
		args = append(args, skillIDs)
		where = append(where, fmt.Sprintf("us.skill_id = ANY($%d::uuid[])", len(args)))
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

	query += " WHERE " + strings.Join(where, " AND ")
	query += " ORDER BY u.rating DESC, u.created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]user.User, 0)
	userIDs := make([]uuid.UUID, 0)
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
			&item.AllowProjectInvites,
			&item.Rating,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
		userIDs = append(userIDs, item.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	skillsMap, err := loadOwnerSkills(ctx, r.db, userIDs)
	if err != nil {
		return nil, err
	}

	for index := range items {
		items[index].Skills = skillsMap[items[index].ID]
	}

	return items, nil
}

func (r *repository) GetInvitableUser(ctx context.Context, projectID, userID uuid.UUID) (*user.User, error) {
	row := r.db.QueryRow(ctx, `
		SELECT u.id, u.email, u.full_name, u.university, u.course, u.bio, u.avatar_url, u.allow_project_invites, u.rating, u.created_at, u.updated_at
		FROM users u
		WHERE u.id = $2
		  AND u.allow_project_invites = true
		  AND NOT EXISTS (
			SELECT 1
			FROM project_members pm
			WHERE pm.project_id = $1 AND pm.user_id = u.id
		  )
	`, projectID, userID)

	var item user.User
	if err := row.Scan(
		&item.ID,
		&item.Email,
		&item.FullName,
		&item.University,
		&item.Course,
		&item.Bio,
		&item.AvatarURL,
		&item.AllowProjectInvites,
		&item.Rating,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		return nil, err
	}

	skillsMap, err := loadOwnerSkills(ctx, r.db, []uuid.UUID{item.ID})
	if err != nil {
		return nil, err
	}

	item.Skills = skillsMap[item.ID]
	return &item, nil
}

func (r *repository) GetInvitationByID(ctx context.Context, invitationID uuid.UUID) (*Invitation, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
		FROM project_invitations
		WHERE id = $1
	`, invitationID)

	item, err := scanInvitationRow(row)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *repository) GetInvitationByRecipient(ctx context.Context, projectID, recipientID uuid.UUID) (*Invitation, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
		FROM project_invitations
		WHERE project_id = $1 AND recipient_id = $2
	`, projectID, recipientID)

	item, err := scanInvitationRow(row)
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func (r *repository) ListProjectInvitations(ctx context.Context, projectID uuid.UUID) ([]InvitationDetail, error) {
	projectDetail, err := r.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
		FROM project_invitations
		WHERE project_id = $1
		ORDER BY
			CASE status
				WHEN 'pending' THEN 0
				WHEN 'accepted' THEN 1
				ELSE 2
			END,
			created_at DESC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Invitation, 0)
	for rows.Next() {
		item, err := scanInvitation(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return hydrateInvitations(ctx, r.db, items, &projectDetail.Project)
}

func (r *repository) ListUserInvitations(ctx context.Context, recipientID uuid.UUID) ([]InvitationDetail, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
		FROM project_invitations
		WHERE recipient_id = $1
		ORDER BY
			CASE status
				WHEN 'pending' THEN 0
				WHEN 'accepted' THEN 1
				ELSE 2
			END,
			created_at DESC
	`, recipientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Invitation, 0)
	for rows.Next() {
		item, err := scanInvitation(rows)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return hydrateInvitations(ctx, r.db, items, nil)
}

func (r *repository) SaveInvitation(ctx context.Context, params SaveInvitationParams) (*InvitationDetail, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO project_invitations (project_id, sender_id, recipient_id, message, status)
		VALUES ($1, $2, $3, $4, 'pending')
		ON CONFLICT (project_id, recipient_id)
		DO UPDATE
		SET sender_id = EXCLUDED.sender_id,
			message = EXCLUDED.message,
			status = 'pending',
			created_at = now(),
			decided_at = NULL
		RETURNING id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
	`, params.ProjectID, params.SenderID, params.RecipientID, params.Message)

	item, err := scanInvitationRow(row)
	if err != nil {
		return nil, err
	}

	items, err := hydrateInvitations(ctx, r.db, []Invitation{item}, nil)
	if err != nil {
		return nil, err
	}

	return &items[0], nil
}

func (r *repository) ReviewInvitation(ctx context.Context, invitationID uuid.UUID, decision string) (*InvitationDetail, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	row := tx.QueryRow(ctx, `
		UPDATE project_invitations
		SET status = $2, decided_at = now()
		WHERE id = $1
		RETURNING id, project_id, sender_id, recipient_id, message, status, created_at, decided_at
	`, invitationID, decision)

	item, err := scanInvitationRow(row)
	if err != nil {
		return nil, err
	}

	if decision == RequestAccepted {
		if _, err := tx.Exec(ctx, `
			INSERT INTO project_members (project_id, user_id, role)
			VALUES ($1, $2, 'member')
			ON CONFLICT (project_id, user_id) DO NOTHING
		`, item.ProjectID, item.RecipientID); err != nil {
			return nil, err
		}
	}

	items, err := hydrateInvitations(ctx, tx, []Invitation{item}, nil)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &items[0], nil
}

func hydrateInvitations(ctx context.Context, q dbQuerier, invitations []Invitation, fixedProject *Project) ([]InvitationDetail, error) {
	if len(invitations) == 0 {
		return []InvitationDetail{}, nil
	}

	userIDs := make([]uuid.UUID, 0, len(invitations)*2)
	projectIDs := make([]uuid.UUID, 0, len(invitations))
	projectMap := make(map[uuid.UUID]Project, len(invitations))

	if fixedProject != nil {
		projectMap[fixedProject.ID] = *fixedProject
		projectIDs = append(projectIDs, fixedProject.ID)
	}

	for _, invitation := range invitations {
		userIDs = append(userIDs, invitation.SenderID, invitation.RecipientID)
		if fixedProject == nil {
			projectIDs = append(projectIDs, invitation.ProjectID)
		}
	}

	usersMap, err := loadOwners(ctx, q, userIDs)
	if err != nil {
		return nil, err
	}

	participantsMap, err := loadParticipantCounts(ctx, q, projectIDs)
	if err != nil {
		return nil, err
	}

	if fixedProject == nil {
		projectMap, err = loadProjectsByIDs(ctx, q, projectIDs)
		if err != nil {
			return nil, err
		}
	}

	items := make([]InvitationDetail, 0, len(invitations))
	for _, invitation := range invitations {
		items = append(items, InvitationDetail{
			Invitation:        invitation,
			Project:           projectMap[invitation.ProjectID],
			ParticipantsCount: participantsMap[invitation.ProjectID],
			Sender:            usersMap[invitation.SenderID],
			Recipient:         usersMap[invitation.RecipientID],
		})
	}

	return items, nil
}

func loadProjectsByIDs(ctx context.Context, q dbQuerier, projectIDs []uuid.UUID) (map[uuid.UUID]Project, error) {
	result := make(map[uuid.UUID]Project, len(projectIDs))
	if len(projectIDs) == 0 {
		return result, nil
	}

	stringIDs := make([]string, 0, len(projectIDs))
	for _, id := range projectIDs {
		stringIDs = append(stringIDs, id.String())
	}

	rows, err := q.Query(ctx, `
		SELECT id, owner_id, title, description, deadline, status, direction, team_size, required_roles, created_at, updated_at
		FROM projects
		WHERE id = ANY($1::uuid[])
	`, stringIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item, err := scanProject(rows)
		if err != nil {
			return nil, err
		}

		result[item.ID] = item
	}

	return result, rows.Err()
}

func scanInvitation(rows pgx.Rows) (Invitation, error) {
	var item Invitation
	err := rows.Scan(
		&item.ID,
		&item.ProjectID,
		&item.SenderID,
		&item.RecipientID,
		&item.Message,
		&item.Status,
		&item.CreatedAt,
		&item.DecidedAt,
	)
	return item, err
}

func scanInvitationRow(row pgx.Row) (Invitation, error) {
	var item Invitation
	err := row.Scan(
		&item.ID,
		&item.ProjectID,
		&item.SenderID,
		&item.RecipientID,
		&item.Message,
		&item.Status,
		&item.CreatedAt,
		&item.DecidedAt,
	)
	return item, err
}
