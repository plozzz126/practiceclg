# Railway Backend Deploy

This guide deploys the DevLink backend to Railway and uses Railway-managed PostgreSQL and Redis.

## Railway layout

Create one Railway project with these services:

- `backend` from this repo
- `Postgres`
- `Redis`

## Backend service settings

Use the repo as the source for the backend service.

Set:

- Root Directory: `backend`
- Dockerfile: let Railway detect `backend/Dockerfile`

This matches Railway's current monorepo and root-directory docs and lets the backend image run migrations on start through `backend/docker/start.sh`.

## Environment variables for backend

Set these in the Railway backend service:

- `APP_ENV=production`
- `PORT=8080`
- `JWT_ACCESS_SECRET=<strong-random-secret>`
- `JWT_REFRESH_SECRET=<strong-random-secret>`
- `ACCESS_TOKEN_TTL=15m`
- `REFRESH_TOKEN_TTL=168h`
- `SKILLS_CACHE_TTL=1h`

For data services:

- `DATABASE_URL=<Railway Postgres connection string>`
- `REDIS_URL=<Railway Redis connection string>`

If you prefer shared variables, Railway supports service and shared variables in the dashboard and via its variables feature.

## Public domain

After the backend deploy is healthy:

1. Open the backend service in Railway.
2. Go to `Settings -> Networking`.
3. Use `Generate Domain`.
4. Copy the public URL.

Your frontend will use:

```text
https://your-backend-domain.up.railway.app/api
```

## Health checks

Verify:

- `https://your-backend-domain.up.railway.app/health`
- `https://your-backend-domain.up.railway.app/swagger/index.html`

## Notes

- The backend Docker image already installs `migrate` and runs DB migrations before starting the server.
- If a deployment fails after schema changes, check the deploy logs first because migration failures will stop startup.
