"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeLocale, type Json, type SupportedLocale } from "@petcura/shared";
import {
  createClinicSchema,
  createClinicStaffSchema,
  marketingLeadAdminNoteSchema,
  marketingLeadArchiveSchema,
  marketingLeadReplyHandoffSchema,
  marketingLeadStatusUpdateSchema,
  updateClinicStaffStatusSchema
} from "@petcura/validation";
import { ensureAuthUser } from "@/lib/admin/bootstrap";
import { requireSuperAdminContext } from "@/lib/auth/super-admin";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminActionResult = {
  ok: boolean;
  affected: number;
  error?: string;
};

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
  adminRedirect(locale, { tab: "clinics", admin_status: "clinic_created" });
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
  adminRedirect(locale, { tab: "staff", admin_status: "staff_added" });
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
  adminRedirect(locale, { tab: "staff", admin_status: "staff_updated" });
}

async function insertLeadEvents({
  leadIds,
  actorId,
  actorEmail,
  action,
  payload
}: {
  leadIds: string[];
  actorId: string;
  actorEmail: string;
  action: string;
  payload: Json;
}) {
  if (leadIds.length === 0) return;

  const admin = createAdminClient();
  const { error } = await admin.from("marketing_lead_events").insert(
    leadIds.map((leadId) => ({
      lead_id: leadId,
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      payload_json: payload
    }))
  );

  if (error) {
    throw new Error(`Could not write marketing lead events: ${error.message}`);
  }
}

export async function updateMarketingLeadStatus(
  leadIds: string[],
  status: string,
  locale: SupportedLocale
): Promise<AdminActionResult> {
  const normalizedLocale = normalizeLocale(locale);
  const superAdmin = await requireSuperAdminContext(normalizedLocale);
  const parsed = marketingLeadStatusUpdateSchema.safeParse({
    leadIds,
    status
  });

  if (!parsed.success) {
    return { ok: false, affected: 0, error: "invalid_lead_status" };
  }

  const now = new Date().toISOString();
  const patch =
    parsed.data.status === "contacted"
      ? {
          status: parsed.data.status,
          last_contacted_at: now,
          last_contacted_by: superAdmin.user.id
        }
      : { status: parsed.data.status };

  const admin = createAdminClient();
  const { data: updatedLeads, count, error } = await admin
    .from("marketing_leads")
    .update(patch, { count: "exact" })
    .in("id", parsed.data.leadIds)
    .neq("status", "archived")
    .select("id");

  if (error) {
    return { ok: false, affected: 0, error: "lead_status_failed" };
  }

  const updatedLeadIds = (updatedLeads ?? []).map((lead) => lead.id);
  await insertLeadEvents({
    leadIds: updatedLeadIds,
    actorId: superAdmin.user.id,
    actorEmail: superAdmin.email,
    action: "status_changed",
    payload: { status: parsed.data.status }
  });

  revalidatePath("/admin");
  return { ok: true, affected: count ?? 0 };
}

export async function archiveMarketingLeads(
  leadIds: string[],
  locale: SupportedLocale
): Promise<AdminActionResult> {
  const normalizedLocale = normalizeLocale(locale);
  const superAdmin = await requireSuperAdminContext(normalizedLocale);
  const parsed = marketingLeadArchiveSchema.safeParse({ leadIds });

  if (!parsed.success) {
    return { ok: false, affected: 0, error: "invalid_leads" };
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data: updatedLeads, count, error } = await admin
    .from("marketing_leads")
    .update(
      {
        status: "archived",
        archived_at: now,
        archived_by: superAdmin.user.id
      },
      { count: "exact" }
    )
    .in("id", parsed.data.leadIds)
    .neq("status", "archived")
    .select("id");

  if (error) {
    return { ok: false, affected: 0, error: "lead_archive_failed" };
  }

  const updatedLeadIds = (updatedLeads ?? []).map((lead) => lead.id);
  await insertLeadEvents({
    leadIds: updatedLeadIds,
    actorId: superAdmin.user.id,
    actorEmail: superAdmin.email,
    action: "archived",
    payload: { archived: true }
  });

  revalidatePath("/admin");
  return { ok: true, affected: count ?? 0 };
}

export async function recordMarketingLeadReplyHandoff(
  leadId: string,
  locale: SupportedLocale
): Promise<AdminActionResult> {
  const normalizedLocale = normalizeLocale(locale);
  const superAdmin = await requireSuperAdminContext(normalizedLocale);
  const parsed = marketingLeadReplyHandoffSchema.safeParse({ leadId });

  if (!parsed.success) {
    return { ok: false, affected: 0, error: "invalid_lead" };
  }

  const now = new Date().toISOString();
  const admin = createAdminClient();
  const { data: updatedLeads, count, error } = await admin
    .from("marketing_leads")
    .update(
      {
        status: "contacted",
        last_contacted_at: now,
        last_contacted_by: superAdmin.user.id
      },
      { count: "exact" }
    )
    .eq("id", parsed.data.leadId)
    .neq("status", "archived")
    .select("id");

  if (error) {
    return { ok: false, affected: 0, error: "lead_reply_failed" };
  }

  await insertLeadEvents({
    leadIds: (updatedLeads ?? []).map((lead) => lead.id),
    actorId: superAdmin.user.id,
    actorEmail: superAdmin.email,
    action: "reply_handoff",
    payload: { channel: "email" }
  });

  revalidatePath("/admin");
  return { ok: true, affected: count ?? 0 };
}

export async function saveMarketingLeadAdminNote(
  leadId: string,
  adminNote: string,
  locale: SupportedLocale
): Promise<AdminActionResult> {
  const normalizedLocale = normalizeLocale(locale);
  const superAdmin = await requireSuperAdminContext(normalizedLocale);
  const parsed = marketingLeadAdminNoteSchema.safeParse({ leadId, adminNote });

  if (!parsed.success) {
    return { ok: false, affected: 0, error: "invalid_lead_note" };
  }

  const admin = createAdminClient();
  const { data: updatedLeads, count, error } = await admin
    .from("marketing_leads")
    .update({ admin_note: parsed.data.adminNote ?? null }, { count: "exact" })
    .eq("id", parsed.data.leadId)
    .select("id");

  if (error) {
    return { ok: false, affected: 0, error: "lead_note_failed" };
  }

  await insertLeadEvents({
    leadIds: (updatedLeads ?? []).map((lead) => lead.id),
    actorId: superAdmin.user.id,
    actorEmail: superAdmin.email,
    action: "note_updated",
    payload: { has_note: Boolean(parsed.data.adminNote) }
  });

  revalidatePath("/admin");
  return { ok: true, affected: count ?? 0 };
}
