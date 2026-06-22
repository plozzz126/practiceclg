DROP INDEX IF EXISTS idx_projects_direction;

ALTER TABLE projects
  DROP COLUMN IF EXISTS required_roles,
  DROP COLUMN IF EXISTS team_size,
  DROP COLUMN IF EXISTS direction;
