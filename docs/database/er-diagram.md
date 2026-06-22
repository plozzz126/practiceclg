# DevLink ER Diagram

```mermaid
erDiagram
  users ||--o{ user_skills : has
  skills ||--o{ user_skills : tagged_in
  users ||--o{ projects : owns
  projects ||--o{ project_required_skills : requires
  skills ||--o{ project_required_skills : included_in
  projects ||--o{ project_members : has
  users ||--o{ project_members : joins
  projects ||--o{ join_requests : receives
  users ||--o{ join_requests : sends
  projects ||--o{ messages : contains
  users ||--o{ messages : sends
  users ||--o{ refresh_tokens : owns
```

## Notes

- `projects` now carries `direction`, `team_size`, and `required_roles`.
- `join_requests` is separate from `project_members` so review states can be preserved.
- `messages` is already modeled for future realtime chat.
- `skills` is shared across both users and projects for consistent matching.
