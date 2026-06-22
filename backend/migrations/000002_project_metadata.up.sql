ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS direction varchar(40) NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS team_size integer NOT NULL DEFAULT 4 CHECK (team_size BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS required_roles text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_projects_direction ON projects (direction);

INSERT INTO skills (name) VALUES
  ('JavaScript'),
  ('Next.js'),
  ('Vue'),
  ('Angular'),
  ('NestJS'),
  ('Django'),
  ('FastAPI'),
  ('Spring Boot'),
  ('C#'),
  ('ASP.NET'),
  ('Rust'),
  ('MySQL'),
  ('MongoDB'),
  ('Docker'),
  ('Kubernetes'),
  ('AWS'),
  ('Git'),
  ('GitHub Actions'),
  ('Tailwind CSS'),
  ('React Native'),
  ('Flutter'),
  ('Swift'),
  ('Kotlin'),
  ('TensorFlow'),
  ('PyTorch'),
  ('Data Science'),
  ('Cybersecurity'),
  ('Linux'),
  ('SIEM'),
  ('Burp Suite'),
  ('CTF'),
  ('Blockchain'),
  ('Solidity')
ON CONFLICT (name) DO NOTHING;
