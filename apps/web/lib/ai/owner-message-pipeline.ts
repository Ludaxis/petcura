import "server-only";

import {
  aiPromptRegistry,
  formatSummaryForStaff,
  summaryLocalizationOutputSchema,
  summaryOutputSchema,
  translationOutputSchema,
  type SummaryOutput
} from "@petcura/ai";
import {
  normalizeLocale,
  type Database,
  type SupportedLocale
} from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateAccountedJson,
  type AiOutputSourceInput
} from "./accountability";
import {
  buildSummaryLocalizationPrompt,
  getSummaryTranslationModel,
  summaryTranslationSystemPrompt,
  summaryTranslationPromptVersion,
  writeAiSummaryLocalization
} from "./summary-localization";
import {
  createMemoryCandidatesFromOwnerMessage,
  retrieveAcceptedMemoryContext,
  type MemoryContextItem,
  type RequestMemoryContext
} from "./memory";

const supportedLocales = ["en", "et", "ru"] as const satisfies readonly SupportedLocale[];
const summaryPromptVersion = aiPromptRegistry.summary.version;
const translationPromptVersion = aiPromptRegistry.translation.version;
const defaultAnthropicHaikuModel = "anthropic/claude-haiku-4.5";
const fallbackSummaryModel = "petcura/rules-fallback";

type AdminClient = ReturnType<typeof createAdminClient>;
type Json = Database["public"]["Tables"]["ai_outputs"]["Insert"]["input_json"];

type MessageForAi = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "sender_type" | "body" | "source_locale" | "created_at"
>;

type RequestForAi = RequestMemoryContext;

export type OwnerMessageAiResult = {
  summary: "generated" | "fallback" | "skipped";
  translations: number;
  errors: string[];
};

function getSummaryModel() {
  return process.env.PETCURA_AI_SUMMARY_MODEL ?? defaultAnthropicHaikuModel;
}

function getTranslationModel() {
  return process.env.PETCURA_AI_TRANSLATION_MODEL ?? defaultAnthropicHaikuModel;
}

function toJson(value: unknown): Json {
  return value as Json;
}

function truncate(value: string, max = 500) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function buildFallbackSummary({
  request,
  messages
}: {
  request: RequestForAi;
  messages: MessageForAi[];
}): SummaryOutput {
  const latestOwnerMessage = [...messages]
    .reverse()
    .find((message) => message.sender_type === "owner");
  const issue = latestOwnerMessage
    ? truncate(latestOwnerMessage.body, 220)
    : "Owner request received.";

  return {
    summaryText: `${request.pets?.name ?? "Pet"}: ${issue}`,
    petName: request.pets?.name ?? undefined,
    issue,
    symptoms: [],
    riskFlags: [],
    urgencySuggestion: undefined,
    confidence: 0.35
  };
}

function buildSummaryPrompt({
  request,
  messages,
  memoryItems
}: {
  request: RequestForAi;
  messages: MessageForAi[];
  memoryItems: MemoryContextItem[];
}) {
  return JSON.stringify(
    {
      task:
        "Summarize this veterinary owner request for clinic staff. Do not diagnose, prescribe, or decide final urgency. You may suggest risk flags and urgencySuggestion for staff review only. Return only JSON matching the requested shape.",
      prior_context_not_current_symptoms: memoryItems.map((item) => ({
        id: item.id,
        scope_type: item.scopeType,
        memory_type: item.memoryType,
        text: item.text,
        sources: item.sources
      })),
      clinic: request.clinics?.name,
      owner: {
        name: request.owners?.name,
        language: request.owners?.preferred_language
      },
      pet: {
        name: request.pets?.name,
        species: request.pets?.species,
        breed: request.pets?.breed,
        allergies: request.pets?.allergies,
        medical_notes: request.pets?.medical_notes
      },
      request: {
        category: request.category,
        staff_set_urgency: request.urgency,
        status: request.status
      },
      messages: messages.map((message) => ({
        sender: message.sender_type,
        source_locale: message.source_locale,
        created_at: message.created_at,
        body: message.body
      })),
      output_shape: {
        summaryText: "one or two concise staff-facing sentences",
        petName: "string optional",
        issue: "short issue label",
        duration: "optional duration if stated",
        symptoms: ["explicit symptoms only"],
        riskFlags: ["risk flags explicitly present in the conversation"],
        urgencySuggestion: "low | medium | high optional; staff review only",
        confidence: "0..1"
      }
    },
    null,
    2
  );
}

function buildTranslationPrompt({
  text,
  sourceLocale,
  targetLocale
}: {
  text: string;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
}) {
  return JSON.stringify(
    {
      task:
        "Translate the owner/staff message for veterinary clinic staff. Preserve meaning, dates, medicine names, symptoms, quantities, and uncertainty. Do not add advice. Return only JSON.",
      source_locale: sourceLocale,
      target_locale: targetLocale,
      text,
      output_shape: {
        translatedText: "translated message text only",
        confidence: "0..1"
      }
    },
    null,
    2
  );
}

