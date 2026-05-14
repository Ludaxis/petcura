# Proxy Supabase SSR Session Refresh — Contract

> Owner: Codex. Adds Supabase SSR client to `apps/web/proxy.ts` so expired
> access tokens are refreshed transparently. Companion to merged plan §9.2.

## Problem

`apps/web/proxy.ts` currently only handles host routing + locale headers.
A user with an expired access token but a valid refresh token reloads
`/inbox` or `/o`, the server component fails to authenticate, and the user
is bounced to `/login` even though Supabase could have refreshed the token
silently.

## Change shape

Add a Supabase SSR client in the proxy that reads cookies from the request
and writes refreshed cookies onto the response **before** server components
run. Pattern is the documented `@supabase/ssr` middleware example.

```ts
import { createServerClient } from "@supabase/ssr";

// inside proxy(), after host routing:
const supabase = createServerClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  }
);
await supabase.auth.getUser();
```

The `getUser()` call triggers the SSR client to refresh and write cookies.

## Cookie names

Per `owner-auth.md:26`:

- Staff session: `__Host-pc_staff_session`.
- Owner session: `__Host-pc_owner_session`.

The proxy must use the **right cookie name per host** (clinic vs owner) so
the two sessions stay isolated. Today the proxy already distinguishes hosts.

## Acceptance criteria

- A user with an expired access token + valid refresh token reloads
  `/inbox` and stays there.
- Same for `/o`.
- Owner cookies never touched on the clinic host and vice versa.
- No new cookies leaked into other paths.

## Files

- `apps/web/proxy.ts` — add SSR client per host.

## Out of scope

- Cookie names rename (already correct per `owner-auth.md`).
- New environment variables.
