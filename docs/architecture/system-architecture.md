# System Architecture

## Overview

PetCura is a single monorepo with a Next.js web app, Supabase backend, Inngest background jobs, Twilio WhatsApp channel, and AI model router.

## Runtime Components

- `apps/web`: staff dashboard, owner web intake, server actions, API routes, Twilio webhooks.
- `supabase`: Postgres schema, RLS policies, storage, auth, realtime.
- `jobs/inngest`: reminders, AI background tasks, delivery retries, GDPR purge jobs, exports.
- `packages/ui`: shared UI primitives and design system.
- `packages/validation`: Zod schemas and shared contracts.
- `packages/ai`: AI prompts, model router, structured output schemas, eval utilities.
- `packages/shared`: shared domain types and utilities.

## Data Flow

1. Owner sends WhatsApp or web intake.
2. API verifies identity, webhook signatures, and idempotency.
3. Supabase stores request, messages, attachments, and events.
4. Inngest runs AI, reminder, delivery, export, and cleanup jobs.
5. Clinic dashboard updates via Supabase Realtime.
6. Staff-approved replies route back through WhatsApp/SMS.

## Integration Rule

The frontend must consume documented contracts from `docs/contracts/` or shared validation schemas. Backend and data changes are reviewed by Codex before merge.
