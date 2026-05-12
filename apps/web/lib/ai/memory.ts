import "server-only";

import { createHash } from "node:crypto";
import {
  contextRetrievalOutputSchema,
  memoryExtractionOutputSchema,
  replyDraftOutputSchema,
  type ContextRetrievalOutput,
  type MemoryExtractionOutput,
  type ReplyDraftOutput
} from "@petcura/ai";
import {
  normalizeLocale,
  type Database,
  type SupportedLocale
} from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateJsonWithGateway } from "./gateway";

const defaultAnthropicHaikuModel = "anthropic/claude-haiku-4.5";
export const memoryExtractionPromptVersion =
  "memory_extraction.v1.2026-05-12";
export const contextRetrievalPromptVersion =
  "context_retrieval.v1.2026-05-12";
export const replyDraftPromptVersion = "reply_draft.v1.2026-05-12";

type AdminClient = ReturnType<typeof createAdminClient>;
type Json = Database["public"]["Tables"]["ai_outputs"]["Insert"]["input_json"];
type AiMemoryItemInsert =
  Database["public"]["Tables"]["ai_memory_items"]["Insert"];

type MessageForAi = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "sender_type" | "body" | "source_locale" | "created_at"
>;

export type RequestMemoryContext = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  "id" | "clinic_id" | "owner_id" | "pet_id" | "category" | "urgency" | "status"
> & {
  clinics: Pick<
    Database["public"]["Tables"]["clinics"]["Row"],
    "name" | "locale"
  > | null;
  owners: Pick<
    Database["public"]["Tables"]["owners"]["Row"],
    "id" | "name" | "preferred_language"
  > | null;
  pets: Pick<
    Database["public"]["Tables"]["pets"]["Row"],
    "id" | "name" | "species" | "breed" | "allergies" | "medical_notes"
  > | null;
};

type MemorySource = {
  sourceType: "request" | "message" | "internal_note" | "ai_output";
  sourceId: string;
};

export type MemoryContextItem = {
  id: string;
  scopeType: "request" | "pet" | "owner";
  scopeId: string;
  memoryType:
    | "request_context"
    | "pet_context"
    | "owner_preference"
    | "communication_preference"
    | "follow_up_context"
    | "safety_context"
    | "operational_note";
  text: string;
  confidence: number | null;
  updatedAt: string;
  sources: MemorySource[];
};

function getMemoryExtractionModel() {
  return process.env.PETCURA_AI_MEMORY_MODEL ?? defaultAnthropicHaikuModel;
}

function getReplyDraftModel() {
  return process.env.PETCURA_AI_REPLY_DRAFT_MODEL ?? defaultAnthropicHaikuModel;
}

function toJson(value: unknown): Json {
  return value as Json;
}

function promptHash(value: unknown) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 24);
}

function scopeIdsForRequest(request: RequestMemoryContext) {
  return [
    { scopeType: "request" as const, scopeId: request.id },
    request.pet_id ? { scopeType: "pet" as const, scopeId: request.pet_id } : null,
    {
      scopeType: "owner" as const,
      scopeId: request.owner_id
    }
  ].filter((scope): scope is { scopeType: "request" | "pet" | "owner"; scopeId: string } =>
    Boolean(scope)
  );
}

function isAllowedCandidateScope(
  request: RequestMemoryContext,
  candidate: { scopeType: string; scopeId: string }
) {
  return scopeIdsForRequest(request).some(
    (scope) =>
      scope.scopeType === candidate.scopeType && scope.scopeId === candidate.scopeId
  );
}

function isAllowedSource(
  request: RequestMemoryContext,
  messages: MessageForAi[],
  source: MemorySource
) {
  if (source.sourceType === "request") return source.sourceId === request.id;
  if (source.sourceType === "message") {
    return messages.some((message) => message.id === source.sourceId);
  }
  return false;
}

async function loadSourcesForMemoryItems(
  admin: AdminClient,
  clinicId: string,
  memoryIds: string[]
) {
  if (memoryIds.length === 0) return new Map<string, MemorySource[]>();
  const { data, error } = await admin
    .from("ai_memory_sources")
    .select("memory_item_id, source_type, source_id")
    .eq("clinic_id", clinicId)
    .in("memory_item_id", memoryIds);

  if (error) {
    throw new Error(`Could not load AI memory sources: ${error.message}`);
  }

  const map = new Map<string, MemorySource[]>();
  for (const row of data ?? []) {
    const existing = map.get(row.memory_item_id) ?? [];
    existing.push({
      sourceType: row.source_type as MemorySource["sourceType"],
      sourceId: row.source_id
    });
    map.set(row.memory_item_id, existing);
  }
  return map;
}

