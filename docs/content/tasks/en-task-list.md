# EN UX Writer — Task List

**Owner:** English UX writer (canonical source).
**Reviewer:** Reza (tone, product); Codex (legal + AI claims).
**Estimated effort:** 3–4 weeks across five waves.
**Read first (in this order):** `voice-and-tone.md` → `microcopy-patterns.md` → `glossary.md` → `key-inventory.md` → `docs/design/a11y-i18n-contract-2026-05.md` §3.1–3.6 → `docs/compliance/public-legal-copy.md`.

You are the **canonical source**. Your EN string is the "intent of record" against which ET and RU translate. You also draft any new voice-and-tone examples that emerge during the work — they get folded into `voice-and-tone.md` between waves.

---

## Working agreements

- Open one branch per wave: `claude/ui-en-wave-{a|b|c|d|e}`.
- Edit `packages/shared/src/i18n.ts` (en block) and `apps/web/lib/owner/i18n.ts` (`const en = {…}`).
- Run before pushing: `npm run lint && npm run typecheck`. TypeScript fails the build if any key is missing — the safety net is built in.
- Tag ET and RU writers on every PR so they can start translating in parallel.
- After Wave A and Wave C, walk the relevant flow in the running app at `?lang=en` and capture screenshots in the PR.

---

## Wave A — Foundations (Week 1)

**Goal:** Lock the small, high-leverage strings that appear on every screen. Get tone calibrated before the long waves begin.

Scope (~80 strings):
- `nav.*` (32 keys) — sidebar, header titles, skip-to-content
- `menu.*` (13 keys) — mobile/account menu, theme labels
- `role.*` (6 keys) — staff role names
- `router.*` (5 keys) — post-login routing copy
- `language.*` (1 key) — language switcher label
- `comingSoon.*` (2 keys) — coming-soon placeholder
- Enum labels in `packages/shared/src/i18n.ts` lines 41–203 — polish only, no semantic change

Acceptance:
- Every nav label is 1–2 words.
- Every enum value matches `microcopy-patterns.md` §14.
- Glossary `glossary.md` is updated with any new term encountered.
- Reza signs off the tone before Wave B opens.

---

## Wave B — Owner surfaces (Week 1–2)

**Goal:** Apple Health reassurance voice across every owner-facing string. Anchor phrase "Your clinic stays in control" appears at least three times across the surfaces.

Scope (~225 strings):
- Owner app (`apps/web/lib/owner/i18n.ts`):
  - `app.*`, `tab.*` (5 keys)
  - `home.*` (31)
  - `pet.*` (25)
  - `chat.*` (17)
  - `services.*` (10)
  - `me.*` (18)
  - `login.*` (34)
  - `join.*` (13)
  - `auth.*` (6)
- Shared dictionary owner-facing:
  - `intake.*` (39) — the web-fallback intake form
  - `owners.*` (34) — the `/owners` marketing-education page
  - `home.*` (21) — owner dashboard top-level

Anchor phrase usage required:
- "Your clinic stays in control." in: `/owners` privacy reassurance, `/intake` notice, `/o/(authed)/me`.

Acceptance:
- Emergency disclaimer translated **once**, then reused verbatim across `owners.emergency.*`, intake notice, and trust page (locked text in `glossary.md` §9).
- The word "AI" appears only in `chat.*` keys describing an AI-drafted reply that the clinic has reviewed. Never in `home.*`, `pet.*`, `services.*`, `me.*`.
- Owner copy is judged by the "owner-clear" char-budget tier (`key-inventory.md` Part C).
- One walkthrough at `?lang=en` of: `/o/login` → magic link → `/o/(authed)` → `/o/(authed)/chat` → reply.

---

## Wave C — Clinic surfaces (Week 2–3)

**Goal:** Apple Mail operational voice. Dense, terse, calm. Zero exclamation marks. Every empty state uses the active-voice pattern from `microcopy-patterns.md` §9.

Scope (~430 strings):
- `inbox.*` (107)
- `request.*` (161)
- `directory.*` (61)
- `customers.*` (11)
- `pets.*` (11)
- `reminders.*` (23)
- `settings.*` (40)
- `profile.*` (20)

Required rewrites (high-priority list — confirm these first):
- Every "No X yet" string → "X appears here once Y" pattern.
- Every success toast → `{Object} {past-participle} · {context}` pattern (e.g., "Request resolved · Bella").
- Every AI-authored message label → `Drafted by AI · review before sending.` (locked).
- Every confirm dialog button → verb that names the action (no "Confirm" / "OK").

