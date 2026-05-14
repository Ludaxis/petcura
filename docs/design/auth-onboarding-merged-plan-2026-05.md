# PetCura Auth + Onboarding — Merged Execution Plan (2026-05)

> Reviewer note: this file supersedes the standalone Claude design plan
> (`~/.claude/plans/as-a-world-class-imperative-dragon.md`) and folds in the
> Codex audit. It is the single canonical execution plan for the auth +
> onboarding redesign. The plan is split across four agents: Designer,
> Developer, Claude (frontend), and Codex (backend / Supabase / security).
> All Codex-lane work is captured in `docs/contracts/` hand-offs only — Claude
> does not ship those changes per `AGENTS.md`.

---

## 1. Context

PetCura ships a working clinic magic-link login (`apps/web/app/login/page.tsx`),
working owner phone-OTP login (`apps/web/app/o/login/page.tsx`), and live
post-login dashboards (`/inbox`, `/o`). The pieces work in isolation but the
*journey* — landing → branded auth → role-correct destination → first-run
orientation — is incoherent. The landing is animated and polished; the auth
screens are bare cards; the dashboards drop new users into operational UIs
with no welcome and no setup path. Both the Claude design plan and the Codex
audit converged on the same fix shape; the only real deltas were Codex-owned
items Claude couldn't see (role-aware router, `shouldCreateUser: false`,
`proxy.ts` SSR session refresh, the `/o/join` route name that's already in
`docs/contracts/owner-auth.md:54`).

**Locked decisions (do not relitigate):**

- Clinic onboarding is **hybrid waitlist + invite**. No self-serve clinic
  creation in v1.
- **All-Supabase auth.** Passkeys deferred to a later round.
- All four pillars in scope: branded auth screens, clinic first-run, owner
  first-run, WhatsApp → app handoff.
- Marketing surfaces may use `motion/react` + dynamic-imported
  `gsap/ScrollTrigger`. **Clinic/owner apps stay View Transitions + CSS only**,
  reusing `--motion-*` / `--ease-*` tokens from `apps/web/app/globals.css` +
  `packages/ui/src/motion-tokens.ts`. No new JS animation libs in product UI.
- `prefers-reduced-motion: reduce` zeros every animation. Static fallback is
  first-class.
- EN/ET/RU full parity. Russian is the longest; layouts must absorb it.
- Onboarding state model: **single `onboarding_progress` table** keyed by
  `(actor_type, actor_id, step)`. Codex's original three-table proposal is
  collapsed per Claude's pushback.

---

## 2. Target journeys

### 2.1 Clinic staff (B2B, desktop-first, magic link)

```
Landing
  └─► Waitlist CTA  (apps/web/app/page.tsx)
        └─► CSM provisions clinic + creates clinic_staff row + sends invite
              └─► Email magic link  (?email=&clinic=&invite=1)
                    └─► /login (branded AuthShell, email pre-filled)
                          └─► /auth/callback
                                └─► PostLoginRouter (Pillar 0)
                                      ├─ new owner role  ──► /onboarding/clinic
                                      ├─ new invited staff ──► /onboarding/staff
                                      └─ returning staff   ──► next param
                                                              ‖ last-visited cookie
                                                              ‖ role default
                                                                   reception → /inbox?q=unassigned
                                                                   vet       → /inbox?q=mine&urgent=1
                                                                   admin     → /settings
```

### 2.2 Pet owner (B2C, mobile-first, WhatsApp-led)

```
Clinic-sent WhatsApp template
  └─► https://my.petcura.app/o/join?token=<jwt>     ← contract: docs/contracts/owner-auth.md:54
        └─► /o/join verifies token + consumes owner_invites row
              └─► "Continue as Bella's owner" handoff screen
                    ├─ session issued  ──► PostLoginRouter (owner branch)
                    │                         ├─ first visit ──► /o (welcome strip + seeded pet card)
                    │                         └─ returning   ──► unread chat ‖ active request ‖ /o
                    └─ OTP fallback if token expired ──► /o/login (phone pre-filled)
```

Cold-start owner path (no WhatsApp link): `/o/login` → phone OTP →
`PostLoginRouter` → `/o`.

---

## 3. Pillar 0 — Role-aware post-login router

**Problem:** Today both `/login` and `/o/login` hardcode their post-auth
destination (clinic → `/inbox`, owner → `/o`). New owners, invited staff,
returning staff, and returning owners all get the same landing — none of
which is the screen that creates value fastest.

**New module:** `apps/web/lib/auth/post-login-router.ts` — pure function +
small server helper. Called from:

- `apps/web/app/auth/callback/route.ts` (clinic magic-link callback)
- `apps/web/app/o/auth/callback/route.ts` (owner OAuth callback)
- `apps/web/app/o/login/actions.ts` after `verifyOwnerOtp` (replace the
  hardcoded `redirect("/o")` at `apps/web/app/o/login/actions.ts:235`)
- `apps/web/app/o/join/route.ts` (new — Pillar 4)

### 3.1 Inputs / outputs (pseudocode)