export async function retrieveAcceptedMemoryContext({
  admin,
  request,
  taskKind,
  limit = 8
}: {
  admin: AdminClient;
  request: RequestMemoryContext;
  taskKind: ContextRetrievalOutput["taskKind"];
  limit?: number;
}) {
  const scopes = scopeIdsForRequest(request);
  const { data, error } = await admin
    .from("ai_memory_items")
    .select(
      "id, scope_type, scope_id, memory_type, content_text, confidence, updated_at, expires_at"
    )
    .eq("clinic_id", request.clinic_id)
    .eq("status", "accepted")
    .is("deleted_at", null)
    .in(
      "scope_id",
      scopes.map((scope) => scope.scopeId)
    )
    .order("updated_at", { ascending: false })
    .limit(24);

  if (error) {
    throw new Error(`Could not retrieve AI memory: ${error.message}`);
  }

  const now = Date.now();
  const rows = (data ?? [])
    .filter((row) =>
      scopes.some(
        (scope) =>
          scope.scopeType === row.scope_type && scope.scopeId === row.scope_id
      )
    )
    .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > now)
    .slice(0, limit);
  const sourcesByMemory = await loadSourcesForMemoryItems(
    admin,
    request.clinic_id,
    rows.map((row) => row.id)
  );

  const items: MemoryContextItem[] = rows.map((row) => ({
    id: row.id,
    scopeType: row.scope_type as MemoryContextItem["scopeType"],
    scopeId: row.scope_id,
    memoryType: row.memory_type as MemoryContextItem["memoryType"],
    text: row.content_text,
    confidence: row.confidence,
    updatedAt: row.updated_at,
    sources: sourcesByMemory.get(row.id) ?? []
  }));
  const output = contextRetrievalOutputSchema.parse({
    taskKind,
    selectedMemoryIds: items.map((item) => item.id),
    contextItems: items,
    promptContextHash: promptHash(items),
    rationale:
      items.length > 0
        ? "Structured clinic-scoped request, pet, and owner memories selected by scope and recency."
        : "No accepted, unexpired memory matched this request."
  });
  const { data: aiOutput, error: aiError } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: request.clinic_id,
      request_id: request.id,
      kind: "context_retrieval",
      model: "petcura/structured-retrieval",
      prompt_version: contextRetrievalPromptVersion,
      input_json: toJson({
        task_kind: taskKind,
        scopes
      }),
      output_json: toJson(output),
      tokens_in: null,
      tokens_out: null,
      latency_ms: 0,
      confidence: null,
      accepted: null
    })
    .select("id")
    .single();

  if (aiError) {
    throw new Error(`Could not log AI context retrieval: ${aiError.message}`);
  }

  return {
    aiOutputId: aiOutput.id,
    output,
    items
  };
}

function buildMemoryExtractionPrompt({
  request,
  messages,
  sourceMessageId
}: {
  request: RequestMemoryContext;
  messages: MessageForAi[];
  sourceMessageId: string;
}) {
  return JSON.stringify(
    {
      task:
        "Extract durable PetCura memory candidates for clinic staff. Only return source-grounded operational context useful for future communication. Do not diagnose, prescribe, set final urgency, or turn current symptoms into permanent facts. Return empty candidates when nothing stable is present.",
      allowed_scopes: scopeIdsForRequest(request),
      allowed_memory_types: [
        "request_context",
        "pet_context",
        "owner_preference",
        "communication_preference",
        "follow_up_context",
        "safety_context",
        "operational_note"
      ],
      source_message_id: sourceMessageId,
      request: {
        id: request.id,
        category: request.category,
        staff_set_urgency: request.urgency,
        status: request.status
      },
      owner: {
        id: request.owner_id,
        name: request.owners?.name,
        language: request.owners?.preferred_language
      },
      pet: {
        id: request.pet_id,
        name: request.pets?.name,
        species: request.pets?.species,
        breed: request.pets?.breed
      },
      messages: messages.map((message) => ({
        id: message.id,
        sender_type: message.sender_type,
        source_locale: message.source_locale,
        created_at: message.created_at,
        body: message.body
      })),
      output_shape: {
        candidates:
          "array of at most 6 candidates with scopeType, scopeId, memoryType, text, confidence, sources, optional content, optional sourceLocale, optional expiresAt",
        confidence: "0..1"
      }
    },
    null,
    2
  );
}

