DROP TABLE IF EXISTS project_invitations;

ALTER TABLE users
  DROP COLUMN IF EXISTS allow_project_invites;
