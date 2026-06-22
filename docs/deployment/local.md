# Local Run

## Fastest path

```bash
docker compose up --build
```

Docker Compose already injects container-safe defaults for PostgreSQL and Redis, so it does not depend on a `localhost`-based `.env`.

This starts:

- Next.js frontend on `http://localhost:3000`
- Go API on `http://localhost:8080`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

## Direct run without Docker

1. Create `.env` from `.env.example`
2. Make sure PostgreSQL and Redis are running locally
3. The default template already uses these values:

```env
DATABASE_URL=postgres://devlink:devlink@localhost:5432/devlink?sslmode=disable
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

If you want custom Compose service URLs, add `DOCKER_DATABASE_URL`, `DOCKER_REDIS_URL`, or `DOCKER_NEXT_PUBLIC_API_URL` to `.env`.

4. Install frontend dependencies:

```bash
npm install
```

5. Start frontend:

```bash
npm run dev
```

6. Start backend:

```bash
npm run backend:run
```

## Useful checks

Frontend build:

```bash
npm run build
```

Backend build:

```bash
npm run backend:build
```

Swagger:

```bash
npm run backend:swagger
```
