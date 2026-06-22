# Vercel Frontend Deploy

This guide deploys the DevLink Next.js frontend to Vercel from the repository root.

## Vercel project settings

Import the Git repository into Vercel and use:

- Framework Preset: `Next.js`
- Root Directory: repo root

No custom build command is required unless you want to override the default Next.js behavior.

## Environment variables

Set this in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.up.railway.app/api
```

The backend domain should come from the Railway backend service after public networking is enabled.

## Deploy flow

1. Deploy backend on Railway first.
2. Generate a Railway public domain for the backend.
3. Add `NEXT_PUBLIC_API_URL` in Vercel.
4. Trigger a new Vercel deployment.

## Verify after deploy

Check:

- Auth screens load
- Dashboard can fetch projects
- Project catalog search works
- Project detail page opens without API errors

## Local parity

For local development, the frontend uses:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```
