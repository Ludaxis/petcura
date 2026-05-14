import "server-only";

/**
 * Typed adapter over the (not-yet-existing) activation-event firing helper.
 * Codex will wire to PostHog server-side per
 * `docs/contracts/activation-events.md`. Until then, no-op in production and
 * console.info in development. Idempotency must eventually be enforced by
 * Codex's `activation_event_log` table — Claude callers may safely repeat.
 */

export type ActivationEvent =
  | "clinic_connected_whatsapp"
  | "staff_first_reply_sent"
  | "owner_first_thread_opened"
  | "owner_push_enabled";

export type FireActivationEventArgs = {
  event: ActivationEvent;
  actorId: string;
  clinicId?: string;
  metadata?: Record<string, unknown>;
};

// TODO(codex): wire to PostHog EU + activation_event_log idempotency table.
export async function fireActivationEvent(
  args: FireActivationEventArgs
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[activation-event] stub fireActivationEvent", args);
  }
}
