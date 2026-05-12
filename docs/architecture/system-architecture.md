# System Architecture

## Overview

PetCura is a single monorepo with a Next.js web app, Supabase backend, Inngest background jobs, Twilio WhatsApp channel, and AI model router.

Last updated: 2026-05-12.

## Runtime Components

- `apps/web`: staff dashboard, owner web intake, server actions, API routes, Twilio webhooks.
- `supabase`: Postgres schema, RLS policies, storage, auth, realtime.
- `jobs/inngest`: typed event contracts for AI background tasks, reminders, delivery retries, GDPR purge jobs, and exports.
- `packages/ui`: shared UI primitives and design system.
- `packages/validation`: Zod schemas and shared contracts.
- `packages/ai`: AI prompts, model router, structured output schemas, eval utilities.
- `packages/shared`: shared domain types and utilities.

## Data Flow

1. Owner sends WhatsApp or web intake.
2. API verifies identity, webhook signatures, and idempotency.
3. Supabase stores request, messages, attachments, and events.
4. Inngest runs owner-message AI after durable writes: summaries, translations, accepted-memory retrieval, and memory extraction.
5. Clinic dashboard updates via Supabase Realtime.
6. Staff can generate on-demand AI drafts; drafts retrieve accepted request/pet/owner memory and prefill the composer only.
7. Staff-approved replies route back through WhatsApp/SMS.

## Integration Rule

The frontend must consume documented contracts from `docs/contracts/` or shared validation schemas. Backend and data changes are reviewed by Codex before merge.