```ts
type Actor =
  | { kind: "clinic_staff"; userId: string; clinicId: string; role: "reception" | "vet" | "admin"; firstRun: boolean }
  | { kind: "owner";        userId: string; firstRun: boolean; hasUnreadStaffReply: boolean; hasActiveRequest: boolean };

type RouterInput = {
  actor: Actor;
  nextParam: string | null;       // sanitized
  lastVisitedCookie: string | null; // pc_last_route, scoped per actor.kind
};

type RouterOutput = { destination: string; reason: string /* for audit */ };

function resolvePostLoginDestination(input: RouterInput): RouterOutput {
  const { actor, nextParam, lastVisitedCookie } = input;

  if (actor.kind === "clinic_staff") {
    if (actor.firstRun && actor.role === "admin")  return { destination: "/onboarding/clinic", reason: "clinic_first_run" };
    if (actor.firstRun)                            return { destination: "/onboarding/staff",  reason: "staff_first_run" };
    if (nextParam)                                 return { destination: nextParam,            reason: "next_param" };
    if (lastVisitedCookie)                         return { destination: lastVisitedCookie,    reason: "last_visited" };
    return { destination: roleDefault(actor.role), reason: "role_default" };
  }

  // owner
  if (actor.firstRun)                              return { destination: "/o?welcome=1", reason: "owner_first_run" };
  if (nextParam)                                   return { destination: nextParam,      reason: "next_param" };
  if (actor.hasUnreadStaffReply)                   return { destination: "/o/chat",      reason: "unread_reply" };
  if (actor.hasActiveRequest)                      return { destination: "/o",           reason: "active_request" };
  return { destination: "/o", reason: "owner_default" };
}

function roleDefault(role: ClinicStaffRole): string {
  switch (role) {
    case "reception": return "/inbox?q=unassigned&today=1";
    case "vet":       return "/inbox?q=mine&urgent=1";
    case "admin":     return "/settings";
  }
}
```

**Inputs that need data Claude can't produce alone (Codex hand-off):**

- `actor.firstRun` — derived from `onboarding_progress` (see §9).
- `actor.role` — already on `clinic_staff` row.
- `actor.hasUnreadStaffReply` / `hasActiveRequest` — derivable from
  existing tables (`request_events`, `messages`), but the helper that
  reads them must run server-side and respect RLS.

**`lastVisitedCookie`** is set by a thin client effect in `AppShell`
(write-on-route-change) under cookie name `pc_last_route_staff` /
`pc_last_route_owner`, both `SameSite=Lax`, `Secure`, `HttpOnly=false`
(needs client read for SPA navs), `Max-Age=30d`. Cookie is path-scoped and
namespaced per actor to prevent cross-context bleed.

**`nextParam` sanitization** is in scope for Claude: reuse the existing
`sanitizeOwnerNextPath` pattern (`apps/web/app/o/login/actions.ts:17`) and
add a clinic-side equivalent `sanitizeStaffNextPath`. Both must:

- Only allow same-origin paths starting with `/`.
- Reject `/login`, `/o/login`, `/o/join`, `/onboarding/*` as `next` targets
  (avoid auth loops).
- Reject `//` and `\\` prefixes.

---

## 4. Pillar 1 — Branded auth screens (login + o/login + AuthShell)

**Problem:** Bare panels on `bg-[var(--paper)]`. Magic-link copy is generic
even for invitees. OTP UX doesn't autofill from WhatsApp/SMS. Errors say
"login_error" with no recovery path.

### 4.1 Design

- **Split-pane AuthShell** at ≥`md`: left = form panel (existing card),
  right = calm sage brand pane with one rotating quote (re-use landing
  testimonial set) + a stripped-down `pc-loop-trail` motif behind glass.
  Mobile: single column with an 8vh animated header strip.
- **Invite-aware `/login`:** read `?email=`, `?clinic=`, `?invite=1`. When
  `invite=1`, swap H1 to "Welcome to {clinicName}", set email field
  `readOnly`, add a "Not you?" link that strips the params.
- **OTP UX upgrade on `/o/login`:**
  - 6 single-character inputs, paste-fans correctly.
  - Each input: `inputMode="numeric"`, `autocomplete="one-time-code"`,
    `pattern="[0-9]*"`, accessible labels per cell.
  - Resend cooldown countdown (`Resend in 0:42`) + "I didn't get it" →
    switches channel WhatsApp ↔ SMS.
- **Error copy with recovery:** map every error code from
  `apps/web/app/login/actions.ts:8` and `apps/web/app/o/login/actions.ts:23`
  to a sentence + action. E.g. `not_found` (owner) → "We couldn't find your
  number with any PetCura clinic. Tap here to contact your clinic." with a
  `mailto:` and a link to `/waitlist`.
- **Language switcher** moves to a quiet top-right chip, matching landing.
- **Motion:** `motion.duration.base` (240ms) fade-up on the form panel,
  `motion.stagger.sm` on labels. Honor `prefers-reduced-motion`. CSS-only.

### 4.2 Codex hand-off (DO NOT implement in Claude tasks)

- Staff magic link must set **`shouldCreateUser: false`** on
  `supabase.auth.signInWithOtp` (`apps/web/app/login/actions.ts:72`). Today
  any email triggers an account; this allows brute enumeration of staff.
  With `shouldCreateUser: false`, unknown emails fail loudly and the UI
  shows the `email_not_authorized` recovery copy.

### 4.3 Files

- **New:** `apps/web/app/(auth)/_components/AuthShell.tsx` — shared split
  pane, brand pane, language chip, motion tokens. Server component;
  accepts `{ variant: "clinic" | "owner"; invite?: { clinicName, email } }`.
- **New:** `apps/web/app/(auth)/_components/BrandPane.tsx` — calm right
  pane: rotating quote + stripped `pc-loop-trail`.
- **New:** `apps/web/app/o/login/_components/OtpCellsInput.tsx` — 6-cell
  segmented input with paste-fan + autofill bridge.
- **Edit:** `apps/web/app/login/page.tsx` — wrap in `AuthShell variant="clinic"`,
  invite-aware copy.
- **Edit:** `apps/web/app/o/login/page.tsx` — wrap in `AuthShell variant="owner"`,
  include `deeplinkToken` carry-through (Pillar 4).
