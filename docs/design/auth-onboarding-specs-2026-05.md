# PetCura Auth + Onboarding — Designer Spec (2026-05)

> Companion to `/Users/reza/Workspace/Ludaxis/PetCura/docs/design/auth-onboarding-merged-plan-2026-05.md`.
> Intended target path: `/Users/reza/Workspace/Ludaxis/PetCura/docs/design/auth-onboarding-specs-2026-05.md`.
> Authored by Designer. Implemented by Developer (Claude). Codex-lane items already captured in `docs/contracts/` per the merged plan §9 and are not respec'd here.

Scope: every screen the Developer ships in Pillars 0–4. ASCII wireframes are descriptive, not pixel-faithful. All numeric sizes are guidance, not law — they collapse cleanly to existing tokens in `apps/web/app/globals.css`.

---

## 0. Global rules (apply to every screen)

### 0.1 Tokens

- Background: `var(--paper)`; surfaces inset to `var(--soft)` where a second tier is needed (e.g. brand pane background).
- Text: `var(--ink)` body, `var(--muted)` secondary, `var(--primary-strong)` for sage emphasis.
- Border: `var(--line)` default, `var(--line-2)` for outlined cards on `--soft`.
- Radius: `var(--radius)` (8px) standard, `var(--radius-xl)` (12px) for the auth card outer container only.
- Focus ring: inherit from `globals.css:253-256` (3px sage outline, offset 2px). Never remove.

### 0.2 Type scale (Montserrat, already loaded)

- H1: `text-2xl font-semibold leading-tight` (24px / 1.2) for auth and onboarding titles.
- H2: `text-lg font-semibold` (18px) for checklist item titles, section headers.
- Body: `text-sm leading-6` (14px / 1.5) for help text.
- Eyebrow: `text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]` — reuses the pattern at `apps/web/app/o/login/page.tsx:47-49`.

### 0.3 Density

- Mobile gutter: `px-4` (16px). Desktop content gutter: `px-6` to `px-8`.
- Vertical rhythm: `gap-5` between major blocks, `gap-3` inside a card, `gap-2` for label→input.
- Form fields: `h-11` (44px) — meets touch target on mobile, matches `login/page.tsx:97`.

### 0.4 Motion baseline

- Default transition: `var(--motion-base)` (240ms) with `var(--ease-standard)`.
- Fade-up on enter: opacity `0 → 1`, transform `translateY(var(--motion-rise-md)) → 0`. Both tokens zero under reduced motion (see `globals.css:571-588`), so the static fallback needs no extra code — just author the transform/opacity transition once.
- Banned: width/height animation, color animation outside the existing status pill exception, autoplay video, parallax, marquee, letter-by-letter typography, confetti, modal tours, spotlights.
- Clinic/owner app: View Transitions + CSS only. No `motion/react`, no `gsap` (confirmed by `docs/design/motion-system-2026-05.md:25-30`).

### 0.5 i18n

- New copy goes in **two dictionary files**:
  - Clinic-side strings (router transient states, `/login`, `/onboarding/clinic`, `/onboarding/staff`) → `packages/shared/src/i18n.ts` (uses the existing `auth.*`, `nav.*` namespaces — extend with `onboarding.clinic.*`, `onboarding.staff.*`, `auth.invite.*`, `auth.error.*`, `router.*`).
  - Owner-side strings (`/o/login` OTP cells / cooldown / channel swap, `/o/join`, `/o` welcome strip) → `apps/web/lib/owner/i18n.ts` (extend existing `login.*` namespace and add `join.*`, `home.welcome.*`, `home.nextStep.*`, `home.journey.*`).
- Russian is the longest. **Test every label at 375px against the Russian string.** Highest-risk labels: resend cooldown, error recovery sentences, "Continue as {petName}'s owner".
- Keys use dot.case to match existing patterns (`login.otp.title`, `home.greeting`). Do not introduce a new convention.

### 0.6 Accessibility floor

- One `<h1>` per route, matches the visible H1.
- All form controls have `<label htmlFor>` or `aria-label`. No floating labels (they fail RU expansion).
- All icon-only buttons get a localized `aria-label`. The existing PostCura `LanguageSwitcher` chip is the reference (`apps/web/components/language-switcher.tsx`).
- Focus order matches visual order. No `tabIndex` > 0.
- Live regions: forms use `role="status"` for sent-state, `role="alert"` for errors. Already established at `login/page.tsx:72,81`.
- OTP cells need a per-cell `aria-label` ("Digit 1 of 6", "Digit 2 of 6", …) — `aria-describedby` points to the helper text once.

### 0.7 Layout conventions

- Auth and onboarding are **standalone full-bleed routes**. They do not render inside `AppShell` (the `data-app-shell` body-fixed lock at `globals.css:228-239` would break form scrolling on mobile).
- `/onboarding/clinic` and `/onboarding/staff` are an exception: they *may* render inside a thin AppShell variant that exposes the progress chip slot. Detailed in §5.

---

## 1. Pillar 0 — Post-login router transient states

The router itself is a server function (`apps/web/lib/auth/post-login-router.ts`, per merged plan §3.1). The user never lands on a "router page", but there are two transient surfaces the Designer specs because the user *can* see them.

### 1.1 Post-callback skeleton (rare, < 200ms)

**When seen:** between `/auth/callback` (or `/o/auth/callback`) returning and the destination route streaming. In practice the SSR redirect happens before any HTML paints, so the skeleton is only seen on slow networks or when an in-flight `Suspense` boundary holds. We still spec it so it doesn't read as a broken state.

**Route / file:** rendered by the **`loading.tsx`** sibling of `auth/callback/route.ts` if it exists; otherwise inline in `app/auth/callback/loading.tsx` and `app/o/auth/callback/loading.tsx`. No new top-level route.

**Layout (mobile 375 / desktop ≥768 identical):**

```
┌───────────────────────────────────────────────┐
│                                               │
│                                               │
│              [ sage paw icon ]                │
│                                               │
│              Setting things up…               │
│              [pc-progress bar, 2px]           │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
```

- Centered. Vertical: `min-h-dvh`, flex-center.
- Paw icon: 32×32, `var(--primary)` on `var(--primary-soft)` 40×40 rounded.
- Heading: H1, but rendered as `<p role="status" aria-live="polite">` to avoid SR users navigating into a transient page. Visually styled as H1 (`text-2xl`).
- Progress bar: existing `.pc-progress` class (`globals.css:323-340`) — 2px tall, sage shimmer, indeterminate.

**Components:** none new. Reuse `pc-progress` class.

**Copy (EN; one key, three locales):**

| Key | EN | ET | RU (longest) |
|---|---|---|---|
| `router.transient.settingUp` | Setting things up… | Valmistame ette… | Подготавливаем всё для вас… |

**States:** one — this is itself a loading state.

**Motion:** `pc-progress` only. Reduced-motion: bar becomes a static 50% opacity sage block (already handled at `globals.css:342-348`).

**A11y:** `role="status" aria-live="polite"`; `<title>` set to "PetCura — Setting things up". No tab targets.

**Open product questions:**
- `Q1`: Should we show a 4-second "stuck?" link to `/o/login` or `/login` if the redirect somehow stalls? Recommendation: yes, but only after 4s. Implement with a CSS `animation-delay` on the link's opacity so JS isn't required. Flag for product.

### 1.2 "We couldn't place you" fallback

**When seen:** the router's data fetches throw, or the actor's `firstRun` flag is undeterminable. Should be essentially never; if it happens, we route users *back* to a sign-in surface rather than into a dashboard with no role.

**Route / file:** `apps/web/app/auth/callback/error/page.tsx` (clinic) and `apps/web/app/o/auth/callback/error/page.tsx` (owner). The route handler redirects to one of these with `?reason=routing_failed` instead of throwing.

**Layout (mobile 375 / desktop ≥768 — same single-column card, max-w 28rem):**

