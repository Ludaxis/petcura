import "server-only";

import type { Json, Database } from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  OUTBOUND_MESSAGE_QUEUED_EVENT,
  type PetCuraInngestEventUnion
} from "../../../../jobs/inngest/events";
import { sendPetCuraInngestEvent } from "@/lib/inngest/client";
import {
  getTwilioDeliveryEventId,
  mapTwilioDeliveryStatus,
  type TwilioMessageStatusPayload
} from "./whatsapp";
import {
  resolveClinicSmsSender,
  sendTwilioOwnerMessage,
  type TwilioOutboundChannel,
  type WhatsAppSendResult
} from "./outbound";

type AdminClient = ReturnType<typeof createAdminClient>;
type OutboundMessageRow =
  Database["public"]["Tables"]["outbound_messages"]["Row"];
type MessageDeliveryAttemptRow =
  Database["public"]["Tables"]["message_delivery_attempts"]["Row"];
type MessageDeliveryStatus =
  Database["public"]["Tables"]["message_delivery_events"]["Row"]["status"];

export type OutboundMessageSource =
  | "staff_reply"
  | "appointment_offer"
  | "reminder"
  | "sms_fallback";

type SendEvent = (event: PetCuraInngestEventUnion) => Promise<unknown>;
type SendQueued = (options: SendQueuedOutboundMessageOptions) => Promise<unknown>;

export type EnqueueOutboundMessageInput = {
  supabase: AdminClient;
  clinicId: string;
  requestId?: string | null;
  messageId?: string | null;
  reminderId?: string | null;
  ownerId?: string | null;
  createdBy?: string | null;
  fallbackOfOutboundMessageId?: string | null;
  source: OutboundMessageSource;
  channel: TwilioOutboundChannel;
  toPhone: string;
  body: string;
  idempotencyKey: string;
  metadata?: Json;
  maxAttempts?: number;
  sendEvent?: SendEvent | false;
  sendQueued?: SendQueued;
};

export type SendQueuedOutboundMessageOptions = {
  outboundMessageId: string;
  supabase?: AdminClient;
  sendTwilio?: typeof sendTwilioOwnerMessage;
  now?: Date;
};

export type RecordTwilioStatusCallbackOptions = {
  payload: TwilioMessageStatusPayload;
  supabase?: AdminClient;
  sendEvent?: SendEvent | false;
  now?: Date;
};