- **Edit:** `apps/web/app/o/login/_components/OtpForm.tsx` — use
  `OtpCellsInput`, add resend cooldown, channel switcher, error recovery copy.
- **Edit:** `packages/shared/src/i18n.ts` (or matching dictionary file) —
  add EN/ET/RU strings for all new copy.

---

## 5. Pillar 2a — Clinic owner first-run (`/onboarding/clinic`)

**Problem:** An admin who just clicked the invite link lands in `/inbox`
empty-handed. No welcome, no setup checklist, no path to "first message".

### 5.1 Design

Dedicated route `/onboarding/clinic` (server component) that the
`PostLoginRouter` sends `firstRun && role === "admin"` users to. Single
viewport-friendly layout, mobile-collapsible. Two columns desktop:
left = friendly welcome + clinic name greeting, right = checklist drawer.

**Setup checklist (5 items, persistent in `onboarding_progress`):**

1. **Connect WhatsApp number** — deep links to `/settings/whatsapp`. "We'll
   handle it" CTA emails CSM.
2. **Pick or skip PMS integration** — deep link to `/settings/integrations`.
3. **Invite 1 teammate** — opens the existing invite flow with
   `?from=onboarding`.
4. **Set quiet hours + auto-reply** — deep link to `/settings/messaging`.
5. **Send a test request** — one-click seeds a demo conversation in the
   inbox (fixture, not a real WhatsApp send).

Each item: action verb, status chip (todo / done), one-line subtext,
`motion.duration.fast` check animation on completion. A 6th implicit item,
"View your inbox", appears at the bottom as a "Skip to inbox →" link that
sets `pc_last_route_staff = /inbox` without marking onboarding complete.

**Completion:** when all 5 are done, the drawer collapses into a soft
"You're all set" pill, fires `clinic_connected_whatsapp` activation event
(if step 1 was completed) and routes to `/inbox`. From that moment the
`PostLoginRouter` treats the admin as returning.

**Header chip:** while onboarding is in flight, `AppShell` shows a small
progress chip (`3 / 5`) in the top bar that opens the checklist drawer if
the admin navigates away mid-flow.

### 5.2 Files

- **New:** `apps/web/app/onboarding/clinic/page.tsx`
- **New:** `apps/web/app/onboarding/clinic/_components/ClinicWelcomeHeader.tsx`
- **New:** `apps/web/app/onboarding/clinic/_components/SetupChecklist.tsx` (client)
- **New:** `apps/web/app/onboarding/clinic/_components/ChecklistItem.tsx`
- **New:** `apps/web/app/onboarding/clinic/actions.ts` — `markStepDone(step)`
  server action that writes to `onboarding_progress` (Codex schema).
- **Edit:** `apps/web/app/_components/AppShell/*` — add header progress
  chip slot driven by `onboarding_progress`.

---

## 6. Pillar 2b — Invited staff first-run (`/onboarding/staff`)

**Problem:** Non-admin staff (reception, vet) don't need to set up the
clinic — that's done — but they still need a moment of welcome + a profile
touch before being dropped into queues.

### 6.1 Design

Lighter route, two screens max, takes ~30 seconds:

1. **Name + avatar** — pre-filled from `clinic_staff.full_name`; optional
   photo upload (existing storage bucket).
2. **Role confirmation** — read-only chip showing the role the admin
   assigned, with a "This isn't right? Ask {adminName} to update."
   recovery link.
3. **Notification preferences** — push (owner-facing PWA contract pattern),
   email digest cadence, quiet hours inherited from clinic.

On completion, fires `staff_first_reply_sent`-precursor event
`staff_onboarded` (not activation but useful) and routes via
`PostLoginRouter` to the role default.

### 6.2 Files

- **New:** `apps/web/app/onboarding/staff/page.tsx`
- **New:** `apps/web/app/onboarding/staff/_components/StaffOnboardingForm.tsx` (client)
- **New:** `apps/web/app/onboarding/staff/actions.ts`

---

## 7. Pillar 3 — Owner first-run on `/o`

**Problem:** A brand-new owner who passes OTP / `/o/join` lands on `/o`
with empty pet grid + empty conversation panel = anxiety, not reassurance.

### 7.1 Design

`/o` renders a **welcome strip** above the pets section when
`PostLoginRouter` set `?welcome=1` OR when `onboarding_progress` shows
owner first-run. The strip contains:

- **Welcome heading** — "{clinicName} is reviewing Bella's request" if
  arriving from `/o/join` with a token-carried pet; otherwise "Welcome to
  PetCura, {firstName}".
- **Next-step card** — single primary action (Notion/Raycast pattern):
  - If active request exists → "Open clinic chat" (links to `/o/chat`).
  - If no pets → "Add another pet".
  - If pets but no active request → "Send a message to {clinicName}".
- **What-happens-next tile** — 3 calm rows: "Clinic reviews your request →
  You get a WhatsApp reply → Updates show up here."
- **Seeded pet card** — when arriving from an intake submission, the first
  pet card is pre-filled from intake (name + species) with a "Finish
  profile" CTA. No empty grid for owners with in-flight intake.

Dismissal: closing the welcome strip fires `owner_first_thread_opened` (if
the owner taps "Open clinic chat") or sets `welcome_dismissed` step in
`onboarding_progress`.

### 7.2 Files

- **New:** `apps/web/app/o/(authed)/_components/OwnerWelcomeStrip.tsx`
- **New:** `apps/web/app/o/(authed)/_components/NextStepCard.tsx`
- **New:** `apps/web/app/o/(authed)/_components/WhatHappensNextTile.tsx`
- **New:** `apps/web/app/o/(authed)/_components/IntakeSeededPetCard.tsx`
- **Edit:** `apps/web/app/o/(authed)/page.tsx` — branch on first-visit.
- **Edit:** existing `PetCard` host or compose at the page level.

