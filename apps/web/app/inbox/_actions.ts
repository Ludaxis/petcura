"use server";

import { revalidatePath } from "next/cache";
import { normalizeLocale } from "@petcura/shared";
import { requireStaffContext } from "@/lib/auth/staff";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function resolveInboxRequest(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");

  const { error } = await ctx.supabase
    .from("requests")
    .update({ status: "resolved" })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await ctx.supabase.from("request_events").insert({
    clinic_id: ctx.clinic.id,
    request_id: requestId,
    event_type: "status_changed",
    actor_type: "staff",
    actor_id: ctx.user.id,
    payload_json: { status: "resolved", source: "inbox_keyboard" }
  });

  revalidatePath("/inbox");
  return { ok: true };
}

export async function assignInboxRequestToMe(
  requestId: string,
  locale?: string
): Promise<ActionResult> {
  const lang = normalizeLocale(locale);
  const ctx = await requireStaffContext(lang, "/inbox");

  const { error } = await ctx.supabase
    .from("requests")
    .update({ assigned_staff_id: ctx.membership.id })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await ctx.supabase.from("request_events").insert({
    clinic_id: ctx.clinic.id,
    request_id: requestId,
    event_type: "assigned",
    actor_type: "staff",
    actor_id: ctx.user.id,
    payload_json: {
      assigned_staff_id: ctx.membership.id,
      source: "inbox_keyboard"
    }
  });

  revalidatePath("/inbox");
  return { ok: true };
}
