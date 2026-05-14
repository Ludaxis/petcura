# `/o/join` Token Verification — Contract

> Owner: Codex. Token signing, HMAC verification, `owner_invites` consume,
> rate limits. Claude calls a typed adapter from `/o/join/actions.ts`.
> Sibling to `owner-auth.md` §D.

## Problem

Owners arrive from clinic-sent WhatsApp templates at
`https://my.petcura.app/o/join?token=<jwt>`. The frontend route handler must:

1. Verify the token signature server-side (HMAC against env-held secret).
2. Confirm `exp` not passed and `jti` not consumed.
3. Atomically mark `owner_invites.consumed_at = now()`.
4. Return `{ clinic_id, phone, pet_id?, clinic_name?, pet_name? }` payload to Claude.

Token payload (per `owner-auth.md:54`):

```
{ phone, clinic_id, pet_id?, exp, jti }
```

HMAC-signed, single-use, TTL 24h.

## Adapter Claude calls

`apps/web/lib/owner/join-token.ts`:

```ts
export type JoinTokenVerifyResult =
  | {
      ok: true;
      clinicId: string;
      clinicName: string;
      phone: string;
      petId?: string;
      petName?: string;
      petSpecies?: "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other";
    }
  | {
      ok: false;
      error: "expired" | "consumed" | "invalid_signature" | "unknown_token" | "rate_limited";
      maskedPhone?: string; // returned even on `expired` so OTP recovery can pre-fill
    };

export async function verifyAndConsumeJoinToken(args: {
  token: string;
  ipAddress: string | null;
}): Promise<JoinTokenVerifyResult>;
```

Until Codex ships, the adapter returns `{ ok: false, error: "unknown_token" }`
and Claude redirects to `/o/login?reason=invite_expired`.

## Server-side endpoint shape (Codex implementation)

Codex may implement this as a shared lib function (preferred) or as an
internal API route. Either way, it must:

- Verify HMAC against `OWNER_JOIN_TOKEN_SECRET` (env, EU-hosted vault).
- Reject `exp <= now()` → `expired`.
- Reject `consumed_at IS NOT NULL` → `consumed`.
- Reject any signature mismatch → `invalid_signature`.
- Reject `jti` not in `owner_invites` → `unknown_token`.
- Enforce 30 attempts/IP/hour (per `owner-auth.md:109`); blocked → `rate_limited`.
- Run the `update ... returning` consume atomically (no double-spend).

## Error code → Claude behavior

| Error              | Claude redirect                                              |
|--------------------|--------------------------------------------------------------|
| `expired`          | `/o/login?reason=invite_expired&phone={maskedPhone}`         |
| `consumed`         | `/o/login?reason=invite_expired&phone={maskedPhone}`         |
| `invalid_signature`| `/o/login?reason=invite_expired`                             |
| `unknown_token`    | `/o/login?reason=invite_expired`                             |
| `rate_limited`     | `/o/login?reason=rate_limited`                               |

## Files

- `apps/web/app/o/join/route.ts` (Claude) — calls the adapter, hands off to
  session issuer + router.
- `apps/web/app/o/join/page.tsx` (Claude) — renders JoinHero confirmation.
- `apps/web/app/o/join/actions.ts` (Claude) — server action `consumeJoinToken`
  for the confirmation screen primary CTA.
- `apps/web/lib/owner/join-token.ts` (Claude TODO adapter, Codex implementation).

## Acceptance criteria

- Valid token consumed exactly once; replay returns `consumed`.
- Expired token returns phone payload so OTP recovery is one tap.
- p95 verify+consume < 80ms.
- `auth_events` row written for every attempt with masked phone (Codex).
