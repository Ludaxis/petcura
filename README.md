# PetCura

PetCura is the WhatsApp-native ClientOps inbox for veterinary clinics. It captures owner requests, structures intake, supports staff-approved AI assistance, manages reminders, and exports clean case records into the clinic's existing PMS.

This repository contains the PetCura monorepo foundation: a Next.js web app scaffold, shared packages, hosted Supabase schema migration, CI, operating manuals, role boundaries, workflow playbooks, and contracts for Codex and Claude collaboration.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs at `http://localhost:3000`.

Fill `.env.local` with the hosted Supabase project values before wiring live data:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-only jobs and migrations

## Scripts

- `npm run dev` starts the web app.
- `npm run typecheck` runs TypeScript checks.
- `npm run lint` runs ESLint.
- `npm run test` runs workspace tests.
- `npm run build` builds the production app.

## Agent Setup

- `AGENTS.md` is the canonical cross-agent manual for Codex and other coding agents.
- `CLAUDE.md` imports `AGENTS.md` and adds Claude-specific frontend/design ownership.
- `.claude/agents/` contains project-specific Claude subagents.
- `.claude/rules/` contains scoped frontend, design, accessibility, and QA rules.

## Build Scope

PetCura v1 is limited to:

- WhatsApp intake and web fallback intake
- clinic inbox and request detail
- staff-approved replies
- AI summaries, translations, category suggestions, risk flags, and reply drafts
- staff-confirmed urgency
- reminders
- PDF/CSV exports
- audit logs and AI logs

Not in v1: native apps, marketplace, delivery, payments, insurance, diagnosis, prescription, full PMS sync, public API, or multi-region expansion.
