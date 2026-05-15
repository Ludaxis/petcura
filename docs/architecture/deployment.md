# Deployment

Last updated: 2026-05-15.

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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PETCURA_DEFAULT_CLINIC_SLUG`
- `PETCURA_BOOTSTRAP_STAFF_EMAILS`
- `CRON_SECRET`

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

## Health Checks

`GET /health` returns a non-secret readiness payload:

- build SHA (`VERCEL_GIT_COMMIT_SHA` when available)
- runtime region (`VERCEL_REGION` when available)
- public environment readiness
- pilot secret-key presence by key name only, never values
- Supabase Auth health latency/status

Default mode returns `200` when public env and Supabase are reachable. Use
`/health?strict=1` for staging promotion checks; strict mode also requires
pilot-critical server env keys such as Twilio, cron, and Supabase secret
presence.

## CI Gates

The GitHub Actions CI now separates gates so failures are easier to triage:

- **App quality gates**: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- **Supabase RLS and schema gates**: local Supabase boot, `supabase test db --local`, and `supabase db lint --local --fail-on error`.
- **Playwright smoke**: `npm run test:e2e:smoke`.
- **Accessibility lane**: `npm run test:a11y`.

Manual/live lanes remain available for staging promotion:

- `PLAYWRIGHT_LIVE_BASE_URL=https://staging.petcura.app npm run test:e2e:live`
- `npm run test:visual`
- `npm run test:e2e:db` with `PETCURA_RUN_DB_PLAYWRIGHT=1` and a deterministic test database.

Latest verified production deployment:

- Commit: `ca9a95a` (`Fix AI draft locale metadata`)
- Deployment ID: `dpl_KARXBvwFHVnD8wbSjTq6YGTfQbWK`
- State: `READY`
- Scope: AI Memory V1 final QA polish; generated reply drafts now store source locale metadata.

## Cron Jobs

Production cron jobs are configured from `apps/web/vercel.json`.

- `/api/cron/reminders` runs every five minutes and dispatches due reminders.
- Vercel invokes cron jobs only on production deployments.
- The route requires `Authorization: Bearer $CRON_SECRET`; keep `CRON_SECRET` configured in Vercel Production and local `.env.local` for manual testing.

## Staging Promotion Checklist

Promotion to production is blocked until every item is green:

- GitHub CI green on `main`.
- `/health?strict=1` returns expected readiness on staging.
- `npm run test:rls:linked` and `npm run db:lint:linked` pass against the linked staging Supabase project.
- Playwright smoke passes against staging: `PLAYWRIGHT_LIVE_BASE_URL=https://staging.petcura.app npm run test:e2e:live`.
- One pilot rehearsal is completed: WhatsApp intake → AI summary → staff reply → delivery event → reminder → export.
- Sentry/Vercel logs show no new unhandled route errors during rehearsal.

## Rollback Checklist

If staging or production promotion fails:

- Stop the rollout and keep the failed deployment URL for log inspection.
- Revert the application deployment in Vercel to the last known good deployment.
- Do not roll back migrations blindly. If a migration shipped, apply the documented down/forward-fix plan for that migration.
- Re-run `/health?strict=1`, RLS linked tests, and the affected Playwright lane.
- Add a short incident note to the PR with blast radius, mitigation, and follow-up owner.