---

## 8. Pillar 4 — WhatsApp → app handoff at `/o/join?token=...`

**Problem:** The contract at `docs/contracts/owner-auth.md:54` documents
`https://my.petcura.app/o/join?token=<jwt>` already. There's no route
serving it. Owners coming from WhatsApp templates hit a 404.

### 8.1 Design

Route: `apps/web/app/o/join/route.ts` (Route Handler, not page) +
`apps/web/app/o/join/page.tsx` (server component for the handoff screen).
The route handler verifies the token via a Codex endpoint and either:

- **Token valid + owner exists** → consume `owner_invites` row, issue
  Supabase session via the admin client (mirroring
  `apps/web/app/o/login/actions.ts:65-104` `ensureOwnerAuthUser` pattern),
  redirect via `PostLoginRouter` to `/o?welcome=1`.
- **Token valid + ambiguous identity** → render `/o/join` page with
  "Continue as Bella's owner" confirmation:
  - Clinic name + clinic photo at top.
  - Pet name + species pre-filled if token matched a pet.
  - Primary button (consumes token, issues session).
  - "This isn't me" escape → `/intake`.
- **Token expired / consumed / invalid** → redirect to `/o/login` with a
  friendly toast (`?reason=invite_expired`), pre-fill phone if token's
  phone is in the (signed) payload.

### 8.2 Token contract (consume only — verification owned by Codex)

Token payload per `docs/contracts/owner-auth.md:54-58`:

```
{ phone, clinic_id, exp, jti }    // HMAC signed, single-use, TTL 24h
```

Table `owner_invites` (already specced at
`docs/contracts/owner-auth.md:84-94`). Verification endpoint is a Codex
deliverable — Claude calls it server-side from `/o/join/route.ts` only.

### 8.3 Motion

Native View Transitions for `/o/join` → `/o?welcome=1`. Gated on
`prefers-reduced-motion`. No new JS lib.

### 8.4 Files

- **New:** `apps/web/app/o/join/route.ts` — Route Handler, server-only,
  calls Codex verification endpoint, issues session, redirects.
- **New:** `apps/web/app/o/join/page.tsx` — handoff screen for the
  ambiguous-identity branch.
- **New:** `apps/web/app/o/join/_components/JoinHero.tsx` — clinic + pet
  presentation.
- **Edit:** `apps/web/proxy.ts` — verify `/o/join` passes through host
  routing. Today the matcher at `apps/web/proxy.ts:78` is broad enough
  that no edit should be needed; confirm and add a comment, not a change.

---

## 9. Codex hand-off section

Every item below is **Codex-lane** per `AGENTS.md`. Claude opens contracts
in `docs/contracts/` and does not implement these. Codex tickets get filed
first because everything else unblocks against them.

### 9.1 `shouldCreateUser: false` on staff magic link

- File: `apps/web/app/login/actions.ts:72`.
- Change: add `options.shouldCreateUser = false` to
  `supabase.auth.signInWithOtp(...)`.
- Acceptance: unknown email returns `email_not_authorized`; no
  `auth.users` row is created on send.

### 9.2 Supabase SSR session refresh in `apps/web/proxy.ts`

- File: `apps/web/proxy.ts:29-75`.
- Add an SSR Supabase client (`@supabase/ssr`) that reads/writes the
  session cookie via the proxy `NextRequest` / `NextResponse` so expired
  access tokens are refreshed transparently before reaching server
  components.
- Cookie names: staff `__Host-pc_staff_session`, owner
  `__Host-pc_owner_session` (matches `docs/contracts/owner-auth.md:26`).
- Acceptance: a user with an expired access token and a valid refresh
  token can reload `/inbox` or `/o` and not be bounced to login.

### 9.3 Rate limits

- 3 OTP requests / phone / hour (Twilio Verify + a Postgres counter).
- 5 verification attempts / OTP.
- 10 magic-link requests / email / day.
- 30 join-token attempts / IP / hour.
- Already enumerated at `docs/contracts/owner-auth.md:105-110`. Codex to
  implement.

### 9.4 Bot protection

- Turnstile or hCaptcha challenge on `/login` and `/o/login` submit, gated
  by IP-velocity. Token validated server-side before
  `signInWithOtp` / `requestOwnerOtp`. Frontend hook is a Claude task only
  once the Codex helper exists.

### 9.5 `auth_events` audit table

```sql
create table auth_events (
  id           uuid primary key default gen_random_uuid(),
  actor_kind   text not null check (actor_kind in ('clinic_staff','owner')),
  actor_id     uuid,
  clinic_id    uuid,
  event_type   text not null,        -- e.g. magic_link_requested, otp_verified, join_token_consumed
  ip_inet      inet,
  user_agent   text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
```

Rows written from every auth server action and the `/o/join` route
handler. Retained per existing retention policy. RLS: clinic admins can
read their own clinic's rows; owners cannot read.

### 9.6 Single `onboarding_progress` table

Per Claude's pushback against the three-table proposal:

```sql
create table onboarding_progress (
  actor_kind   text not null check (actor_kind in ('clinic_owner','clinic_staff','owner')),
  actor_id     uuid not null,
  clinic_id    uuid,                          -- nullable for owner rows that span clinics
  step         text not null,                 -- 'connect_whatsapp','invite_teammate','welcome_dismissed',...
  status       text not null check (status in ('todo','done','skipped')) default 'todo',
  completed_at timestamptz,
  metadata     jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  primary key (actor_kind, actor_id, step)
);
create index on onboarding_progress (actor_kind, actor_id);
```

