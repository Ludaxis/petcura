import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadActorFirstRunSignal } from "./onboarding-progress";

export type ResolvedOwnerActor = {
  userId: string;
  firstRun: boolean;
  hasUnreadStaffReply: boolean;
  hasActiveRequest: boolean;
} | null;

/**
 * Loads owner-side routing inputs. Conservative defaults when reads fail:
 *   - hasUnreadStaffReply → false (don't divert to /o/chat speculatively)
 *   - hasActiveRequest    → false
 *   - firstRun derived from onboarding-progress adapter (currently stubbed)
 *
 * Codex replaces the body of this function once `request_events` and
 * `messages` queries land. See `docs/contracts/post-login-router.md`.
 */
export async function resolveOwnerActor(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedOwnerActor> {
  // Membership existence is a hard requirement — without it we cannot route.
  const { data: memberships, error: membershipError } = await supabase
    .from("owner_user_memberships")
    .select("owner_id, clinic_id")
    .eq("user_id", userId);

  if (membershipError || !memberships || memberships.length === 0) {
    return null;
  }

  const { firstRun } = await loadActorFirstRunSignal({
    actorKind: "owner",
    actorId: userId
  });

  // TODO(codex): real implementation per docs/contracts/post-login-router.md.
  return {
    userId,
    firstRun,
    hasUnreadStaffReply: false,
    hasActiveRequest: false
  };
}