function cleanPhone(value: string) {
  const withoutPrefix = value.replace(/^whatsapp:/i, "").trim();
  const hasPlus = withoutPrefix.startsWith("+");
  const digits = withoutPrefix.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

function toJsonObject(value: Json | undefined): Json {
  return value ?? {};
}

function messageStatusForOutbound(status: OutboundMessageRow["status"]) {
  if (status === "delivered" || status === "read" || status === "failed") {
    return status;
  }

  return "sent";
}

function outboundStatusFromDelivery(status: MessageDeliveryStatus) {
  if (status === "delivered" || status === "read" || status === "failed") {
    return status;
  }

  return "dispatched";
}

function errorCode(error: unknown) {
  return error instanceof Error ? error.message : "twilio_send_failed";
}

async function dispatchQueuedEvent({
  supabase,
  outbound,
  sendEvent,
  sendQueued
}: {
  supabase: AdminClient;
  outbound: Pick<
    OutboundMessageRow,
    "id" | "clinic_id" | "request_id" | "message_id" | "channel" | "created_at"
  >;
  sendEvent: SendEvent | false | undefined;
  sendQueued: SendQueued | undefined;
}) {
  if (sendEvent === false) return;

  if (!process.env.INNGEST_EVENT_KEY && sendEvent === undefined) {
    await sendQueuedInlineFallback({
      supabase,
      outbound,
      sendQueued,
      reason: "inngest_event_key_missing"
    });
    return;
  }

  try {
    const data = {
      clinicId: outbound.clinic_id,
      outboundMessageId: outbound.id,
      channel: outbound.channel as TwilioOutboundChannel,
      queuedAt: outbound.created_at,
      ...(outbound.message_id ? { messageId: outbound.message_id } : {}),
      ...(outbound.request_id ? { requestId: outbound.request_id } : {})
    };

    await (sendEvent ?? sendPetCuraInngestEvent)({
      name: OUTBOUND_MESSAGE_QUEUED_EVENT,
      data,
      id: `${outbound.clinic_id}:${outbound.id}:send`
    });
  } catch (error) {
    await supabase
      .from("outbound_messages")
      .update({ last_error: `inngest_event_failed:${errorCode(error)}` })
      .eq("clinic_id", outbound.clinic_id)
      .eq("id", outbound.id);

    if (
      sendEvent === undefined &&
      process.env.PETCURA_OUTBOUND_INLINE_FALLBACK === "true"
    ) {
      await sendQueuedInlineFallback({
        supabase,
        outbound,
        sendQueued,
        reason: "inngest_event_failed"
      });
    }
  }
}

async function sendQueuedInlineFallback({
  supabase,
  outbound,
  sendQueued,
  reason
}: {
  supabase: AdminClient;
  outbound: Pick<OutboundMessageRow, "id" | "clinic_id">;
  sendQueued: SendQueued | undefined;
  reason: string;
}) {
  try {
    await (sendQueued ?? sendQueuedOutboundMessage)({
      outboundMessageId: outbound.id,
      supabase
    });
  } catch (error) {
    await supabase
      .from("outbound_messages")
      .update({ last_error: `${reason}:${errorCode(error)}` })
      .eq("clinic_id", outbound.clinic_id)
      .eq("id", outbound.id);
  }
}

export async function enqueueOutboundMessage({
  supabase,
  clinicId,
  requestId,
  messageId,
  reminderId,
  ownerId,
  createdBy,
  fallbackOfOutboundMessageId,
  source,
  channel,
  toPhone,
  body,
  idempotencyKey,
  metadata,
  maxAttempts,
  sendEvent,
  sendQueued
}: EnqueueOutboundMessageInput) {
  const { data: outbound, error } = await supabase
    .from("outbound_messages")
    .insert({
      clinic_id: clinicId,
      request_id: requestId ?? null,
      message_id: messageId ?? null,
      reminder_id: reminderId ?? null,
      owner_id: ownerId ?? null,
      created_by: createdBy ?? null,
      fallback_of_outbound_message_id: fallbackOfOutboundMessageId ?? null,
      source,
      channel,
      recipient_phone: cleanPhone(toPhone),
      body,
      idempotency_key: idempotencyKey,
      metadata_json: toJsonObject(metadata),
      ...(maxAttempts ? { max_attempts: maxAttempts } : {})
    })
    .select(
      "id, clinic_id, request_id, message_id, channel, created_at, status"
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("outbound_messages")
        .select(
          "id, clinic_id, request_id, message_id, channel, created_at, status"
        )
        .eq("clinic_id", clinicId)
        .eq("idempotency_key", idempotencyKey)
        .single();

      if (existingError) {
        throw new Error(
          `Could not load existing outbound message: ${existingError.message}`
        );
      }

      await dispatchQueuedEvent({
        supabase,
        outbound: existing,
        sendEvent,
        sendQueued
      });
      return existing;
    }

    throw new Error(`Could not queue outbound message: ${error.message}`);
  }

  if (messageId) {
    const { error: deliveryError } = await supabase
      .from("message_delivery_events")
      .upsert(
        {
          message_id: messageId,
          clinic_id: clinicId,
          channel,
          status: "queued",
          provider: "twilio",
          external_event_id: `outbound:${outbound.id}:queued`,
          payload_json: {
            outbound_message_id: outbound.id,
            source
          }
        },
        { onConflict: "provider,external_event_id", ignoreDuplicates: true }
      );

    if (deliveryError) {
      throw new Error(
        `Could not record queued delivery event: ${deliveryError.message}`
      );
    }
  }

  await dispatchQueuedEvent({ supabase, outbound, sendEvent, sendQueued });
  return outbound;
}