Helper view `onboarding_summary` for the router: returns `is_first_run`
boolean per actor (true when no `done` rows exist for the actor's
required-steps set).

### 9.7 Activation event taxonomy

PostHog events Codex must register (Claude fires them via existing
analytics util):

- `clinic_connected_whatsapp` — fired when checklist step "Connect
  WhatsApp number" flips to `done`.
- `staff_first_reply_sent` — fired by inbox reply server action on first
  staff reply for that staff.
- `owner_first_thread_opened` — fired by owner chat route when the owner
  first opens a thread post-onboarding.
- `owner_push_enabled` — fired when owner accepts push (existing
  `docs/contracts/pwa-push.md` flow).

### 9.8 `/o/join` token verification endpoint

Server-only endpoint (or shared lib) that:

- Verifies HMAC signature against an env-held secret.
- Confirms `exp` not passed and `jti` not consumed.
- Atomically marks `owner_invites.consumed_at = now()` and returns the
  `{ clinic_id, phone, pet_id? }` payload.
- Returns typed error codes: `expired`, `consumed`, `invalid_signature`,
  `unknown_token`.

Claude's `/o/join/route.ts` is the only caller in v1.

### 9.9 Contract files Claude will open

- `docs/contracts/post-login-router.md` — Pillar 0 input contracts that
  Codex must populate (firstRun flag source, role source,
  `hasUnreadStaffReply` / `hasActiveRequest` query shapes).
- `docs/contracts/onboarding-progress.md` — §9.6 schema + which steps are
  "required" per actor kind.
- `docs/contracts/auth-events.md` — §9.5 schema + event_type catalog +
  RLS expectations.
- `docs/contracts/owner-join-token.md` — §9.8 endpoint + token payload.
- *(existing)* `docs/contracts/owner-auth.md` — referenced, not rewritten.

---

## 10. File map (consolidated, grouped by pillar)

### Pillar 0 — Post-login router

**New**

- `apps/web/lib/auth/post-login-router.ts`
- `apps/web/lib/auth/sanitize-staff-next-path.ts`
- `apps/web/lib/auth/last-route-cookie.ts` (client + server helpers)

**Edit**

- `apps/web/app/auth/callback/route.ts` — call router (instead of
  hard-coded redirect)
- `apps/web/app/o/auth/callback/route.ts` — call router
- `apps/web/app/o/login/actions.ts:235` — replace `redirect("/o")` with
  router call

### Pillar 1 — Branded auth screens

**New**

- `apps/web/app/(auth)/_components/AuthShell.tsx`
- `apps/web/app/(auth)/_components/BrandPane.tsx`
- `apps/web/app/o/login/_components/OtpCellsInput.tsx`

**Edit**

- `apps/web/app/login/page.tsx`
- `apps/web/app/o/login/page.tsx`
- `apps/web/app/o/login/_components/OtpForm.tsx`
- `packages/shared/src/i18n.ts` (or equivalent EN/ET/RU dictionary)

**Codex hand-off (do not implement)**

- `apps/web/app/login/actions.ts:72` (`shouldCreateUser: false`)
- `apps/web/proxy.ts:29-75` (SSR session refresh)

### Pillar 2a — Clinic owner first-run

**New**

- `apps/web/app/onboarding/clinic/page.tsx`
- `apps/web/app/onboarding/clinic/actions.ts`
- `apps/web/app/onboarding/clinic/_components/ClinicWelcomeHeader.tsx`
- `apps/web/app/onboarding/clinic/_components/SetupChecklist.tsx`
- `apps/web/app/onboarding/clinic/_components/ChecklistItem.tsx`

**Edit**

- `apps/web/app/_components/AppShell/*` — add progress chip slot

### Pillar 2b — Invited staff first-run

**New**

- `apps/web/app/onboarding/staff/page.tsx`
- `apps/web/app/onboarding/staff/actions.ts`
- `apps/web/app/onboarding/staff/_components/StaffOnboardingForm.tsx`

### Pillar 3 — Owner first-run on `/o`

**New**

- `apps/web/app/o/(authed)/_components/OwnerWelcomeStrip.tsx`
- `apps/web/app/o/(authed)/_components/NextStepCard.tsx`
- `apps/web/app/o/(authed)/_components/WhatHappensNextTile.tsx`
- `apps/web/app/o/(authed)/_components/IntakeSeededPetCard.tsx`

**Edit**

- `apps/web/app/o/(authed)/page.tsx`

### Pillar 4 — `/o/join` handoff

**New**

- `apps/web/app/o/join/route.ts`
- `apps/web/app/o/join/page.tsx`
- `apps/web/app/o/join/_components/JoinHero.tsx`

**Verify only**

- `apps/web/proxy.ts:78` (matcher already broad enough)

### Codex contracts

**New**

- `docs/contracts/post-login-router.md`
- `docs/contracts/onboarding-progress.md`
- `docs/contracts/auth-events.md`
- `docs/contracts/owner-join-token.md`

### Landing waitlist CTA (open question OQ-1 from upstream plan)

**Edit**

- `apps/web/app/page.tsx` — swap `mailto:` / `#pricing` CTAs for a
  `/waitlist` form. Note: waitlist storage + CSM inbox is its own
  Codex-lane micro-contract; Claude builds the form, Codex handles
  storage. Tracked as T01.5 below.

---

## 11. Ordered task list

Format: `Tnn — Title — Owner — Depends-on — Acceptance — Size (S/M/L)`.
Sizes: **S** ≤ ½ day, **M** ≤ 2 days, **L** > 2 days.

