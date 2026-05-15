# Staging Promotion Runbook

Owner: QA / SRE / Security.
Last updated: 2026-05-15.

## Required Gates

Run these before production promotion:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e:smoke
npm run test:a11y
```

Run database gates with the linked staging project:

```bash
npm run test:rls:linked
npm run db:lint:linked
```

Run live smoke against staging:

```bash
PLAYWRIGHT_LIVE_BASE_URL=https://staging.petcura.app npm run test:e2e:live
```

## Health Check

Check both application hostnames:

```bash
curl -fsS https://app.petcura.app/health?strict=1
curl -fsS https://my.petcura.app/health?strict=1
```

The response must not contain secret values. A strict failure means a missing
server env key, unreachable Supabase Auth health endpoint, or public env issue
must be fixed before promotion.

## Pilot Rehearsal

Before using real Alex traffic, complete one rehearsal:

1. Send WhatsApp intake from an owner phone.
2. Confirm the request appears in clinic inbox without manual data edits.
3. Confirm AI summary is created and staff-visible.
4. Send a staff reply and confirm delivery status events update.
5. Create a reminder and confirm it dispatches or schedules correctly.
6. Export the case record once export is available.

## Rollback

Rollback the Vercel deployment first. Treat database migrations as forward-only
unless the migration includes explicit rollback SQL and has been rehearsed on
staging. Record the incident note in the PR and keep the failed deployment URL
for log review.