async function loadOutboundMessage(
  supabase: AdminClient,
  outboundMessageId: string
) {
  const { data, error } = await supabase
    .from("outbound_messages")
    .select("*")
    .eq("id", outboundMessageId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load outbound message: ${error.message}`);
  }

  return data as OutboundMessageRow | null;
}

async function claimOutboundMessage({
  supabase,
  outbound,
  now
}: {
  supabase: AdminClient;
  outbound: OutboundMessageRow;
  now: Date;
}) {
  if (outbound.status !== "queued" && outbound.status !== "failed") {
    return null;
  }

  if (new Date(outbound.next_attempt_at).getTime() > now.getTime()) {
    return null;
  }

  if (outbound.attempt_count >= outbound.max_attempts) {
    return null;
  }

  const attemptNumber = outbound.attempt_count + 1;
  const { data, error } = await supabase
    .from("outbound_messages")
    .update({
      status: "sending",
      attempt_count: attemptNumber,
      last_error: null
    })
    .eq("clinic_id", outbound.clinic_id)
    .eq("id", outbound.id)
    .eq("attempt_count", outbound.attempt_count)
    .in("status", ["queued", "failed"])
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Could not claim outbound message: ${error.message}`);
  }

  return data as OutboundMessageRow | null;
}

async function insertAttempt({
  supabase,
  outbound
}: {
  supabase: AdminClient;
  outbound: OutboundMessageRow;
}) {
  const { data, error } = await supabase
    .from("message_delivery_attempts")
    .insert({
      clinic_id: outbound.clinic_id,
      outbound_message_id: outbound.id,
      message_id: outbound.message_id,
      request_id: outbound.request_id,
      channel: outbound.channel,
      provider: outbound.provider,
      attempt_number: outbound.attempt_count,
      status: "sending",
      payload_json: {
        outbound_message_id: outbound.id
      }
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not create delivery attempt: ${error.message}`);
  }

  return data as MessageDeliveryAttemptRow;
}

async function recordAttemptSuccess({
  supabase,
  outbound,
  attempt,
  delivery,
  now
}: {
  supabase: AdminClient;
  outbound: OutboundMessageRow;
  attempt: MessageDeliveryAttemptRow;
  delivery: WhatsAppSendResult;
  now: Date;
}) {
  const { error: attemptError } = await supabase
    .from("message_delivery_attempts")
    .update({
      status: delivery.status,
      provider_message_sid: delivery.sid,
      provider_status: delivery.rawStatus,
      payload_json: {
        provider_status: delivery.rawStatus,
        outbound_message_id: outbound.id
      },
      sent_at: now.toISOString()
    })
    .eq("clinic_id", outbound.clinic_id)
    .eq("id", attempt.id);

  if (attemptError) {
    throw new Error(`Could not update delivery attempt: ${attemptError.message}`);
  }

  const outboundStatus = outboundStatusFromDelivery(delivery.status);
  const { error: outboundError } = await supabase
    .from("outbound_messages")
    .update({
      status: outboundStatus,
      last_error: null
    })
    .eq("clinic_id", outbound.clinic_id)
    .eq("id", outbound.id);

  if (outboundError) {
    throw new Error(`Could not update outbound message: ${outboundError.message}`);
  }

  if (outbound.message_id) {
    await supabase
      .from("messages")
      .update({ external_id: delivery.sid })
      .eq("clinic_id", outbound.clinic_id)
      .eq("id", outbound.message_id)
      .is("external_id", null);

    const { error: deliveryEventError } = await supabase
      .from("message_delivery_events")
      .upsert(
        {
          message_id: outbound.message_id,
          clinic_id: outbound.clinic_id,
          channel: outbound.channel,
          status: delivery.status,
          provider: "twilio",
          external_event_id: getTwilioDeliveryEventId(
            delivery.sid,
            delivery.rawStatus
          ),
          payload_json: {
            outbound_message_id: outbound.id,
            attempt_id: attempt.id,
            provider_status: delivery.rawStatus
          }
        },
        { onConflict: "provider,external_event_id", ignoreDuplicates: true }
      );

    if (deliveryEventError) {
      throw new Error(
        `Could not record delivery event: ${deliveryEventError.message}`
      );
    }
  }

  return {
    status: "sent" as const,
    outboundStatus
  };
}

async function recordAttemptFailure({
  supabase,
  outbound,
  attempt,
  code,
  now
}: {
  supabase: AdminClient;
  outbound: OutboundMessageRow;
  attempt: MessageDeliveryAttemptRow;
  code: string;
  now: Date;
}) {
  const finalFailure = outbound.attempt_count >= outbound.max_attempts;
  const nextStatus = finalFailure ? "failed" : "queued";
  const retryAt = new Date(now.getTime() + 60_000).toISOString();

  const { error: attemptError } = await supabase
    .from("message_delivery_attempts")
    .update({
      status: "failed",
      error_message: code,
      completed_at: now.toISOString(),
      payload_json: {
        outbound_message_id: outbound.id,
        error: code
      }
    })
    .eq("clinic_id", outbound.clinic_id)
    .eq("id", attempt.id);

  if (attemptError) {
    throw new Error(`Could not fail delivery attempt: ${attemptError.message}`);
  }

  const { error: outboundError } = await supabase
    .from("outbound_messages")
    .update({
      status: nextStatus,
      last_error: code,
      next_attempt_at: finalFailure ? now.toISOString() : retryAt
    })
    .eq("clinic_id", outbound.clinic_id)
    .eq("id", outbound.id);

  if (outboundError) {
    throw new Error(
      `Could not record outbound failure: ${outboundError.message}`
    );
  }

  if (outbound.message_id && finalFailure) {
    await recordDeliveryEventAndTimeline({
      supabase,
      attempt: {
        ...attempt,
        status: "failed",
        error_message: code
      },
      status: "failed",
      externalEventId: `attempt:${attempt.id}:failed`,
      payload: {
        outbound_message_id: outbound.id,
        attempt_id: attempt.id,
        error: code
      },
      now
    });
  }

  if (outbound.reminder_id && finalFailure) {
    await supabase
      .from("reminders")
      .update({ last_send_error: code })
      .eq("clinic_id", outbound.clinic_id)
      .eq("id", outbound.reminder_id);
  }

  if (finalFailure && outbound.channel === "whatsapp") {
    await maybeQueueSmsFallback({
      supabase,
      attempt: {
        ...attempt,
        status: "failed",
        error_message: code
      },
      now
    });
  }

  if (!finalFailure) {
    throw new Error(code);
  }

  return {
    status: "failed" as const
  };
}

export async function sendQueuedOutboundMessage({
  outboundMessageId,
  supabase = createAdminClient(),
  sendTwilio = sendTwilioOwnerMessage,
  now = new Date()
}: SendQueuedOutboundMessageOptions) {
  const outbound = await loadOutboundMessage(supabase, outboundMessageId);

  if (!outbound) {
    return { status: "missing" as const };
  }

  const claimed = await claimOutboundMessage({ supabase, outbound, now });

  if (!claimed) {
    return {
      status: "skipped" as const,
      outboundStatus: outbound.status
    };
  }

  const attempt = await insertAttempt({ supabase, outbound: claimed });

  try {
    const delivery = await sendTwilio({
      supabase,
      clinicId: claimed.clinic_id,
      channel: claimed.channel as TwilioOutboundChannel,
      toPhone: claimed.recipient_phone,
      body: claimed.body
    });

    return recordAttemptSuccess({
      supabase,
      outbound: claimed,
      attempt,
      delivery,
      now
    });
  } catch (error) {
    return recordAttemptFailure({
      supabase,
      outbound: claimed,
      attempt,
      code: errorCode(error),
      now
    });
  }
}

async function recordDeliveryEventAndTimeline({
  supabase,
  attempt,
  status,
  externalEventId,
  payload,
  now
}: {
  supabase: AdminClient;
  attempt: MessageDeliveryAttemptRow;
  status: MessageDeliveryStatus;
  externalEventId: string;
  payload: Json;
  now: Date;
}) {
  if (!attempt.message_id) return false;

  const { data: deliveryRows, error: deliveryError } = await supabase
    .from("message_delivery_events")
    .upsert(
      {
        message_id: attempt.message_id,
        clinic_id: attempt.clinic_id,
        channel: attempt.channel,
        status,
        provider: attempt.provider,
        external_event_id: externalEventId,
        payload_json: payload
      },
      { onConflict: "provider,external_event_id", ignoreDuplicates: true }
    )
    .select("id");

  if (deliveryError) {
    throw new Error(`Could not record delivery event: ${deliveryError.message}`);
  }

  if (!deliveryRows || deliveryRows.length === 0 || !attempt.request_id) {
    return false;
  }

  const { error: eventError } = await supabase.from("request_events").insert({
    clinic_id: attempt.clinic_id,
    request_id: attempt.request_id,
    actor_type: "system",
    actor_id: null,
    event_type: `message_delivery_${status}`,
    payload_json: {
      message_id: attempt.message_id,
      provider: attempt.provider,
      attempt_id: attempt.id,
      provider_message_sid: attempt.provider_message_sid,
      recorded_at: now.toISOString(),
      ...(typeof payload === "object" && payload && !Array.isArray(payload)
        ? payload
        : {})
    }
  });

  if (eventError) {
    throw new Error(`Could not write delivery timeline event: ${eventError.message}`);
  }

  return true;
}

async function loadAttemptByProviderSid(
  supabase: AdminClient,
  providerMessageSid: string
) {
  const { data, error } = await supabase
    .from("message_delivery_attempts")
    .select("*")
    .eq("provider", "twilio")
    .eq("provider_message_sid", providerMessageSid)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load delivery attempt: ${error.message}`);
  }

  return data as MessageDeliveryAttemptRow | null;
}