### Phase A — Codex unblocks (run first)

| ID | Title | Owner | Depends | Acceptance | Size |
|---|---|---|---|---|---|
| T01 | Open `docs/contracts/post-login-router.md` | Claude | — | Contract documents router inputs, firstRun source, role source, query shapes for `hasUnreadStaffReply` / `hasActiveRequest`. PR has Codex hand-off note. | S |
| T02 | Open `docs/contracts/onboarding-progress.md` | Claude | — | Contract documents single-table schema (§9.6) + required-steps map per actor kind + RLS expectations. | S |
| T03 | Open `docs/contracts/auth-events.md` | Claude | — | Contract documents §9.5 schema + event_type catalog (magic_link_requested, otp_requested, otp_verified, join_token_consumed, oauth_started, oauth_callback) + RLS. | S |
| T04 | Open `docs/contracts/owner-join-token.md` | Claude | — | Contract documents §9.8 endpoint shape + token payload + error codes. | S |
| T05 | Codex: `shouldCreateUser: false` on staff magic link | Codex | T03 | `apps/web/app/login/actions.ts:72` patched; unknown email → `email_not_authorized`; isolation test added. | S |
| T06 | Codex: Supabase SSR session refresh in `apps/web/proxy.ts` | Codex | — | Expired access token + valid refresh token reloads `/inbox` and `/o` without bouncing to login. Cookie names match `docs/contracts/owner-auth.md:26`. | M |
| T07 | Codex: `onboarding_progress` migration + `onboarding_summary` view | Codex | T02 | Migration applied; `is_first_run(actor_kind, actor_id)` returns expected booleans; RLS isolates by clinic. | M |
| T08 | Codex: `auth_events` migration + write helpers | Codex | T03 | Table exists; helper `writeAuthEvent(...)` callable from server actions; clinic-admin read RLS. | M |
| T09 | Codex: rate limits (3 OTP/hr, 5 verify, 10 magic/day, 30 join/hr) | Codex | T08 | Negative tests prove 4th OTP request blocks; 31st join attempt blocks. | M |
| T10 | Codex: `/o/join` token verification endpoint + `owner_invites` consume | Codex | T04 | Endpoint verifies HMAC, atomically consumes, returns typed errors. Replay attempt fails. | M |
| T11 | Codex: Bot protection helper (Turnstile) | Codex | — | Server helper accepts a token from FE and validates; failing token blocks `signInWithOtp` / `requestOwnerOtp`. | M |

### Phase B — Pillar 0 (router)

| T12 | Designer: Specify `pc_last_route_*` cookie semantics + role-default URLs | Designer | T01 | Design spec PR with route table per role + cookie scope diagram. | S |
| T13 | Developer (Claude): Implement `apps/web/lib/auth/post-login-router.ts` + sanitize helpers + cookie helpers | Claude | T01, T07, T12 | Pure function unit-tested with 12+ cases (every branch in §3.1). Cookie helper roundtrips. | M |
| T14 | Developer (Claude): Wire router into `/auth/callback`, `/o/auth/callback`, `verifyOwnerOtp` | Claude | T13 | All three callsites call router; old hardcoded `/inbox` / `/o` redirects removed. Typecheck + lint pass. | S |
| T15 | QA: Playwright scenarios for router (4 actor types × 3 cases) | QA | T14 | Tests cover: new admin → `/onboarding/clinic`; new staff → `/onboarding/staff`; returning vet with `next=/x` → `/x`; returning vet with last-visited cookie; returning vet no signal → role default; new owner → `/o?welcome=1`; returning owner with unread → `/o/chat`; returning owner default → `/o`. | M |

### Phase C — Pillar 1 (branded auth)

| T16 | Designer: AuthShell + BrandPane Figma + EN/ET/RU copy deck | Designer | — | Figma frames for desktop ≥ md and mobile; copy deck for all error codes with recovery sentences; brand pane assets exported. | M |
| T17 | Developer (Claude): Build `AuthShell` + `BrandPane` | Claude | T16 | Server component; supports `variant: "clinic" \| "owner"`; passes a11y (focus order, keyboard nav); reduced-motion fallback verified. | M |
| T18 | Developer (Claude): Invite-aware `/login` (`?invite=1` flow) | Claude | T17 | `?invite=1` swaps H1, sets email read-only, "Not you?" works. | S |
| T19 | Developer (Claude): `OtpCellsInput` segmented 6-cell + paste-fan + autocomplete=one-time-code | Claude | T17 | Mobile autofill works on iOS Safari + Android Chrome (manual smoke). Paste of 6-digit code populates all cells. A11y labels per cell. | M |
| T20 | Developer (Claude): Resend cooldown + channel switch (WhatsApp ↔ SMS) | Claude | T19 | Cooldown counts down; channel switch re-requests OTP via new channel. | S |
| T21 | Developer (Claude): Error copy with recovery for all codes (`apps/web/app/login/actions.ts:8` + `apps/web/app/o/login/actions.ts:23`) | Claude | T18, T20 | Every error code maps to a sentence + action; EN/ET/RU all present. | S |
| T22 | QA: Playwright for auth screens (clinic + owner, invited + cold) | QA | T21 | Covers invite link → branded `/login` → magic link sent; cold owner → OTP → success; bad OTP → recovery copy; expired magic link → recovery copy. | M |
| T23 | QA: A11y + EN/ET/RU parity on auth screens | QA | T21 | axe-core 0 violations on `/login` and `/o/login`; Russian strings don't truncate at 375 px and 1280 px. | S |

### Phase D — Pillar 2a (clinic owner first-run)