export async function createMemoryCandidatesFromOwnerMessage({
  admin,
  request,
  messages,
  sourceMessageId
}: {
  admin: AdminClient;
  request: RequestMemoryContext;
  messages: MessageForAi[];
  sourceMessageId: string;
}) {
  const { data: existing, error: existingError } = await admin
    .from("ai_outputs")
    .select("id")
    .eq("clinic_id", request.clinic_id)
    .eq("request_id", request.id)
    .eq("kind", "memory_extraction")
    .contains("input_json", {
      source_message_id: sourceMessageId,
      prompt_version: memoryExtractionPromptVersion
    })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Could not check AI memory extraction idempotency: ${existingError.message}`
    );
  }

  if (existing) {
    return { aiOutputId: existing.id, candidates: 0, skipped: true };
  }

  const model = getMemoryExtractionModel();
  const gatewayResult = await generateJsonWithGateway({
    model,
    system:
      "You are PetCura's veterinary clinic operations memory assistant. You extract reviewable staff context only. You never diagnose, prescribe, set final urgency, or create unsupported medical facts.",
    prompt: buildMemoryExtractionPrompt({ request, messages, sourceMessageId }),
    schema: memoryExtractionOutputSchema,
    timeoutMs: 8_000,
    maxOutputTokens: 900
  });
  const output: MemoryExtractionOutput = gatewayResult.ok
    ? gatewayResult.output
    : { candidates: [], confidence: 0 };
  const { data: aiOutput, error: aiError } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: request.clinic_id,
      request_id: request.id,
      kind: "memory_extraction",
      model: gatewayResult.ok ? gatewayResult.model : model,
      prompt_version: memoryExtractionPromptVersion,
      input_json: toJson({
        source_message_id: sourceMessageId,
        prompt_version: memoryExtractionPromptVersion,
        fallback_reason: gatewayResult.ok ? null : gatewayResult.reason
      }),
      output_json: toJson(output),
      tokens_in: gatewayResult.ok ? gatewayResult.tokensIn : null,
      tokens_out: gatewayResult.ok ? gatewayResult.tokensOut : null,
      latency_ms: gatewayResult.latencyMs,
      confidence: output.confidence,
      accepted: null
    })
    .select("id")
    .single();

  if (aiError) {
    throw new Error(`Could not store AI memory extraction: ${aiError.message}`);
  }

  const allowedCandidates = output.candidates
    .filter((candidate) => isAllowedCandidateScope(request, candidate))
    .map((candidate) => ({
      ...candidate,
      sources: candidate.sources.filter((source) =>
        isAllowedSource(request, messages, source)
      )
    }))
    .filter((candidate) => candidate.sources.length > 0);

  let inserted = 0;
  for (const candidate of allowedCandidates) {
    const insertPayload: AiMemoryItemInsert = {
      clinic_id: request.clinic_id,
      scope_type: candidate.scopeType,
      scope_id: candidate.scopeId,
      memory_type: candidate.memoryType,
      content_text: candidate.text,
      content_json: toJson(candidate.content),
      source_locale: candidate.sourceLocale ?? null,
      status: "candidate",
      confidence: candidate.confidence,
      source_ai_output_id: aiOutput.id,
      expires_at: candidate.expiresAt ?? null
    };
    const { data: memory, error: memoryError } = await admin
      .from("ai_memory_items")
      .insert(insertPayload)
      .select("id")
      .single();

    if (memoryError) {
      throw new Error(`Could not store AI memory candidate: ${memoryError.message}`);
    }

    const { error: sourceError } = await admin.from("ai_memory_sources").insert(
      candidate.sources.map((source) => ({
        clinic_id: request.clinic_id,
        memory_item_id: memory.id,
        source_type: source.sourceType,
        source_id: source.sourceId
      }))
    );

    if (sourceError) {
      throw new Error(`Could not store AI memory sources: ${sourceError.message}`);
    }

    inserted += 1;
  }

  const { error: eventError } = await admin.from("request_events").insert({
    clinic_id: request.clinic_id,
    request_id: request.id,
    actor_type: "ai",
    actor_id: null,
    event_type: "ai_memory_candidates_created",
    payload_json: {
      ai_output_id: aiOutput.id,
      source_message_id: sourceMessageId,
      candidate_count: inserted
    }
  });

  if (eventError) {
    throw new Error(`Could not write AI memory event: ${eventError.message}`);
  }

  return { aiOutputId: aiOutput.id, candidates: inserted, skipped: false };
}

function buildReplyDraftPrompt({
  request,
  messages,
  memoryItems,
  targetLocale
}: {
  request: RequestMemoryContext;
  messages: MessageForAi[];
  memoryItems: MemoryContextItem[];
  targetLocale: SupportedLocale;
}) {
  return JSON.stringify(
    {
      task:
        "Draft a concise staff-reviewed reply to the owner. The draft is never sent automatically. Use prior memory only as background context and label uncertainty. Do not diagnose, prescribe, set final urgency, or provide autonomous medical advice.",
      target_locale: targetLocale,
      prior_context_not_current_symptoms: memoryItems.map((item) => ({
        id: item.id,
        scope_type: item.scopeType,
        memory_type: item.memoryType,
        text: item.text,
        sources: item.sources
      })),
      request: {
        id: request.id,
        category: request.category,
        staff_set_urgency: request.urgency,
        status: request.status
      },
      owner: {
        language: request.owners?.preferred_language
      },
      pet: {
        name: request.pets?.name,
        species: request.pets?.species,
        breed: request.pets?.breed,
        allergies: request.pets?.allergies
      },
      messages: messages.map((message) => ({
        sender_type: message.sender_type,
        source_locale: message.source_locale,
        created_at: message.created_at,
        body: message.body
      })),
      output_shape: {
        text: "draft reply text only",
        confidence: "0..1",
        usedMemoryIds: "array of memory ids used",
        safetyNotes: "array of short safety notes"
      }
    },
    null,
    2
  );
}

export async function generateReplyDraftForRequest({
  clinicId,
  requestId,
  locale
}: {
  clinicId: string;
  requestId: string;
  locale: SupportedLocale;
}) {
  const admin = createAdminClient();
  const [request, messages] = await Promise.all([
    loadRequestMemoryContext(admin, clinicId, requestId),
    loadRecentRequestMessages(admin, clinicId, requestId)
  ]);

  if (!request) {
    return { ok: false as const, error: "not_found" };
  }

  const context = await retrieveAcceptedMemoryContext({
    admin,
    request,
    taskKind: "reply_draft"
  });
  const model = getReplyDraftModel();
  const targetLocale = normalizeLocale(
    locale ?? request.owners?.preferred_language ?? request.clinics?.locale
  );
  const gatewayResult = await generateJsonWithGateway({
    model,
    system:
      "You are PetCura's veterinary clinic operations assistant. You draft staff-reviewed replies only. You never diagnose, prescribe, set final urgency, or send messages.",
    prompt: buildReplyDraftPrompt({
      request,
      messages,
      memoryItems: context.items,
      targetLocale
    }),
    schema: replyDraftOutputSchema,
    timeoutMs: 10_000,
    maxOutputTokens: 900
  });

  if (!gatewayResult.ok) {
    const { error: eventError } = await admin.from("request_events").insert({
      clinic_id: clinicId,
      request_id: requestId,
      actor_type: "ai",
      actor_id: null,
      event_type: "ai_draft_generation_failed",
      payload_json: {
        reason: gatewayResult.reason,
        context_retrieval_ai_output_id: context.aiOutputId
      }
    });

    if (eventError) {
      return { ok: false as const, error: eventError.message };
    }
    return { ok: false as const, error: gatewayResult.reason };
  }

  const output: ReplyDraftOutput = {
    ...gatewayResult.output,
    usedMemoryIds: gatewayResult.output.usedMemoryIds.filter((id) =>
      context.items.some((item) => item.id === id)
    )
  };
  const { data: aiOutput, error: aiError } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: clinicId,
      request_id: requestId,
      kind: "reply_draft",
      model: gatewayResult.model,
      prompt_version: replyDraftPromptVersion,
      input_json: toJson({
        prompt_version: replyDraftPromptVersion,
        target_locale: targetLocale,
        context_retrieval_ai_output_id: context.aiOutputId,
        memory_ids: context.items.map((item) => item.id)
      }),
      output_json: toJson(output),
      tokens_in: gatewayResult.tokensIn,
      tokens_out: gatewayResult.tokensOut,
      latency_ms: gatewayResult.latencyMs,
      confidence: output.confidence,
      accepted: null
    })
    .select("id")
    .single();

  if (aiError) {
    return { ok: false as const, error: aiError.message };
  }

  const { error: eventError } = await admin.from("request_events").insert({
    clinic_id: clinicId,
    request_id: requestId,
    actor_type: "ai",
    actor_id: null,
    event_type: "ai_draft_generated",
    payload_json: {
      ai_output_id: aiOutput.id,
      prompt_version: replyDraftPromptVersion,
      context_retrieval_ai_output_id: context.aiOutputId,
      memory_ids: output.usedMemoryIds
    }
  });

  if (eventError) {
    return { ok: false as const, error: eventError.message };
  }

  return { ok: true as const, aiOutputId: aiOutput.id };
}

export async function loadRequestMemoryContext(
  admin: AdminClient,
  clinicId: string,
  requestId: string
) {
  const { data, error } = await admin
    .from("requests")
    .select(
      "id, clinic_id, owner_id, pet_id, category, urgency, status, clinics(name, locale), owners(id, name, preferred_language), pets(id, name, species, breed, allergies, medical_notes)"
    )
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load request memory context: ${error.message}`);
  }

  return data as unknown as RequestMemoryContext | null;
}

export async function loadRecentRequestMessages(
  admin: AdminClient,
  clinicId: string,
  requestId: string,
  limit = 12
) {
  const { data, error } = await admin
    .from("messages")
    .select("id, sender_type, body, source_locale, created_at")
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Could not load request messages for memory: ${error.message}`);
  }

  return [...((data ?? []) as MessageForAi[])].reverse();
}