async function maybeQueueSmsFallback({
  supabase,
  attempt,
  sendEvent,
  now = new Date()
}: {
  supabase: AdminClient;
  attempt: MessageDeliveryAttemptRow;
  sendEvent?: SendEvent | false;
  now?: Date;
}) {
  if (attempt.channel !== "whatsapp") {
    return { queued: false, reason: "not_whatsapp" as const };
  }

  if (process.env.PETCURA_SMS_FALLBACK_ENABLED !== "true") {
    return { queued: false, reason: "disabled" as const };
  }

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return { queued: false, reason: "twilio_not_configured" as const };
  }

  const outbound = await loadOutboundMessage(supabase, attempt.outbound_message_id);
  if (!outbound || outbound.fallback_of_outbound_message_id || !outbound.owner_id) {
    return { queued: false, reason: "not_eligible" as const };
  }

  const smsSender = await resolveClinicSmsSender(supabase, outbound.clinic_id);
  if (!smsSender) {
    return { queued: false, reason: "sms_sender_not_configured" as const };
  }

  const { data: identity, error: identityError } = await supabase
    .from("owner_channel_identities")
    .select("external_id")
    .eq("clinic_id", outbound.clinic_id)
    .eq("owner_id", outbound.owner_id)
    .eq("channel", "sms")
    .not("consented_at", "is", null)
    .is("opted_out_at", null)
    .order("is_primary", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (identityError) {
    throw new Error(`Could not check SMS consent: ${identityError.message}`);
  }

  if (!identity?.external_id) {
    return { queued: false, reason: "missing_sms_consent" as const };
  }

  const fallback = await enqueueOutboundMessage({
    supabase,
    clinicId: outbound.clinic_id,
    requestId: outbound.request_id,
    messageId: outbound.message_id,
    reminderId: outbound.reminder_id,
    ownerId: outbound.owner_id,
    fallbackOfOutboundMessageId: outbound.id,
    source: "sms_fallback",
    channel: "sms",
    toPhone: identity.external_id,
    body: outbound.body,
    idempotencyKey: `sms-fallback:${outbound.id}`,
    metadata: {
      fallback_of_outbound_message_id: outbound.id,
      failed_attempt_id: attempt.id,
      failed_provider_message_sid: attempt.provider_message_sid,
      queued_at: now.toISOString()
    },
    ...(sendEvent !== undefined ? { sendEvent } : {})
  });

  return { queued: true, outboundMessageId: fallback.id };
}

