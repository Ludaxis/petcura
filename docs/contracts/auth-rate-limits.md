# Auth Rate Limits + Bot Protection — Contract

> Owner: Codex. Server-side enforcement of velocity limits and Turnstile
> validation across every auth entrypoint.
> Mirrors `owner-auth.md` §"Rate limits" + merged plan §9.3-9.4.

## Limits to enforce

| Surface                                  | Limit                                |
|------------------------------------------|--------------------------------------|
| `signInWithMagicLink` (email)            | 10 requests / email / day            |
| `requestOwnerOtp` (phone)                | 3 requests / phone / hour            |
| `verifyOwnerOtp` (code)                  | 5 attempts / OTP                     |
| `/o/join?token=` (IP)                    | 30 attempts / IP / hour              |
| `signInWithMagicLink`, `requestOwnerOtp` | Turnstile required when IP velocity > N/min |

## Backend approach (Codex)

- Postgres counter table `auth_rate_limits(scope text, key text, window_start timestamptz, count int)` with a sliding-window helper.
- Or: Twilio Verify defaults + a small Postgres counter (recommended for OTP per
  `owner-auth.md`).
- Turnstile token submitted by Claude from `/login`, `/o/login`; validated
  by `verifyTurnstileToken(token)` server helper before the rate-limited
  action runs.

## Frontend touchpoints (Claude)

Once Codex ships:

- `/login` form + `/o/login` phone form add a hidden Turnstile widget; the
  resulting token is posted alongside the email/phone. **NOT shipped this
  round** — depends on Codex T11 helper. Tracked in merged plan T50.
- Error code surfaced: `rate_limited` (already in error copy table at
  `auth-onboarding-specs-2026-05.md` §2.5).

## Acceptance criteria

- 4th OTP request within an hour returns `rate_limited`.
- 31st `/o/join` attempt within an hour returns `rate_limited`.
- Turnstile token rejected → 400, no `signInWithOtp` call made.
- Per-rule responses logged as `auth_events` rows with `result: 'rate_limited'`.

## Out of scope this round (Claude side)

- Turnstile DOM widget: pending Codex T11.
- Cooldown UI on `/login` after `rate_limited`: cooldown chip is in the spec
  but cannot fire without the Codex limiter. Claude renders `rate_limited`
  copy correctly today; cooldown chip wiring lands once `Retry-After`-style
  metadata arrives in the redirect URL.