| T24 | Designer: `/onboarding/clinic` mocks + checklist copy (EN/ET/RU) | Designer | — | Figma frames desktop + mobile; checklist item copy + subtext + completion micro-copy. | M |
| T25 | Developer (Claude): `/onboarding/clinic` page + `markStepDone` action | Claude | T07, T13, T24 | Page renders for first-run admins only; `markStepDone` writes via the Codex helper; refresh preserves progress. | M |
| T26 | Developer (Claude): `SetupChecklist` + `ChecklistItem` components with deep links | Claude | T25 | Each item navigates to the correct sub-route with `?from=onboarding`; status chip updates optimistically. | M |
| T27 | Developer (Claude): AppShell progress chip slot | Claude | T25 | Chip appears in `AppShell` while onboarding is incomplete; opens drawer; disappears on completion. | S |
| T28 | Developer (Claude): Fire `clinic_connected_whatsapp` on WhatsApp step done | Claude | T26 | PostHog event fires once per clinic. | S |
| T29 | QA: Playwright happy path for `/onboarding/clinic` | QA | T28 | Sign-in as fresh admin → onboarding → complete all 5 → routed to `/inbox`. | M |
| T30 | QA: A11y + EN/ET/RU + reduced-motion on `/onboarding/clinic` | QA | T29 | axe-core clean; RU strings fit; reduced-motion removes all transitions. | S |

### Phase E — Pillar 2b (invited staff first-run)

| T31 | Designer: `/onboarding/staff` mock + copy | Designer | — | 1–2 screen Figma + copy deck. | S |
| T32 | Developer (Claude): `/onboarding/staff` page + form | Claude | T07, T13, T31 | Server component frame; client form posts to `actions.ts`; routes to role default on completion. | M |
| T33 | QA: Playwright for `/onboarding/staff` | QA | T32 | Fresh vet → onboarding → routes to `/inbox?q=mine&urgent=1`. | S |
| T34 | QA: A11y + i18n + reduced-motion on `/onboarding/staff` | QA | T33 | axe-core clean; EN/ET/RU; reduced-motion verified. | S |

### Phase F — Pillar 3 (owner first-run on `/o`)

| T35 | Designer: Owner welcome strip + next-step card + what-happens-next + seeded pet card | Designer | — | Figma mobile-first + desktop variant; copy for all four states (with-token / without-token / no-pets / with-pets). | M |
| T36 | Developer (Claude): `OwnerWelcomeStrip` + `NextStepCard` + `WhatHappensNextTile` + `IntakeSeededPetCard` | Claude | T07, T13, T35 | Components render correct copy per branch; reuse `PetCard` structure; reduced-motion safe. | M |
| T37 | Developer (Claude): Wire into `/o/(authed)/page.tsx` | Claude | T36 | First-run signal from `onboarding_progress` drives the strip; `?welcome=1` from router triggers explicitly. | S |
| T38 | Developer (Claude): Fire `owner_first_thread_opened` from chat route | Claude | T36 | Event fires once per owner. | S |
| T39 | QA: Playwright owner first-run | QA | T38 | New owner via `/o/join` → `/o?welcome=1` → opens chat → event fires; returning owner → no welcome strip. | M |
| T40 | QA: A11y + EN/ET/RU + reduced-motion on `/o` welcome strip | QA | T39 | axe-core clean; RU fits; reduced-motion removes motion. | S |

### Phase G — Pillar 4 (`/o/join` handoff)

| T41 | Designer: `/o/join` handoff screen + token-expired toast variant | Designer | — | Figma mobile-first; copy for "Continue as {petName}'s owner" + "This isn't me" + expired toast. | S |
| T42 | Developer (Claude): `/o/join/route.ts` calling Codex verification endpoint | Claude | T10, T13, T41 | Route verifies, consumes, issues session, redirects via router; expired token → `/o/login?reason=invite_expired&phone=...`. | M |
| T43 | Developer (Claude): `/o/join/page.tsx` + `JoinHero` confirmation screen | Claude | T42 | Renders clinic + pet from token payload; "Continue" consumes; "This isn't me" → `/intake`. | M |
| T44 | Developer (Claude): View Transitions between `/o/join` → `/o?welcome=1` | Claude | T43 | Transition runs at `motion.duration.base`; reduced-motion bypasses. | S |
| T45 | QA: Playwright for `/o/join` (happy + expired + consumed + invalid) | QA | T44 | All four branches assert correct redirect + toast + event row in `auth_events`. | M |
| T46 | QA: A11y + EN/ET/RU + reduced-motion on `/o/join` | QA | T45 | axe-core clean; RU fits; reduced-motion verified. | S |

### Phase H — Landing + final wiring

| T47 | Designer: `/waitlist` form mock + CSM-facing inbox mock | Designer | — | Figma + copy. | S |
| T48 | Codex: `/waitlist` storage table + CSM read endpoint | Codex | — | Migration + endpoint; rate-limited; spam-protected. | M |
| T49 | Developer (Claude): `/waitlist` form on landing CTA | Claude | T47, T48 | `apps/web/app/page.tsx` CTAs swap from `mailto:` to `/waitlist`; form submits to Codex endpoint; success state shows "We'll be in touch within 1 business day." | M |
| T50 | Developer (Claude): Bot-protection wiring on `/login` + `/o/login` + `/waitlist` | Claude | T11 | Turnstile token submitted with form; failing token blocked server-side. | S |
| T51 | QA: Cross-pillar Playwright "clinic invite → first activation" suite | QA | T29, T22 | Full path: waitlist → admin invite email → magic link → `/onboarding/clinic` → WhatsApp step → `/inbox` with `clinic_connected_whatsapp` event row. | L |
| T52 | QA: Cross-pillar Playwright "WhatsApp → owner first thread" suite | QA | T39, T45 | Full path: clinic-sent WhatsApp template → `/o/join?token=...` → `/o?welcome=1` → `/o/chat` with `owner_first_thread_opened` event row. | L |
| T53 | QA: Final verification gate (typecheck/lint/test/build + visual diff) | QA | T49, T50, T51, T52 | All four commands green; visual diff approved at 375 px + 1280 px on every new/edited screen. | M |

