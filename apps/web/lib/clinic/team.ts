import "server-only";

import type { Database, StaffRole } from "@petcura/shared";
import { listAuthUserEmails } from "@/lib/admin/bootstrap";
import { getSignedProfileImageUrls } from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

type StaffRow = Pick<
  Database["public"]["Tables"]["clinic_staff"]["Row"],
  "id" | "clinic_id" | "user_id" | "role" | "is_active" | "created_at"
>;

export type ClinicTeamMember = StaffRow & {
  email: string;
  isCurrentUser: boolean;
  profile: {
    fullName: string | null;
    displayName: string | null;
    phone: string | null;
    jobTitle: string | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    locale: string;
  };
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
  const userIds = (data ?? []).map((member) => member.user_id);
  const profilesResult = userIds.length
    ? await admin
        .from("user_profiles")
        .select(
          "user_id, full_name, display_name, phone, job_title, avatar_url, locale"
        )
        .in("user_id", userIds)
    : null;

  if (profilesResult?.error) {
    throw new Error(
      `Could not list clinic team profiles: ${profilesResult.error.message}`
    );
  }

  const profiles = profilesResult?.data ?? [];
  const profileByUserId = new Map(
    profiles.map((profile) => [profile.user_id, profile])
  );
  const avatarUrls = await getSignedProfileImageUrls(
    profiles.map((profile) => profile.avatar_url)
  );

  return (data ?? []).map((member) => {
    const profile = profileByUserId.get(member.user_id);
    const avatarPath = profile?.avatar_url ?? null;

    return {
      ...member,
      role: member.role as StaffRole,
      email: usersById.get(member.user_id) ?? member.user_id,
      isCurrentUser: member.user_id === currentUserId,
      profile: {
        fullName: profile?.full_name ?? null,
        displayName: profile?.display_name ?? null,
        phone: profile?.phone ?? null,
        jobTitle: profile?.job_title ?? null,
        avatarPath,
        avatarUrl: avatarPath ? avatarUrls.get(avatarPath) ?? null : null,
        locale: profile?.locale ?? "en"
      }
    };
  });
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
