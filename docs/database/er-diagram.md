# ER-диаграмма EduMatch

## Mermaid ER

```mermaid
erDiagram
  USERS {
    uuid id PK
    string email UK
    string password_hash
    string full_name
    string university
    int course
    text bio
    string avatar_url
    numeric rating
    timestamptz created_at
  }

  REFRESH_TOKENS {
    uuid id PK
    uuid user_id FK
    string token_hash
    timestamptz expires_at
    timestamptz revoked_at
  }

  SKILLS {
    uuid id PK
    string name UK
  }

  USER_SKILLS {
    uuid user_id FK
    uuid skill_id FK
  }

  PROJECTS {
    uuid id PK
    uuid owner_id FK
    string title
    text description
    date deadline
    string status
    timestamptz created_at
  }

  PROJECT_REQUIRED_SKILLS {
    uuid project_id FK
    uuid skill_id FK
  }

  PROJECT_MEMBERS {
    uuid project_id FK
    uuid user_id FK
    string role
    timestamptz joined_at
  }

  JOIN_REQUESTS {
    uuid id PK
    uuid project_id FK
    uuid user_id FK
    string message
    string status
    timestamptz created_at
    timestamptz decided_at
  }

  MESSAGES {
    uuid id PK
    uuid project_id FK
    uuid sender_id FK
    text body
    timestamptz created_at
  }

  USERS ||--o{ REFRESH_TOKENS : owns
  USERS ||--o{ USER_SKILLS : has
  SKILLS ||--o{ USER_SKILLS : selected
  USERS ||--o{ PROJECTS : creates
  PROJECTS ||--o{ PROJECT_REQUIRED_SKILLS : requires
  SKILLS ||--o{ PROJECT_REQUIRED_SKILLS : listed
  PROJECTS ||--o{ PROJECT_MEMBERS : includes
  USERS ||--o{ PROJECT_MEMBERS : joins
  PROJECTS ||--o{ JOIN_REQUESTS : receives
  USERS ||--o{ JOIN_REQUESTS : sends
  PROJECTS ||--o{ MESSAGES : contains
  USERS ||--o{ MESSAGES : writes
```

## Обоснование модели

- `users` хранит данные профиля и поля для поиска тиммейтов.
- `skills` вынесены в отдельную таблицу, чтобы фильтровать проекты и пользователей по единому справочнику.
- `join_requests` отделены от `project_members`, потому что заявка может быть отклонена или ожидать решения.
- `refresh_tokens` нужны для JWT + Refresh Token архитектуры.
- `messages` привязаны к проекту и отправителю, что подходит для WebSocket-чата внутри проекта.
