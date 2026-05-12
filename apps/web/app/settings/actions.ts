"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canAssignStaffRole,
  canManageStaffMember,
  hasClinicPermission,
  normalizeLocale,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import {
  createClinicStaffSchema,
  updateTeamMemberProfileSchema,
  updateClinicStaffRoleSchema,
  updateClinicStaffStatusSchema
} from "@petcura/validation";
import { ensureAuthUser } from "@/lib/admin/bootstrap";
import { requireStaffContext } from "@/lib/auth/staff";
import { countActiveOwners } from "@/lib/clinic/team";
import {
  hasUsableProfileImage,
  uploadProfileImage
} from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

function settingsRedirect(
  locale: SupportedLocale,
  params: Record<string, string>
): never {
  const searchParams = new URLSearchParams({
    lang: locale,
    ...params
  });

  redirect(`/settings?${searchParams.toString()}`);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPhoto(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && hasUsableProfileImage(value) ? value : null;
}

function nullable(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

async function getTeamActionContext(locale: SupportedLocale) {
  const staffContext = await requireStaffContext(locale, "/settings");
  const actorRole = staffContext.membership.role as StaffRole;

  if (!hasClinicPermission(actorRole, "team:manage")) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  return { staffContext, actorRole };
}

export async function addClinicTeamMember(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const { staffContext, actorRole } = await getTeamActionContext(locale);
  const parsed = createClinicStaffSchema.safeParse({
    clinicId: staffContext.clinic.id,
    email: getString(formData, "email"),
    role: getString(formData, "role")
  });

  if (!parsed.success || !canAssignStaffRole(actorRole, parsed.data.role)) {
    settingsRedirect(locale, { settings_error: "invalid_staff" });
  }

  const admin = createAdminClient();
  const user = await ensureAuthUser(parsed.data.email);
  const { data: membership, error } = await admin
    .from("clinic_staff")
    .upsert(
      {
        clinic_id: staffContext.clinic.id,
        user_id: user.id,
        role: parsed.data.role,
        is_active: true
      },
      {
        onConflict: "clinic_id,user_id"
      }
    )
    .select("id")
    .single();

  if (error) {
    settingsRedirect(locale, { settings_error: "staff_create_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "clinic_staff_added",
    entity_type: "clinic_staff",
    entity_id: membership.id,
    payload_json: {
      email: parsed.data.email,
      role: parsed.data.role,
      source: "clinic_settings"
    }
  });

  revalidatePath("/settings");
  settingsRedirect(locale, { settings_status: "staff_added" });
}

export async function updateClinicTeamMemberRole(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const { staffContext, actorRole } = await getTeamActionContext(locale);
  const parsed = updateClinicStaffRoleSchema.safeParse({
    membershipId: getString(formData, "membershipId"),
    role: getString(formData, "role")
  });

  if (!parsed.success || !canAssignStaffRole(actorRole, parsed.data.role)) {
    settingsRedirect(locale, { settings_error: "invalid_role" });
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("clinic_staff")
    .select("id, clinic_id, user_id, role, is_active")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.membershipId)
    .maybeSingle();

  if (targetError || !target) {
    settingsRedirect(locale, { settings_error: "staff_not_found" });
  }

  const targetRole = target.role as StaffRole;
  if (!canManageStaffMember(actorRole, targetRole)) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  if (
    targetRole === "owner" &&
    parsed.data.role !== "owner" &&
    target.is_active &&
    (await countActiveOwners(staffContext.clinic.id)) <= 1
  ) {
    settingsRedirect(locale, { settings_error: "last_owner" });
  }

  if (targetRole === parsed.data.role) {
    settingsRedirect(locale, {});
  }

  const { error } = await admin
    .from("clinic_staff")
    .update({ role: parsed.data.role })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.membershipId);

  if (error) {
    settingsRedirect(locale, { settings_error: "role_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "clinic_staff_role_updated",
    entity_type: "clinic_staff",
    entity_id: target.id,
    payload_json: {
      user_id: target.user_id,
      from: targetRole,
      to: parsed.data.role,
      source: "clinic_settings"
    }
  });

  revalidatePath("/settings");
  settingsRedirect(locale, { settings_status: "role_updated" });
}

export async function updateClinicTeamMemberStatus(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const { staffContext, actorRole } = await getTeamActionContext(locale);
  const parsed = updateClinicStaffStatusSchema.safeParse({
    membershipId: getString(formData, "membershipId"),
    isActive: getString(formData, "isActive")
  });

  if (!parsed.success) {
    settingsRedirect(locale, { settings_error: "invalid_status" });
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("clinic_staff")
    .select("id, clinic_id, user_id, role, is_active")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.membershipId)
    .maybeSingle();

  if (targetError || !target) {
    settingsRedirect(locale, { settings_error: "staff_not_found" });
  }

  const targetRole = target.role as StaffRole;
  if (!canManageStaffMember(actorRole, targetRole)) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  if (target.user_id === staffContext.user.id && !parsed.data.isActive) {
    settingsRedirect(locale, { settings_error: "self_deactivate" });
  }

  if (
    targetRole === "owner" &&
    target.is_active &&
    !parsed.data.isActive &&
    (await countActiveOwners(staffContext.clinic.id)) <= 1
  ) {
    settingsRedirect(locale, { settings_error: "last_owner" });
  }

  if (target.is_active === parsed.data.isActive) {
    settingsRedirect(locale, {});
  }

  const { error } = await admin
    .from("clinic_staff")
    .update({ is_active: parsed.data.isActive })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.membershipId);

  if (error) {
    settingsRedirect(locale, { settings_error: "staff_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: parsed.data.isActive
      ? "clinic_staff_activated"
      : "clinic_staff_deactivated",
    entity_type: "clinic_staff",
    entity_id: target.id,
    payload_json: {
      user_id: target.user_id,
      role: targetRole,
      source: "clinic_settings"
    }
  });

  revalidatePath("/settings");
  settingsRedirect(locale, { settings_status: "staff_updated" });
}

export async function updateClinicTeamMemberProfile(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const { staffContext, actorRole } = await getTeamActionContext(locale);
  const parsed = updateTeamMemberProfileSchema.safeParse({
    membershipId: getString(formData, "membershipId"),
    fullName: getString(formData, "fullName"),
    displayName: getString(formData, "displayName"),
    phone: getString(formData, "phone"),
    jobTitle: getString(formData, "jobTitle"),
    locale: getString(formData, "profileLocale") || locale
  });

  if (!parsed.success) {
    settingsRedirect(locale, { settings_error: "invalid_profile" });
  }

  const admin = createAdminClient();
  const { data: target, error: targetError } = await admin
    .from("clinic_staff")
    .select("id, clinic_id, user_id, role, is_active")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.membershipId)
    .maybeSingle();

  if (targetError || !target) {
    settingsRedirect(locale, { settings_error: "staff_not_found" });
  }

  const targetRole = target.role as StaffRole;
  if (!canManageStaffMember(actorRole, targetRole)) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  const photo = getPhoto(formData);
  let avatarUrl: string | undefined;

  if (photo) {
    try {
      avatarUrl = await uploadProfileImage({
        clinicId: staffContext.clinic.id,
        entity: "staff",
        entityId: target.user_id,
        file: photo
      });
    } catch {
      settingsRedirect(locale, { settings_error: "photo_upload_failed" });
    }
  }

  const { error } = await admin.from("user_profiles").upsert(
    {
      user_id: target.user_id,
      full_name: parsed.data.fullName,
      display_name: nullable(parsed.data.displayName),
      phone: nullable(parsed.data.phone),
      job_title: nullable(parsed.data.jobTitle),
      locale: parsed.data.locale,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {})
    },
    { onConflict: "user_id" }
  );

  if (error) {
    settingsRedirect(locale, { settings_error: "profile_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "clinic_staff_profile_updated",
    entity_type: "clinic_staff",
    entity_id: target.id,
    payload_json: {
      user_id: target.user_id,
      source: "clinic_settings",
      avatar_url: Boolean(avatarUrl)
    }
  });

  revalidatePath("/settings");
  revalidatePath("/profile");
  settingsRedirect(locale, { settings_status: "profile_saved" });
}
