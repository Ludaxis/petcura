"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import { getOwnerRequest } from "@/lib/owner/data";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireUuid(value: string, label: string) {
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
}

export async function submitOwnerMessage(requestId: string, text: string) {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, `/o/chat/${requestId}`);
  const body = text.trim();

  if (!uuidRegex.test(requestId) || body.length === 0 || body.length > 4000) {
    throw new Error("Invalid owner message.");
  }

  const request = await getOwnerRequest(context, requestId);
  if (!request) {
    throw new Error("Request is not available to this owner.");
  }

  const admin = createAdminClient();
  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: requestId,
      clinic_id: context.clinic.id,
      sender_type: "owner",
      sender_id: context.owner.id,
      body,
      source_locale: context.owner.preferred_language
    })
    .select("id")
    .single();

  if (messageError) {
    throw new Error(`Could not send owner message: ${messageError.message}`);
  }

  const nextStatus =
    request.status === "waiting_owner" || request.status === "resolved"
      ? "waiting_staff"
      : request.status;

  const { error: updateError } = await admin
    .from("requests")
    .update({
      status: nextStatus,
      resolved_at: null
    })
    .eq("clinic_id", context.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not update request status: ${updateError.message}`);
  }

  const events: RequestEventInsert[] = [
    {
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "owner",
      actor_id: context.owner.id,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        source_locale: context.owner.preferred_language,
        channel: "web"
      }
    }
  ];

  if (nextStatus !== request.status) {
    events.push({
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "system",
      actor_id: context.owner.id,
      event_type: "status_changed",
      payload_json: {
        from: request.status,
        to: nextStatus,
        reason: "owner_reply"
      }
    });
  }

  const { error: eventError } = await admin.from("request_events").insert(events);
  if (eventError) {
    throw new Error(`Could not record owner message event: ${eventError.message}`);
  }

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_web_message_sent",
    entity_type: "request",
    entity_id: requestId,
    payload_json: {
      owner_id: context.owner.id,
      message_id: message.id
    }
  });

  revalidatePath(`/o/chat/${requestId}`);
  revalidatePath("/o/chat");
  revalidatePath("/o");
}

export async function requestOwnerAppointment(formData: FormData) {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/services");
  const petId = requireUuid(getString(formData, "petId"), "pet");
  const serviceId = requireUuid(getString(formData, "serviceId"), "service");
  const proposedAt = getString(formData, "proposedAt");
  const notes = getString(formData, "notes");
  const idempotencyKey = getString(formData, "idempotencyKey") || randomUUID();
  const startsAt = new Date(proposedAt);

  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Invalid appointment time.");
  }

  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const proposedWindow = `[${startsAt.toISOString()},${endsAt.toISOString()})`;
  const { data: appointmentId, error } = await context.supabase.rpc(
    "request_appointment",
    {
      p_pet_id: petId,
      p_service_id: serviceId,
      p_proposed_window: proposedWindow,
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey
    }
  );

  if (error || !appointmentId) {
    throw new Error(error?.message ?? "Could not request appointment.");
  }

  const { data: appointment, error: appointmentError } = await context.supabase
    .from("appointments")
    .select("request_id")
    .eq("clinic_id", context.clinic.id)
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    throw new Error(
      `Could not load requested appointment: ${appointmentError.message}`
    );
  }

  revalidatePath("/o/services");
  revalidatePath("/o/chat");
  revalidatePath("/o");

  redirect(appointment?.request_id ? `/o/chat/${appointment.request_id}` : "/o");
}