Acceptance:
- Word `Please` removed from every empty state and error.
- No exclamation marks anywhere in `inbox.*`, `request.*`, `reminders.*`, `directory.*`, `customers.*`, `pets.*`, `settings.*`, `profile.*`.
- Sidebar labels ≤ 18 chars.
- One walkthrough at `?lang=en` of: `/login` → `/inbox` → open a request → resolve → check `/reminders` and `/directory`.

---

## Wave D — Auth + Admin + Transactional (Week 3)

**Goal:** Apple system honesty for errors. Apple receipts for transactional templates. Apple Mail operational for admin.

Scope (~135 strings + 4 templates):
- `auth.*` (35) — login, error states, magic-link success
- `admin.*` (83) — leads, clinics, staff, activity tabs (EN required; ET/RU optional per writer)
- `onboarding.*` (55) — clinic + staff onboarding steps
- New transactional templates (delivered as Markdown alongside this task list; engineering wires them):
  - `magic-link-email.{en,et,ru}.md`
  - `owner-invite-whatsapp.{en,et,ru}.md`
  - `owner-invite-sms.{en,et,ru}.md`
  - `reminder-whatsapp.{en,et,ru}.md`

Required rewrites (high-priority list):
- All auth errors get a "what happened + what to do" rewrite. Match `voice-and-tone.md` §4.5.
- Magic-link email: subject < 50 chars, body < 60 words, one CTA, one disclaimer.
- Audit log entries follow `{Actor} {verb} {object} · {timestamp}` pattern.
- Bulk-action confirmations name the count: "Mark 12 leads as contacted?"

Acceptance:
- No "Please" in auth errors. No "Oops/Whoops/Sorry."
- Magic-link email passes the inbox-preview test (subject + first 60 chars make sense without opening).
- Walk three error states: bad email, rate limit, expired link.

---

## Wave E — Marketing + Legal polish (Week 3–4)

**Goal:** Apple.com aspirational for marketing. Apple Privacy plain-language for legal.

Scope (~360 strings):
- `landing.*` (172) — homepage, all sections
- `trust.*` (29) — trust center landing + FAQ
- `demo.*` (37) — `/demo` form
- `sandbox.*` (20) — `/sandbox` preview guard
- Legal pages — plain-language pass against `docs/compliance/public-legal-copy.md`:
  - `/privacy`
  - `/terms`
  - `/dpa`
  - `/cookies`
  - `/subprocessors`
  - `/trust`

Required rewrites:
- Hero: one declarative sentence + one outcome sentence. ≤ 35 words combined.
- All section subheads ≤ 9 words.
- AI safety section uses the locked AI accountability sentence from `glossary.md` §8.
- Pricing keeps the existing transparency frame ("Pilot pricing, locked through 2027. No long-term contract — leave any time.").
- Every legal page opens with a 2-sentence plain-language summary above the dense body.
- FAQ answers ≤ 2 sentences each.

Legal constraints (do not violate):
- No claim added, removed, or softened without Codex sign-off.
- Forbidden phrases in `docs/compliance/public-legal-copy.md` §1 "Do not use" list — stays banned.
- Subprocessor list copy stays factually identical; only structure and clarity may change.

Acceptance:
- Codex reviews and approves the legal-page PRs separately from the marketing PR.
- A compliance officer (or Reza standing in) can read each legal page in under 3 minutes and explain it back in 3 sentences.
- Lighthouse Accessibility = 100 on `/`, `/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors`, `/trust`.

---

## Cross-wave responsibilities (EN writer only)

1. **Maintain `voice-and-tone.md`.** Every new pattern that emerges (a new error shape, a new toast shape) gets a before/after entry there. Keep the doc to ≤ 12 KB.
2. **Maintain `glossary.md`.** Every new domain term gets added with a `unconfirmed` flag; ET and RU translators clear the flag.
3. **Maintain `key-inventory.md`.** When you discover a string that isn't keyed, mark it in Part D and ping Claude (frontend) to route it through the dictionary before you write the value.
4. **Coordinate weekly sync.** 30 min on Mondays. Walk through the EN drafts for the upcoming wave; ET and RU writers ask questions before they translate.

## Definition of done (EN scope)

- Every key in `packages/shared/src/i18n.ts` (`en` block) and `apps/web/lib/owner/i18n.ts` (`const en`) has a final value matching one of the voice modes.
- Every transactional template has a final EN version.
- Zero typecheck / lint regressions.
- Reza signs off after walking `/`, `/owners`, `/intake`, `/login`, `/inbox`, `/o/(authed)`, `/admin`, all legal pages at `?lang=en`.
- The forbidden phrases per `voice-and-tone.md` §5 do not appear anywhere in the EN dictionary (verify with `grep`).
