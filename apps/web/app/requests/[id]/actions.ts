"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeLocale,
  type Database,
  type RequestStatus
} from "@petcura/shared";
import {
  aiDraftDecisionSchema,
  aiDraftEditSchema,
  aiDraftRejectSchema,
  createReminderSchema,
  internalNoteSchema,
  requestAssignmentSchema,
  requestStatusUpdateSchema,
  requestUrgencyUpdateSchema,
  staffReplySchema,
  translationRevealSchema
} from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  hasStaffPermission,
  requireStaffPermission
} from "@/lib/auth/permissions";
import { sendWhatsAppStaffMessage } from "@/lib/twilio/outbound";
import { getTwilioDeliveryEventId } from "@/lib/twilio/whatsapp";

function requestPath(
  requestId: string,
  locale: string,
  params?: Record<string, string>
) {
  const searchParams = new URLSearchParams({
    lang: locale,
    ...(params ?? {})
  });

  return `/requests/${encodeURIComponent(requestId)}?${searchParams.toString()}`;
}

function redirectToRequest(
  requestId: string,
  locale: string,
  params?: Record<string, string>
): never {
  redirect(requestPath(requestId, locale, params));
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function eventTypeForStatusChange(
  fromStatus: RequestStatus,
  toStatus: RequestStatus
) {
  if (toStatus === "resolved") return "resolved";
  if (fromStatus === "resolved") return "reopened";

  return "status_changed";
}

type RequestForAction = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  "id" | "pet_id" | "status" | "urgency" | "assigned_staff_id" | "channel"
> & {
  owners: Pick<Database["public"]["Tables"]["owners"]["Row"], "phone"> | null;
};

async function loadRequestForAction(
  supabase: Awaited<ReturnType<typeof requireStaffContext>>["supabase"],
  clinicId: string,
  requestId: string
) {
  const { data, error } = await supabase
    .from("requests")
    .select("id, pet_id, status, urgency, assigned_staff_id, channel, owners(phone)")
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load request for action: ${error.message}`);
  }

  return data as unknown as RequestForAction | null;
}

type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];

function refreshRequestViews(requestId: string) {
  revalidatePath("/inbox");
  revalidatePath(`/requests/${requestId}`);
}

export async function sendStaffReply(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = staffReplySchema.safeParse({
    requestId: getString(formData, "requestId"),
    body: getString(formData, "body")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "reply"
    });
  }

  const { requestId, body } = parsed.data;
  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "requests:reply")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  let delivery:
    | Awaited<ReturnType<typeof sendWhatsAppStaffMessage>>
    | null = null;

  if (request.channel === "whatsapp") {
    const ownerPhone = request.owners?.phone;

    if (!ownerPhone) {
      redirectToRequest(requestId, locale, { action_error: "delivery" });
    }

    try {
      delivery = await sendWhatsAppStaffMessage({
        supabase: staffContext.supabase,
        clinicId: staffContext.clinic.id,
        toPhone: ownerPhone,
        body
      });
    } catch {
      redirectToRequest(requestId, locale, { action_error: "delivery" });
    }
  }

  const { data: message, error: messageError } = await staffContext.supabase
    .from("messages")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      sender_type: "staff",
      sender_id: staffContext.user.id,
      body,
      source_locale: locale,
      external_id: delivery?.sid ?? null
    })
    .select("id")
    .single();

  if (messageError) {
    throw new Error(`Could not save staff reply: ${messageError.message}`);
  }

  const nextStatus: RequestStatus = "waiting_owner";
  const { error: updateError } = await staffContext.supabase
    .from("requests")
    .update({
      status: nextStatus,
      resolved_at: null
    })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not update request after reply: ${updateError.message}`);
  }

  if (delivery) {
    const { error: deliveryError } = await staffContext.supabase
      .from("message_delivery_events")
      .insert({
        message_id: message.id,
        clinic_id: staffContext.clinic.id,
        channel: "whatsapp",
        status: delivery.status,
        provider: "twilio",
        external_event_id: getTwilioDeliveryEventId(
          delivery.sid,
          delivery.rawStatus
        ),
        payload_json: {
          provider_status: delivery.rawStatus
        }
      });

    if (deliveryError) {
      throw new Error(
        `Could not record WhatsApp delivery event: ${deliveryError.message}`
      );
    }
  }

  const events: RequestEventInsert[] = [
    {
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: "message_sent",
      payload_json: {
        message_id: message.id,
        staff_id: staffContext.membership.id,
        channel: request.channel,
        external_id: delivery?.sid ?? null,
        delivery_status: delivery?.status ?? null
      }
    }
  ];

  if (request.status !== nextStatus) {
    events.push({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: eventTypeForStatusChange(request.status, nextStatus),
      payload_json: {
        from: request.status,
        to: nextStatus
      }
    });
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert(events);

  if (eventError) {
    throw new Error(`Could not write reply event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "reply_sent" });
}

export async function addInternalNote(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = internalNoteSchema.safeParse({
    requestId: getString(formData, "requestId"),
    body: getString(formData, "body")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "note"
    });
  }

  const { requestId, body } = parsed.data;
  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  const { data: note, error: noteError } = await staffContext.supabase
    .from("internal_notes")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      author_id: staffContext.user.id,
      body
    })
    .select("id")
    .single();

  if (noteError) {
    throw new Error(`Could not save internal note: ${noteError.message}`);
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: "note_created",
      payload_json: {
        note_id: note.id,
        staff_id: staffContext.membership.id
      }
    });

  if (eventError) {
    throw new Error(`Could not write note event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "note_added" });
}

