"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeLocale,
  type Database,
  type RequestStatus
} from "@petcura/shared";
import { aiPromptRegistry, summaryLocalizationOutputSchema } from "@petcura/ai";
import {
  aiDraftDecisionSchema,
  aiDraftEditSchema,
  aiDraftRejectSchema,
  aiMemoryDecisionSchema,
  aiMemoryEditSchema,
  aiReplyDraftGenerationSchema,
  aiSummaryEditSchema,
  aiSummaryTranslateSchema,
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
import {
  buildSummaryLocalizationPrompt,
  buildEditedAiSummaryLocalization,
  getSummaryTranslationModel,
  summaryTranslationSystemPrompt,
  summaryTranslationPromptVersion,
  writeAiSummaryLocalization
} from "@/lib/ai/summary-localization";
import { generateAccountedJson } from "@/lib/ai/accountability";
import { enqueueOutboundMessage } from "@/lib/twilio/outbox";
import { generateReplyDraftForRequest } from "@/lib/ai/memory";
import {
  sendPetCuraInngestEvent,
  shouldUseInngestAiJobs
} from "@/lib/inngest/client";
import { AI_REPLY_DRAFT_REQUESTED_EVENT } from "../../../../../jobs/inngest/events";

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
  | "id"
  | "owner_id"
  | "pet_id"
  | "status"
  | "urgency"
  | "assigned_staff_id"
  | "channel"
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
    .select("id, owner_id, pet_id, status, urgency, assigned_staff_id, channel, owners(phone)")
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

  let ownerPhone: string | null = null;

  if (request.channel === "whatsapp") {
    ownerPhone = request.owners?.phone ?? null;

    if (!ownerPhone) {
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
      external_id: null
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

  let outboundMessageId: string | null = null;
  let deliveryStatus: "queued" | null = null;

  if (request.channel === "whatsapp" && ownerPhone) {
    const outbound = await enqueueOutboundMessage({
      supabase: staffContext.supabase as never,
      clinicId: staffContext.clinic.id,
      requestId,
      messageId: message.id,
      ownerId: request.owner_id,
      createdBy: staffContext.user.id,
      source: "staff_reply",
      channel: "whatsapp",
      toPhone: ownerPhone,
      body,
      idempotencyKey: `staff-reply:${message.id}`
    });

    outboundMessageId = outbound.id;
    deliveryStatus = "queued";
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
        outbound_message_id: outboundMessageId,
        external_id: null,
        delivery_status: deliveryStatus
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

type AiSummaryRequestRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  | "id"
  | "ai_summary"
  | "ai_summary_translations_json"
  | "risk_flags_json"
>;

type AiOutputJson =
  Database["public"]["Tables"]["ai_outputs"]["Insert"]["input_json"];

function toAiOutputJson(value: unknown): AiOutputJson {
  return value as AiOutputJson;
}

function parseRiskFlagsText(value: string) {
  return value
    .split(/\r?\n/)
    .map((flag) => flag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function pickRiskFlags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((flag): flag is string => typeof flag === "string");
}

async function loadAiSummaryRequestForAction(
  supabase: Awaited<ReturnType<typeof requireStaffContext>>["supabase"],
  clinicId: string,
  requestId: string
): Promise<AiSummaryRequestRow | null> {
  const { data, error } = await supabase
    .from("requests")
    .select("id, ai_summary, ai_summary_translations_json, risk_flags_json")
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load AI summary: ${error.message}`);
  }

  return data as AiSummaryRequestRow | null;
}

export async function translateAiSummary(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = aiSummaryTranslateSchema.safeParse({
    requestId: getString(formData, "requestId"),
    targetLocale: getString(formData, "targetLocale") || locale
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "summary_translate"
    });
  }

  const { requestId, targetLocale } = parsed.data;
  if (targetLocale === "en") {
    redirectToRequest(requestId, locale, { action_status: "summary" });
  }

  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }

  const request = await loadAiSummaryRequestForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId
  );
  const summaryText = request?.ai_summary?.trim();
  if (!request || !summaryText) {
    redirectToRequest(requestId, locale, { action_error: "summary_translate" });
  }

  const sourceRiskFlags = pickRiskFlags(request.risk_flags_json);
  const translation = await generateAccountedJson({
    db: ctx.supabase,
    clinicId: ctx.clinic.id,
    requestId,
    kind: "summary_translation",
    promptKey: aiPromptRegistry.summaryTranslation.key,
    promptVersion: summaryTranslationPromptVersion,
    model: getSummaryTranslationModel(),
    system: summaryTranslationSystemPrompt,
    prompt: buildSummaryLocalizationPrompt({
      summaryText,
      riskFlags: sourceRiskFlags,
      targetLocale
    }),
    schema: summaryLocalizationOutputSchema,
    inputJson: toAiOutputJson({
      source_locale: "en",
      target_locale: targetLocale,
      summary_text: summaryText,
      risk_flags: sourceRiskFlags,
      staff_id: ctx.membership.id
    }),
    sources: [
      {
        sourceType: "request",
        sourceId: requestId,
        sourceLabel: "source_summary"
      }
    ],
    timeoutMs: 8_000,
    maxOutputTokens: 900
  });

  if (!translation.ok) {
    redirectToRequest(requestId, locale, { action_error: "summary_translate" });
  }

  const nextTranslations = writeAiSummaryLocalization(
    request.ai_summary_translations_json,
    targetLocale,
    {
      summaryText: translation.output.summaryText,
      riskFlags: translation.output.riskFlags,
      sourceLocale: "en",
      targetLocale,
      promptVersion: summaryTranslationPromptVersion,
      model: translation.model,
      confidence: translation.output.confidence,
      aiOutputId: translation.aiOutputId,
      reviewedBy: null,
      edited: false,
      updatedAt: new Date().toISOString()
    }
  );

  const { error: updateError } = await ctx.supabase
    .from("requests")
    .update({ ai_summary_translations_json: nextTranslations })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(
      `Could not update AI summary translation: ${updateError.message}`
    );
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "ai_summary_translated",
      payload_json: {
        ai_output_id: translation.aiOutputId,
        staff_id: ctx.membership.id,
        target_locale: targetLocale
      }
    });

  if (eventError) {
    throw new Error(
      `Could not write summary translation event: ${eventError.message}`
    );
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "summary" });
}

export async function editAiSummary(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const parsed = aiSummaryEditSchema.safeParse({
    requestId: getString(formData, "requestId"),
    targetLocale: getString(formData, "targetLocale") || locale,
    summaryText: getString(formData, "summaryText"),
    riskFlagsText: getString(formData, "riskFlagsText")
  });

  if (!parsed.success) {
    redirectToRequest(getString(formData, "requestId"), locale, {
      action_error: "summary_edit"
    });
  }

  const { requestId, targetLocale, summaryText, riskFlagsText } = parsed.data;
  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:manage")) {
    redirectToRequest(requestId, locale, { action_error: "permission" });
  }

  const request = await loadAiSummaryRequestForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId
  );
  if (!request) {
    redirectToRequest(requestId, locale, { action_error: "not_found" });
  }

  const riskFlags = parseRiskFlagsText(riskFlagsText);
  const updatePayload: Database["public"]["Tables"]["requests"]["Update"] =
    targetLocale === "en"
      ? {
          ai_summary: summaryText,
          risk_flags_json: riskFlags,
          ai_summary_translations_json: {}
        }
      : {
          ai_summary_translations_json: writeAiSummaryLocalization(
            request.ai_summary_translations_json,
            targetLocale,
            buildEditedAiSummaryLocalization({
              locale: targetLocale,
              summaryText,
              riskFlags,
              reviewedBy: ctx.user.id
            })
          )
        };

  const { error: updateError } = await ctx.supabase
    .from("requests")
    .update(updatePayload)
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not edit AI summary: ${updateError.message}`);
  }

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "ai_summary_edited",
      payload_json: {
        staff_id: ctx.membership.id,
        target_locale: targetLocale,
        summary_length: summaryText.length,
        risk_flags_count: riskFlags.length
      }
    });

  if (eventError) {
    throw new Error(`Could not write summary edit event: ${eventError.message}`);
  }

  refreshRequestViews(requestId);
  redirectToRequest(requestId, locale, { action_status: "summary" });
}

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
    .update({
      accepted: true,
      reviewed_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      review_status: "accepted"
    })
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
      ? {
          edited_output_json: { text: editedText },
          reviewed_by: ctx.user.id,
          reviewed_at: new Date().toISOString(),
          review_status: "edited"
        }
      : {
          accepted: true,
          reviewed_by: ctx.user.id,
          reviewed_at: new Date().toISOString(),
          review_status: "accepted_with_edits",
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
    .update({
      accepted: false,
      reviewed_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      review_status: "rejected"
    })
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

export async function generateAiReplyDraft(
  formData: FormData
): Promise<AiDraftActionResult> {
  const parsed = aiReplyDraftGenerationSchema.safeParse({
    requestId: getString(formData, "requestId"),
    locale: normalizeLocale(formData.get("lang"))
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const { requestId, locale } = parsed.data;
  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:reply")) {
    return { ok: false, error: "forbidden" };
  }

  if (shouldUseInngestAiJobs()) {
    await sendPetCuraInngestEvent({
      name: AI_REPLY_DRAFT_REQUESTED_EVENT,
      id: `${ctx.clinic.id}:${requestId}:reply-draft:${Date.now()}`,
      data: {
        clinicId: ctx.clinic.id,
        requestId,
        requestedAt: new Date().toISOString(),
        requestedBy: {
          type: "staff",
          id: ctx.user.id
        },
        targetLocale: locale
      }
    });
    refreshRequestViews(requestId);
    return { ok: true };
  }

  const result = await generateReplyDraftForRequest({
    clinicId: ctx.clinic.id,
    requestId,
    locale
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  refreshRequestViews(requestId);
  return { ok: true };
}

function memoryBelongsToRequest(
  request: Pick<RequestForAction, "id" | "owner_id" | "pet_id">,
  memory: Pick<
    Database["public"]["Tables"]["ai_memory_items"]["Row"],
    "scope_type" | "scope_id"
  >
) {
  if (memory.scope_type === "request") return memory.scope_id === request.id;
  if (memory.scope_type === "owner") return memory.scope_id === request.owner_id;
  if (memory.scope_type === "pet") return memory.scope_id === request.pet_id;
  return false;
}

export async function reviewAiMemoryCandidate(
  formData: FormData
): Promise<AiDraftActionResult> {
  const requestId = getString(formData, "requestId");
  const memoryItemId = getString(formData, "candidateId");
  const intent = getString(formData, "intent");
  const locale = normalizeLocale(formData.get("lang"));
  const contentText = getString(formData, "contentText");
  const parsed =
    intent === "approve"
      ? aiMemoryEditSchema.safeParse({ requestId, memoryItemId, contentText })
      : aiMemoryDecisionSchema.safeParse({ requestId, memoryItemId });

  if (!parsed.success || (intent !== "approve" && intent !== "dismiss")) {
    return { ok: false, error: "invalid_input" };
  }

  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  if (!hasStaffPermission(ctx, "requests:manage")) {
    return { ok: false, error: "forbidden" };
  }

  const request = await loadRequestForAction(
    ctx.supabase,
    ctx.clinic.id,
    requestId
  );

  if (!request) {
    return { ok: false, error: "not_found" };
  }

  const { data: memory, error: memoryError } = await ctx.supabase
    .from("ai_memory_items")
    .select("id, scope_type, scope_id, status")
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", memoryItemId)
    .maybeSingle();

  if (memoryError) return { ok: false, error: memoryError.message };
  if (!memory || !memoryBelongsToRequest(request, memory)) {
    return { ok: false, error: "not_found" };
  }
  if (memory.status !== "candidate") {
    refreshRequestViews(requestId);
    return { ok: true };
  }

  const accepted = intent === "approve";
  const updatePayload: Database["public"]["Tables"]["ai_memory_items"]["Update"] =
    accepted
      ? {
          status: "accepted",
          content_text: contentText,
          reviewed_by: ctx.user.id,
          reviewed_at: new Date().toISOString()
        }
      : {
          status: "rejected",
          reviewed_by: ctx.user.id,
          reviewed_at: new Date().toISOString()
        };

  const { error: updateError } = await ctx.supabase
    .from("ai_memory_items")
    .update(updatePayload)
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", memoryItemId);

  if (updateError) return { ok: false, error: updateError.message };

  const { error: eventError } = await ctx.supabase
    .from("request_events")
    .insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: accepted ? "ai_memory_accepted" : "ai_memory_rejected",
      payload_json: {
        memory_item_id: memoryItemId,
        staff_id: ctx.membership.id,
        edited_length: accepted ? contentText.length : null
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
