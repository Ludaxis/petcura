import "server-only";

import type { Database, StaffRole } from "@petcura/shared";
import { listAuthUserEmails } from "@/lib/admin/bootstrap";
import { createAdminClient } from "@/lib/supabase/admin";

type StaffRow = Pick<
  Database["public"]["Tables"]["clinic_staff"]["Row"],
  "id" | "clinic_id" | "user_id" | "role" | "is_active" | "created_at"
>;

export type ClinicTeamMember = StaffRow & {
  email: string;
  isCurrentUser: boolean;
};

export async function listClinicTeam(
  clinicId: string,
  currentUserId: string
): Promise<ClinicTeamMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinic_staff")
    .select("id, clinic_id, user_id, role, is_active, created_at")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not list clinic team: ${error.message}`);
  }

  const usersById = await listAuthUserEmails();

  return (data ?? []).map((member) => ({
    ...member,
    role: member.role as StaffRole,
    email: usersById.get(member.user_id) ?? member.user_id,
    isCurrentUser: member.user_id === currentUserId
  }));
}

export async function countActiveOwners(clinicId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("clinic_staff")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("role", "owner")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Could not count active owners: ${error.message}`);
  }

  return count ?? 0;
}
