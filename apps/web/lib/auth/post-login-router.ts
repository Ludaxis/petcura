/**
 * Pure, side-effect-free post-login router.
 *
 * Called from:
 *   - apps/web/app/auth/callback/route.ts        (clinic magic-link callback)
 *   - apps/web/app/o/auth/callback/route.ts      (owner OAuth callback)
 *   - apps/web/app/o/login/actions.ts            (verifyOwnerOtp success)
 *   - apps/web/app/o/join/route.ts               (WhatsApp deep-link consume)
 *
 * Inputs that depend on Codex schema (firstRun, hasUnread*, hasActiveRequest)
 * are read by thin server adapters: see post-login-router.md contract.
 */

import {
  sanitizeOwnerNextRouterPath,
  sanitizeStaffNextPath
} from "./sanitize-next-path";

const staffOnboardingEnabled = false;

/**
 * Subset of `staff_role` (database enum: owner|admin|vet|tech|reception|viewer)
 * collapsed for routing purposes. `owner` and `admin` both map to admin.
 * `tech` and `viewer` collapse to `reception` (read-mostly default).
 */
export type ClinicStaffRole = "reception" | "vet" | "admin";

export function normalizeRoutingRole(
  role: "owner" | "admin" | "vet" | "tech" | "reception" | "viewer"
): ClinicStaffRole {
  if (role === "owner" || role === "admin") return "admin";
  if (role === "vet") return "vet";
  return "reception";
}

export type RouterActor =
  | {
      kind: "clinic_staff";
      userId: string;
      clinicId: string;
      role: ClinicStaffRole;
      firstRun: boolean;
    }
  | {
      kind: "owner";
      userId: string;
      firstRun: boolean;
      hasUnreadStaffReply: boolean;
      hasActiveRequest: boolean;
    };

export type RouterReason =
  | "clinic_first_run"
  | "staff_first_run"
  | "next_param"
  | "last_visited"
  | "role_default"
  | "owner_first_run"
  | "unread_reply"
  | "active_request"
  | "owner_default";

export type RouterInput = {
  actor: RouterActor;
  /** Raw `next` query param; will be sanitized in the router. */
  nextParam: string | null;
  /** Pre-sanitized last-visited route (use `readStaffLastRoute` / `readOwnerLastRoute`). */
  lastVisitedCookie: string | null;
};

export type RouterOutput = {
  destination: string;
  reason: RouterReason;
};

export function roleDefaultDestination(role: ClinicStaffRole): string {
  switch (role) {
    case "reception":
      return "/inbox?q=unassigned&today=1";
    case "vet":
      return "/inbox?q=mine&urgent=1";
    case "admin":
      return "/settings";
  }
}

export function resolvePostLoginDestination(input: RouterInput): RouterOutput {
  const { actor, nextParam, lastVisitedCookie } = input;

  if (actor.kind === "clinic_staff") {
    if (staffOnboardingEnabled && actor.firstRun && actor.role === "admin") {
      return { destination: "/onboarding/clinic", reason: "clinic_first_run" };
    }
    if (staffOnboardingEnabled && actor.firstRun) {
      return { destination: "/onboarding/staff", reason: "staff_first_run" };
    }
    const nextSanitized = nextParam ? sanitizeStaffNextPath(nextParam, "") : "";
    if (nextSanitized) {
      return { destination: nextSanitized, reason: "next_param" };
    }
    if (lastVisitedCookie) {
      return { destination: lastVisitedCookie, reason: "last_visited" };
    }
    return {
      destination: roleDefaultDestination(actor.role),
      reason: "role_default"
    };
  }

  // owner
  if (actor.firstRun) {
    return { destination: "/o?welcome=1", reason: "owner_first_run" };
  }
  const nextSanitized = nextParam ? sanitizeOwnerNextRouterPath(nextParam, "") : "";
  if (nextSanitized) {
    return { destination: nextSanitized, reason: "next_param" };
  }
  if (actor.hasUnreadStaffReply) {
    return { destination: "/o/chat", reason: "unread_reply" };
  }
  if (actor.hasActiveRequest) {
    return { destination: "/o", reason: "active_request" };
  }
  return { destination: "/o", reason: "owner_default" };
}
