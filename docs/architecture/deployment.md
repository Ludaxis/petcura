# Deployment

## Vercel Project

- Team: `Ludaxis`
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
npx --yes vercel@latest deploy --prod --yes --scope ludaxis --logs
```

Inspect a deployment:

```bash
npx --yes vercel@latest inspect <deployment-url> --logs --scope ludaxis
```

List environment variable keys:

```bash
npx --yes vercel@latest env list --scope ludaxis
```

## Git Integration Status

Vercel Git auto-deploy is not active yet. Attempting to connect `Ludaxis/petcura` failed because the repository is private and organization-owned, which is not supported on the current Hobby plan.

To enable automatic deployments, either upgrade the Ludaxis Vercel team to Pro or make the repository public, then run:

```bash
npx --yes vercel@latest git connect git@github.com:Ludaxis/petcura.git --scope ludaxis --non-interactive
```

Until then, production deploys are manual through the Vercel CLI.
