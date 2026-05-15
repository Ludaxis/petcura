import "server-only";

import type {
  Database,
  ReminderStatus,
  ReminderType
} from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueOutboundMessage } from "@/lib/twilio/outbox";
import {
  buildReminderWhatsAppBody,
  getFailureStatus,
  getReminderRetryCutoff,
  reminderDispatchDefaults,
  shouldRetryReminder
} from "./reminder-dispatch-core";

type AdminClient = ReturnType<typeof createAdminClient>;

type ReminderRow = Database["public"]["Tables"]["reminders"]["Row"];
type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];

type DueReminderRow = Pick<
  ReminderRow,
  | "id"
  | "clinic_id"
  | "request_id"
  | "pet_id"
  | "type"
  | "title"
  | "body"
  | "due_at"
  | "channel"
  | "status"
  | "send_attempts"
  | "last_send_attempt_at"
> & {
  clinics: {
    name: string;
    locale: string;
  } | null;
  pets: {
    name: string;
  } | null;
  requests: {
    id: string;
    owners: {
      id: string;
      phone: string;
      preferred_language: string;
    } | null;
  } | null;
};

type ClaimedReminder = {
  id: string;
  send_attempts: number;
};

export type ReminderDispatchResult = {
  scanned: number;
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{
    reminderId: string;
    code: string;
  }>;
};

export type DispatchDueReminderOptions = {
  now?: Date;
  batchSize?: number;
  maxAttempts?: number;
  retryAfterMs?: number;
  supabase?: AdminClient;
  enqueueOutbound?: typeof enqueueOutboundMessage;
};

function emptyResult(): ReminderDispatchResult {
  return {
    scanned: 0,
    claimed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
}

async function listDueReminders(
  supabase: AdminClient,
  now: Date,
  batchSize: number
) {
  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id, clinic_id, request_id, pet_id, type, title, body, due_at, channel, status, send_attempts, last_send_attempt_at, clinics(name, locale), pets(name), requests(id, owners(id, phone, preferred_language))"
    )
    .eq("status", "scheduled")
    .lte("due_at", now.toISOString())
    .order("due_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(`Could not load due reminders: ${error.message}`);
  }

  return (data ?? []) as unknown as DueReminderRow[];
}

async function claimReminder(
  supabase: AdminClient,
  reminder: DueReminderRow,
  now: Date,
  retryAfterMs: number
) {
  if (
    !shouldRetryReminder(reminder.last_send_attempt_at, now, retryAfterMs)
  ) {
    return null;
  }

  const retryCutoff = getReminderRetryCutoff(now, retryAfterMs).toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .update({
      send_attempts: reminder.send_attempts + 1,
      last_send_attempt_at: now.toISOString(),
      last_send_error: null
    })
    .eq("clinic_id", reminder.clinic_id)
    .eq("id", reminder.id)
    .eq("status", "scheduled")
    .or(`last_send_attempt_at.is.null,last_send_attempt_at.lt.${retryCutoff}`)
    .select("id, send_attempts")
    .maybeSingle();

  if (error) {
    throw new Error(`Could not claim reminder: ${error.message}`);
  }

  return data as ClaimedReminder | null;
}

function buildFailureEvent(
  reminder: DueReminderRow,
  code: string,
  attempts: number,
  nextStatus: ReminderStatus
): RequestEventInsert | null {
  if (!reminder.request_id) return null;

  return {
    clinic_id: reminder.clinic_id,
    request_id: reminder.request_id,
    actor_type: "system",
    actor_id: null,
    event_type: "reminder_send_failed",
    payload_json: {
      reminder_id: reminder.id,
      error: code,
      attempts,
      next_status: nextStatus
    }
  };
}

async function recordReminderFailure(
  supabase: AdminClient,
  reminder: DueReminderRow,
  code: string,
  attempts: number,
  maxAttempts: number
) {
  const nextStatus = getFailureStatus(attempts, maxAttempts);
  const { error: updateError } = await supabase
    .from("reminders")
    .update({
      status: nextStatus,
      last_send_error: code
    })
    .eq("clinic_id", reminder.clinic_id)
    .eq("id", reminder.id);

  if (updateError) {
    throw new Error(`Could not record reminder failure: ${updateError.message}`);
  }

  const event = buildFailureEvent(
    reminder,
    code,
    attempts,
    nextStatus as ReminderStatus
  );

  if (event) {
    const { error: eventError } = await supabase
      .from("request_events")
      .insert(event);

    if (eventError) {
      throw new Error(`Could not write reminder failure event: ${eventError.message}`);
    }
  }

  return nextStatus;
}

