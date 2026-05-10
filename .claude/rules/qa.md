---
paths:
  - "tests/**/*"
  - "apps/web/**/*.{ts,tsx}"
  - "supabase/**/*"
---

# QA Rules

- Add or update tests for changed behavior.
- Prefer targeted tests during development, then run the relevant full suite before handoff.
- UI changes need browser smoke coverage for the affected workflow.
- Security-sensitive changes need negative tests.
- AI changes need eval updates or an explicit no-eval rationale.