export async function createReminder(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const requestId = getString(formData, "requestId");
  const parsed = createReminderSchema.safeParse({
    requestId,
    type: getString(formData, "type"),
    title: getString(formData, "title"),
    body: getString(formData, "body"),
    dueAt: getString(formData, "dueAt"),
    channel: getString(formData, "channel") || "whatsapp"
  });

  if (!parsed.success) {
    redirectToRequest(requestId, locale, { action_error: "reminder" });
  }

  const { type, title, body, dueAt, channel } = parsed.data;
  const dueDate = new Date(dueAt);
  if (Number.isNaN(dueDate.getTime())) {
    redirectToRequest(requestId, locale, { action_error: "reminder" });
  }

  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "reminders:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  const { data: reminder, error: reminderError } = await staffContext.supabase
    .from("reminders")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      pet_id: request.pet_id,
      type,
      title,
      body: body?.trim() ? body.trim() : null,
      due_at: dueDate.toISOString(),
      channel,
      status: "scheduled",
      created_by: staffContext.user.id
    })
    .select("id")
    .single();

  if (reminderError) {
    throw new Error(`Could not create reminder: ${reminderError.message}`);
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: "reminder_created",
      payload_json: {
        reminder_id: reminder.id,
        staff_id: staffContext.membership.id,
        type,
        due_at: dueDate.toISOString(),
        channel
      }
    });

  if (eventError) {
    throw new Error(`Could not write reminder event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  revalidatePath("/reminders");
  redirectToRequest(requestId, locale, { action_status: "reminder_created" });
}

export async function updateRequestStatus(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = requestStatusUpdateSchema.safeParse({
    requestId: getString(formData, "requestId"),
    status: getString(formData, "status")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "status"
    });
  }

  const { requestId, status } = parsed.data;
  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  if (request.status === status) {
    redirectToRequest(requestId, locale);
  }

  const { error: updateError } = await staffContext.supabase
    .from("requests")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null
    })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not update request status: ${updateError.message}`);
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: eventTypeForStatusChange(request.status, status),
      payload_json: {
        from: request.status,
        to: status,
        staff_id: staffContext.membership.id
      }
    });

  if (eventError) {
    throw new Error(`Could not write status event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "status_updated" });
}

export async function updateRequestUrgency(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = requestUrgencyUpdateSchema.safeParse({
    requestId: getString(formData, "requestId"),
    urgency: getString(formData, "urgency")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "urgency"
    });
  }

  const { requestId, urgency } = parsed.data;
  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  if (request.urgency === urgency) {
    redirectToRequest(requestId, locale);
  }

  const { error: updateError } = await staffContext.supabase
    .from("requests")
    .update({ urgency })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not update request urgency: ${updateError.message}`);
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: "urgency_changed",
      payload_json: {
        from: request.urgency,
        to: urgency,
        staff_id: staffContext.membership.id
      }
    });

  if (eventError) {
    throw new Error(`Could not write urgency event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "urgency_updated" });
}

export async function assignRequest(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = requestAssignmentSchema.safeParse({
    requestId: getString(formData, "requestId"),
    staffMemberId: getString(formData, "staffMemberId")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "assignment"
    });
  }

  const { requestId, staffMemberId } = parsed.data;
  const staffContext = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(staffContext, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }
  const request = await loadRequestForAction(
    staffContext.supabase,
    staffContext.clinic.id,
    requestId
  );

  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  const nextStaffId = staffMemberId === "unassigned" ? null : staffMemberId;

  if (nextStaffId) {
    const { data: staffMember, error: staffError } = await staffContext.supabase
      .from("clinic_staff")
      .select("id")
      .eq("clinic_id", staffContext.clinic.id)
      .eq("id", nextStaffId)
      .eq("is_active", true)
      .maybeSingle();

    if (staffError) {
      throw new Error(`Could not verify assignee: ${staffError.message}`);
    }

    if (!staffMember) {
      redirectToRequest(requestId, locale, { action_error: "assignment" });
    }
  }

  if (request.assigned_staff_id === nextStaffId) {
    redirectToRequest(requestId, locale);
  }

  const { error: updateError } = await staffContext.supabase
    .from("requests")
    .update({ assigned_staff_id: nextStaffId })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not assign request: ${updateError.message}`);
  }

  const { error: eventError } = await staffContext.supabase
    .from("request_events")
    .insert({
      clinic_id: staffContext.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: staffContext.user.id,
      event_type: "assigned",
      payload_json: {
        from: request.assigned_staff_id,
        to: nextStaffId,
        staff_id: staffContext.membership.id
      }
    });

  if (eventError) {
    throw new Error(`Could not write assignment event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "assigned" });
}

type AiDraftActionResult = { ok: true } | { ok: false; error: string };

type AiDraftRow = Pick<
  Database["public"]["Tables"]["ai_outputs"]["Row"],
  | "id"
  | "request_id"
  | "kind"
  | "accepted"
  | "output_json"
  | "edited_output_json"
>;

async function loadDraftForAction(
  supabase: Awaited<ReturnType<typeof requireStaffContext>>["supabase"],
  clinicId: string,
  requestId: string,
  aiOutputId: string
): Promise<{ draft: AiDraftRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("ai_outputs")
    .select(
      "id, request_id, kind, accepted, output_json, edited_output_json"
    )
    .eq("clinic_id", clinicId)
    .eq("id", aiOutputId)
    .eq("request_id", requestId)
    .eq("kind", "reply_draft")
    .maybeSingle();

  if (error) return { draft: null, error: error.message };
  return { draft: (data as AiDraftRow | null) ?? null, error: null };
}

export async function acceptAiDraft(input: {
  requestId: string;
  aiOutputId: string;
}): Promise<AiDraftActionResult> {
  const parsed = aiDraftDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { requestId, aiOutputId } = parsed.data;
  const ctx = await requireStaffContext("en", `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:reply")) {
    return { ok: false, error: "forbidden" };
  }
  const { draft, error: loadError } = await loadDraftForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId,
    aiOutputId
  );

  if (loadError) return { ok: false, error: loadError };
  if (!draft) return { ok: false, error: "not_found" };
  if (draft.accepted !== null) {
    // Idempotent — already decided.
    refreshRequestViews(requestId);
    return { ok: true };
  }

  const { error: updateError } = await ctx.supabase
    .from("ai_outputs")
    .update({ accepted: true, reviewed_by: ctx.user.id })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", aiOutputId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "ai_draft_accepted",
      payload_json: {
        ai_output_id: aiOutputId,
        staff_id: ctx.membership.id
      }
    });

  if (eventError) return { ok: false, error: eventError.message };

  refreshRequestViews(requestId);
  return { ok: true };
}

