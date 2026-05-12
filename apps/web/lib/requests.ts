import "server-only";

import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import type {
  Database,
  RequestCategory,
  RequestChannel,
  RequestStatus,
  RequestUrgency
} from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";
import {
  getLatestDeliveryEvent,
  normalizeDeliveryStatus,
  type MessageDeliveryStatus
} from "@/lib/delivery";
import { listRequestReminders, type ReminderListItem } from "@/lib/reminders";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type OwnerRow = Pick<
  Database["public"]["Tables"]["owners"]["Row"],
  "id" | "name" | "phone" | "preferred_language"
>;

type PetRow = Pick<
  Database["public"]["Tables"]["pets"]["Row"],
  "id" | "name" | "species" | "breed" | "photo_url"
>;

type RequestBaseRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  | "id"
  | "assigned_staff_id"
  | "category"
  | "channel"
  | "status"
  | "urgency"
  | "ai_summary"
  | "ai_summary_version"
  | "urgency_suggestion"
  | "risk_flags_json"
  | "created_at"
  | "updated_at"
>;

type RequestWithRelations = RequestBaseRow & {
  owners: OwnerRow | null;
  pets: PetRow | null;
};

export type InboxRequest = {
  id: string;
  status: RequestStatus;
  urgency: RequestUrgency;
  category: RequestCategory;
  channel: RequestChannel;
  petName: string;
  species: string;
  ownerName: string;
  ownerLanguage: string;
  summary: string;
  updatedAt: string;
};

export type ClinicStaffOption = {
  id: string;
  userId: string;
  role: Database["public"]["Enums"]["staff_role"];
};

export type PendingAiDraft = {
  id: string;
  text: string;
  confidence: number | null;
  sourceMessageId: string | null;
  sourceLocale: string | null;
  targetLocale: string | null;
  model: string;
  promptVersion: string;
  createdAt: string;
};

export type RequestDetail = InboxRequest & {
  assignedStaffId: string | null;
  ownerPhone: string;
  petBreed: string | null;
  aiSummary: string | null;
  aiSummaryVersion: string | null;
  urgencySuggestion: RequestUrgency | null;
  riskFlags: string[];
  createdAt: string;
  messages: Array<{
    id: string;
    senderType: Database["public"]["Enums"]["message_sender_type"];
    body: string;
    bodyTranslated: string | null;
    sourceLocale: string | null;
    createdAt: string;
    deliveryStatus: MessageDeliveryStatus | null;
    deliveryProvider: string | null;
    deliveryUpdatedAt: string | null;
  }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
  }>;
  reminders: ReminderListItem[];
  events: Array<{
    id: string;
    eventType: string;
    actorType: string;
    createdAt: string;
  }>;
  staffOptions: ClinicStaffOption[];
  pendingDraft: PendingAiDraft | null;
};

function pickDraftText(output: unknown): string {
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    for (const key of ["text", "body", "draft", "reply", "message"]) {
      const value = obj[key];
      if (typeof value === "string" && value.trim().length > 0) return value;
    }
  }
  return "";
}