---

## 12. Verification plan

Per `AGENTS.md` "Definition of Done" + `CLAUDE.md` UI verification + the
QA / a11y / frontend rules in `.claude/rules/*.md`.

### 12.1 Commands (run before every PR)

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e` (Playwright)
- `npm run test:visual` (screenshot diff)

If any command is missing for the affected workspace, add it as part of
the task rather than declare verification passed.

### 12.2 Playwright scenarios (matrix)

| Scenario | Started by | Ends at | Activation event |
|---|---|---|---|
| Clinic invite happy path | `/login?invite=1&email=` | `/inbox` post checklist | `clinic_connected_whatsapp` |
| Invited vet happy path | `/login?invite=1` (role=vet) | `/inbox?q=mine&urgent=1` | — |
| Returning admin with `next=/settings/billing` | `/login` | `/settings/billing` | — |
| Returning vet with last-visited cookie | `/login` | last route | — |
| Returning vet, no signals | `/login` | `/inbox?q=mine&urgent=1` | — |
| Unknown staff email | `/login` | `/login?error=email_not_authorized` | — |
| Owner WhatsApp deep link happy | `/o/join?token=<valid>` | `/o?welcome=1` → `/o/chat` | `owner_first_thread_opened` |
| Owner WhatsApp expired token | `/o/join?token=<expired>` | `/o/login?reason=invite_expired` | — |
| Owner WhatsApp consumed token | `/o/join?token=<consumed>` | `/o/login?reason=invite_expired` | — |
| Owner WhatsApp invalid signature | `/o/join?token=<bad>` | `/o/login?reason=invite_expired` | — |
| Owner cold OTP, new owner | `/o/login` | `/o?welcome=1` | — |
| Owner cold OTP, returning + unread | `/o/login` | `/o/chat` | — |
| Owner cold OTP, returning + idle | `/o/login` | `/o` | — |

Plus the negative cases from §11 T15 / T22 / T45.

### 12.3 Accessibility

- axe-core / Lighthouse: 0 critical violations on every new screen.
- Focus order matches visual order on `AuthShell`, `SetupChecklist`,
  `OwnerWelcomeStrip`, `JoinHero`.
- All icon-only buttons have accessible names.
- OTP cells have explicit `aria-label` per cell ("Digit 1 of 6", …).
- Visible focus styles preserved.

### 12.4 Screenshot review

- 375 px and 1280 px for every new screen.
- Light and dark theme if both are active in this round.
- Captured at: `/login`, `/login?invite=1`, `/o/login`, `/o/login` with
  filled OTP cells, `/onboarding/clinic` (states 0%, 60%, 100%),
  `/onboarding/staff`, `/o` welcome strip, `/o/join` handoff.

### 12.5 EN/ET/RU parity

- Every new string lands in the dictionary.
- Russian rendering verified at 375 px on:
  - OTP labels and resend cooldown
  - Checklist item titles + subtext
  - Welcome strip heading
  - Error recovery sentences (longest copy)
- Et and Ru both verified for AppShell progress chip.

### 12.6 Reduced-motion run

- DevTools "prefers-reduced-motion: reduce" set; reload each new screen.
- Confirm: no transforms, no fade-ups, no view transitions, no rotating
  brand-pane quote; static fallback is fully usable and looks intentional.

### 12.7 Security touchpoints (Codex review, Claude flags)

- `shouldCreateUser: false` confirmed at runtime via Supabase logs.
- Rate-limit responses observed at 4th OTP / 31st join attempt.
- `auth_events` rows present for every Playwright run (one row per
  action).
- `owner_invites.consumed_at` set after first successful consumption,
  replay returns `consumed`.

### 12.8 Open questions to resolve at implementation time

- OQ-1: `/waitlist` storage location — Codex T48 decides between a new
  `waitlist` table and an existing CRM relay.
- OQ-2: Seeded demo conversation source for the clinic checklist test
  step — recommend hardcoded fixture (cannot leak across tenants).
- OQ-3: Owner "first-run" derivation — primary signal is
  `onboarding_progress` row absence; secondary is no `request_events`
  rows for the owner. Confirm with Codex during T07.

---

## 13. Sequencing summary

The dependency graph collapses to four waves a Developer can execute
linearly:

1. **Wave 1 — Contracts and Codex unblockers:** T01–T11. Claude writes
   the four contracts; Codex ships migrations + auth fixes + rate limits
   + `/o/join` token endpoint. No Claude UI work blocks here.
2. **Wave 2 — Router + branded auth:** T12–T23. Once T05–T08 land,
   Claude builds the router (T13–T14) and the AuthShell (T17–T21).
3. **Wave 3 — First-run surfaces:** T24–T40. Three parallel tracks
   (clinic admin / invited staff / owner) all depend on T07 + T13.
4. **Wave 4 — Handoff + landing + cross-pillar QA:** T41–T53.
   `/o/join` plumbing, waitlist CTA, full end-to-end Playwright suites,
   final verification gate.

A Developer starting at T01 and finishing at T53 ships the full redesign
with every hand-off, contract, and QA gate covered.
