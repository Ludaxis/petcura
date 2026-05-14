/**
 * Helpers for the `pc_last_route_*` cookies that hold each actor's last
 * visited route, used by the post-login router as a soft fallback.
 *
 * Per merged plan §3.1: scoped per actor kind to prevent cross-context bleed.
 * Cookie is client-readable (the `AppShell` writes it on route change), so
 * `HttpOnly` is intentionally false. Lifetime 30 days, `SameSite=Lax`.
 */

import {
  sanitizeOwnerNextRouterPath,
  sanitizeStaffNextPath
} from "./sanitize-next-path";

export const STAFF_LAST_ROUTE_COOKIE = "pc_last_route_staff";
export const OWNER_LAST_ROUTE_COOKIE = "pc_last_route_owner";

export const LAST_ROUTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function readStaffLastRoute(value: string | undefined | null): string | null {
  if (!value) return null;
  const sanitized = sanitizeStaffNextPath(value, "");
  return sanitized || null;
}

export function readOwnerLastRoute(value: string | undefined | null): string | null {
  if (!value) return null;
  const sanitized = sanitizeOwnerNextRouterPath(value, "");
  return sanitized || null;
}
