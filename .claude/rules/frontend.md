---
paths:
  - "apps/web/**/*.{ts,tsx,css}"
  - "packages/ui/**/*.{ts,tsx,css}"
---

# Frontend Rules

- Use Next.js App Router patterns.
- Prefer server components unless client interactivity is required.
- Keep client components small and explicit.
- Use typed props and shared validation schemas where available.
- Do not add browser-only assumptions to server components.
- Verify mobile and desktop behavior for any screen-level change.