async function recordReminderQueued({
  supabase,
  reminder,
  body,
  ownerLanguage,
  ownerId,
  ownerPhone,
  now,
  enqueueOutbound
}: {
  supabase: AdminClient;
  reminder: DueReminderRow;
  body: string;
  ownerLanguage: string;
  ownerId: string;
  ownerPhone: string;
  now: Date;
  enqueueOutbound: typeof enqueueOutboundMessage;
}) {
  if (!reminder.request_id) {
    throw new Error("missing_request");
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      clinic_id: reminder.clinic_id,
      request_id: reminder.request_id,
      sender_type: "system",
      sender_id: null,
      body,
      source_locale: ownerLanguage,
      external_id: null
    })
    .select("id")
    .single();

  if (messageError) {
    throw new Error(`Could not save reminder message: ${messageError.message}`);
  }

  const { error: reminderError } = await supabase
    .from("reminders")
    .update({
      status: "sent",
      sent_at: now.toISOString(),
      last_delivery_message_id: message.id,
      last_send_error: null
    })
    .eq("clinic_id", reminder.clinic_id)
    .eq("id", reminder.id);

  if (reminderError) {
    throw new Error(`Could not mark reminder sent: ${reminderError.message}`);
  }

  const outbound = await enqueueOutbound({
    supabase,
    clinicId: reminder.clinic_id,
    requestId: reminder.request_id,
    messageId: message.id,
    reminderId: reminder.id,
    ownerId,
    source: "reminder",
    channel: "whatsapp",
    toPhone: ownerPhone,
    body,
    idempotencyKey: `reminder:${reminder.id}:${message.id}`,
    metadata: {
      reminder_id: reminder.id,
      reminder_type: reminder.type
    }
  });

  const { error: eventError } = await supabase.from("request_events").insert({
    clinic_id: reminder.clinic_id,
    request_id: reminder.request_id,
    actor_type: "system",
    actor_id: null,
    event_type: "reminder_sent",
    payload_json: {
      reminder_id: reminder.id,
      message_id: message.id,
      outbound_message_id: outbound.id,
      channel: reminder.channel,
      external_id: null,
      delivery_status: "queued"
    }
  });

  if (eventError) {
    throw new Error(`Could not write reminder sent event: ${eventError.message}`);
  }
}

async function dispatchReminder({
  supabase,
  reminder,
  now,
  maxAttempts,
  enqueueOutbound
}: {
  supabase: AdminClient;
  reminder: DueReminderRow;
  now: Date;
  maxAttempts: number;
  enqueueOutbound: typeof enqueueOutboundMessage;
}) {
  const owner = reminder.requests?.owners;
  const ownerId = owner?.id;
  const ownerPhone = owner?.phone;
  const ownerLanguage = owner?.preferred_language ?? reminder.clinics?.locale ?? "en";

  if (!reminder.request_id) {
    return recordReminderFailure(
      supabase,
      reminder,
      "missing_request",
      maxAttempts,
      maxAttempts
    );
  }

  if (!ownerId) {
    return recordReminderFailure(
      supabase,
      reminder,
      "missing_owner",
      maxAttempts,
      maxAttempts
    );
  }

  if (!ownerPhone) {
    return recordReminderFailure(
      supabase,
      reminder,
      "missing_owner_phone",
      maxAttempts,
      maxAttempts
    );
  }

  if (reminder.channel !== "whatsapp") {
    return recordReminderFailure(
      supabase,
      reminder,
      `unsupported_channel_${reminder.channel}`,
      maxAttempts,
      maxAttempts
    );
  }

  const body = buildReminderWhatsAppBody({
    clinicName: reminder.clinics?.name ?? "PetCura",
    petName: reminder.pets?.name ?? "your pet",
    title: reminder.title,
    body: reminder.body,
    type: reminder.type as ReminderType,
    ownerLanguage
  });

  try {
    await recordReminderQueued({
      supabase,
      reminder,
      body,
      ownerLanguage,
      ownerId,
      ownerPhone,
      now,
      enqueueOutbound
    });

    return "sent";
  } catch (error) {
    return recordReminderFailure(
      supabase,
      reminder,
      error instanceof Error ? error.message : "send_failed",
      reminder.send_attempts,
      maxAttempts
    );
  }
}

export async function dispatchDueReminders(
  options: DispatchDueReminderOptions = {}
): Promise<ReminderDispatchResult> {
  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? reminderDispatchDefaults.batchSize;
  const maxAttempts = options.maxAttempts ?? reminderDispatchDefaults.maxAttempts;
  const retryAfterMs =
    options.retryAfterMs ?? reminderDispatchDefaults.retryAfterMs;
  const supabase = options.supabase ?? createAdminClient();
  const enqueueOutbound = options.enqueueOutbound ?? enqueueOutboundMessage;
  const result = emptyResult();
  const dueReminders = await listDueReminders(supabase, now, batchSize);
  result.scanned = dueReminders.length;

  for (const reminder of dueReminders) {
    try {
      const claimed = await claimReminder(
        supabase,
        reminder,
        now,
        retryAfterMs
      );

      if (!claimed) {
        result.skipped += 1;
        continue;
      }

      result.claimed += 1;
      const status = await dispatchReminder({
        supabase,
        reminder: {
          ...reminder,
          send_attempts: claimed.send_attempts
        },
        now,
        maxAttempts,
        enqueueOutbound
      });

      if (status === "sent") {
        result.sent += 1;
      } else {
        result.failed += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        reminderId: reminder.id,
        code: error instanceof Error ? error.message : "unknown_error"
      });
    }
  }

  return result;
}
