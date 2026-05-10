# PetCura Agent Manual

## Product North Star

PetCura is the WhatsApp-native ClientOps inbox for veterinary clinics. It reduces phone chaos, structures owner requests, assists staff with safe AI, manages follow-ups, and exports clean records into the clinic's existing PMS.

The PMS remains the medical system of record. PetCura owns communication, intake, reminders, follow-up workflow, and auditability.

## Tech Stack

- Frontend: Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui.
- Backend: Next.js server actions/API routes, Supabase managed EU Postgres/Auth/Storage/Realtime, Inngest jobs.
- Channels: Twilio WhatsApp Business first, web intake fallback, SMS fallback for failed WhatsApp delivery.
- AI: provider-routed model layer selected by eval quality, latency, cost, safety, and residency.
- Observability: Sentry, PostHog EU, Better Stack, Vercel logs, AI usage dashboards.

## Ownership Boundaries

- Codex owns architecture, backend, data model, Supabase, RLS, jobs, integrations, AI safety, security, compliance, tests, and final integration.
- Claude owns product design, UI/UX, frontend implementation, design system, accessibility, responsive behavior, and Figma-to-code work.
- Human product owner owns clinic workflow decisions, pilot metrics, and scope tradeoffs.
- Shared files require a task brief in `docs/agents/task-brief-template.md` and an explicit owner.
- Do not edit another role's owned area without documenting why in the PR summary.

## Commands

When the app scaffold exists, use these quality gates:

- Install dependencies: `npm install`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Unit/integration tests: `npm run test`
- Build: `npm run build`
- E2E tests: `npm run test:e2e`
- Visual checks: `npm run test:visual`
- AI evals: `npm run test:ai`

If a command does not exist yet, add or update the appropriate package script as part of the scaffold instead of claiming verification passed.

## Architecture Rules

- Keep PetCura narrow: intake, inbox, request detail, reminders, exports, AI assistance, auditability.
- Do not build marketplace, delivery, payments, insurance, native apps, full PMS replacement, public API, or diagnosis/prescription features in v1.
- Use explicit contracts in `docs/contracts/` before crossing frontend/backend/data boundaries.
- Favor small, composable modules and typed boundaries over implicit shared state.
- Background work belongs in `jobs/inngest/`; durable data belongs in Supabase.

## Data Model Rules

- Every tenant-owned table must include `clinic_id`.
- RLS is mandatory for all domain tables.
- `request_events` is the source of truth for case timeline.
- `ai_outputs` is the source of truth for AI accountability.
- `message_delivery_events` tracks outbound lifecycle.
- Avoid JSON blobs unless the shape is intentionally flexible and documented.

## Security and Compliance Rules

- PetCura is processor; the clinic is controller.
- Primary application data must be hosted in EU regions.
- Document subprocessors, transfer mechanisms, retention periods, and AI inference settings in compliance docs.
- Never expose Supabase `sb_secret_...` keys or legacy service-role keys to client code.
- Never commit secrets, real owner PII, clinic credentials, or production exports.
- Webhooks must verify signatures and be idempotent.
- GDPR erasure/export flows must preserve audit requirements while minimizing retained PII.

## AI Safety Rules

- AI assists staff; it never replaces veterinary professionals.
- AI may generate intake questions, category suggestions, risk flags, summaries, translations, and reply drafts.
- AI must not diagnose, prescribe, set final urgency, or auto-send medical advice.
- Owner-facing AI content requires staff approval unless it is non-medical intake collection or translation.
- Store model, prompt version, input, output, confidence, token usage, latency, review status, and edited output in `ai_outputs`.
- Prompt changes require version bumps and eval updates.

## Frontend Rules

- Clinic UX is dense, calm, and operational. Owner UX is simple, reassuring, and low-friction.
- Use shadcn/ui primitives and PetCura design tokens.
- Prefer server components unless interactivity requires client components.
- Verify important views at mobile and desktop widths.
- UI must support keyboard navigation, visible focus states, EN/ET/RU text expansion, and accessible contrast.

## Testing Rules

- Add tests for behavior changed by the task.
- RLS/security-sensitive changes require isolation tests.
- AI changes require eval updates or explicit documentation of why no eval changed.
- UI changes require browser smoke tests and screenshot review.
- Do not weaken tests, RLS, or validation to make a build pass.

## PR Rules

- Use branches: `codex/backend-<slug>`, `codex/data-<slug>`, `claude/ui-<slug>`, `claude/design-<slug>`, or `qa/<slug>`.
- PRs must include goal, scope, verification, risk notes, and rollback notes.
- Codex performs final integration review before merge.

## Definition of Done

- Relevant commands pass or missing commands are explicitly called out.
- Unit/integration tests cover changed logic.
- Playwright happy path passes for affected workflow.
- UI changes include desktop and mobile screenshot review.
- Security/compliance impacts are documented.
- AI changes update `ai_outputs` contracts and evals.
- No ownership conflicts remain unresolved.
