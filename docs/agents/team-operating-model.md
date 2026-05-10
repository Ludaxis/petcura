# Team Operating Model

| Role | Primary Owner | Skills |
|---|---|---|
| CTO / Integrator | Codex | architecture, merge coherence, backend/frontend contract review |
| Backend Engineer | Codex | Next.js server actions, API boundaries, Inngest, Twilio, Vercel |
| Data Engineer | Codex | Supabase schema, RLS, migrations, analytics events |
| AI Safety Engineer | Codex | AI outputs, evals, prompt versioning, model router, safety rails |
| Security / Compliance Engineer | Codex | GDPR, audit logs, DPA requirements, secrets, access control |
| DevOps / SRE | Codex | Vercel, Supabase EU, monitoring, Sentry, PostHog, uptime |
| Product Designer | Claude | flows, information architecture, Figma, design system, clinic usability |
| Frontend Engineer | Claude | React, Next.js App Router, Tailwind, shadcn/ui, responsive UI |
| Design System Guardian | Claude | tokens, components, accessibility, visual consistency |
| QA Engineer | Claude + Codex | Playwright, regression tests, visual QA, acceptance checks |
| Accessibility / Localization Reviewer | Claude | WCAG, keyboard UX, EN/ET/RU interface quality |
| Clinic Ops / Product Owner | Human | Alex workflow, pilot metrics, product decisions |

## Integration Rules

- Claude may build frontend surfaces.
- Codex owns backend/data/security and final integration.
- Shared files require a task brief and explicit owner.
- No agent edits another role's owned area without documenting the reason.

## Delivery Loop

1. Human or Codex writes task brief.
2. Codex plans backend/data/contracts.
3. Claude designs or implements UI against the contract.
4. Codex integrates and reviews schema/API/security.
5. QA runs tests, browser checks, accessibility checks, and screenshot checks.
6. Codex prepares final PR summary.
