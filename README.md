# PetCura

PetCura is the WhatsApp-native ClientOps inbox for veterinary clinics. It captures owner requests, structures intake, supports staff-approved AI assistance, manages reminders, and exports clean case records into the clinic's existing PMS.

This repository currently contains the multi-agent development foundation: operating manuals, role boundaries, workflow playbooks, contracts, and documentation structure for Codex and Claude collaboration.

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
