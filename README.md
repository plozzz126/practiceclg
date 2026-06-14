# EduMatch Backend

Backend второй недели практики для проекта EduMatch. Репозиторий теперь сфокусирован на production-ready API для регистрации пользователей, поиска тиммейтов и управления проектами. Frontend предполагается отдельным приложением на Next.js + TypeScript, которое будет подключаться на третьей неделе.

## Описание проекта

EduMatch помогает студентам:

- находить тиммейтов по навыкам, курсу, университету и рейтингу;
- создавать учебные проекты и искать участников;
- управлять профилем, навыками и сессиями;
- работать через JWT access token + refresh token схему.

Реализованы:

- регистрация, логин, refresh, logout;
- middleware авторизации;
- CRUD профиля пользователя;
- CRUD проектов;
- управление навыками пользователя;
- поиск пользователей и проектов;
- Redis-кэширование и хранение сессий;
- Swagger-документация;
- централизованная обработка ошибок;
- Docker и миграции через `golang-migrate`.

## Стек технологий

- Go 1.25
- Gin
- PostgreSQL 16
- Redis 7
- JWT (`github.com/golang-jwt/jwt/v5`)
- bcrypt
- UUID
- Swagger (`swaggo/gin-swagger`)
- Docker / Docker Compose
- golang-migrate

## Архитектура

Используется Clean Architecture с разделением на `handler -> service -> repository`.

```text
backend/
├── cmd/server
├── configs
├── docker
├── docs
├── internal
│   ├── auth
│   ├── middleware
│   ├── project
│   ├── shared
│   ├── skill
│   └── user
├── migrations
└── pkg
    ├── jwt
    ├── logger
    ├── postgres
    └── redis
```

Ключевые принципы:

- в handlers нет бизнес-логики;
- зависимости собираются через DI в `cmd/server/main.go`;
- ошибки и success-ответы имеют единый формат;
- Redis используется для кэша навыков, сессий refresh token и blacklist access token.

## Установка

### Вариант 1. Быстрый старт через Docker

```bash
cp .env.example .env
docker compose up --build
```

После старта:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger/index.html`
- Healthcheck: `http://localhost:8080/health`

### Вариант 2. Локальный запуск без Docker

1. Поднимите PostgreSQL и Redis локально.
2. Создайте `.env` на основе `.env.example`.
3. Для локального запуска замените в `.env` хосты:

```env
DATABASE_URL=postgres://edumatch:edumatch@localhost:5432/edumatch?sslmode=disable
REDIS_URL=redis://localhost:6379/0
```

4. Выполните:

```bash
cd backend
go mod tidy
go run ./cmd/server
```

## Переменные окружения

Основные переменные:

- `APP_ENV` — окружение (`development`, `production`)
- `PORT` — порт API
- `DATABASE_URL` — строка подключения к PostgreSQL
- `REDIS_URL` — строка подключения к Redis
- `JWT_ACCESS_SECRET` — секрет access token
- `JWT_REFRESH_SECRET` — секрет refresh token
- `ACCESS_TOKEN_TTL` — TTL access token, по умолчанию `15m`
- `REFRESH_TOKEN_TTL` — TTL refresh token, по умолчанию `168h`
- `SKILLS_CACHE_TTL` — TTL кэша навыков

Пример лежит в `.env.example`.

## Миграции

Миграции находятся в [backend/migrations](/c:/Users/rpan9/Documents/projects/SessionClg/practice/backend/migrations).

Полезные команды:

```bash
cd backend
go run github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.0 \
  -path migrations \
  -database "postgres://edumatch:edumatch@localhost:5432/edumatch?sslmode=disable" up
```

При запуске через Docker миграции применяются автоматически в `backend/docker/start.sh`.

## Запуск

### Docker

```bash
docker compose up --build
```

### Локальная сборка

```bash
cd backend
go build ./cmd/server
```

### Генерация Swagger

```bash
cd backend
make swagger
```

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users

- `GET /api/users`
- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/me/skills`
- `DELETE /api/users/me`
- `GET /api/users/:id`

Фильтры `GET /api/users`:

- `query`
- `skill`
- `course`
- `university`
- `rating`

### Skills

- `GET /api/skills`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`

Фильтры `GET /api/projects`:

- `query`
- `skills` — CSV со списком skill UUID
- `status`
- `sort=asc|desc`

## Формат ответов

Успешный ответ:

```json
{
  "success": true,
  "data": {}
}
```

Ошибка:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    }
  ]
}
```

## Swagger

Сгенерированные Swagger-файлы находятся в [backend/docs](/c:/Users/rpan9/Documents/projects/SessionClg/practice/backend/docs), а UI доступен по адресу:

`http://localhost:8080/swagger/index.html`

## Документы первой недели

Сохранены материалы исследования и проектирования:

- [docs/week-1/week-1-report.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/week-1/week-1-report.md)
- [docs/week-1/competitor-analysis.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/week-1/competitor-analysis.md)
- [docs/week-1/user-flow.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/week-1/user-flow.md)
- [docs/design/product-design.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/design/product-design.md)
- [docs/design/wireframes.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/design/wireframes.md)
- [docs/database/er-diagram.md](/c:/Users/rpan9/Documents/projects/SessionClg/practice/docs/database/er-diagram.md)
- [db/schema.sql](/c:/Users/rpan9/Documents/projects/SessionClg/practice/db/schema.sql)
