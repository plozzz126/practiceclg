ALTER TABLE users
  ADD COLUMN allow_project_invites boolean NOT NULL DEFAULT true;

CREATE TABLE project_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text,
  status request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (project_id, recipient_id),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_project_invitations_project_status ON project_invitations (project_id, status, created_at DESC);
CREATE INDEX idx_project_invitations_recipient_status ON project_invitations (recipient_id, status, created_at DESC);
