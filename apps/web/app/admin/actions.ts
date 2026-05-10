"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import {
  createClinicSchema,
  createClinicStaffSchema,
  updateClinicStaffStatusSchema
} from "@petcura/validation";
import { ensureAuthUser } from "@/lib/admin/bootstrap";
import { requireSuperAdminContext } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";

function adminRedirect(
  locale: SupportedLocale,
  params: Record<string, string>
): never {
  const searchParams = new URLSearchParams({
    lang: locale,
    ...params
  });

  redirect(`/admin?${searchParams.toString()}`);
}

export async function createClinic(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const superAdmin = await requireSuperAdminContext(locale);
  const parsed = createClinicSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    country: formData.get("country"),
    timezone: formData.get("timezone"),
    locale: formData.get("clinicLocale")
  });

  if (!parsed.success) {
    adminRedirect(locale, { admin_error: "invalid_clinic" });
  }

  const admin = createAdminClient();
  const { data: clinic, error } = await admin
    .from("clinics")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    adminRedirect(locale, { admin_error: "clinic_create_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: clinic.id,
    actor_id: superAdmin.user.id,
    action: "clinic_created",
    entity_type: "clinic",
    entity_id: clinic.id,
    payload_json: {
      slug: parsed.data.slug,
      super_admin_email: superAdmin.email
    }
  });

  revalidatePath("/admin");
  adminRedirect(locale, { admin_status: "clinic_created" });
}

export async function addClinicStaff(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const superAdmin = await requireSuperAdminContext(locale);
  const parsed = createClinicStaffSchema.safeParse({
    clinicId: formData.get("clinicId"),
    email: formData.get("email"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    adminRedirect(locale, { admin_error: "invalid_staff" });
  }

  const admin = createAdminClient();
  const user = await ensureAuthUser(parsed.data.email);
  const { data: membership, error } = await admin
    .from("clinic_staff")
    .upsert(
      {
        clinic_id: parsed.data.clinicId,
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
    adminRedirect(locale, { admin_error: "staff_create_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: parsed.data.clinicId,
    actor_id: superAdmin.user.id,
    action: "staff_provisioned",
    entity_type: "clinic_staff",
    entity_id: membership.id,
    payload_json: {
      email: parsed.data.email,
      role: parsed.data.role,
      super_admin_email: superAdmin.email
    }
  });

  revalidatePath("/admin");
  adminRedirect(locale, { admin_status: "staff_added" });
}

export async function updateClinicStaffStatus(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const superAdmin = await requireSuperAdminContext(locale);
  const parsed = updateClinicStaffStatusSchema.safeParse({
    membershipId: formData.get("membershipId"),
    isActive: formData.get("isActive")
  });

  if (!parsed.success) {
    adminRedirect(locale, { admin_error: "invalid_staff_status" });
  }

  const admin = createAdminClient();
  const { data: membership, error: membershipError } = await admin
    .from("clinic_staff")
    .select("id, clinic_id, user_id")
    .eq("id", parsed.data.membershipId)
    .single();

  if (membershipError) {
    adminRedirect(locale, { admin_error: "staff_not_found" });
  }

  const { error } = await admin
    .from("clinic_staff")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.membershipId);

  if (error) {
    adminRedirect(locale, { admin_error: "staff_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: membership.clinic_id,
    actor_id: superAdmin.user.id,
    action: parsed.data.isActive ? "staff_activated" : "staff_deactivated",
    entity_type: "clinic_staff",
    entity_id: membership.id,
    payload_json: {
      user_id: membership.user_id,
      super_admin_email: superAdmin.email
    }
  });

  revalidatePath("/admin");
  adminRedirect(locale, { admin_status: "staff_updated" });
}