```
┌───────────────────────────────────────────────┐
│  [paw icon]  PetCura                          │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │  We couldn't place you just yet         │  │  H1 (text-2xl)
│  │                                         │  │
│  │  Your account is signed in, but we      │  │  body, --muted
│  │  couldn't match it to a clinic profile. │  │
│  │  Please sign in again, or contact your  │  │
│  │  clinic.                                │  │
│  │                                         │  │
│  │  [ Try signing in again → ]   primary   │  │  Button
│  │  [ Contact your clinic ]      secondary │  │  mailto: per AGENTS
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- Card: `Panel` from `@petcura/ui` with `p-5 sm:p-6`.
- The two CTAs stack on mobile (full width), sit side-by-side on desktop.
- "Try signing in again" links to `/login` (clinic variant) or `/o/login` (owner variant). The button must clear any stale Supabase session cookies first — call a `signOutAndRedirect` server action.
- "Contact your clinic" opens a `mailto:` placeholder until Codex finalizes the support channel (track as `Q2`).

**Components:**
- `Panel` (reused).
- `Button variant="primary"` + `Button variant="secondary"`.

**Copy:**

| Key | EN | ET notes | RU notes |
|---|---|---|---|
| `router.fallback.heading` | We couldn't place you just yet | — | Cyrillic ~45 chars; verify fit on 375 px (`375 - 32 gutter = 343` content). |
| `router.fallback.body` | Your account is signed in, but we couldn't match it to a clinic profile. Please sign in again, or contact your clinic. | Same shape | Russian likely 1.5× length — single block, no inline `<br>`; let it wrap naturally. |
| `router.fallback.retry` | Try signing in again | — | "Войти заново" — short. |
| `router.fallback.contact` | Contact your clinic | — | "Связаться с клиникой" — short. |

**States:**
- Default (only state). No loading, no success.

**Motion:** `Reveal` token-driven fade-up on mount, `var(--motion-base)`, opacity + translateY. Reduced motion: static. No infinite animations.

**A11y:**
- H1 visible, semantic.
- Both CTAs are real `<button>` or `<a>` with text labels — no icon-only.
- Focus order: H1 (skip) → body (skip) → primary CTA → secondary CTA.

**Open product questions:**
- `Q2`: Per-locale support address for "Contact your clinic" — depends on Codex T48 (waitlist storage) decision. Until then, use `support@petcura.app`.

---

## 2. Pillar 1 — Branded auth screens

### 2.1 `AuthShell` (shared)

**Route / file:** `apps/web/app/(auth)/_components/AuthShell.tsx`. Server component. Hosts both `/login` (clinic) and `/o/login` (owner). Co-located route group `(auth)` does **not** alter URLs.

**Props sketch:**

```ts
type AuthShellProps = {
  variant: "clinic" | "owner";
  /** When present, swaps left-pane H1/eyebrow to invite-aware copy. */
  invite?: { clinicName: string; email?: string };
  /** Localized strings — server component looks them up from the dictionary. */
  locale: SupportedLocale;
  /** Slot — the actual form (magic link or OTP). */
  children: ReactNode;
  /** Path used by LanguageSwitcher to preserve params. */
  currentPath: string;
};
```

**Layout — mobile (< md, 375 baseline):**

```
┌──────────────────────────────────────┐
│  [paw icon]              [EN ▾]      │  56px header strip, sticky
│                                      │
│  [animated brand strip, 8vh, no copy]│  see BrandPane mobile variant
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Welcome to PetCura            │  │  H1
│  │  Sign in with the email your   │  │  body, --muted
│  │  clinic invited.               │  │
│  │                                │  │
│  │  [form children render here]   │  │  slot
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  [tiny EU residency footer chip]     │
└──────────────────────────────────────┘
```

**Layout — desktop (≥ md, 768+):**

```
┌────────────────────────────────────────────────────────────────┐
│  [paw icon]  PetCura                                  [EN ▾]   │  64px
│                                                                │
│  ┌──────────────────────────────┬──────────────────────────┐   │
│  │                              │                          │   │
│  │  [eyebrow: CLINIC INBOX or   │                          │   │
│  │   OWNER APP]                 │   ┌──────────────────┐   │   │
│  │                              │   │  rotating quote  │   │   │
│  │  Welcome to PetCura          │   │  attribution     │   │   │
│  │  (or "Welcome to {clinic}")  │   │                  │   │   │
│  │                              │   │  stripped         │   │   │
│  │  {form children render here} │   │  pc-loop-trail    │   │   │
│  │                              │   │  motif behind     │   │   │
│  │  [error / status block]      │   │  frosted glass    │   │   │
│  │                              │   │                   │   │   │
│  │  [help link]                 │   └──────────────────┘   │   │
│  │                              │                          │   │
│  └──────────────────────────────┴──────────────────────────┘   │
│  left 56% (form pane)             right 44% (brand pane)       │
│                                                                │
│  [EU residency + privacy footer, two links]                    │
└────────────────────────────────────────────────────────────────┘
```

- Outer wrapper: `min-h-dvh grid md:grid-cols-[1.25fr_1fr]`. On mobile, brand pane becomes a thin animated strip *above* the form (`h-[8vh]`, max 96px).
- Form pane background: `var(--paper)`. Brand pane background: `var(--soft)` with a subtle sage radial gradient (`from-[var(--primary-soft)] via-transparent`).
- Card inside form pane: reuses `Panel` styling but **without** the outer border on desktop (the pane edge does the framing). On mobile, `Panel` with full border + `var(--radius-xl)` matches the existing `/o/login` look at `apps/web/app/o/login/page.tsx:42`.
- Footer (EU residency / privacy): small text-xs row, `--muted`, two underlined links.

**Components used:**
- `@petcura/ui`: `Panel`, `Button`, `Badge`.
- New: `BrandPane` (§2.2).
- Reused: `LanguageSwitcher` from `apps/web/components/language-switcher.tsx`.

**States:**
- `variant="clinic"`: eyebrow reads `CLINIC INBOX`, brand pane quote rotates from a clinic-focused set (3 quotes).
- `variant="owner"`: eyebrow reads `OWNER APP`, brand pane uses owner-focused quote set.
- `invite` prop present → eyebrow + H1 swap to invite copy (per `/login` spec §2.3 below).

**Motion:**
- Form panel fade-up on mount: `opacity 0→1`, `translateY(var(--motion-rise-md))→0`, duration `var(--motion-base)`, ease `var(--ease-enter)`. Pure CSS, applied via a `[data-mount]` attribute toggle on the wrapper.
- Form field labels stagger: `var(--motion-stagger-base)` between siblings, capped at 4 cascade slots so the form feels arrived-at after ~320ms.
- Brand pane quote crossfade every 9s. Implemented as a CSS keyframe cycling 3 children opacity (no JS scheduler). Reduced-motion: hides cycle, shows quote #1 statically.
- Static fallback: under `prefers-reduced-motion: reduce`, the rise resolves to 0 and durations to 0.01ms (already wired by `globals.css:571-588`). No extra code per primitive — but the developer must verify the form does not need `animation: none` to clear the brand-pane crossfade (which is keyframe-driven and needs the explicit zero from the dedicated rule below).

**A11y:**
- Single `<main>` per page. `AuthShell` provides the landmark; children must not nest another `<main>`.
- Brand pane is `aria-hidden="true"` on desktop, completely absent (CSS `hidden md:block`) on mobile (mobile keeps just an 8vh decorative strip with `role="presentation"`).
- LanguageSwitcher is a real `<button>` dropdown with `aria-haspopup="listbox"` (already implemented).
- Skip link not required — the form is the page's only landmark target.

**Open product questions:**
- `Q3`: Final quote set for `BrandPane`. Recommend 3 testimonial pulls from the landing testimonial deck (already vetted), filtered per variant. Owner quotes use pet-parent voice ("My clinic answers in minutes now"), clinic quotes use staff voice.

### 2.2 `BrandPane`

**Route / file:** `apps/web/app/(auth)/_components/BrandPane.tsx`. Server component (no interactivity).

**Props sketch:**

```ts
type BrandPaneProps = {
  variant: "clinic" | "owner";
  /** Localized quote strings, picked from dictionary. */
  quotes: Array<{ body: string; attribution: string }>;
};
```

**Layout (desktop only; mobile renders the 8vh strip variant — same component, different class):**

```
┌────────────────────────────────────────┐
│                                        │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │  "Owners love the WhatsApp       │  │
│  │   replies — they feel heard      │  │  italic, text-lg
│  │   without us drowning in calls." │  │
│  │                                  │  │
│  │   — Dr. Mari, Tartu Loomakliinik │  │  small, --muted
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│           [pc-loop-trail glyph]        │  vertical 2px sage trail,
│                                        │  centered, behind glass
│                                        │
└────────────────────────────────────────┘
```

- Background: `var(--soft)` with a radial sage glow.
- Quote card: 80% width, centered, on a translucent `var(--paper)` with `border-[var(--line-2)]` and `backdrop-blur-sm`. Sits at ~30% vertical.
- `pc-loop-trail` behind glass: a single 2px-wide vertical sage line, ~40% height of pane, animated via the existing `.pc-loop-trail` class (`globals.css:507-509`). Reduced motion: still rendered, no animation.
- Three quote slots; only one visible at a time via opacity (others `opacity-0 pointer-events-none`).

**Components:** none from `@petcura/ui`; pure layout.

**Copy (per variant, 3 each, localized):**

Clinic quotes — `auth.brandPane.clinic.quote1` … `quote3` and `…attribution1` … `attribution3`.
Owner quotes — `auth.brandPane.owner.quote1` … `quote3`.

| Key | EN |
|---|---|
| `auth.brandPane.clinic.quote1` | "Owners love the WhatsApp replies — they feel heard without us drowning in calls." |
| `auth.brandPane.clinic.attribution1` | — Dr. Mari, Tartu Loomakliinik |
| `auth.brandPane.owner.quote1` | "I get straight answers from the vet without phone tag." |
| `auth.brandPane.owner.attribution1` | — Anna, owner of two cats |

(Reviewer can swap final voices; structure is what matters.)

**States:** one. No loading, no empty (quotes are bundled at build).

**Motion:**
- Crossfade: 3 children, each visible for 6s with a 3s overlap (so the pane is always showing one). Implemented as `@keyframes pc-brand-quote-cycle` with three children using `animation-delay` 0s / 6s / 12s on an 18s cycle. Property: `opacity` only.
- Trail: existing `.pc-loop-trail`, 14s cycle. No new code.
- Reduced motion: dedicated rule sets both animations to `none`; shows `quote1` only.

**A11y:**
- Entire pane `aria-hidden="true"` — it is decorative, the form pane carries the meaning.
- No focus targets inside.

**Open product questions:** see `Q3`.

### 2.3 `/login` — clinic magic link

**Route / file:** `apps/web/app/login/page.tsx` (existing — wrap in `AuthShell`).

**Layout (form pane — desktop slot; mobile uses same shape full-width):**

```
┌──────────────────────────────────────┐
│  [eyebrow: CLINIC INBOX]             │
│                                      │
│  Welcome back                        │   H1, when no invite
│                                      │
│  Sign in with the email your clinic  │   body, --muted
│  uses for PetCura.                   │
│                                      │
│  ── Email ──                         │   label
│  [name@clinic.ee              ]      │   input, h-11
│                                      │
│  [  Send sign-in link        →  ]    │   Button primary, full width
│                                      │
│  ──────────────────────────────────  │   separator
│                                      │
│  Don't have access? Ask an admin     │   help link, --muted
│  to invite you, or join our          │   underline
│  waitlist →                          │
│                                      │
└──────────────────────────────────────┘
```

**Layout — invited variant (`?invite=1&email=name@x&clinic=...`):**

```
┌──────────────────────────────────────┐
│  [eyebrow: INVITE]                   │
│                                      │
│  Welcome to {clinicName}             │   H1
│                                      │
│  We'll email you a one-time           │   body, --muted
│  sign-in link to finish setup.       │
│                                      │
│  ── Email ──                         │
│  [name@clinic.ee   ] [ Not you? ]    │   read-only input + link
│                                      │
│  [  Send sign-in link        →  ]    │   primary CTA
│                                      │
│  ──────────────────────────────────  │
│                                      │
│  By continuing, you agree to our      │   small print
│  Terms and Privacy Policy.            │
│                                      │
└──────────────────────────────────────┘
```

- "Not you?" is a `Button variant="ghost" size="sm"` inline next to the read-only email. On click, strips `invite`, `email`, `clinic` from the URL via `router.replace` and re-renders cold sign-in. Server component branch reads the post-strip URL.
- Read-only email: `<input readOnly aria-readonly="true" tabIndex={-1}>` styled with `bg-[var(--soft)]` so it's visually identifiable.

**Components:**
- New: `AuthShell` (variant="clinic"). Wraps the existing form `<form action={signInWithMagicLink}>`.
- Reused: `Panel`, `Button`, `Badge`.

**Copy:**

| Key | EN | ET notes | RU notes |
|---|---|---|---|
| `auth.login.eyebrowClinic` | Clinic inbox | Kliiniku sisendkast | Кабинет клиники |
| `auth.login.eyebrowInvite` | Invite | Kutse | Приглашение |
| `auth.login.headingCold` | Welcome back | Tere tulemast tagasi | С возвращением |
| `auth.login.headingInvite` | Welcome to {clinicName} | Tere tulemast {clinicName} | Добро пожаловать в {clinicName} |
| `auth.login.bodyCold` | Sign in with the email your clinic uses for PetCura. | Logi sisse kliiniku PetCura e-postiga. | Войдите с помощью email, который ваша клиника использует в PetCura. |
| `auth.login.bodyInvite` | We'll email you a one-time sign-in link to finish setup. | Saadame ühekordse sisselogimislingi. | Мы отправим одноразовую ссылку для входа на этот адрес. |
| `auth.login.emailLabel` | Email | E-post | Эл. почта |
| `auth.login.notYou` | Not you? | Pole sina? | Это не вы? |
| `auth.login.sendLink` | Send sign-in link | Saada sisselogimislink | Отправить ссылку для входа |  ← longest at 28 chars
| `auth.login.help` | Don't have access? Ask an admin to invite you, or **join our waitlist**. | Pole ligipääsu? Palu administraatorit sind kutsuda või **liitu ootenimekirjaga**. | Нет доступа? Попросите администратора пригласить вас или **присоединитесь к листу ожидания**. ← bold link |
| `auth.login.terms` | By continuing, you agree to our [Terms](…) and [Privacy](…). | inline links | inline links |

The `auth.login.sendLink` Russian string is ~33 chars; the primary button is full-width inside the form pane, so it has 100% of the form's content width (~360px on mobile, ~480px on desktop). Verified comfortable at both widths.

**States:**

| State | Trigger | Treatment |
|---|---|---|
| Default cold | `/login` | As shown (cold variant). |
| Invited | `?invite=1&email=&clinic=` | As shown (invite variant). |
| Loading | Form submit | Button shows inline spinner (reuse existing `Loading` primitive); button disabled. |
| Sent | `?sent=1` (existing) | `role="status"` block above the form: "Check your email — link sent to {email}. It expires in 15 minutes." |
| Error | `?error=…` | `role="alert"` block above the form with the recovery sentence (see §2.5). |

**Motion:**
- Inherits `AuthShell` fade-up + label stagger.
- Sent-state status block: fade-in via `Reveal`, `var(--motion-base)`, opacity only.
- Error block: same fade-in, but `aria-live="assertive"` so AT users hear it on appearance.

**A11y:**
- Single `<h1>`.
- Email input has `<label htmlFor="email">` (already correct at `login/page.tsx:92-94`).
- Read-only state announced via `aria-readonly`.
- "Not you?" is a `<button>` (link semantics misleading because it triggers a client navigation with a side effect of clearing params).
- Submit button has no icon-only state — always has "Send sign-in link" text.

**Open product questions:**
- `Q4`: Should "Don't have access" route to `/waitlist` (Phase H, T49) or `mailto:`? Recommendation: route to `/waitlist` once T49 lands; until then, link to landing `/#waitlist` anchor or `mailto:hello@petcura.app`.

### 2.4 `/o/login` — owner phone OTP

**Route / file:** `apps/web/app/o/login/page.tsx` (existing — wrap in `AuthShell variant="owner"`).

**Layout — phone step (mobile 375; desktop uses same shape inside form pane):**

```
┌──────────────────────────────────────┐
│  [eyebrow: OWNER APP]                │
│                                      │
│  Welcome                             │   H1
│                                      │
│  Sign in with the phone number       │   body, --muted
│  your clinic has on file.            │
│                                      │
│  ── Phone number ──                  │
│  [+372 5XXX XXXX              ]      │   input, h-11
│                                      │
│  [  Continue                  →  ]    │  primary CTA
│                                      │
│  ──────── or ────────                │
│                                      │
│  [ G  Continue with Google     ]    │  secondary
│                                      │
│  Number not working? Ask your clinic │  help, --muted
│  to invite you.                      │
└──────────────────────────────────────┘
```