function pickJsonString(json: unknown, key: string): string | null {
  if (json && typeof json === "object") {
    const value = (json as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function pickStringArray(json: unknown): string[] {
  if (!Array.isArray(json)) return [];
  return json.filter((value): value is string => typeof value === "string");
}

function fallbackSummary(row: RequestWithRelations) {
  return (
    row.ai_summary ??
    `${row.pets?.name ?? "Pet"} request from ${row.owners?.name ?? "owner"}`
  );
}

function toInboxRequest(row: RequestWithRelations): InboxRequest {
  return {
    id: row.id,
    status: row.status,
    urgency: row.urgency,
    category: row.category,
    channel: row.channel,
    petName: row.pets?.name ?? "Unknown pet",
    species: row.pets?.species ?? "Unknown species",
    ownerName: row.owners?.name ?? "Unknown owner",
    ownerLanguage: row.owners?.preferred_language ?? "en",
    summary: fallbackSummary(row),
    updatedAt: row.updated_at
  };
}

export async function listInboxRequests(
  supabase: ServerSupabaseClient,
  clinicId: string
) {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, assigned_staff_id, category, channel, status, urgency, ai_summary, ai_summary_version, urgency_suggestion, risk_flags_json, created_at, updated_at, owners(id, name, phone, preferred_language), pets(id, name, species, breed, photo_url)"
    )
    .eq("clinic_id", clinicId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load inbox requests: ${error.message}`);
  }

  return ((data ?? []) as unknown as RequestWithRelations[]).map(
    toInboxRequest
  );
}

export async function getRequestDetail(
  supabase: ServerSupabaseClient,
  clinicId: string,
  requestId: string,
  locale: SupportedLocale
): Promise<RequestDetail | null> {
  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select(
      "id, assigned_staff_id, category, channel, status, urgency, ai_summary, ai_summary_version, urgency_suggestion, risk_flags_json, created_at, updated_at, owners(id, name, phone, preferred_language), pets(id, name, species, breed, photo_url)"
    )
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    throw new Error(`Could not load request: ${requestError.message}`);
  }

  if (!requestData) {
    return null;
  }

  const request = requestData as unknown as RequestWithRelations;

  const [
    messagesResult,
    notesResult,
    eventsResult,
    staffResult,
    draftResult,
    reminders
  ] = await Promise.all([
      supabase
        .from("messages")
        .select(
          "id, sender_type, body, body_translated, source_locale, created_at"
        )
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      supabase
        .from("internal_notes")
        .select("id, body, created_at")
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      supabase
        .from("request_events")
        .select("id, event_type, actor_type, created_at")
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      supabase
        .from("clinic_staff")
        .select("id, user_id, role")
        .eq("clinic_id", clinicId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("ai_outputs")
        .select(
          "id, output_json, input_json, confidence, model, prompt_version, created_at, accepted"
        )
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .eq("kind", "reply_draft")
        .is("accepted", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      listRequestReminders(supabase, clinicId, requestId)
    ]);

  if (messagesResult.error) {
    throw new Error(`Could not load messages: ${messagesResult.error.message}`);
  }

  if (notesResult.error) {
    throw new Error(`Could not load notes: ${notesResult.error.message}`);
  }

  if (eventsResult.error) {
    throw new Error(`Could not load events: ${eventsResult.error.message}`);
  }

  if (staffResult.error) {
    throw new Error(`Could not load staff: ${staffResult.error.message}`);
  }

  const messageIds = (messagesResult.data ?? []).map((message) => message.id);
  const deliveryEventsByMessage = new Map<
    string,
    Array<{
      id: string;
      status: string;
      provider: string | null;
      created_at: string;
    }>
  >();
  const translationsByMessage = new Map<string, string>();

  if (messageIds.length > 0) {
    const [deliveryResult, translationResult] = await Promise.all([
      supabase
        .from("message_delivery_events")
        .select("id, message_id, status, provider, created_at")
        .eq("clinic_id", clinicId)
        .in("message_id", messageIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("message_translations")
        .select("message_id, translated_body, target_locale")
        .eq("clinic_id", clinicId)
        .eq("target_locale", locale)
        .in("message_id", messageIds)
    ]);

    if (deliveryResult.error) {
      throw new Error(
        `Could not load delivery events: ${deliveryResult.error.message}`
      );
    }

    if (translationResult.error) {
      throw new Error(
        `Could not load message translations: ${translationResult.error.message}`
      );
    }

    for (const event of deliveryResult.data ?? []) {
      const events = deliveryEventsByMessage.get(event.message_id) ?? [];
      events.push(event);
      deliveryEventsByMessage.set(event.message_id, events);
    }

    for (const translation of translationResult.data ?? []) {
      translationsByMessage.set(
        translation.message_id,
        translation.translated_body
      );
    }
  }

  // ai_outputs is read-only here; tolerate missing rows or RLS-suppressed
  // results without failing the page render.
  let pendingDraft: PendingAiDraft | null = null;
  if (!draftResult.error && draftResult.data) {
    const row = draftResult.data;
    const text = pickDraftText(row.output_json);
    if (text.trim().length > 0) {
      pendingDraft = {
        id: row.id,
        text,
        confidence: row.confidence,
        sourceMessageId: pickJsonString(row.input_json, "source_message_id"),
        sourceLocale: pickJsonString(row.input_json, "source_locale"),
        targetLocale: pickJsonString(row.input_json, "target_locale"),
        model: row.model,
        promptVersion: row.prompt_version,
        createdAt: row.created_at
      };
    }
  }

  return {
    ...toInboxRequest(request),
    assignedStaffId: request.assigned_staff_id,
    ownerPhone: request.owners?.phone ?? "",
    petBreed: request.pets?.breed ?? null,
    aiSummary: request.ai_summary,
    aiSummaryVersion: request.ai_summary_version,
    urgencySuggestion: request.urgency_suggestion,
    riskFlags: pickStringArray(request.risk_flags_json),
    createdAt: request.created_at,
    messages: (messagesResult.data ?? []).map((message) => {
      const latestDelivery = getLatestDeliveryEvent(
        deliveryEventsByMessage.get(message.id) ?? []
      );
      const deliveryStatus = normalizeDeliveryStatus(latestDelivery?.status);
      const sourceLocale = message.source_locale
        ? normalizeLocale(message.source_locale)
        : null;
      const localizedTranslation =
        sourceLocale === locale
          ? null
          : translationsByMessage.get(message.id) ??
            (locale === "en" ? message.body_translated : null);

      return {
        id: message.id,
        senderType: message.sender_type,
        body: message.body,
        bodyTranslated: localizedTranslation,
        sourceLocale: message.source_locale,
        createdAt: message.created_at,
        deliveryStatus,
        deliveryProvider: latestDelivery?.provider ?? null,
        deliveryUpdatedAt: latestDelivery?.created_at ?? null
      };
    }),
    notes: (notesResult.data ?? []).map((note) => ({
      id: note.id,
      body: note.body,
      createdAt: note.created_at
    })),
    reminders,
    events: (eventsResult.data ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type,
      actorType: event.actor_type,
      createdAt: event.created_at
    })),
    staffOptions: (staffResult.data ?? []).map((staff) => ({
      id: staff.id,
      userId: staff.user_id,
      role: staff.role
    })),
    pendingDraft
  };
}
