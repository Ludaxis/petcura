import "server-only";

/**
 * Typed adapter over the (not-yet-existing) `auth_events` table.
 * Codex will implement the real writes per
 * `docs/contracts/auth-audit-events.md`. Until then the adapter is a no-op
 * (development warns; production silent) so auth flows never block on audit.
 */

export type AuthEventType =
  | "magic_link_requested"
  | "magic_link_consumed"
  | "otp_requested"
  | "otp_verified"
  | "otp_verify_failed"
  | "oauth_started"
  | "oauth_callback"
  | "join_token_attempted"
  | "join_token_consumed"
  | "signout"
  | "routing_fallback";

export type AuthEventActorKind = "clinic_staff" | "owner" | "unknown";

export type WriteAuthEventArgs = {
  eventType: AuthEventType;
  actorKind: AuthEventActorKind;
  actorId?: string | null;
  clinicId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

// TODO(codex): replace with Supabase insert. Must never throw — auth must
// never fail because audit failed. See docs/contracts/auth-audit-events.md.
export async function writeAuthEvent(args: WriteAuthEventArgs): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[auth-event] stub writeAuthEvent", args);
  }
}
