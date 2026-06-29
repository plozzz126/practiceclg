package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
)

func runMigrations(ctx context.Context, db *pgxpool.Pool, databaseURL string, logger *slog.Logger) error {
	path, err := resolveMigrationsPath()
	if err != nil {
		return err
	}

	instance, err := migrate.New("file://"+filepath.ToSlash(path), databaseURL)
	if err != nil {
		return fmt.Errorf("init migrations: %w", err)
	}

	existingVersion, err := detectExistingSchemaVersion(ctx, db)
	if err != nil {
		closeMigrate(instance, logger)
		return err
	}

	version, dirty, err := instance.Version()
	switch {
	case errors.Is(err, migrate.ErrNilVersion):
		if existingVersion > 0 {
			if err := instance.Force(existingVersion); err != nil {
				closeMigrate(instance, logger)
				return fmt.Errorf("baseline migrations at version %d: %w", existingVersion, err)
			}
			logger.Info("migration state baselined from existing schema", "version", existingVersion)
		}
	case err != nil:
		closeMigrate(instance, logger)
		return fmt.Errorf("read migration state: %w", err)
	case dirty:
		if existingVersion == 0 {
			closeMigrate(instance, logger)
			return fmt.Errorf("repair dirty migration state at version %d: existing schema version could not be detected", version)
		}

		forceVersion := existingVersion
		if int(version) > forceVersion {
			forceVersion = int(version)
		}

		if err := instance.Force(forceVersion); err != nil {
			closeMigrate(instance, logger)
			return fmt.Errorf("repair dirty migration state at version %d: %w", forceVersion, err)
		}
		logger.Warn("dirty migration state repaired from detected schema", "version", forceVersion)
	}

	err = instance.Up()
	closeMigrate(instance, logger)

	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("apply migrations: %w", err)
	}

	if errors.Is(err, migrate.ErrNoChange) {
		logger.Info("database migrations already up to date", "path", path)
		return nil
	}

	logger.Info("database migrations applied", "path", path)
	return nil
}

func detectExistingSchemaVersion(ctx context.Context, db *pgxpool.Pool) (int, error) {
	usersExists, err := tableExists(ctx, db, "users")
	if err != nil {
		return 0, fmt.Errorf("check users table: %w", err)
	}
	projectsExists, err := tableExists(ctx, db, "projects")
	if err != nil {
		return 0, fmt.Errorf("check projects table: %w", err)
	}
	if !usersExists || !projectsExists {
		return 0, nil
	}

	version := 1

	projectTasksExists, err := tableExists(ctx, db, "project_tasks")
	if err != nil {
		return 0, fmt.Errorf("check project_tasks table: %w", err)
	}
	if projectTasksExists {
		version = 3
	}

	projectDocumentsExists, err := tableExists(ctx, db, "project_documents")
	if err != nil {
		return 0, fmt.Errorf("check project_documents table: %w", err)
	}
	notificationsExists, err := tableExists(ctx, db, "notifications")
	if err != nil {
		return 0, fmt.Errorf("check notifications table: %w", err)
	}
	if projectDocumentsExists && notificationsExists {
		version = 4
	}

	projectInvitationsExists, err := tableExists(ctx, db, "project_invitations")
	if err != nil {
		return 0, fmt.Errorf("check project_invitations table: %w", err)
	}
	allowInvitesColumnExists, err := columnExists(ctx, db, "users", "allow_project_invites")
	if err != nil {
		return 0, fmt.Errorf("check allow_project_invites column: %w", err)
	}
	if projectInvitationsExists && allowInvitesColumnExists {
		version = 5
	}

	return version, nil
}

func tableExists(ctx context.Context, db *pgxpool.Pool, tableName string) (bool, error) {
	var exists bool
	err := db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = $1
		)
	`, tableName).Scan(&exists)
	return exists, err
}

func columnExists(ctx context.Context, db *pgxpool.Pool, tableName, columnName string) (bool, error) {
	var exists bool
	err := db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
		)
	`, tableName, columnName).Scan(&exists)
	return exists, err
}

func closeMigrate(instance *migrate.Migrate, logger *slog.Logger) {
	sourceErr, closeErr := instance.Close()
	if sourceErr != nil {
		logger.Warn("migration source close warning", "error", sourceErr.Error())
	}
	if closeErr != nil {
		logger.Warn("migration database close warning", "error", closeErr.Error())
	}
}

func resolveMigrationsPath() (string, error) {
	candidates := []string{
		"migrations",
		filepath.Join("backend", "migrations"),
	}

	for _, candidate := range candidates {
		absolute, err := filepath.Abs(candidate)
		if err != nil {
			continue
		}

		stat, err := os.Stat(absolute)
		if err == nil && stat.IsDir() {
			return absolute, nil
		}
	}

	return "", errors.New("migrations directory not found")
}
