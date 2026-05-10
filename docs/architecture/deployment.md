# Deployment

## Vercel Project

- Team: `Joyixir`
- Project: `petcura`
- Project ID: `prj_NMBdyjd3ds86DWZsCiFzJvmngzwa`
- Framework: Next.js
- Root directory: `apps/web`
- Source files outside root directory: enabled, so workspace packages in `packages/*` are included
- Node.js: `24.x`
- Default function region: `fra1`
- Web Analytics: enabled
- Speed Insights: enabled

## Domains

- Production: `https://app.petcura.app`
- Staging: `https://staging.petcura.app`

Both domains are added to the Vercel project. Staging currently serves the latest production deployment until a separate preview/custom-environment promotion flow is configured.

## Environment Variables

Configured in Vercel for Production, Preview, and Development:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit Vercel environment values or `.vercel/`. The local project link lives in `.vercel/project.json`, which is intentionally gitignored.

## Deployment Commands

Deploy production manually:

```bash
npx --yes vercel@latest deploy --prod --yes --scope joyixir-games --logs
```

Inspect a deployment:

```bash
npx --yes vercel@latest inspect <deployment-url> --logs --scope joyixir-games
```

List environment variable keys:

```bash
npx --yes vercel@latest env list --scope joyixir-games
```

## Git Integration Status

Vercel Git auto-deploy is active for:

- Repository: `Ludaxis/petcura`
- Production branch: `main`
- Vercel team: `Joyixir`

Pushes to `main` should create production deployments. Manual CLI deploy remains available when an explicit deployment is needed.