**Layout — OTP step (the heart of the upgrade):**

```
┌──────────────────────────────────────┐
│  [← Use a different number]          │   back link, ghost
│                                      │
│  Enter your code                     │   H1
│                                      │
│  We sent a 6-digit code to           │   body, --muted
│  +372 5XXX XXXX via WhatsApp.        │
│                                      │
│  ┌──┬──┬──┬──┬──┬──┐                 │
│  │ 4│ 7│ 2│ _│ _│ _│                 │   6 segmented cells
│  └──┴──┴──┴──┴──┴──┘                 │   54×54 mobile, 56×56 desk
│                                      │
│  [  Verify                   →  ]    │   primary, disabled until 6
│                                      │
│  Didn't get it? Resend in 0:42       │   countdown link, --muted
│                                      │
│  Try SMS instead →                   │   channel switch, ghost
└──────────────────────────────────────┘
```

**Phone step components:**
- Reuse existing `OtpForm` shell (`apps/web/app/o/login/_components/OtpForm.tsx`).
- Phone input: existing pattern (`type="tel"`, `inputMode="tel"`, `autoComplete="tel"`).
- OAuth button: existing `OAuthButton` at lines 41-69. Verify "Continue with Apple" lands as soon as the Codex flow exists (Apple is out of scope this round per Pillar 1).

**OTP step components:**
- New: `OtpCellsInput` (`apps/web/app/o/login/_components/OtpCellsInput.tsx`). See §2.4.1.
- Resend cooldown: a `<button type="button">` with state-driven label; disabled when cooldown > 0.
- Channel switch: secondary `<button>` that re-requests OTP with the alternate channel.

#### 2.4.1 `OtpCellsInput` — segmented 6-cell input

**Component contract:**

```ts
type OtpCellsInputProps = {
  /** Current 0..6-character code. */
  value: string;
  onChange: (next: string) => void;
  /** Fires when 6 digits are present (autofill or manual). */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  /** ID prefix for cell aria-label localization. */
  idPrefix?: string;
  /** Localized per-cell label template, e.g. "Digit {n} of 6". */
  cellLabelTemplate: string;
  /** Localized helper / describedby text id. */
  helperTextId?: string;
};
```

**Behavior:**

- 6 `<input>` elements rendered in a single row, each `type="text"`, `inputMode="numeric"`, `pattern="[0-9]*"`, `maxLength={1}`, `autoComplete="one-time-code"` on the **first cell only** (iOS heuristic; the rest get `autoComplete="off"`). When iOS / Android offers a 6-digit suggestion above the keyboard, accepting it produces a *single keystroke* of all 6 digits into cell 1 — the input handler must detect that (`event.target.value.length > 1`) and fan it out to all cells, focusing the last filled cell or the submit button.
- Paste: pasting into any cell with a 6-digit string fans out and triggers `onComplete`. Non-digit characters stripped silently.
- Backspace on an empty cell focuses the previous cell *and* clears it.
- Arrow left/right navigates between cells.
- Visual: each cell is 48×54 (mobile) / 56×56 (desktop), border `var(--line)`, focus border `var(--primary)` with 3px sage outline (reuses `:focus-visible` from globals). Filled cell shows the digit in `text-2xl font-semibold leading-none`. Caret hidden when filled (`caret-color: transparent` on cells with a value).
- Cell gap: `gap-1.5` (6px) — 6 cells * 48 + 5 * 6 = 318 px, fits 343 content width on 375 mobile with margin.

**A11y:**
- Each cell has `aria-label="{cellLabelTemplate replaced for n}"` (e.g. "Digit 1 of 6").
- The whole input is wrapped in a `<div role="group" aria-labelledby="otp-label" aria-describedby="{helperTextId}">` where `otp-label` is the visible H1 "Enter your code".
- Submit button is disabled until `value.length === 6`; the disabled state is `aria-disabled="true"` not `disabled`, so SR users still hear the button.

**i18n keys:**

| Key | EN | ET | RU |
|---|---|---|---|
| `login.otp.cellLabel` | Digit {n} of 6 | Number {n} 6-st | Цифра {n} из 6 |
| `login.otp.helper` | Paste or type the 6-digit code | Kleebi või sisesta 6-kohaline kood | Вставьте или введите 6-значный код |

**Motion:**
- Cell fill: instant. No animation — animating a digit appearing reads as "broken keyboard".
- On successful verify: a 240ms `var(--motion-base)` sage outline pulse on all 6 cells, then route transition. Reduced motion: skip pulse.
- On invalid code: cells shake — but **shake is banned** under reduced motion *and* we want to avoid layout thrash. Replacement: cells flash red border (`border-[var(--red)]`) for 240ms then revert. Property: `border-color` exception is permitted here because shake is worse for accessibility and the existing status-pill exception in `globals.css:603-605` already establishes the precedent.

**OTP step copy:**

| Key | EN | ET | RU |
|---|---|---|---|
| `login.otp.title` (existing) | Enter your code | Sisesta kood | Введите код |
| `login.otp.subtitleWhatsApp` | We sent a 6-digit code to {phone} via WhatsApp. | Saatsime 6-kohalise koodi {phone} WhatsAppi. | Мы отправили 6-значный код на {phone} через WhatsApp. |
| `login.otp.subtitleSms` | We sent a 6-digit code to {phone} via SMS. | SMS-iga. | через SMS. |
| `login.otp.resendIn` | Resend in {time} | Saada uuesti {time} pärast | Отправить заново через {time} |
| `login.otp.resendNow` | Send a new code | Saada uus kood | Отправить новый код |
| `login.otp.tryChannel.sms` | Try SMS instead | Proovi SMS-i | Попробовать SMS |
| `login.otp.tryChannel.whatsapp` | Try WhatsApp instead | Proovi WhatsAppi | Попробовать WhatsApp |
| `login.otp.back` (existing) | Use a different number | Kasuta teist numbrit | Использовать другой номер |
| `login.otp.verify` (existing) | Verify | Kinnita | Подтвердить |

