# Definition of Done

A task is done when:

- `npm run typecheck` passes or the missing script is explicitly created/documented.
- `npm run lint` passes or the missing script is explicitly created/documented.
- Relevant unit/integration tests pass.
- Playwright happy path passes for the affected workflow.
- RLS/security-sensitive changes have tests.
- UI changes include desktop and mobile screenshot review.
- AI changes update evals and `ai_outputs` contract docs.
- Docs/contracts are updated for public behavior changes.
- PR summary includes scope, verification, risks, and rollback notes.
- Codex has completed final integration review.
