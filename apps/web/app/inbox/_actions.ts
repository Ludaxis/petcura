"use server";

import { revalidatePath } from "next/cache";
import { normalizeLocale } from "@petcura/shared";
import { requireStaffContext } from "@/lib/auth/staff";

type ActionResult = { ok: true } | { ok: false; error: string };
type StaffContext = Awaited<ReturnType<typeof requireStaffContext>>;

async function loadRequestForInboxAction(
  ctx: StaffContext,
  requestId: string
) {
  const { data, error } = await ctx.supabase
    .from("requests")
    .select("id, status, assigned_staff_id")
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return { request: data, error: null };
}

function refreshInboxRequest(requestId: string) {
  revalidatePath("/inbox");
  revalidatePath(`/requests/${requestId}`);
}

export async function resolveInboxRequest(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  const { request, error: loadError } = await loadRequestForInboxAction(
    ctx,
    requestId
  );

  if (loadError) {
    return { ok: false, error: loadError };
  }

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  if (request.status === "resolved") {
    refreshInboxRequest(requestId);
    return { ok: true };
  }

  const { error } = await ctx.supabase
    .from("requests")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      event_type: "resolved",
      actor_type: "staff",
      actor_id: ctx.user.id,
      payload_json: {
        from: request.status,
        to: "resolved",
        staff_id: ctx.membership.id,
        source: "inbox_keyboard"
      }
    });

  if (eventError) {
    return { ok: false, error: eventError.message };
  }

  refreshInboxRequest(requestId);
  return { ok: true };
}

export async function assignInboxRequestToMe(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");
  const { request, error: loadError } = await loadRequestForInboxAction(
    ctx,
    requestId
  );

  if (loadError) {
    return { ok: false, error: loadError };
  }

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  if (request.assigned_staff_id === ctx.membership.id) {
    refreshInboxRequest(requestId);
    return { ok: true };
  }

  const { error } = await ctx.supabase
    .from("requests")
    .update({ assigned_staff_id: ctx.membership.id })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      event_type: "assigned",
      actor_type: "staff",
      actor_id: ctx.user.id,
      payload_json: {
        from: request.assigned_staff_id,
        to: ctx.membership.id,
        staff_id: ctx.membership.id,
        source: "inbox_keyboard"
      }
    });

  if (eventError) {
    return { ok: false, error: eventError.message };
  }

  refreshInboxRequest(requestId);
  return { ok: true };
}