**Cooldown UX:**
- Initial cooldown: 45 seconds after first send, then 60s, 90s, 120s on subsequent resends (mirrors Twilio Verify defaults; Codex confirms in T09).
- Format: `M:SS` (no leading zero on minutes; pad seconds). E.g. `0:42`, `1:30`.
- The countdown updates via a `useEffect` interval (allowed — it's owner UX, not motion). Reduced motion does not affect this; it's a state ticker, not animation.
- When `cooldown === 0`, the line becomes the active "Send a new code" link (button).

**Channel switch UX:**
- "Try SMS instead" / "Try WhatsApp instead" lives below the resend line.
- Clicking it: cancels current OTP context, re-fires `requestOwnerOtp` with the alternate `channel` arg, swaps the subtitle string accordingly, and resets the cooldown to its initial 45s.

**States:**

| State | Treatment |
|---|---|
| Phone step | As shown. |
| OTP step, fresh | Cells empty, `Verify` disabled, cooldown counting from 45s. |
| OTP step, partially filled | Same; `Verify` disabled. |
| OTP step, complete | `Verify` enabled; if autofill, can auto-submit if `Q5` decided. |
| OTP step, error | Cells flash red border, retain digits, `role="alert"` shows recovery copy. |
| OTP step, verifying | `Verify` button shows spinner, all cells disabled. |
| OTP step, success | Sage outline pulse on cells (240ms), then route transition. |

**Open product questions:**
- `Q5`: Auto-submit on 6th digit? Recommendation: yes, on autofill specifically (the first input handler detects autofill via `value.length > 1`). On manual entry, require an explicit "Verify" tap — gives users a moment to spot a typo.
- `Q6`: Should the channel switch be visible from the start, or only after first cooldown elapses? Recommendation: visible after 15s on the first attempt; immediately after a resend. Reduces "I clicked the wrong thing" regret while still respecting users who know WhatsApp didn't arrive.

### 2.5 Error-recovery copy table

Comprehensive map from error code → recovery sentence + action. Strings live under `auth.error.*` (clinic) and `login.error.*` (owner — extending the existing namespace).

| Code | Surface | EN sentence | EN action (CTA label) | Action behavior |
|---|---|---|---|---|
| `no_membership` | `/login`, `/o/login` | This account is not linked to a clinic yet. Please contact your clinic. | Contact your clinic | `mailto:` placeholder (`Q2`). |
| `invalid_email` | `/login` | Enter a valid email address. | — | Inline; focuses email field. |
| `rate_limited` | `/login`, `/o/login` | Too many attempts. Please wait a few minutes and try again. | — | Inline; disables submit for 60s with cooldown chip. |
| `email_not_authorized` | `/login` | We don't recognize that email. If your clinic invited you, double-check it matches the invite email. | Join the waitlist | Routes to `/waitlist`. |
| `oauth_not_linked` | `/o/login` | This Google or Apple account isn't linked to a clinic owner profile yet. Ask your clinic to add the same email, or use your phone number. | Use phone instead | Switches back to phone step. |
| `oauth_ambiguous_email` | `/o/login` | More than one owner profile uses this email. Ask your clinic to confirm the correct profile. | Contact your clinic | `mailto:` placeholder. |
| `owner_required` | `/o/login` | Please sign in with an owner account. | Sign in as staff | Routes to `/login`. |
| `invalid_phone` | `/o/login` | Enter a valid phone number with country code. | — | Inline; focuses phone field. |
| `invalid_code` | `/o/login` | The code is incorrect or expired. | Send a new code | Triggers resend if cooldown elapsed. |
| `otp_unavailable` | `/o/login` | We couldn't send a code right now. Try SMS instead, or try again in a minute. | Try SMS instead | Switches channel. |
| `not_found` | `/o/login` | We couldn't find your number with any PetCura clinic. Contact your clinic to be invited. | Contact your clinic | `mailto:` placeholder. |
| `login_error` (catch-all) | both | We couldn't sign you in just now. Please try again. | Try again | Reloads the page. |
| `invite_expired` | `/o/login` (from `/o/join` redirect) | Your invite link expired. Sign in with your phone number to continue. | — | Inline; phone field pre-filled from token. |

Key naming for new ones: `auth.error.emailNotAuthorized`, `auth.error.recoveryContactClinic`, `auth.error.recoveryWaitlist`, `auth.error.recoveryUsePhone`, `auth.error.recoverySignInStaff`, `auth.error.recoveryTryAgain`, `login.error.inviteExpired`. ET/RU translations follow the same shape; Russian sentences are longest (~1.6× EN length). Verify each sentence wraps within the form pane (~360px mobile) without truncation — none should exceed 3 lines.

**Visual treatment:** Reuse the existing red-soft alert block at `login/page.tsx:81-85`. The recovery action is rendered as an inline `Button variant="ghost" size="sm"` *inside* the alert block, right-aligned, **not** as a separate row.

---

## 3. Pillar 2a — `/onboarding/clinic`

### 3.1 Page shell

**Route / file:** `apps/web/app/onboarding/clinic/page.tsx`. Server component. Wrapped in a thin AppShell variant (no sidebar; just topbar + progress chip slot).

**Layout — mobile (375):**

```
┌──────────────────────────────────────┐
│ [paw] PetCura          [3/5] [EN ▾]  │   topbar
│ ────────────────────────────────────  │
│                                      │
│  Let's get {clinicName} set up       │  H1
│                                      │
│  These 5 quick steps will get your   │  body, --muted
│  inbox ready for real owners.        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ① Connect WhatsApp number   ☐  │  │  ChecklistItem
│  │ Bring your clinic line in.     │  │  subtext, --muted
│  │ [ Connect → ]   [ Do later ]   │  │  primary + ghost
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ② Choose PMS integration    ☐  │  │
│  │ Connect to Provet, Animal     │  │
│  │ Health Director, or skip.     │  │
│  │ [ Choose → ]    [ Skip ]       │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ③ Invite 1 teammate         ☐  │  │
│  │ Reception or a vet who'll     │  │
│  │ answer first messages.        │  │
│  │ [ Invite → ]    [ Do later ]   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ④ Set quiet hours + reply   ☐  │  │
│  │ When you're closed, owners    │  │
│  │ get an honest auto-reply.     │  │
│  │ [ Set hours → ] [ Do later ]   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ ⑤ Send a test request       ☐  │  │
│  │ See how a request flows from  │  │
│  │ WhatsApp into your inbox.     │  │
│  │ [ Run test → ] [ Do later ]    │  │
│  └────────────────────────────────┘  │
│                                      │
│  Skip to inbox →                     │  ghost link, --muted
└──────────────────────────────────────┘
```

**Layout — desktop (≥768; preferred 1024+):**

```
┌────────────────────────────────────────────────────────────────┐
│  [paw] PetCura  Onboarding              [3/5] [EN ▾]           │  topbar
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│  ┌────────────────────────┐  ┌────────────────────────────┐    │
│  │                        │  │                            │    │
│  │ Let's get              │  │ Setup                      │    │
│  │ {clinicName} set up    │  │                            │    │
│  │                        │  │ ┌──────────────────────┐   │    │
│  │ These 5 quick steps    │  │ │ ① Connect WhatsApp   │   │    │
│  │ will get your inbox    │  │ │ ...   [ Connect → ]  │   │    │
│  │ ready.                 │  │ └──────────────────────┘   │    │
│  │                        │  │ ┌──────────────────────┐   │    │
│  │ ─────────────────      │  │ │ ② PMS integration    │   │    │
│  │ EU residency           │  │ │ ...   [ Choose → ]   │   │    │
│  │ AI never auto-sends    │  │ └──────────────────────┘   │    │
│  │ Audit trail by default │  │ ┌──────────────────────┐   │    │
│  │ ─────────────────      │  │ │ ③ Invite teammate    │   │    │
│  │                        │  │ │ ...   [ Invite → ]   │   │    │
│  │ Need help?             │  │ └──────────────────────┘   │    │
│  │ Talk to your CSM →     │  │ ┌──────────────────────┐   │    │
│  │                        │  │ │ ④ Quiet hours        │   │    │
│  │                        │  │ └──────────────────────┘   │    │
│  │                        │  │ ┌──────────────────────┐   │    │
│  │                        │  │ │ ⑤ Test request       │   │    │
│  │                        │  │ └──────────────────────┘   │    │
│  │                        │  │                            │    │
│  │                        │  │ Skip to inbox →            │    │
│  └────────────────────────┘  └────────────────────────────┘    │
│  left 40% (welcome)            right 60% (checklist)           │
└────────────────────────────────────────────────────────────────┘
```

- The left pane shows three reassurance bullets (EU residency, AI is staff-assist, audit by default) below the welcome heading. These mirror the landing's trust pillars.
- Right pane is the checklist; on mobile, the left pane collapses into a 56px-tall heading band above the checklist.
- Page max-width: 1100px on desktop. Vertical scrolling allowed (this is **not** AppShell-locked).

**Components:**
- New: `ClinicWelcomeHeader` (`apps/web/app/onboarding/clinic/_components/ClinicWelcomeHeader.tsx`).
- New: `SetupChecklist` (client component, `_components/SetupChecklist.tsx`) — holds checklist state, listens to server action results.
- New: `ChecklistItem` (`_components/ChecklistItem.tsx`).
- AppShell progress chip slot (see §3.3).

### 3.2 `ChecklistItem` component

**Props sketch:**

```ts
type ChecklistItemProps = {
  step: "connect_whatsapp" | "choose_pms" | "invite_teammate" | "quiet_hours" | "test_request";
  index: number; // 1..5, for the numeric prefix
  status: "todo" | "done" | "skipped";
  title: string;
  subtext: string;
  primaryHref: string; // deep link to /settings/whatsapp etc., always appended with ?from=onboarding
  primaryLabel: string; // e.g. "Connect"
  secondaryLabel: string; // "Do later" or "Skip"
  onSecondary: () => void; // marks step "skipped" via server action
};
```

**Card layout (one item):**

```
┌──────────────────────────────────────────┐
│  ①  Connect WhatsApp number        [ ☐ ] │   title row
│      Bring your clinic line in.          │   subtext
│      [ Connect → ]      [ Do later ]      │   CTAs
└──────────────────────────────────────────┘
```

- Card: `Panel` style — but **not** nested in another Panel (per `.claude/rules/design-system.md`: no cards inside cards). The checklist container is a `<ul>` with `gap-3`, not a Panel.
- The numeric circle (①…⑤) is a 28×28 sage-soft circle with the digit in `var(--primary-strong)`. Becomes a sage filled checkmark when `status="done"`.
- Status chip on the right: `[ ☐ ]` when todo, `[ ✓ ]` when done (filled sage circle with white check), `[ — ]` muted dash when skipped.
- CTAs: primary (`Button variant="primary"`) navigates to `primaryHref`, secondary (`Button variant="ghost"`) calls `onSecondary`. On mobile, CTAs stack and span full width; on desktop, they sit side by side at right.
- When `status="done"`, the entire card transitions to a calmer state: title struck-through? No — strike-through reads as "deleted". Better: title color shifts to `var(--muted)` and the CTA row collapses (replaced by a single ghost "Edit" link). The checkmark gets a 240ms sage scale-in.
- When `status="skipped"`, the card stays at full intensity but the chip shows `—` and the secondary CTA becomes "Mark done".

**Completion checkmark animation (CSS only):**

- Two-step transform on the `<svg>` check icon:
  1. Circle background scales from 0.6 to 1.0 with opacity 0→1 over `var(--motion-fast)` (160ms).
  2. Check stroke path uses `stroke-dasharray` + `stroke-dashoffset` to "draw" over `var(--motion-base)` (240ms), delay 80ms.
- Implemented as a single `@keyframes pc-check-in` in `globals.css`, applied via a `.pc-check-in` class. Property: `transform`, `opacity`, `stroke-dashoffset`. `stroke-dashoffset` is SVG-specific and animates cheaply on the compositor — acceptable exception to the transform/opacity rule.
- Reduced motion: skip both steps; render the final state immediately. Add the standard `@media (prefers-reduced-motion: reduce) .pc-check-in { animation: none; }` block.

**i18n keys (per step):**

| Key | EN |
|---|---|
| `onboarding.clinic.heading` | Let's get {clinicName} set up |
| `onboarding.clinic.body` | These 5 quick steps will get your inbox ready for real owners. |
| `onboarding.clinic.trust.eu` | EU residency by default |
| `onboarding.clinic.trust.ai` | AI assists staff, never auto-sends |
| `onboarding.clinic.trust.audit` | Every action audit-logged |
| `onboarding.clinic.help` | Need help? Talk to your CSM. |
| `onboarding.clinic.skip` | Skip to inbox |
| `onboarding.clinic.step.connect_whatsapp.title` | Connect WhatsApp number |
| `onboarding.clinic.step.connect_whatsapp.subtext` | Bring your clinic's WhatsApp line in. |
| `onboarding.clinic.step.connect_whatsapp.cta` | Connect |
| `onboarding.clinic.step.choose_pms.title` | Choose your PMS |
| `onboarding.clinic.step.choose_pms.subtext` | Connect Provet, Animal Health Director, or skip for now. |
| `onboarding.clinic.step.choose_pms.cta` | Choose |
| `onboarding.clinic.step.invite_teammate.title` | Invite 1 teammate |
| `onboarding.clinic.step.invite_teammate.subtext` | A reception or a vet who'll answer first messages. |
| `onboarding.clinic.step.invite_teammate.cta` | Invite |
| `onboarding.clinic.step.quiet_hours.title` | Set quiet hours and auto-reply |
| `onboarding.clinic.step.quiet_hours.subtext` | When you're closed, owners get an honest auto-reply. |
| `onboarding.clinic.step.quiet_hours.cta` | Set hours |
| `onboarding.clinic.step.test_request.title` | Send yourself a test request |
| `onboarding.clinic.step.test_request.subtext` | See how a real request flows from WhatsApp into your inbox. |
| `onboarding.clinic.step.test_request.cta` | Run test |
| `onboarding.clinic.doLater` | Do later |
| `onboarding.clinic.skipItem` | Skip |
| `onboarding.clinic.markDone` | Mark done |
| `onboarding.clinic.edit` | Edit |
| `onboarding.clinic.statusTodo` | To do |
| `onboarding.clinic.statusDone` | Done |
| `onboarding.clinic.statusSkipped` | Skipped |
| `onboarding.clinic.allSet` | You're all set. Heading to your inbox… |

**RU truncation watch:** "Send yourself a test request" → "Отправьте себе тестовый запрос" (~31 chars; fits). "Set quiet hours and auto-reply" → "Настройте часы тишины и авто-ответ" (~33 chars; fits on a 280px+ card on mobile). Verify "Connect WhatsApp number" RU isn't wider than the chip + checkmark allow (`Подключите номер WhatsApp` ~24 chars — fine).

### 3.3 AppShell progress chip

**Slot:** `apps/web/app/_components/AppShell/Topbar.tsx` (or equivalent) gains a `progressChip` slot. The chip:

- Renders when `onboarding_progress` has any non-`done` required step for this admin.
- Format: `[3/5 ▼]` — small button, `Button variant="secondary" size="sm"`, opens a popover with the inline checklist.
- Visible across `/inbox`, `/settings/*`, anywhere in the clinic app, until completion.
- Disappears once all 5 steps are done or `skipped`.

**Popover layout (when chip is opened from inside `/inbox`):**

```
┌────────────────────────────────────────┐
│  Setup                          3 of 5 │
│                                        │
│  ✓ Connect WhatsApp                    │
│  ✓ Choose PMS                          │
│  ✓ Invite teammate                     │
│  ☐ Quiet hours          [ Set → ]      │
│  ☐ Test request         [ Run → ]      │
│                                        │
│  [ Back to onboarding → ]               │
└────────────────────────────────────────┘
```

- Reuses the existing shadcn Popover primitive.
- "Back to onboarding" routes to `/onboarding/clinic`.

### 3.4 Completion state

When step 5 flips to done:

- The 5th `ChecklistItem` plays its check-in animation.
- The entire checklist `<ul>` fades to opacity 0.7 over `var(--motion-slow)` (400ms).
- A "You're all set" pill appears above: sage-filled, white text, `Badge tone="teal"` variant.
- After 1.2s (literal `setTimeout`, single-shot), the page redirects to `/inbox?onboarded=1`.
- The chip in `AppShell` disappears.

**Reduced motion:** skip the fade and the timeout; redirect immediately on the server action callback.

### 3.5 States

| State | Treatment |
|---|---|
| 0% complete | All cards "todo", chip "0/5", no completion pill. |
| Partial (1-4) | Done cards muted with check-in animation, chip increments, "Skip to inbox" still visible. |
| All done | Brief "You're all set" pill + redirect. |
| Returning admin (already onboarded) | Page redirects to `/inbox` server-side before render. |
| Error (server action fails) | Toast at bottom-right: "Couldn't save that just yet. Try again." with `role="alert"`. |

### 3.6 Motion summary

- Card mount: stagger reveal, `var(--motion-stagger-base)` (80ms) between cards, max 5 cards = 400ms total cascade. Transform: `translateY(var(--motion-rise-md)) → 0`, opacity 0 → 1.
- Check-in: `pc-check-in` keyframe per §3.2.
- Card to "done" state: title color crossfade over `var(--motion-base)`, controlled by CSS variable on the wrapper.
- Completion fade-out: opacity 1 → 0.7 over `var(--motion-slow)`.
- All view transitions between onboarding and settings sub-routes use the existing `::view-transition-old(root)` rule. Honors `prefers-reduced-motion` automatically.

### 3.7 Accessibility

- Page H1 is the welcome line.
- Each checklist item is an `<li>` with an inner `<article>` or unwrapped — H2 lives on the title.
- Status chip is `role="img" aria-label="To do"` / `"Done"` / `"Skipped"`.
- "Skip to inbox" is a real `<a href="/inbox">`, not a button — refresh-safe.
- Popover from the chip: standard shadcn Popover with `aria-expanded`, focus return to trigger on close.

### 3.8 Open product questions

- `Q7`: "Test request" — fixture conversation, not a real WhatsApp send. Confirms OQ-2 from merged plan. Recommendation: hardcoded fixture seeded by `markStepDone('test_request')`. Codex T07 should expose a write helper that drops a fixture `request` row into the clinic's data with a "Demo:" prefix.
- `Q8`: When a step's deep link (e.g. `/settings/whatsapp`) is visited but the admin returns *without* completing it, do we leave it "todo" or auto-mark "in progress"? Recommendation: leave "todo"; mark done only on the actual completion event the sub-route fires.

---

## 4. Pillar 2b — `/onboarding/staff`

### 4.1 Page shell

**Route / file:** `apps/web/app/onboarding/staff/page.tsx`. Two steps max — same route, internal step state.

**Layout — mobile (single column, no desktop split needed):**

**Step 1 of 2 — Name + avatar:**

```
┌──────────────────────────────────────┐
│ [paw] PetCura            [EN ▾]      │
│ ────────────────────────────────────  │
│  Step 1 of 2                         │   eyebrow, --muted
│                                      │
│  Welcome to {clinicName}             │   H1
│                                      │
│  Just a couple of quick details      │   body, --muted
│  before you head to the inbox.        │
│                                      │
│  ┌──────────────────────────────┐    │
│  │ [ avatar circle, 72×72 ]      │    │  avatar with edit pencil
│  │      [ Upload photo ]          │    │
│  └──────────────────────────────┘    │
│                                      │
│  ── Your name ──                     │
│  [ Mari Tamm                      ]   │  input, pre-filled
│                                      │
│  ── Your role ──                     │
│  [Veterinarian]   This isn't right? →│  read-only chip + recovery
│                                      │
│  [ Continue              →  ]         │  primary CTA
└──────────────────────────────────────┘
```

**Step 2 of 2 — Notifications:**

```
┌──────────────────────────────────────┐
│ [paw] PetCura            [EN ▾]      │
│ ────────────────────────────────────  │
│  Step 2 of 2                         │
│                                      │
│  How should we reach you?            │   H1
│                                      │
│  ── Push notifications ──            │
│  [○] Off                             │   radio
│  [●] Urgent and direct mentions      │   recommended
│  [○] Every new request                │
│                                      │
│  ── Email digest ──                  │
│  [○] Off                             │
│  [●] Daily summary                   │
│  [○] Weekly summary                  │
│                                      │
│  Quiet hours follow your clinic's     │   help, --muted
│  setting ({hours}).                   │
│                                      │
│  [ Back ]              [ Finish → ]   │  ghost + primary
└──────────────────────────────────────┘
```

- Page max-width 480px on all viewports — staff onboarding stays one-handed.
- Step indicator: text-only eyebrow `Step 1 of 2`; no progress bar (it's only 2 steps).

**Components:**
- New: `StaffOnboardingForm` (client, `_components/StaffOnboardingForm.tsx`).
- Reused: `Panel`, `Button`, `Badge` for the role chip.
- Avatar uploader: reuse the existing storage-backed uploader (assume `apps/web/components/avatar-uploader.tsx` or equivalent; if missing, the Developer should ship a minimal one — `Q9`).

### 4.2 Copy

| Key | EN | RU notes |
|---|---|---|
| `onboarding.staff.stepN` | Step {n} of 2 | "Шаг {n} из 2" — fits. |
| `onboarding.staff.headingWelcome` | Welcome to {clinicName} | — |
| `onboarding.staff.bodyWelcome` | Just a couple of quick details before you head to the inbox. | Russian likely 1.5× — should still fit two lines on 375. |
| `onboarding.staff.avatarUpload` | Upload photo | "Загрузить фото" — short. |
| `onboarding.staff.avatarRemove` | Remove photo | — |
| `onboarding.staff.nameLabel` | Your name | — |
| `onboarding.staff.roleLabel` | Your role | — |
| `onboarding.staff.roleChip.reception` | Reception | "Администратор" — long, 13 chars; fits the chip if chip is `min-w-fit`. |
| `onboarding.staff.roleChip.vet` | Veterinarian | "Ветеринар" — fits. |
| `onboarding.staff.roleChip.admin` | Admin | "Администратор" — same as reception RU; visually OK, semantically clear (chip is on a labeled row). |
| `onboarding.staff.roleWrong` | This isn't right? Ask {adminName} to update. | The {adminName} interpolation must support fallback to "your admin" if unknown. |
| `onboarding.staff.continue` | Continue | — |
| `onboarding.staff.headingNotifs` | How should we reach you? | — |
| `onboarding.staff.pushLabel` | Push notifications | "Push-уведомления" — long, ~17 chars; fits. |
| `onboarding.staff.push.off` | Off | — |
| `onboarding.staff.push.urgent` | Urgent and direct mentions | "Срочные и прямые упоминания" — ~28 chars; fits a 480-wide column. |
| `onboarding.staff.push.all` | Every new request | "Каждый новый запрос" — fits. |
| `onboarding.staff.emailLabel` | Email digest | — |
| `onboarding.staff.email.off` | Off | — |
| `onboarding.staff.email.daily` | Daily summary | "Ежедневная сводка" — fits. |
| `onboarding.staff.email.weekly` | Weekly summary | "Еженедельная сводка" — fits. |
| `onboarding.staff.quietHoursHelp` | Quiet hours follow your clinic's setting ({hours}). | RU ~1.5× — keep on two lines. |
| `onboarding.staff.back` | Back | — |
| `onboarding.staff.finish` | Finish | — |

### 4.3 States

| State | Treatment |
|---|---|
| Step 1 | As shown. |
| Step 1, photo uploading | Avatar circle shows a `pc-shimmer` ring; Continue disabled. |
| Step 1, photo upload failed | `role="alert"` below the avatar with `Try again` ghost button. |
| Step 2 | As shown. |
| Submitting | `Finish` shows spinner, both buttons disabled. |
| Success | Server action redirects via `PostLoginRouter` to role default (e.g. `/inbox?q=mine&urgent=1`). No page success state needed. |

### 4.4 Motion

- Step transition: horizontal slide via the existing `.pc-stepper-step` mechanism (`globals.css:609-639`). The mechanism is already token-driven and reduced-motion-safe.
- Avatar uploaded: 240ms sage outline pulse on the avatar (`box-shadow` exception inside the existing pattern — used carefully, single moment).
- No infinite animations on this page.

### 4.5 Accessibility

- Step indicator is purely visual — H1 carries the meaning. Optionally announce step changes via a sibling `<p role="status" aria-live="polite">` like "Step 2 of 2: How should we reach you?".
- Radio groups use `<fieldset><legend>` with the legend visually styled as the section label.
- Role chip: `role="img" aria-label="Your role: Veterinarian"`. The "This isn't right?" link is a real `<a mailto:>` for `Q10`.
- Step 1 → Step 2 navigation preserves focus on the new H1.

### 4.6 Open product questions

- `Q9`: Does an avatar uploader exist? If not, the Developer should ship a minimal one (file input → preview → Supabase Storage). Either way it should not block T32.
- `Q10`: "This isn't right? Ask {adminName} to update" — what does the click do? Recommendation: opens `mailto:{adminEmail}?subject=Update my PetCura role`. If `adminEmail` is unknown, falls back to a copy-to-clipboard of the clinic's CSM contact.

---

## 5. Pillar 3 — Owner first-run on `/o`

This pillar adds a welcome strip and seeded card to the existing `/o` page at `apps/web/app/o/(authed)/page.tsx`. The existing dashboard content stays — the welcome layer sits **above** the pets section and only renders when `firstRun || ?welcome=1`.

### 5.1 `OwnerWelcomeStrip`

**Route / file:** `apps/web/app/o/(authed)/_components/OwnerWelcomeStrip.tsx`. Server component (receives data as props).

**Props sketch:**

```ts
type OwnerWelcomeStripProps = {
  ownerFirstName: string;
  /** Set when arriving from /o/join with a token that carried a pet. */
  arrivedFromJoin?: { clinicName: string; petName?: string };
  /** Drives NextStepCard branch. */
  nextStep:
    | { kind: "active_request"; requestId: string }
    | { kind: "no_pets" }
    | { kind: "send_first_message"; clinicName: string };
  locale: SupportedLocale;
};
```

**Layout — mobile-first (375 baseline; owner UX is mobile-first per `AGENTS.md`):**

```
┌──────────────────────────────────────┐
│  Welcome to PetCura, Anna            │  H1
│                                      │
│  Or, if from /o/join:                │
│  {clinicName} is reviewing Bella's    │
│  request                              │
│  ────────────────────────────────────│
│                                      │
│  ┌── Next step ────────────────┐     │
│  │ Open clinic chat             │     │   NextStepCard
│  │ Your clinic replied 2m ago.  │     │
│  │ [ Open chat            →  ]   │     │
│  └──────────────────────────────┘     │
│                                      │
│  What happens next                   │   tile heading
│  ┌──────────────────────────────┐    │
│  │ 1. Clinic reviews your request│    │
│  │ 2. You get a WhatsApp reply  │    │   WhatHappensNextTile
│  │ 3. Updates show up here      │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Desktop variant (≥768):** Same content, but the NextStepCard and WhatHappensNextTile sit side-by-side in a 2-column grid; the heading spans both columns.

- The strip dismisses **only on action**: tapping "Open chat" fires `owner_first_thread_opened` and marks `welcome_dismissed`. Tapping "Add another pet" similarly closes the strip. There is no explicit "Close" X — the strip is reassurance, not a popup.
- The strip is **above** the existing "Your pets" section in `/o/(authed)/page.tsx`. After dismissal (or for returning owners), the page renders unchanged.

### 5.2 `NextStepCard`

**Route / file:** `apps/web/app/o/(authed)/_components/NextStepCard.tsx`. Server component.

**Layout (single card, three variants by `nextStep.kind`):**

```
Variant: active_request
┌──────────────────────────────────────┐
│  Next step                           │   eyebrow
│  Open clinic chat                    │   H2
│  {clinicName} replied {relativeTime}.│   body, --muted
│  [ Open chat                  → ]    │   primary CTA
└──────────────────────────────────────┘

Variant: no_pets
┌──────────────────────────────────────┐
│  Next step                           │
│  Add your first pet                  │
│  This helps the clinic answer faster.│
│  [ Add a pet                  + ]    │
└──────────────────────────────────────┘

Variant: send_first_message
┌──────────────────────────────────────┐
│  Next step                           │
│  Message {clinicName}                │
│  Got a question? Send it any time.   │
│  [ Open chat                  → ]    │
└──────────────────────────────────────┘
```

- Card: a `Panel`-style outlined card. **Not** nested in another card (the welcome strip itself is unboxed).
- Primary CTA is full-width on mobile, fit-content on desktop.
- No secondary CTA — this is a "single primary action" pattern (per merged plan §7.1).

**Copy:**

| Key | EN | RU |
|---|---|---|
| `home.welcome.headingFresh` | Welcome to PetCura, {name} | Добро пожаловать в PetCura, {name} |
| `home.welcome.headingFromJoin` | {clinicName} is reviewing {petName}'s request | {clinicName} рассматривает запрос {petName} |
| `home.welcome.headingFromJoinNoPet` | {clinicName} got your request | {clinicName} получила ваш запрос |
| `home.nextStep.eyebrow` | Next step | Следующий шаг |
| `home.nextStep.active_request.title` | Open clinic chat | Открыть чат с клиникой |
| `home.nextStep.active_request.subtitle` | {clinicName} replied {relativeTime}. | {clinicName} ответила {relativeTime}. |
| `home.nextStep.active_request.cta` | Open chat | Открыть чат |
| `home.nextStep.no_pets.title` | Add your first pet | Добавьте первого питомца |
| `home.nextStep.no_pets.subtitle` | This helps the clinic answer faster. | Это поможет клинике быстрее ответить. |
| `home.nextStep.no_pets.cta` | Add a pet | Добавить питомца |
| `home.nextStep.send_first.title` | Message {clinicName} | Написать {clinicName} |
| `home.nextStep.send_first.subtitle` | Got a question? Send it any time. | Есть вопрос? Напишите в любое время. |
| `home.nextStep.send_first.cta` | Open chat | Открыть чат |

### 5.3 `WhatHappensNextTile`

**Route / file:** `apps/web/app/o/(authed)/_components/WhatHappensNextTile.tsx`. Server component.

**Layout:**

```
┌──────────────────────────────────────┐
│  What happens next                   │   eyebrow / H2
│                                      │
│  ① Clinic reviews your request       │   3 rows
│  ② You get a WhatsApp reply          │
│  ③ Updates show up here              │
└──────────────────────────────────────┘
```

- Light card on `var(--soft)` background — visually less prominent than `NextStepCard`. Reassures, doesn't compete for action.
- Three rows; each row is a numbered sage chip + text. No interaction.
- Renders only for owners arriving via `/o/join` or first-run, never for returning owners.

**Copy:**

| Key | EN | RU |
|---|---|---|
| `home.journey.heading` | What happens next | Что будет дальше |
| `home.journey.step1` | Clinic reviews your request | Клиника рассмотрит ваш запрос |
| `home.journey.step2` | You'll get a WhatsApp reply | Вам придёт ответ в WhatsApp |
| `home.journey.step3` | Updates show up here | Обновления появятся здесь |

RU watch: step 2 ~30 chars, step 1 ~32; both fit on mobile single-line if the numeric chip is 20px wide.

### 5.4 `IntakeSeededPetCard`

**Route / file:** `apps/web/app/o/(authed)/_components/IntakeSeededPetCard.tsx`. Variant of the existing `PetCard` at `apps/web/app/o/(authed)/_components/PetCard.tsx`. Should subclass via composition — pass an additional `isSeeded` prop into the existing card or expose a thin wrapper. Recommended: **wrapper**, so we don't pollute the canonical `PetCard` with first-run logic.

**Layout (drop-in replacement for the first card in `pets[]` when `pets[0].fromIntake === true`):**

```
┌──────────────────────────────────────┐
│  [pet illustration]   Bella    [Cat] │   same as PetCard
│  ─────────────────────────────────── │
│  We've got Bella's basics from your   │   pale sage banner
│  intake.                              │
│  [ Finish profile →  ]                │   primary CTA in banner
│  ─────────────────────────────────── │
│  (rest of normal PetCard content     │
│   below: vaccines, last visit, etc.) │
└──────────────────────────────────────┘
```

- The "seeded" banner is a 56px horizontal strip with `bg-[var(--primary-soft)]` and a sage left border (3px). It tucks into the existing PetCard between the header and the body.
- The "Finish profile" CTA routes to `/o/pets/{petId}?from=welcome` — the pet detail page should respect that param and surface a 3-field completion form (weight, DOB, neuter status). That's a separate spec; out of scope here. Track as `Q11`.
- Once the pet profile is complete, this variant disappears and the normal `PetCard` is rendered.

**Copy:**

| Key | EN | RU |
|---|---|---|
| `home.seededPet.banner` | We've got {petName}'s basics from your intake. | У нас уже есть основные данные о {petName} из вашей заявки. |
| `home.seededPet.cta` | Finish profile | Заполнить профиль |

### 5.5 States

| State | OwnerWelcomeStrip | NextStepCard | WhatHappensNextTile | IntakeSeededPetCard |
|---|---|---|---|---|
| First-run, from /o/join + pet | Heading "FromJoin" | active_request OR send_first_message | Visible | Visible (first pet) |
| First-run, cold OTP, no pets | Heading "Fresh" | no_pets | Visible | — (no pets to seed) |
| First-run, cold OTP, has pets | Heading "Fresh" | send_first_message | Visible | — |
| Returning, has unread | Strip not rendered (router already routed to /o/chat) | — | — | — |
| Returning, idle | Strip not rendered | — | — | — |

### 5.6 Motion

- Strip mount: fade-up over `var(--motion-base)`, transform + opacity. Reduced-motion: static.
- NextStepCard CTA hover: standard `Button` hover, no card-level motion.
- WhatHappensNextTile rows: stagger reveal at `var(--motion-stagger-tight)` (40ms) between rows.
- IntakeSeededPetCard banner: no animation — the banner is critical content, not a delight moment.
- View Transition from `/o/join` → `/o?welcome=1`: pair the clinic name + pet name elements with `view-transition-name` so they morph instead of crossfading. Specifically:
  - On `/o/join` page: the `<h1>` carrying clinic name has `style={{ viewTransitionName: 'pc-join-clinic' }}`.
  - On `/o` welcome strip: same element same name.
  - Same for pet name: `pc-join-pet`.
- Reduced motion: the View Transitions API rules at `globals.css:548-554` already neutralize this. Confirm with `prefers-reduced-motion: reduce` set in DevTools.

### 5.7 Accessibility

- Welcome strip H1 is `<h1>`. `/o`'s existing greeting H1 (`apps/web/app/o/(authed)/page.tsx` line ~38 reference) should be **suppressed** when the strip renders — never two H1s.
- NextStepCard: H2, CTA is a real `<a>` (routes), not a button.
- WhatHappensNextTile: H2, no interactive children. The numbered chips have `aria-hidden="true"`; the row text is the meaning.
- IntakeSeededPetCard: the banner is an `<aside>` inside the existing card with its own H3 ("Finish setup" — or just the body as the meaningful text). The "Finish profile" link is a real `<a>`.

### 5.8 Open product questions

- `Q11`: "Finish profile" sub-form — out of scope this round. Until the pet detail page supports `?from=welcome`, the link should still work (drops user on existing pet detail page).
- `Q12`: For a first-run owner with multiple pets seeded from intake (rare but possible), do we render multiple `IntakeSeededPetCard`s? Recommendation: yes, but only the first one shows the "Finish profile" banner; the rest behave as normal `PetCard`s with a small `[ New ]` badge.

---

## 6. Pillar 4 — `/o/join?token=…`

### 6.1 Route handler (no UI)

**Route / file:** `apps/web/app/o/join/route.ts`. Per merged plan §8.1. This is a Route Handler that:

1. Reads `token` from the URL.
2. Calls the Codex verification endpoint (per `docs/contracts/owner-join-token.md` — Claude T04 to open).
3. On `valid` → issues session via the same admin pattern as `ensureOwnerAuthUser` (`apps/web/app/o/login/actions.ts:65`), then calls `resolvePostLoginDestination` (Pillar 0) and 302 redirects to it (typically `/o?welcome=1`).
4. On `valid + ambiguous_identity` (token resolved a clinic and a pet but not a unique owner identity) → 302 to `/o/join/page` (the JoinHero confirmation screen). Token is passed forward via a server-side cookie `pc_join_token` (httpOnly, 5min TTL) — never via URL after this point.
5. On `expired` / `consumed` / `invalid_signature` / `unknown_token` → 302 to `/o/login?reason=invite_expired&phone=<masked-phone-from-token-if-present>`. The Codex endpoint should return the phone in the verification payload even on `expired` so the user can be ushered into OTP recovery without retyping.

No UI rendered by the route handler itself. If verification takes more than 800ms, the user briefly sees the route's `loading.tsx` — same skeleton as Pillar 0 §1.1.

### 6.2 `/o/join` page — JoinHero confirmation screen

**Route / file:** `apps/web/app/o/join/page.tsx`. Server component. Reads `pc_join_token` cookie (set by the route handler).

**Layout — mobile (375; primary surface — owners come from WhatsApp, on phones):**

```
┌──────────────────────────────────────┐
│  [paw] PetCura            [EN ▾]      │
│ ────────────────────────────────────  │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  [ clinic photo, 64×64 ]      │    │   circle, --line-2
│  │  Tartu Loomakliinik           │    │   H1
│  │                               │    │
│  │  Continue as Bella's owner    │    │   H2
│  │                               │    │
│  │  We'll set up your owner       │    │   body, --muted
│  │  account on this phone.       │    │
│  │                               │    │
│  │  [ Continue as Bella's owner ]│    │   primary, full width
│  │                               │    │
│  │  This isn't me →               │    │   ghost link
│  └──────────────────────────────┘    │
│                                      │
│  By continuing, you agree to our      │   small print
│  Terms and Privacy.                   │
└──────────────────────────────────────┘
```

**Desktop (≥768):** Same card centered, max-width 480px. The card hosts a 96×96 clinic photo + H1 + H2 + CTA + escape link.

**Components:**
- New: `JoinHero` (`apps/web/app/o/join/_components/JoinHero.tsx`). Server component.
- Reused: `Panel`, `Button`, `Badge` for the species/pet chip.

**`JoinHero` props sketch:**

```ts
type JoinHeroProps = {
  clinic: { name: string; photoUrl?: string };
  pet?: { name: string; species: "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other" };
  /** Server action that consumes the join token cookie and issues a session. */
  onContinue: () => Promise<void>; // form action
  /** Path to the cold intake form. */
  thisIsNotMeHref: string; // "/intake"
};
```

**Copy:**

| Key | EN | ET | RU |
|---|---|---|---|
| `join.headingClinic` | {clinicName} | — | — |
| `join.subheadingWithPet` | Continue as {petName}'s owner | Jätka {petName} omanikuna | Продолжить как владелец {petName} |
| `join.subheadingNoPet` | Continue as the pet's owner | Jätka lemmiku omanikuna | Продолжить как владелец питомца |
| `join.body` | We'll set up your owner account on this phone. | Loome sulle omaniku konto sellel telefonil. | Мы создадим аккаунт владельца на этом телефоне. |
| `join.cta.continue` | Continue as {petName}'s owner | Jätka {petName} omanikuna | Продолжить как владелец {petName} |
| `join.cta.continueNoPet` | Continue | Jätka | Продолжить |
| `join.notMe` | This isn't me | See pole mina | Это не я |
| `join.terms` | By continuing, you agree to our [Terms](…) and [Privacy](…). | inline | inline |

**RU watch:** "Continue as {petName}'s owner" → "Продолжить как владелец {petName}". With a 10-char pet name, that's ~40 chars. On a 343-content-width mobile, this wraps to 2 lines on a primary button. Acceptable, but the button height grows from 44 → 60. Accept that growth; do **not** truncate. Verify visually at 375 mobile.

### 6.3 Inline OTP step (rare branch)

If the Codex endpoint returns `expired` *and* the token had a phone, the route handler redirects to `/o/login?reason=invite_expired&phone={maskedPhone}`. `/o/login` reads `phone` from the URL and pre-fills the phone field, **read-only** (with a "Use a different number" escape). The OTP step then behaves exactly as §2.4 — same `OtpCellsInput`.

This is the only place `/o/login` accepts a `phone` URL param. The handler must normalize/validate it.

**Copy addition for this branch:**

| Key | EN |
|---|---|
| `login.error.inviteExpired` | Your invite link expired. We'll send a code to {phone} to continue. |

### 6.4 `FastIntake` — 3-question chip-based intake

The merged plan calls for FastIntake as part of `/o/join` flow (referenced in the spec ask, though not detailed in the merged plan). Treating this as a **fallback** for users who tap "This isn't me" but still need to send a request — routes them into a lightweight intake instead of full `/intake`.

**Route / file:** `apps/web/app/o/join/_components/FastIntake.tsx`. Client component (chip selection is interactive). Lives inside `/intake` or as a step on `/o/join` when the "This isn't me" branch is taken from an *anonymous* visit (no session). Recommendation: keep it on `/intake?fast=1` so the routing stays simple.

**Layout (3 vertical question groups; one screen, no stepper):**

```
┌──────────────────────────────────────┐
│  Tell us a bit about today           │   H1
│                                      │
│  How urgent is this?                 │   H2, group 1
│  [ Routine ] [ Today ] [ Urgent ]    │   chip group, single select
│                                      │
│  How is your pet right now?          │   H2, group 2
│  [ Eating ] [ Off food ] [ Vomiting ]│   chip group, multi select
│  [ Diarrhea ] [ Hurt ] [ Other ]     │
│                                      │
│  Anything to add? (optional)         │   H2, group 3
│  [ textarea, 80px ]                  │
│                                      │
│  [ Send to clinic              →  ]   │   primary CTA
└──────────────────────────────────────┘
```

**`ChipGroup` — new primitive in `packages/ui`:**

The chip group should live in `packages/ui/src/chip-group.tsx` because it's reusable across owner intake, fast intake, and future filter UIs.

**Props sketch:**

```ts
type ChipGroupProps<T extends string> = {
  /** Optional label rendered as a `<legend>` inside the fieldset. */
  label?: string;
  /** "single" or "multi". */
  selectionMode: "single" | "multi";
  /** Options as { value, label, helperText? }. */
  options: Array<{ value: T; label: string; helperText?: string; tone?: "neutral" | "amber" | "red" }>;
  value: T | T[] | undefined;
  onChange: (next: T | T[] | undefined) => void;
  /** Required for a11y when `label` is omitted (passed via `aria-labelledby`). */
  ariaLabelledBy?: string;
  /** Disables all chips. */
  disabled?: boolean;
};

// Single chip visual:
type ChipProps = {
  selected: boolean;
  tone?: "neutral" | "amber" | "red";
  children: ReactNode;
};
```

**Chip visual:**
- 36px tall, `px-3`, `rounded-full`, `border-[var(--line)]`, `bg-[var(--paper)]`.
- Selected: `bg-[var(--primary-soft)]`, `border-[var(--primary)]`, `text-[var(--primary-strong)]`.
- Tone amber: `bg-[var(--amber-soft)] border-[var(--amber)]` when selected.
- Tone red: `bg-[var(--red-soft)] border-[var(--red)]` when selected.
- Hover (unselected): `bg-[var(--soft)]`.
- Focus: standard sage 3px outline.
- Active (mousedown): scale 0.97 over `var(--motion-instant)` (80ms).

**Behavior:**
- Single-select: clicking a chip selects it; clicking it again deselects (returns to undefined). Use `role="radiogroup"` + `role="radio"` per chip.
- Multi-select: each chip toggles. Use `role="group"` + `<button aria-pressed>` per chip (not `role="checkbox"` — buttons read better with screen reader).
- Keyboard: chip group is a single tab stop; arrow keys move focus within the group. Space toggles.

**FastIntake states:**

| State | Treatment |
|---|---|
| Default | All chips unselected, textarea empty, CTA disabled. |
| Q1 only answered | CTA still disabled. |
| Q1 + Q2 answered | CTA enabled. Q3 always optional. |
| Submitting | CTA spinner, all chips disabled. |
| Success | Routes to confirmation screen (§6.5). |
| Error | `role="alert"` above CTA with retry button. |

**Copy:**

| Key | EN | ET | RU |
|---|---|---|---|
| `intake.fast.heading` | Tell us a bit about today | Räägi meile lühidalt | Расскажите коротко о ситуации |
| `intake.fast.q1` | How urgent is this? | Kui kiire on? | Насколько это срочно? |
| `intake.fast.q1.routine` | Routine | Tavaline | Обычное дело |
| `intake.fast.q1.today` | Today | Täna | Сегодня |
| `intake.fast.q1.urgent` | Urgent | Kiire | Срочно |
| `intake.fast.q2` | How is your pet right now? | Kuidas lemmik praegu on? | Как чувствует себя питомец? |
| `intake.fast.q2.eating` | Eating | Sööb | Ест |
| `intake.fast.q2.offFood` | Off food | Toidust ära | Не ест |
| `intake.fast.q2.vomiting` | Vomiting | Oksendab | Рвота |
| `intake.fast.q2.diarrhea` | Diarrhea | Kõhulahtisus | Диарея |
| `intake.fast.q2.hurt` | Hurt | Vigastatud | Травма |
| `intake.fast.q2.other` | Other | Muu | Другое |
| `intake.fast.q3` | Anything to add? (optional) | Veel midagi? (valikuline) | Что-то ещё? (необязательно) |
| `intake.fast.q3.placeholder` | When did it start? Anything else the vet should know? | — | — |
| `intake.fast.submit` | Send to clinic | Saada kliinikule | Отправить в клинику |

### 6.5 Confirmation → `/o` handoff

After FastIntake submit (or after JoinHero "Continue"), the user sees a brief confirmation before being routed to `/o`.

**Layout — full screen, centered:**

```
┌──────────────────────────────────────┐
│                                      │
│             [ sage check ]            │
│              (pc-check-in)            │
│                                      │
│        We've sent your request to     │  H1
│              {clinicName}             │
│                                      │
│      They'll be in touch shortly.    │  body, --muted
│                                      │
│      Heading to your home page…       │  small, --muted-2
│       [pc-progress, 2px bar]          │
│                                      │
└──────────────────────────────────────┘
```

- 2.4s on screen, then auto-redirects to `/o?welcome=1` via the router.
- Reduced motion: no check-in animation; no progress bar shimmer (the static fallback already covers); redirect after a static 1.2s.
- A "Continue now →" link appears after 1.5s for users who don't want to wait.

**Copy:**

| Key | EN |
|---|---|
| `join.confirm.heading` | We've sent your request to {clinicName} |
| `join.confirm.body` | They'll be in touch shortly. |
| `join.confirm.redirecting` | Heading to your home page… |
| `join.confirm.continueNow` | Continue now |

### 6.6 Motion summary for Pillar 4

- JoinHero mount: fade-up over `var(--motion-base)`. Clinic photo and pet name carry `view-transition-name` so they morph into `/o` welcome strip.
- "Continue" button: standard hover; submit shows spinner.
- Confirmation check-in: `pc-check-in` keyframe.
- View Transition: `/o/join` → `/o?welcome=1`, default 220ms root crossfade plus paired clinic-name / pet-name morphs.
- Reduced motion: every keyframe zeroed by `globals.css:571-588` + dedicated per-component blocks.

### 6.7 Accessibility

- JoinHero H1 is the clinic name; H2 is the "Continue as Bella's owner" subhead. Reasonable because clinic name is what owners scan for trust ("yes, this is my vet").
- Clinic photo: `alt="{clinicName} logo"`. If `photoUrl` missing, render the sage paw fallback with `alt=""` and a visible name.
- "This isn't me" is a real `<a href="/intake">` — refresh-safe.
- ChipGroup: keyboard nav per ARIA Authoring Practices (radiogroup for single, group for multi).

### 6.8 Open product questions

- `Q13`: Confirmation screen — should it count as a real "page" or render inline on `/o?welcome=1` as a 2-second overlay? Recommendation: dedicated `/o/join/confirm` route — easier to track in analytics, easier to add a refresh-safe URL when users share screenshots.
- `Q14`: Does FastIntake need the same anti-spam protection as `/intake`? Recommendation: yes, but Codex T11 (Turnstile) covers both.

---

## 7. Component inventory

### 7.1 New components

| Component | Location | Reusable? | Lives in `packages/ui`? |
|---|---|---|---|
| `AuthShell` | `apps/web/app/(auth)/_components/AuthShell.tsx` | Yes (clinic + owner) | No — app-specific layout with route-aware copy. |
| `BrandPane` | `apps/web/app/(auth)/_components/BrandPane.tsx` | Yes | No — bundles localized quotes; stays app-local. |
| `OtpCellsInput` | `apps/web/app/o/login/_components/OtpCellsInput.tsx` | **Yes — promote to `packages/ui/src/otp-cells-input.tsx`** | **Yes**, recommended. Owner-only today but the segmented OTP pattern is general; clinic 2FA may need it later. |
| `ChipGroup` + `Chip` | `packages/ui/src/chip-group.tsx` | Yes | **Yes**. Used by FastIntake; existing `/intake` should later migrate to it. |
| `ClinicWelcomeHeader` | `apps/web/app/onboarding/clinic/_components/ClinicWelcomeHeader.tsx` | No | No. |
| `SetupChecklist` | `apps/web/app/onboarding/clinic/_components/SetupChecklist.tsx` | No | No. |
| `ChecklistItem` | `apps/web/app/onboarding/clinic/_components/ChecklistItem.tsx` | Possibly (also useful in owner profile-completion) | Defer — keep app-local until a 2nd consumer appears. |
| `StaffOnboardingForm` | `apps/web/app/onboarding/staff/_components/StaffOnboardingForm.tsx` | No | No. |
| `OwnerWelcomeStrip` | `apps/web/app/o/(authed)/_components/OwnerWelcomeStrip.tsx` | No | No. |
| `NextStepCard` | `apps/web/app/o/(authed)/_components/NextStepCard.tsx` | Possibly (clinic dashboard could reuse) | Defer. |
| `WhatHappensNextTile` | `apps/web/app/o/(authed)/_components/WhatHappensNextTile.tsx` | No | No. |
| `IntakeSeededPetCard` | `apps/web/app/o/(authed)/_components/IntakeSeededPetCard.tsx` | No (composes existing `PetCard`) | No. |
| `JoinHero` | `apps/web/app/o/join/_components/JoinHero.tsx` | No | No. |
| `FastIntake` | `apps/web/app/o/join/_components/FastIntake.tsx` (or `/intake?fast=1` host) | No | No. |
| Router transient skeleton | `apps/web/app/auth/callback/loading.tsx` + `o/auth/callback/loading.tsx` | No | No (just a small `Reveal` + `pc-progress`). |
| Router fallback | `apps/web/app/auth/callback/error/page.tsx` + `o/auth/callback/error/page.tsx` | No | No. |
| AppShell progress chip | edit to `apps/web/app/_components/AppShell/*` | No | No. |

### 7.2 Reused components

- `Panel`, `Button`, `Badge`, `Loading`, `cn` — from `@petcura/ui`.
- `LanguageSwitcher` — from `apps/web/components/language-switcher.tsx`.
- `PetCard` (existing) — composed into `IntakeSeededPetCard`.
- `OtpForm` (existing) — refactored to use new `OtpCellsInput` and add cooldown / channel switch.
- Existing `Reveal` / motion primitives — from `@petcura/ui/motion-primitives` (per `packages/ui/src/index.ts:4`).

### 7.3 Removed components

None — Pillar 1 wraps existing pages, doesn't replace them.

---

## 8. i18n key inventory

All keys grouped by namespace. The Developer adds these to **two** dictionary files:

- **Clinic-side** → `packages/shared/src/i18n.ts` (consumed by `createTranslator(locale)`).
- **Owner-side** → `apps/web/lib/owner/i18n.ts` (consumed by `createOwnerTranslator(locale)`).

When in doubt, follow the rule already in play: clinic UI uses `auth.*`, `onboarding.*`, owner UI uses `login.*`, `home.*`, `intake.*`, `join.*`.

### 8.1 Clinic-side (`packages/shared/src/i18n.ts`)

```
router.transient.settingUp
router.fallback.heading
router.fallback.body
router.fallback.retry
router.fallback.contact

auth.login.eyebrowClinic
auth.login.eyebrowInvite
auth.login.headingCold
auth.login.headingInvite
auth.login.bodyCold
auth.login.bodyInvite
auth.login.emailLabel
auth.login.notYou
auth.login.sendLink
auth.login.help
auth.login.terms

auth.brandPane.clinic.quote1
auth.brandPane.clinic.quote2
auth.brandPane.clinic.quote3
auth.brandPane.clinic.attribution1
auth.brandPane.clinic.attribution2
auth.brandPane.clinic.attribution3

auth.error.noMembership
auth.error.invalidEmail
auth.error.rateLimited
auth.error.emailNotAuthorized
auth.error.loginError
auth.error.recoveryContactClinic
auth.error.recoveryWaitlist
auth.error.recoveryTryAgain
auth.error.recoverySignInStaff

onboarding.clinic.heading
onboarding.clinic.body
onboarding.clinic.trust.eu
onboarding.clinic.trust.ai
onboarding.clinic.trust.audit
onboarding.clinic.help
onboarding.clinic.skip
onboarding.clinic.doLater
onboarding.clinic.skipItem
onboarding.clinic.markDone
onboarding.clinic.edit
onboarding.clinic.statusTodo
onboarding.clinic.statusDone
onboarding.clinic.statusSkipped
onboarding.clinic.allSet
onboarding.clinic.step.connect_whatsapp.title
onboarding.clinic.step.connect_whatsapp.subtext
onboarding.clinic.step.connect_whatsapp.cta
onboarding.clinic.step.choose_pms.title
onboarding.clinic.step.choose_pms.subtext
onboarding.clinic.step.choose_pms.cta
onboarding.clinic.step.invite_teammate.title
onboarding.clinic.step.invite_teammate.subtext
onboarding.clinic.step.invite_teammate.cta
onboarding.clinic.step.quiet_hours.title
onboarding.clinic.step.quiet_hours.subtext
onboarding.clinic.step.quiet_hours.cta
onboarding.clinic.step.test_request.title
onboarding.clinic.step.test_request.subtext
onboarding.clinic.step.test_request.cta
onboarding.clinic.progressChipLabel              # "{done} of {total} steps"

onboarding.staff.stepN
onboarding.staff.headingWelcome
onboarding.staff.bodyWelcome
onboarding.staff.avatarUpload
onboarding.staff.avatarRemove
onboarding.staff.nameLabel
onboarding.staff.roleLabel
onboarding.staff.roleChip.reception
onboarding.staff.roleChip.vet
onboarding.staff.roleChip.admin
onboarding.staff.roleWrong
onboarding.staff.continue
onboarding.staff.headingNotifs
onboarding.staff.pushLabel
onboarding.staff.push.off
onboarding.staff.push.urgent
onboarding.staff.push.all
onboarding.staff.emailLabel
onboarding.staff.email.off
onboarding.staff.email.daily
onboarding.staff.email.weekly
onboarding.staff.quietHoursHelp
onboarding.staff.back
onboarding.staff.finish
```

### 8.2 Owner-side (`apps/web/lib/owner/i18n.ts`)

```
# Extensions to existing login.* namespace
login.otp.subtitleWhatsApp
login.otp.subtitleSms
login.otp.cellLabel              # "Digit {n} of 6"
login.otp.helper                 # "Paste or type the 6-digit code"
login.otp.resendIn               # "Resend in {time}"
login.otp.resendNow              # "Send a new code" (already exists as login.otp.resend — reuse)
login.otp.tryChannel.sms
login.otp.tryChannel.whatsapp
login.error.inviteExpired

auth.brandPane.owner.quote1
auth.brandPane.owner.quote2
auth.brandPane.owner.quote3
auth.brandPane.owner.attribution1
auth.brandPane.owner.attribution2
auth.brandPane.owner.attribution3

# Owner welcome (Pillar 3)
home.welcome.headingFresh
home.welcome.headingFromJoin
home.welcome.headingFromJoinNoPet
home.nextStep.eyebrow
home.nextStep.active_request.title
home.nextStep.active_request.subtitle
home.nextStep.active_request.cta
home.nextStep.no_pets.title
home.nextStep.no_pets.subtitle
home.nextStep.no_pets.cta
home.nextStep.send_first.title
home.nextStep.send_first.subtitle
home.nextStep.send_first.cta
home.journey.heading
home.journey.step1
home.journey.step2
home.journey.step3
home.seededPet.banner
home.seededPet.cta

# Pillar 4 join
join.headingClinic
join.subheadingWithPet
join.subheadingNoPet
join.body
join.cta.continue
join.cta.continueNoPet
join.notMe
join.terms
join.confirm.heading
join.confirm.body
join.confirm.redirecting
join.confirm.continueNow

# Fast intake
intake.fast.heading
intake.fast.q1
intake.fast.q1.routine
intake.fast.q1.today
intake.fast.q1.urgent
intake.fast.q2
intake.fast.q2.eating
intake.fast.q2.offFood
intake.fast.q2.vomiting
intake.fast.q2.diarrhea
intake.fast.q2.hurt
intake.fast.q2.other
intake.fast.q3
intake.fast.q3.placeholder
intake.fast.submit
```

### 8.3 i18n acceptance criteria

- Every key listed above lands in **all three locales** (EN, ET, RU) before the PR is merged.
- No string is hardcoded in JSX. The Developer should add an ESLint check or a CI grep for `>{en text}<` in new files.
- Russian-longest verification: at 375px, the longest sentence in each key must wrap to ≤ 3 lines on the form pane (≤ 343px content). Manually verify the 8 highest-risk keys: `auth.login.sendLink`, `auth.error.emailNotAuthorized`, `login.otp.subtitleWhatsApp`, `login.otp.resendIn`, `onboarding.clinic.step.test_request.subtext`, `onboarding.staff.push.urgent`, `home.welcome.headingFromJoin`, `join.cta.continue`.

---

## 9. Motion inventory

Every animated thing in this round, mapped to tokens, with reduced-motion fallback.

| Surface | Element | Property | Duration | Easing | Reduced-motion fallback |
|---|---|---|---|---|---|
| AuthShell | Form panel mount | opacity, transform | `--motion-base` | `--ease-enter` | Static (tokens zeroed). |
| AuthShell | Field label stagger | opacity, transform | `--motion-base`, `--motion-stagger-base` delay between siblings | `--ease-enter` | Static (tokens zeroed). |
| BrandPane | Quote crossfade | opacity | 18s cycle, 6s each | linear | `animation: none`; show quote 1. |
| BrandPane | `pc-loop-trail` | transform | 14s cycle (existing) | brand `pc-loop-trail` ease | `animation: none` (existing rule). |
| `/login` | Sent-state status block | opacity, transform | `--motion-base` | `--ease-standard` | Static. |
| `/login` | Error block | opacity, transform | `--motion-base` | `--ease-standard` | Static. |
| `/o/login` OTP | Cell-fill flash on verify | box-shadow color | `--motion-base` | `--ease-standard` | No flash. |
| `/o/login` OTP | Invalid code border flash | border-color | `--motion-base` | `--ease-standard` | Static red border for 240ms then revert via state, no animation. |
| `/o/login` OTP | Resend cooldown ticker | (text update via state) | n/a | n/a | Unchanged — not animation. |
| `/onboarding/clinic` | Card stagger | opacity, transform | `--motion-base`, `--motion-stagger-base` delay | `--ease-enter` | Static. |
| `/onboarding/clinic` | Check-in animation | transform, opacity, stroke-dashoffset | `--motion-fast` + `--motion-base` | `--ease-standard` | Final state, no draw. |
| `/onboarding/clinic` | Card "done" mute | color | `--motion-base` | `--ease-standard` | Instant (token zeroed). |
| `/onboarding/clinic` | Completion strip fade | opacity | `--motion-slow` | `--ease-exit` | Instant. |
| `/onboarding/staff` | Step transition | transform, opacity | existing `.pc-stepper-step` (token-driven) | `--ease-enter` | Static. |
| `/o` welcome strip | Mount fade-up | opacity, transform | `--motion-base` | `--ease-enter` | Static. |
| `/o` WhatHappensNextTile | Row stagger | opacity, transform | `--motion-base`, `--motion-stagger-tight` | `--ease-enter` | Static. |
| `/o/join` JoinHero | Mount fade-up | opacity, transform | `--motion-base` | `--ease-enter` | Static. |
| `/o/join` → `/o?welcome=1` | View Transition (root + paired clinic/pet names) | (native) | 220–280ms | `--ease-standard` | Disabled (existing rule). |
| `/o/join/confirm` | check-in | reuses `pc-check-in` | as above | — | Final state. |
| `/o/join/confirm` | `pc-progress` ticker | (existing class) | — | — | Static 50% sage block. |
| FastIntake | Chip select scale | transform | `--motion-instant` | `--ease-standard` | No scale. |

### 9.1 No new JS animation libraries in clinic/owner

Reaffirmed: every motion above is CSS or native View Transitions. No `motion/react`, no `gsap`. `globals.css:589-660` already establishes the app-side motion rules; this round only **adds** keyframes (`pc-check-in`, `pc-brand-quote-cycle`) and a few transition rules, never new JS deps.

---

## 10. Final acceptance criteria summary

For every screen in Pillars 0–4, the Developer must, before handoff:

1. **Typecheck pass** (`npm run typecheck`).
2. **Lint pass** (`npm run lint`).
3. **Build pass** (`npm run build`).
4. **Playwright happy path** for the affected route (handed to QA on a separate ticket, but Developer authors the spec).
5. **375px and 1280px screenshot** in both light and (where active) dark mode.
6. **Russian-longest visual check** at 375px on the 8 high-risk keys listed in §8.3.
7. **`prefers-reduced-motion: reduce` check**: all motion is zeroed, page still composes correctly, no broken layouts.
8. **axe-core 0 critical violations** on each new screen.
9. **Keyboard-only run-through** confirms focus order matches visual order on `AuthShell`, `SetupChecklist`, `OwnerWelcomeStrip`, `JoinHero`, `FastIntake`.

Per `CLAUDE.md` and `AGENTS.md`, the Developer ships PRs on `claude/ui-…` branches with goal/scope/verification/risk/rollback. Codex hand-offs (rate limits, `shouldCreateUser: false`, `auth_events` writes, `/o/join` token verification, `onboarding_progress` schema) are captured in `docs/contracts/` per merged plan T01–T04 and **not** implemented by the Developer.

---

## 11. Final open product questions (consolidated)

| ID | Question | Designer recommendation | Blocks |
|---|---|---|---|
| Q1 | Pillar 0 transient: show "stuck?" link after 4s? | Yes, CSS-only `animation-delay` on link opacity. | No. |
| Q2 | "Contact your clinic" support address per locale | `support@petcura.app` until Codex T48 wires CSM routing. | No. |
| Q3 | Final 3 quotes for BrandPane per variant | Pull 3 each from existing landing testimonial deck. | No. |
| Q4 | `/login` help link target until `/waitlist` ships | Link to landing `/#waitlist` anchor or `mailto:hello@petcura.app`. | No. |
| Q5 | OTP auto-submit on 6th digit | Yes on autofill, no on manual entry. | No. |
| Q6 | Channel switch visibility timing | After 15s on first attempt; immediately on resend. | No. |
| Q7 | Test-request fixture (clinic step 5) | Hardcoded fixture seeded by `markStepDone('test_request')` via Codex helper. | Yes — flag to Codex T07. |
| Q8 | Sub-route visit without completion | Leave "todo"; mark done only on sub-route completion event. | No. |
| Q9 | Avatar uploader exists? | If not, Developer ships minimal uploader. | No. |
| Q10 | "This isn't right?" role recovery target | `mailto:{adminEmail}` with subject prefilled; fallback to clinic CSM contact. | No. |
| Q11 | "Finish profile" sub-form on pet detail | Out of scope; route works without it. | No. |
| Q12 | Multiple seeded pets first-run | Render multiple seeded cards; only first shows "Finish profile" banner. | No. |
| Q13 | Confirmation screen as dedicated route? | Yes — `/o/join/confirm`. | No. |
| Q14 | FastIntake anti-spam | Covered by Codex T11 Turnstile. | No. |

None of the open questions block the Developer from starting at T13 (Pillar 0 router) and T17 (AuthShell). Q7 should be flagged to Codex during T07 review so the fixture write helper is in scope for the migration. Q11 is acknowledged as deferred work; the link works without the sub-form.

---

## 12. Hand-off note to Developer

Build order recommendation, matching merged plan §13 Wave 2 and Wave 3:

1. **Wave 2a** — Pillar 0 router (T12–T15) + AuthShell shell (T17). These together unblock every other screen, because every screen reaches its destination via the router.
2. **Wave 2b** — `/login` (T18), `/o/login` OTP cells (T19), cooldown + channel (T20), error copy (T21). These complete Pillar 1.
3. **Wave 3 (parallel)** — Pillar 2a (T25–T28), Pillar 2b (T32), Pillar 3 (T36–T38). All three depend on `onboarding_progress` (Codex T07) and the router (T13).
4. **Wave 4** — Pillar 4 `/o/join` (T42–T44), confirmation, FastIntake.

If you find a contradiction between this spec and the merged plan, the merged plan wins (it is the source of truth for *what* ships; this spec is the source of truth for *how it looks and feels*). Flag the contradiction in the PR description so the Reviewer can update one of the two documents.

---

End of spec. Total: 13 screens specified, 14 components inventoried, 14 open questions enumerated, 18 motion entries mapped. Spec is implementation-ready.

---

## File paths referenced in this spec (absolute)

- `/Users/reza/Workspace/Ludaxis/PetCura/docs/design/auth-onboarding-merged-plan-2026-05.md`
- `/Users/reza/Workspace/Ludaxis/PetCura/docs/contracts/owner-auth.md`
- `/Users/reza/Workspace/Ludaxis/PetCura/packages/ui/src/motion-tokens.ts`
- `/Users/reza/Workspace/Ludaxis/PetCura/packages/ui/src/index.ts`
- `/Users/reza/Workspace/Ludaxis/PetCura/packages/ui/src/primitives.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/globals.css`
- `/Users/reza/Workspace/Ludaxis/PetCura/packages/shared/src/i18n.ts`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/lib/owner/i18n.ts`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/login/page.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/o/login/page.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/o/login/_components/OtpForm.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/o/(authed)/page.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/apps/web/app/intake/page.tsx`
- `/Users/reza/Workspace/Ludaxis/PetCura/docs/design/motion-system-2026-05.md`