export async function recordTwilioStatusCallback({
  payload,
  supabase = createAdminClient(),
  sendEvent,
  now = new Date()
}: RecordTwilioStatusCallbackOptions) {
  const attempt = await loadAttemptByProviderSid(supabase, payload.messageSid);

  if (!attempt) {
    return { status: "missing_attempt" as const };
  }

  const deliveryPayload = {
    provider_status: payload.rawStatus,
    event_type: payload.eventType,
    error_code: payload.errorCode,
    channel_status_message: payload.channelStatusMessage,
    outbound_message_id: attempt.outbound_message_id,
    attempt_id: attempt.id
  };

  const completedAt =
    payload.status === "failed" ||
    payload.status === "delivered" ||
    payload.status === "read"
      ? now.toISOString()
      : null;

  const { error: attemptError } = await supabase
    .from("message_delivery_attempts")
    .update({
      status: payload.status,
      provider_status: payload.rawStatus,
      error_code: payload.errorCode ?? null,
      error_message: payload.channelStatusMessage ?? null,
      payload_json: deliveryPayload,
      ...(completedAt ? { completed_at: completedAt } : {})
    })
    .eq("clinic_id", attempt.clinic_id)
    .eq("id", attempt.id);

  if (attemptError) {
    throw new Error(`Could not update delivery attempt: ${attemptError.message}`);
  }

  const outboundStatus = outboundStatusFromDelivery(payload.status);
  const { error: outboundError } = await supabase
    .from("outbound_messages")
    .update({
      status: outboundStatus,
      last_error:
        payload.status === "failed"
          ? payload.errorCode ?? payload.channelStatusMessage ?? payload.rawStatus
          : null
    })
    .eq("clinic_id", attempt.clinic_id)
    .eq("id", attempt.outbound_message_id);

  if (outboundError) {
    throw new Error(`Could not update outbound status: ${outboundError.message}`);
  }

  await recordDeliveryEventAndTimeline({
    supabase,
    attempt: {
      ...attempt,
      status: payload.status,
      provider_status: payload.rawStatus,
      error_code: payload.errorCode ?? null,
      error_message: payload.channelStatusMessage ?? null
    },
    status: payload.status,
    externalEventId: payload.eventId,
    payload: deliveryPayload,
    now
  });

  let fallback:
    | Awaited<ReturnType<typeof maybeQueueSmsFallback>>
    | undefined = undefined;

  if (payload.status === "failed") {
    fallback = await maybeQueueSmsFallback({
      supabase,
      attempt,
      now,
      ...(sendEvent !== undefined ? { sendEvent } : {})
    });
  }

  return {
    status: "recorded" as const,
    deliveryStatus: payload.status,
    outboundStatus,
    fallback
  };
}

export function mapTwilioSendStatus(rawStatus: string) {
  return messageStatusForOutbound(
    outboundStatusFromDelivery(mapTwilioDeliveryStatus(rawStatus))
  );
}
