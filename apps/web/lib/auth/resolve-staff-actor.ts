import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeRoutingRole,
  type ClinicStaffRole
} from "./post-login-router";
import { loadActorFirstRunSignal } from "./onboarding-progress";

export type ResolvedStaffActor = {
  userId: string;
  clinicId: string;
  role: ClinicStaffRole;
  firstRun: boolean;
} | null;

/**
 * Loads enough of the staff actor to feed `resolvePostLoginDestination`.
 * Returns `null` when the user has no active clinic membership; callers
 * should redirect to `/login?error=no_membership`.
 */
export async function resolveStaffActor(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedStaffActor> {
  const { data, error } = await supabase
    .from("clinic_staff")
    .select("clinic_id, role, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const { firstRun } = await loadActorFirstRunSignal({
    actorKind: "clinic_staff",
    actorId: userId
  });

  return {
    userId,
    clinicId: data.clinic_id,
    role: normalizeRoutingRole(
      data.role as Parameters<typeof normalizeRoutingRole>[0]
    ),
    firstRun
  };
}