export async function editAiDraft(input: {
  requestId: string;
  aiOutputId: string;
  editedText: string;
  saveOnly?: boolean;
}): Promise<AiDraftActionResult> {
  const parsed = aiDraftEditSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { requestId, aiOutputId, editedText, saveOnly } = parsed.data;
  const ctx = await requireStaffContext("en", `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:reply")) {
    return { ok: false, error: "forbidden" };
  }
  const { draft, error: loadError } = await loadDraftForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId,
    aiOutputId
  );

  if (loadError) return { ok: false, error: loadError };
  if (!draft) return { ok: false, error: "not_found" };
  if (draft.accepted === false) {
    // Already rejected — refuse to flip it.
    return { ok: false, error: "already_rejected" };
  }

  // saveOnly = true  → write edit, keep accepted=null, log ai_draft_edited.
  // saveOnly = false → write edit, set accepted=true, log ai_draft_accepted_with_edits.
  const updatePayload: Database["public"]["Tables"]["ai_outputs"]["Update"] =
    saveOnly
      ? { edited_output_json: { text: editedText } }
      : {
          accepted: true,
          reviewed_by: ctx.user.id,
          edited_output_json: { text: editedText }
        };

  const { error: updateError } = await ctx.supabase
    .from("ai_outputs")
    .update(updatePayload)
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", aiOutputId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: saveOnly ? "ai_draft_edited" : "ai_draft_accepted_with_edits",
      payload_json: {
        ai_output_id: aiOutputId,
        staff_id: ctx.membership.id,
        edited_length: editedText.length
      }
    });

  if (eventError) return { ok: false, error: eventError.message };

  refreshRequestViews(requestId);
  return { ok: true };
}

export async function rejectAiDraft(input: {
  requestId: string;
  aiOutputId: string;
  reason?: string;
}): Promise<AiDraftActionResult> {
  const parsed = aiDraftRejectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { requestId, aiOutputId, reason } = parsed.data;
  const ctx = await requireStaffContext("en", `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:reply")) {
    return { ok: false, error: "forbidden" };
  }
  const { draft, error: loadError } = await loadDraftForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId,
    aiOutputId
  );

  if (loadError) return { ok: false, error: loadError };
  if (!draft) return { ok: false, error: "not_found" };
  if (draft.accepted !== null) {
    refreshRequestViews(requestId);
    return { ok: true };
  }

  const { error: updateError } = await ctx.supabase
    .from("ai_outputs")
    .update({ accepted: false, reviewed_by: ctx.user.id })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", aiOutputId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "ai_draft_rejected",
      payload_json: {
        ai_output_id: aiOutputId,
        staff_id: ctx.membership.id,
        reason: reason ?? null
      }
    });

  if (eventError) return { ok: false, error: eventError.message };

  refreshRequestViews(requestId);
  return { ok: true };
}

export async function logTranslationRevealed(input: {
  requestId: string;
  messageId: string;
  targetLocale: string;
}): Promise<AiDraftActionResult> {
  const parsed = translationRevealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { requestId, messageId, targetLocale } = parsed.data;
  const ctx = await requireStaffContext("en", `/requests/${requestId}`);
  requireStaffPermission(ctx, "requests:view");

  // Confirm the message belongs to this clinic + request before we log.
  const { data: message, error: messageError } = await ctx.supabase
    .from("messages")
    .select("id")
    .eq("clinic_id", ctx.clinic.id)
    .eq("request_id", requestId)
    .eq("id", messageId)
    .maybeSingle();

  if (messageError) return { ok: false, error: messageError.message };
  if (!message) return { ok: false, error: "not_found" };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "translation_revealed",
      payload_json: {
        message_id: messageId,
        target_locale: targetLocale,
        staff_id: ctx.membership.id
      }
    });

  if (eventError) return { ok: false, error: eventError.message };
  return { ok: true };
}
