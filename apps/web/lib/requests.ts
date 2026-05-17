import "server-only";

import {
  intakeQuestionOutputSchema,
  type IntakeQuestionOutput
} from "@petcura/ai";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import type {
  Database,
  RequestCategory,
  RequestChannel,
  RequestStatus,
  RequestUrgency
} from "@petcura/shared";
import { readAiSummaryLocalizationMap } from "@/lib/ai/summary-localization";
import { createClient } from "@/lib/supabase/server";
import { listAuthUserEmails } from "@/lib/admin/bootstrap";
import {
  getLatestDeliveryEvent,
  normalizeDeliveryStatus,
  type MessageDeliveryStatus
} from "@/lib/delivery";
import { listRequestReminders, type ReminderListItem } from "@/lib/reminders";
import {
  getAppointmentContextForRequest,
  type AppointmentContext
} from "@/lib/appointments/calendar";

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
  | "owner_id"
  | "pet_id"
  | "category"
  | "channel"
  | "status"
  | "urgency"
  | "ai_summary"
  | "ai_summary_translations_json"
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
  /**
   * Auth email looked up via the admin API so the Assigned dropdown can
   * show a recognizable label like "anna@clinic.ee (vet)" instead of
   * rendering raw role strings × N entries. Null if the user has been
   * deleted upstream or the admin lookup failed under RLS.
   */
  email: string | null;
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

export type AiMemoryContextItem = {
  id: string;
  scopeType: string;
  memoryType: string;
  text: string;
  confidence: number | null;
  updatedAt: string | null;
};

export type AiMemoryCandidateItem = {
  id: string;
  scopeType: string;
  memoryType: string;
  contentText: string;
  status: string;
  confidence: number | null;
  createdAt: string;
  sourceCount: number;
};

export type AiIntakeHandoff = IntakeQuestionOutput & {
  id: string;
  createdAt: string;
};

