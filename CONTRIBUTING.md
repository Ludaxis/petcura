# Contributing

PetCura uses an agent-assisted workflow with Codex as final integrator and Claude as design/frontend lead.

## Before Starting

1. Read `AGENTS.md`.
2. Use `docs/agents/task-brief-template.md` for non-trivial work.
3. Confirm ownership boundaries before editing shared files.

## Branches

- `codex/backend-<slug>`
- `codex/data-<slug>`
- `claude/ui-<slug>`
- `claude/design-<slug>`
- `qa/<slug>`

## Pull Requests

Every PR should include:

- goal and scope
- data/API contract changes
- screenshots for UI work
- verification commands
- risk notes
- rollback notes

Codex owns final integration review before merge.
