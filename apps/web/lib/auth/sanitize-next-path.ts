/**
 * Sanitize a `next` query parameter for post-login redirects.
 *
 * Rules (per merged plan §3.1):
 *  - Only allow same-origin paths starting with `/`.
 *  - Reject `//` and `\\` prefixes (open-redirect vectors).
 *  - Reject the auth/onboarding entrypoints themselves to avoid loops.
 *  - Reject `/o/...` paths from the clinic surface and `/inbox`-style paths
 *    from the owner surface, so a phished param can't bleed across actors.
 */

const STAFF_FORBIDDEN_PREFIXES = [
  "/login",
  "/o/login",
  "/o/join",
  "/onboarding/clinic",
  "/onboarding/staff",
  "/auth/callback",
  "/o/auth/callback"
];

const OWNER_FORBIDDEN_PREFIXES = [
  "/login",
  "/o/login",
  "/o/join",
  "/onboarding/clinic",
  "/onboarding/staff",
  "/auth/callback",
  "/o/auth/callback"
];

function isStructurallyValid(raw: string | null | undefined): raw is string {
  if (typeof raw !== "string") return false;
  if (!raw.startsWith("/")) return false;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return false;
  if (raw.startsWith("\\")) return false;
  return true;
}

export function sanitizeStaffNextPath(
  raw: string | null | undefined,
  fallback = "/inbox"
): string {
  if (!isStructurallyValid(raw)) return fallback;
  if (raw.startsWith("/o/") || raw === "/o") return fallback;
  for (const forbidden of STAFF_FORBIDDEN_PREFIXES) {
    if (raw === forbidden || raw.startsWith(`${forbidden}/`) || raw.startsWith(`${forbidden}?`)) {
      return fallback;
    }
  }
  return raw;
}

export function sanitizeOwnerNextRouterPath(
  raw: string | null | undefined,
  fallback = "/o"
): string {
  if (!isStructurallyValid(raw)) return fallback;
  // Owners can only navigate within /o/*
  if (raw !== "/o" && !raw.startsWith("/o/")) return fallback;
  for (const forbidden of OWNER_FORBIDDEN_PREFIXES) {
    if (raw === forbidden || raw.startsWith(`${forbidden}/`) || raw.startsWith(`${forbidden}?`)) {
      return fallback;
    }
  }
  return raw;
}