function messageSources(messages: MessageForAi[]): AiOutputSourceInput[] {
  return messages.map((message) => ({
    sourceType: "message",
    sourceId: message.id
  }));
}

async function loadRequestContext(
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
    throw new Error(`Could not load request AI context: ${error.message}`);
  }

  return data as unknown as RequestForAi | null;
}

async function loadRecentMessages(
  admin: AdminClient,
  clinicId: string,
  requestId: string
) {
  const { data, error } = await admin
    .from("messages")
    .select("id, sender_type, body, source_locale, created_at")
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(`Could not load request messages for AI: ${error.message}`);
  }

  return [...((data ?? []) as MessageForAi[])].reverse();
}

async function loadMessage(
  admin: AdminClient,
  clinicId: string,
  messageId: string
) {
  const { data, error } = await admin
    .from("messages")
    .select("id, sender_type, body, source_locale, created_at")
    .eq("clinic_id", clinicId)
    .eq("id", messageId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load message for AI: ${error.message}`);
  }

  return data as MessageForAi | null;
}

async function writeSummary({
  admin,
  request,
  messages,
  sourceMessageId
}: {
  admin: AdminClient;
  request: RequestForAi;
  messages: MessageForAi[];
  sourceMessageId: string;
}) {
  const model = getSummaryModel();
  const memoryContext = await retrieveAcceptedMemoryContext({
    admin,
    request,
    taskKind: "summary"
  });
  const input = {
    source_message_id: sourceMessageId,
    prompt_version: summaryPromptVersion,
    context_retrieval_ai_output_id: memoryContext.aiOutputId,
    memory_ids: memoryContext.items.map((item) => item.id),
    messages: messages.map((message) => ({
      id: message.id,
      sender_type: message.sender_type,
      source_locale: message.source_locale,
      body: message.body
    }))
  };
  const system =
    "You are PetCura's veterinary clinic operations assistant. You summarize communication for staff. You never diagnose, prescribe, or replace a veterinarian.";
  const prompt = buildSummaryPrompt({
    request,
    messages,
    memoryItems: memoryContext.items
  });
  const accounted = await generateAccountedJson({
    db: admin,
    clinicId: request.clinic_id,
    requestId: request.id,
    kind: "summary",
    promptKey: aiPromptRegistry.summary.key,
    promptVersion: summaryPromptVersion,
    model,
    system,
    prompt,
    schema: summaryOutputSchema,
    inputJson: toJson(input),
    sources: [
      ...messageSources(messages),
      {
        sourceType: "ai_output",
        sourceId: memoryContext.aiOutputId,
        sourceLabel: "context_retrieval"
      }
    ],
    timeoutMs: 8_000,
    maxOutputTokens: 700,
    fallback: {
      output: buildFallbackSummary({ request, messages }),
      model: fallbackSummaryModel
    }
  });
  if (!accounted.ok) {
    throw new Error(`Could not generate accountable AI summary: ${accounted.reason}`);
  }

  const summary = accounted.output;
  const summaryText = formatSummaryForStaff(summary);

  let aiSummaryTranslationsJson: Json = {};
  for (const targetLocale of ["et", "ru"] as const) {
    const localizationInput = {
      source_ai_output_id: accounted.aiOutputId,
      source_locale: "en",
      target_locale: targetLocale,
      summary_text: summaryText,
      risk_flags: summary.riskFlags
    };
    const localizationResult = await generateAccountedJson({
      db: admin,
      clinicId: request.clinic_id,
      requestId: request.id,
      kind: "summary_translation",
      promptKey: aiPromptRegistry.summaryTranslation.key,
      promptVersion: summaryTranslationPromptVersion,
      model: getSummaryTranslationModel(),
      system: summaryTranslationSystemPrompt,
      prompt: buildSummaryLocalizationPrompt({
        summaryText,
        riskFlags: summary.riskFlags,
        targetLocale
      }),
      schema: summaryLocalizationOutputSchema,
      inputJson: toJson(localizationInput),
      sources: [
        {
          sourceType: "ai_output",
          sourceId: accounted.aiOutputId,
          sourceLabel: "source_summary"
        }
      ],
      timeoutMs: 8_000,
      maxOutputTokens: 900
    });

    if (!localizationResult.ok) continue;

    aiSummaryTranslationsJson = writeAiSummaryLocalization(
      aiSummaryTranslationsJson,
      targetLocale,
      {
        summaryText: localizationResult.output.summaryText,
        riskFlags: localizationResult.output.riskFlags,
        sourceLocale: "en",
        targetLocale,
        promptVersion: summaryTranslationPromptVersion,
        model: localizationResult.model,
        confidence: localizationResult.output.confidence,
        aiOutputId: localizationResult.aiOutputId,
        reviewedBy: null,
        edited: false,
        updatedAt: new Date().toISOString()
      }
    ) as Json;
  }

  const { error: requestError } = await admin
    .from("requests")
    .update({
      ai_summary: summaryText,
      ai_summary_translations_json: aiSummaryTranslationsJson,
      ai_summary_version: summaryPromptVersion,
      urgency_suggestion: summary.urgencySuggestion ?? null,
      risk_flags_json: summary.riskFlags
    })
    .eq("clinic_id", request.clinic_id)
    .eq("id", request.id);

  if (requestError) {
    throw new Error(`Could not update request AI summary: ${requestError.message}`);
  }

  const { error: eventError } = await admin.from("request_events").insert({
    clinic_id: request.clinic_id,
    request_id: request.id,
    actor_type: "ai",
    actor_id: null,
    event_type: "ai_summary_updated",
    payload_json: {
      ai_output_id: accounted.aiOutputId,
      prompt_version: summaryPromptVersion,
      fallback: accounted.status === "fallback",
      source_message_id: sourceMessageId
    }
  });

  if (eventError) {
    throw new Error(`Could not write AI summary event: ${eventError.message}`);
  }

  return accounted.status === "success" ? "generated" : "fallback";
}

async function writeTranslation({
  admin,
  request,
  message,
  sourceLocale,
  targetLocale
}: {
  admin: AdminClient;
  request: RequestForAi;
  message: MessageForAi;
  sourceLocale: SupportedLocale;
  targetLocale: SupportedLocale;
}) {
  const model = getTranslationModel();
  const system =
    "You are PetCura's translation assistant. Translate exactly and neutrally for veterinary clinic staff. Do not add medical advice.";
  const prompt = buildTranslationPrompt({
    text: message.body,
    sourceLocale,
    targetLocale
  });
  const accounted = await generateAccountedJson({
    db: admin,
    clinicId: request.clinic_id,
    requestId: request.id,
    kind: "translation",
    promptKey: aiPromptRegistry.translation.key,
    promptVersion: translationPromptVersion,
    model,
    system,
    prompt,
    schema: translationOutputSchema,
    inputJson: toJson({
      source_message_id: message.id,
      source_locale: sourceLocale,
      target_locale: targetLocale,
      text: message.body
    }),
    sources: [
      {
        sourceType: "message",
        sourceId: message.id
      }
    ],
    timeoutMs: 8_000,
    maxOutputTokens: 900
  });

  if (!accounted.ok) {
    return false;
  }

  const { error: translationError } = await admin
    .from("message_translations")
    .upsert(
      {
        clinic_id: request.clinic_id,
        message_id: message.id,
        ai_output_id: accounted.aiOutputId,
        source_locale: sourceLocale,
        target_locale: targetLocale,
        translated_body: accounted.output.translatedText,
        model: accounted.model,
        prompt_version: translationPromptVersion
      },
      { onConflict: "message_id,target_locale" }
    );

  if (translationError) {
    throw new Error(`Could not store message translation: ${translationError.message}`);
  }

  if (targetLocale === "en") {
    const { error: messageError } = await admin
      .from("messages")
      .update({
        body_translated: accounted.output.translatedText
      })
      .eq("clinic_id", request.clinic_id)
      .eq("id", message.id);

    if (messageError) {
      throw new Error(`Could not update message translation: ${messageError.message}`);
    }
  }

  const { error: eventError } = await admin.from("request_events").insert({
    clinic_id: request.clinic_id,
    request_id: request.id,
    actor_type: "ai",
    actor_id: null,
    event_type: "ai_translation_cached",
    payload_json: {
      ai_output_id: accounted.aiOutputId,
      message_id: message.id,
      source_locale: sourceLocale,
      target_locale: targetLocale
    }
  });

  if (eventError) {
    throw new Error(`Could not write AI translation event: ${eventError.message}`);
  }

  return true;
}

export async function processOwnerMessageAi({
  clinicId,
  requestId,
  messageId
}: {
  clinicId: string;
  requestId: string;
  messageId: string;
}): Promise<OwnerMessageAiResult> {
  const admin = createAdminClient();
  const result: OwnerMessageAiResult = {
    summary: "skipped",
    translations: 0,
    errors: []
  };
  const [request, messages, message] = await Promise.all([
    loadRequestContext(admin, clinicId, requestId),
    loadRecentMessages(admin, clinicId, requestId),
    loadMessage(admin, clinicId, messageId)
  ]);

  if (!request || !message || message.sender_type !== "owner") {
    return result;
  }

  try {
    result.summary = await writeSummary({
      admin,
      request,
      messages,
      sourceMessageId: messageId
    });
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "summary_error");
  }

  try {
    await createMemoryCandidatesFromOwnerMessage({
      admin,
      request,
      messages,
      sourceMessageId: messageId
    });
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "memory_extraction_error"
    );
  }

  const sourceLocale = normalizeLocale(
    message.source_locale ?? request.owners?.preferred_language ?? request.clinics?.locale
  );
  const targets = supportedLocales.filter((locale) => locale !== sourceLocale);

  await Promise.all(
    targets.map(async (targetLocale) => {
      try {
        const ok = await writeTranslation({
          admin,
          request,
          message,
          sourceLocale,
          targetLocale
        });
        if (ok) result.translations += 1;
      } catch (error) {
        result.errors.push(
          error instanceof Error ? error.message : "translation_error"
        );
      }
    })
  );

  return result;
}
