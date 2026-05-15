import "server-only";

import type { Database, StaffRole } from "@petcura/shared";
import { listAuthUserEmails } from "@/lib/admin/bootstrap";
import { getSignedProfileImageUrls } from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

type StaffRow = Pick<
  Database["public"]["Tables"]["clinic_staff"]["Row"],
  "id" | "clinic_id" | "user_id" | "role" | "is_active" | "created_at"
> & {
  archived_at: string | null;
  archived_by: string | null;
  archive_reason: string | null;
};

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

export type ClinicTeamActivity = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: Database["public"]["Tables"]["audit_logs"]["Row"]["payload_json"];
  createdAt: string;
};

export async function listClinicTeam(
  clinicId: string,
  currentUserId: string
): Promise<ClinicTeamMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("clinic_staff")
    .select(
      "id, clinic_id, user_id, role, is_active, created_at, archived_at, archived_by, archive_reason"
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not list clinic team: ${error.message}`);
  }

  const usersById = await listAuthUserEmails();
  const rows = (data ?? []) as unknown as StaffRow[];
  const userIds = rows.map((member) => member.user_id);
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

  return rows.map((member) => {
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

export async function listClinicTeamActivity(
  clinicId: string,
  limit = 80
): Promise<ClinicTeamActivity[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select(
      "id, actor_id, action, entity_type, entity_id, payload_json, created_at"
    )
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not list clinic team activity: ${error.message}`);
  }

  const usersById = await listAuthUserEmails();
  return (data ?? []).map((activity) => ({
    id: activity.id,
    actorId: activity.actor_id,
    actorEmail: activity.actor_id
      ? usersById.get(activity.actor_id) ?? null
      : null,
    action: activity.action,
    entityType: activity.entity_type,
    entityId: activity.entity_id,
    payload: activity.payload_json,
    createdAt: activity.created_at
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