export type RequestDetail = InboxRequest & {
  assignedStaffId: string | null;
  ownerPhone: string;
  petBreed: string | null;
  aiSummary: string | null;
  aiSummaryHasTranslation: boolean;
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
  aiIntake: AiIntakeHandoff | null;
  aiMemoryContext: AiMemoryContextItem[];
  aiMemoryCandidates: AiMemoryCandidateItem[];
  appointmentContext: AppointmentContext | null;
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

function isMissingMemoryTableError(error: { message?: string; code?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("Could not find the table 'public.ai_memory_") ||
    error.message?.includes("relation \"public.ai_memory_")
  );
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
      "id, assigned_staff_id, category, channel, status, urgency, ai_summary, ai_summary_translations_json, ai_summary_version, urgency_suggestion, risk_flags_json, created_at, updated_at, owners(id, name, phone, preferred_language), pets(id, name, species, breed, photo_url)"
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
  locale: SupportedLocale,
  timeZone = "Europe/Tallinn"
): Promise<RequestDetail | null> {
  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select(
      "id, assigned_staff_id, owner_id, pet_id, category, channel, status, urgency, ai_summary, ai_summary_translations_json, ai_summary_version, urgency_suggestion, risk_flags_json, created_at, updated_at, owners(id, name, phone, preferred_language), pets(id, name, species, breed, photo_url)"
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
    intakeResult,
    contextResult,
    reminders,
    appointmentContext
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
        .in("status", ["success", "fallback"])
        .is("accepted", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_outputs")
        .select("id, output_json, created_at")
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .eq("kind", "intake_question")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_outputs")
        .select("id, output_json, created_at")
        .eq("clinic_id", clinicId)
        .eq("request_id", requestId)
        .eq("kind", "context_retrieval")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      listRequestReminders(supabase, clinicId, requestId),
      request.category === "appointment"
        ? getAppointmentContextForRequest({
            clinicId,
            requestId,
            locale,
            timeZone
          })
        : Promise.resolve(null)
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

  if (contextResult.error) {
    throw new Error(
      `Could not load AI context retrieval: ${contextResult.error.message}`
    );
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

  const aiSummaryLocalizationMap = readAiSummaryLocalizationMap(
    request.ai_summary_translations_json
  );
  const localizedSummary =
    locale === "en" ? null : aiSummaryLocalizationMap[locale];
  const localizedRiskFlags =
    localizedSummary && localizedSummary.riskFlags.length > 0
      ? localizedSummary.riskFlags
      : null;

  const scopePairs = [
    { scopeType: "request", scopeId: request.id },
    request.pet_id ? { scopeType: "pet", scopeId: request.pet_id } : null,
    { scopeType: "owner", scopeId: request.owner_id }
  ].filter(
    (scope): scope is { scopeType: string; scopeId: string } => scope !== null
  );
  const candidateRows: Array<{
    id: string;
    scope_type: string;
    scope_id: string;
    memory_type: string;
    content_text: string;
    status: string;
    confidence: number | null;
    created_at: string;
  }> = [];

  if (scopePairs.length > 0) {
    const { data: memoryRows, error: memoryError } = await supabase
      .from("ai_memory_items")
      .select(
        "id, scope_type, scope_id, memory_type, content_text, status, confidence, created_at"
      )
      .eq("clinic_id", clinicId)
      .eq("status", "candidate")
      .is("deleted_at", null)
      .in(
        "scope_id",
        scopePairs.map((scope) => scope.scopeId)
      )
      .order("created_at", { ascending: false })
      .limit(8);

    if (memoryError) {
      if (!isMissingMemoryTableError(memoryError)) {
        throw new Error(
          `Could not load AI memory candidates: ${memoryError.message}`
        );
      }
    } else {
      candidateRows.push(
        ...((memoryRows ?? []) as typeof candidateRows).filter((row) =>
          scopePairs.some(
            (scope) =>
              scope.scopeType === row.scope_type &&
              scope.scopeId === row.scope_id
          )
        )
      );
    }
  }

  const candidateSourceCounts = new Map<string, number>();
  if (candidateRows.length > 0) {
    const { data: sources, error: sourceError } = await supabase
      .from("ai_memory_sources")
      .select("memory_item_id")
      .eq("clinic_id", clinicId)
      .in(
        "memory_item_id",
        candidateRows.map((row) => row.id)
      );

    if (sourceError) {
      if (!isMissingMemoryTableError(sourceError)) {
        throw new Error(`Could not load AI memory sources: ${sourceError.message}`);
      }
    }

    for (const source of sources ?? []) {
      candidateSourceCounts.set(
        source.memory_item_id,
        (candidateSourceCounts.get(source.memory_item_id) ?? 0) + 1
      );
    }
  }

  return {
    ...toInboxRequest(request),
    assignedStaffId: request.assigned_staff_id,
    ownerPhone: request.owners?.phone ?? "",
    petBreed: request.pets?.breed ?? null,
    aiSummary: localizedSummary?.summaryText ?? request.ai_summary,
    aiSummaryHasTranslation: Boolean(localizedSummary),
    aiSummaryVersion: request.ai_summary_version,
    urgencySuggestion: request.urgency_suggestion,
    riskFlags: localizedRiskFlags ?? pickStringArray(request.risk_flags_json),
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
    staffOptions: await enrichStaffOptions(staffResult.data ?? []),
    pendingDraft,
    aiIntake: pickAiIntakeHandoff(intakeResult.data),
    aiMemoryContext: pickContextItems(contextResult.data?.output_json),
    aiMemoryCandidates: candidateRows.map((row) => ({
      id: row.id,
      scopeType: row.scope_type,
      memoryType: row.memory_type,
      contentText: row.content_text,
      status: row.status,
      confidence: row.confidence,
      createdAt: row.created_at,
      sourceCount: candidateSourceCounts.get(row.id) ?? 0
    })),
    appointmentContext
  };
}

function pickAiIntakeHandoff(
  row:
    | {
        id: string;
        output_json: unknown;
        created_at: string;
      }
    | null
    | undefined
): AiIntakeHandoff | null {
  if (!row) return null;
  const parsed = intakeQuestionOutputSchema.safeParse(row.output_json);
  if (!parsed.success) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    ...parsed.data
  };
}

function pickContextItems(output: unknown): AiMemoryContextItem[] {
  if (!output || typeof output !== "object") return [];
  const items = (output as Record<string, unknown>).contextItems;
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (
        typeof obj.id !== "string" ||
        typeof obj.scopeType !== "string" ||
        typeof obj.memoryType !== "string" ||
        typeof obj.text !== "string"
      ) {
        return null;
      }
      return {
        id: obj.id,
        scopeType: obj.scopeType,
        memoryType: obj.memoryType,
        text: obj.text,
        confidence: typeof obj.confidence === "number" ? obj.confidence : null,
        updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : null
      };
    })
    .filter((item): item is AiMemoryContextItem => item !== null);
}

/**
 * Joins `clinic_staff` rows to their auth user emails via the admin API.
 * `clinic_staff` does not store name/email locally — they live in `auth.users`,
 * which is not RLS-accessible from a user-scoped client. We pay the admin call
 * once per detail render (same pattern as listClinicTeam in lib/clinic/team.ts).
 *
 * If the admin lookup fails (no service key in dev, RLS edge case), we degrade
 * gracefully by returning `email: null` — the UI then falls back to the role
 * label only, which is the legacy behavior.
 */
async function enrichStaffOptions(
  rows: Array<{ id: string; user_id: string; role: ClinicStaffOption["role"] }>
): Promise<ClinicStaffOption[]> {
  if (rows.length === 0) return [];
  let emailsByUserId: Map<string, string> | null = null;
  try {
    emailsByUserId = await listAuthUserEmails();
  } catch {
    emailsByUserId = null;
  }
  return rows.map((staff) => ({
    id: staff.id,
    userId: staff.user_id,
    role: staff.role,
    email: emailsByUserId?.get(staff.user_id) ?? null
  }));
}
