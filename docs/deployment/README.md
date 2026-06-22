# Deployment Guide

This folder contains the full deployment path for DevLink.

Files:

- `local.md` - local setup and troubleshooting
- `railway.md` - backend deployment to Railway
- `vercel.md` - frontend deployment to Vercel

Recommended production split:

1. Deploy PostgreSQL and Redis on Railway.
2. Deploy the Go backend on Railway from `backend/`.
3. Deploy the Next.js frontend on Vercel from the repo root.
4. Set `NEXT_PUBLIC_API_URL` in Vercel to the Railway backend public URL with `/api`.

For local Docker runs, `docker-compose.yml` uses Docker-safe defaults through `DOCKER_DATABASE_URL`, `DOCKER_REDIS_URL`, and `DOCKER_NEXT_PUBLIC_API_URL`, so direct-run `localhost` values do not break container networking.

Official references used for the guides:

- Railway build configuration: `https://docs.railway.com/builds/build-configuration`
- Railway monorepos: `https://docs.railway.com/deployments/monorepo`
- Railway variables: `https://docs.railway.com/variables`
- Railway public networking: `https://docs.railway.com/networking/public-networking`
- Vercel monorepos: `https://vercel.com/docs/monorepos`
- Vercel Next.js: `https://vercel.com/docs/frameworks/full-stack/nextjs`
- Vercel environment variables: `https://vercel.com/docs/environment-variables`
