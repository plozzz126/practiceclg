# DevLink

DevLink is a student collaboration platform for finding projects, teammates, and stack-based matches. The repo includes a Next.js frontend, a Go backend, PostgreSQL, Redis, Figma-importable design assets, and deployment guides for Railway and Vercel.

## What is included

- Dark workspace UI with desktop sidebar and mobile bottom navigation
- Project search by stack, direction, status, and deadline
- Project detail workspace with real tasks, chat, documentation links, invitations, and join-request review flow
- Student profiles with skills, rating, course, and university filters
- JWT auth with refresh tokens
- PostgreSQL + Redis backend with migrations and Swagger docs
- Figma-ready SVG boards for screens and user flow

## Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand
- Backend: Go 1.25, Gin, pgx, Redis, JWT
- Data: PostgreSQL, Redis
- Docs and design: SVG Figma boards, Markdown deployment guides

## Repository layout

```text
src/                     Next.js frontend
backend/                 Go API, migrations, Dockerfile, Swagger
db/                      SQL reference schema
docs/design/             Design notes and Figma import assets
docs/deployment/         Local, Railway, and Vercel guides
Dockerfile.frontend      Frontend Docker image for local full-stack runs
docker-compose.yml       Frontend + backend + postgres + redis
```

## Quick start

### Option 1: full local stack with Docker

```bash
docker compose up --build
```

`docker compose` uses Docker-safe defaults for PostgreSQL and Redis service hosts, so it still works even if your local `.env` uses `localhost` for direct runs.

Services:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger: `http://localhost:8080/swagger/index.html`

### Option 2: run frontend and backend directly

1. Create `.env` from `.env.example`
2. Start PostgreSQL and Redis locally
3. The default template already uses localhost hosts:

```env
DATABASE_URL=postgres://devlink:devlink@localhost:5432/devlink?sslmode=disable
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

4. Install frontend packages and run Next.js:

```bash
npm install
npm run dev
```

If the repository path contains unsupported characters for Next.js tooling, the `dev`, `build`, `start`, and `lint`
scripts automatically mirror the frontend into `/tmp/practiceclg-run` and run there.

5. Run the backend from the repo root:

```bash
npm run backend:run
```

The backend applies pending SQL migrations automatically on startup.

## Useful scripts

```bash
npm run dev
npm run build
npm run backend:run
npm run backend:build
npm run backend:swagger
npm run docker:backend
npm run docker:up
npm run docker:down
```

## Environment variables

Frontend:

- `NEXT_PUBLIC_API_URL`

Backend:

- `APP_ENV`
- `PORT`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ALLOWED_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_TTL`
- `REFRESH_TOKEN_TTL`
- `SKILLS_CACHE_TTL`

See `.env.example` for the default local template.
For Docker Compose overrides, use `DOCKER_DATABASE_URL`, `DOCKER_REDIS_URL`, and `DOCKER_NEXT_PUBLIC_API_URL`.

## Database and migrations

- SQL reference schema: `db/schema.sql`
- Backend migrations: `backend/migrations`
- Runtime migration entrypoint: `backend/docker/start.sh`

Manual migration example:

```bash
go -C backend run github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.0 \
  -path migrations \
  -database "postgres://devlink:devlink@localhost:5432/devlink?sslmode=disable" up
```

## Deployment guides

- `docs/deployment/README.md`
- `docs/deployment/local.md`
- `docs/deployment/railway.md`
- `docs/deployment/vercel.md`

## Design assets

- `docs/design/figma-import/devlink-figma-board.svg`
- `docs/design/figma-import/devlink-user-flow.svg`
- `docs/design/figma-import/figma-transfer-guide.md`

## API

Core endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users`
- `GET /api/users/:id`
- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/me/privacy`
- `PUT /api/users/me/skills`
- `GET /api/skills`
- `GET /api/projects`
- `GET /api/projects/mine`
- `GET /api/projects/participating`
- `GET /api/projects/invitations/mine`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/tasks`
- `POST /api/projects/:id/tasks`
- `GET /api/projects/:id/documents`
- `POST /api/projects/:id/documents`
- `GET /api/projects/:id/join-requests`
- `POST /api/projects/:id/join-requests`
- `GET /api/projects/:id/invite-candidates`
- `GET /api/projects/:id/invitations`
- `POST /api/projects/:id/invitations`
- `GET /api/projects/:id/messages`
- `POST /api/projects/:id/messages`

Swagger UI:

- `http://localhost:8080/swagger/index.html`

## Notes

- The project detail page now uses real backend data for tasks, chat, join requests, documentation links, and invitations.
- In development, localhost origins on alternative ports such as `3001` are accepted by CORS so local demos do not break if port `3000` is busy.
