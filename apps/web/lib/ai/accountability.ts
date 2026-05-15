import "server-only";

import { createHash } from "node:crypto";
import {
  findAiPromptRegistryEntry,
  validateAiOutputSafety,
  type AiOutputKind,
  type AiOutputStatus,
  type AiReviewStatus
} from "@petcura/ai";
import type { Database, Json } from "@petcura/shared";
import type { z } from "zod";
import type { createAdminClient } from "@/lib/supabase/admin";
import { generateJsonWithGateway } from "./gateway";

type AiDbClient = Pick<ReturnType<typeof createAdminClient>, "from">;
type AiOutputInsert = Database["public"]["Tables"]["ai_outputs"]["Insert"];
type AiOutputSourceInsert =
  Database["public"]["Tables"]["ai_output_sources"]["Insert"];

export type AiOutputSourceInput = {
  sourceType:
    | "request"
    | "message"
    | "internal_note"
    | "ai_output"
    | "ai_memory_item"
    | "owner"
    | "pet"
    | "web_intake_session";
  sourceId: string;
  sourceLabel?: string | null;
  metadata?: Json | null;
};

type WriteAccountedAiOutputInput = {
  db: AiDbClient;
  clinicId: string;
  requestId: string | null;
  kind: AiOutputKind;
  status: AiOutputStatus;
  model: string;
  promptKey: string;
  promptVersion: string;
  inputJson: Json;
  outputJson: Json;
  promptHash?: string | null;
  system?: string | null;
  prompt?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  latencyMs?: number | null;
  confidence?: number | null;
  rawOutputText?: string | null;
  failureReason?: string | null;
  blockedReason?: string | null;
  safetyWarnings?: string[];
  sources?: AiOutputSourceInput[];
  reviewStatus?: AiReviewStatus | undefined;
};

export type AccountedAiJsonResult<T> =
  | {
      ok: true;
      status: Extract<AiOutputStatus, "success" | "fallback">;
      output: T;
      aiOutputId: string;
      model: string;
      promptHash: string;
      latencyMs: number | null;
      tokensIn: number | null;
      tokensOut: number | null;
      fallbackReason: string | null;
    }
  | {
      ok: false;
      status: Extract<
        AiOutputStatus,
        "schema_failure" | "provider_error" | "blocked"
      >;
      aiOutputId: string;
      model: string;
      promptHash: string;
      latencyMs: number | null;
      reason: string;
    };

export function hashAiPromptMaterial({
  promptKey,
  promptVersion,
  system,
  prompt
}: {
  promptKey: string;
  promptVersion: string;
  system?: string | null;
  prompt?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        promptKey,
        promptVersion,
        system: system ?? "",
        prompt: prompt ?? ""
      })
    )
    .digest("hex");
}

export function inferAiProvider(model: string) {
  if (model.startsWith("anthropic/") || model.startsWith("claude-")) {
    return "anthropic";
  }
  if (model.startsWith("openai/") || model.startsWith("gpt-")) {
    return "openai";
  }
  if (model.startsWith("petcura/")) return "petcura";
  return "unknown";
}

function reviewStatusFor(status: AiOutputStatus): AiReviewStatus {
  return status === "success" || status === "fallback"
    ? "pending"
    : "not_reviewable";
}

function confidenceFromOutput(output: unknown) {
  if (!output || typeof output !== "object") return null;
  const confidence = (output as Record<string, unknown>).confidence;
  return typeof confidence === "number" ? confidence : null;
}

function withAccountabilityInput({
  inputJson,
  promptKey,
  promptHash,
  requestedModel,
  fallbackReason,
  safetyWarnings
}: {
  inputJson: Json;
  promptKey: string;
  promptHash: string;
  requestedModel: string;
  fallbackReason?: string | null;
  safetyWarnings?: string[];
}): Json {
  const base =
    inputJson && typeof inputJson === "object" && !Array.isArray(inputJson)
      ? (inputJson as Record<string, unknown>)
      : { value: inputJson };

  return {
    ...base,
    prompt_key: promptKey,
    prompt_hash: promptHash,
    requested_model: requestedModel,
    fallback_reason: fallbackReason ?? null,
    safety_warnings: safetyWarnings ?? []
  } as Json;
}

export function buildAiOutputInsert({
  clinicId,
  requestId,
  kind,
  status,
  model,
  promptKey,
  promptVersion,
  promptHash,
  inputJson,
  outputJson,
  tokensIn = null,
  tokensOut = null,
  latencyMs = null,
  confidence = null,
  rawOutputText = null,
  failureReason = null,
  blockedReason = null,
  reviewStatus
}: Omit<WriteAccountedAiOutputInput, "db" | "sources"> & {
  promptHash: string;
}): AiOutputInsert {
  return {
    clinic_id: clinicId,
    request_id: requestId,
    kind,
    status,
    provider: inferAiProvider(model),
    model,
    prompt_key: promptKey,
    prompt_version: promptVersion,
    prompt_hash: promptHash,
    input_json: inputJson,
    output_json: outputJson,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latency_ms: latencyMs,
    confidence,
    accepted: null,
    review_status: reviewStatus ?? reviewStatusFor(status),
    failure_reason: failureReason,
    blocked_reason: blockedReason,
    raw_output_text: rawOutputText,
    provenance_json: {
      prompt_registry_version:
        findAiPromptRegistryEntry(promptKey)?.version ?? null
    }
  };
}

async function writeAiOutputSources({
  db,
  clinicId,
  aiOutputId,
  sources = []
}: {
  db: AiDbClient;
  clinicId: string;
  aiOutputId: string;
  sources?: AiOutputSourceInput[];
}) {
  const uniqueSources = new Map<string, AiOutputSourceInput>();
  for (const source of sources) {
    uniqueSources.set(`${source.sourceType}:${source.sourceId}`, source);
  }

  if (uniqueSources.size === 0) return;

  const rows: AiOutputSourceInsert[] = Array.from(uniqueSources.values()).map(
    (source) => ({
      clinic_id: clinicId,
      ai_output_id: aiOutputId,
      source_type: source.sourceType,
      source_id: source.sourceId,
      source_label: source.sourceLabel ?? null,
      metadata_json: source.metadata ?? {}
    })
  );

  const { error } = await db.from("ai_output_sources").insert(rows);
  if (error) {
    throw new Error(`Could not store AI output sources: ${error.message}`);
  }
}

export async function writeAccountedAiOutput({
  db,
  clinicId,
  requestId,
  kind,
  status,
  model,
  promptKey,
  promptVersion,
  inputJson,
  outputJson,
  promptHash,
  system = null,
  prompt = null,
  tokensIn = null,
  tokensOut = null,
  latencyMs = null,
  confidence = null,
  rawOutputText = null,
  failureReason = null,
  blockedReason = null,
  safetyWarnings = [],
  sources = [],
  reviewStatus
}: WriteAccountedAiOutputInput) {
  const resolvedPromptHash =
    promptHash ??
    hashAiPromptMaterial({
      promptKey,
      promptVersion,
      system,
      prompt
    });
  const requestedModel =
    (inputJson &&
      typeof inputJson === "object" &&
      !Array.isArray(inputJson) &&
      typeof (inputJson as Record<string, unknown>).requested_model === "string"
      ? ((inputJson as Record<string, unknown>).requested_model as string)
      : model) ?? model;
  const insert = buildAiOutputInsert({
    clinicId,
    requestId,
    kind,
    status,
    model,
    promptKey,
    promptVersion,
    promptHash: resolvedPromptHash,
    inputJson: withAccountabilityInput({
      inputJson,
      promptKey,
      promptHash: resolvedPromptHash,
      requestedModel,
      fallbackReason: failureReason,
      safetyWarnings
    }),
    outputJson,
    tokensIn,
    tokensOut,
    latencyMs,
    confidence,
    rawOutputText,
    failureReason,
    blockedReason,
    reviewStatus
  });

  const { data, error } = await db
    .from("ai_outputs")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not store AI output: ${error.message}`);
  }

  await writeAiOutputSources({
    db,
    clinicId,
    aiOutputId: data.id,
    sources
  });

  return {
    aiOutputId: data.id,
    promptHash: resolvedPromptHash
  };
}

export async function generateAccountedJson<T>({
  db,
  clinicId,
  requestId,
  kind,
  promptKey,
  promptVersion,
  model,
  system,
  prompt,
  schema,
  inputJson,
  sources = [],
  ownerFacing,
  timeoutMs,
  maxOutputTokens,
  fallback,
  transformOutput,
  skipProviderReason = null
}: {
  db: AiDbClient;
  clinicId: string;
  requestId: string | null;
  kind: AiOutputKind;
  promptKey: string;
  promptVersion: string;
  model: string;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  inputJson: Json;
  sources?: AiOutputSourceInput[];
  ownerFacing?: boolean;
  timeoutMs?: number;
  maxOutputTokens?: number;
  fallback?: {
    output: T;
    model: string;
  };
  transformOutput?: (output: T) => T;
  skipProviderReason?: string | null;
}): Promise<AccountedAiJsonResult<T>> {
  const promptHash = hashAiPromptMaterial({ promptKey, promptVersion, system, prompt });
  const registryEntry = findAiPromptRegistryEntry(promptKey);
  const shouldTreatAsOwnerFacing = ownerFacing ?? registryEntry?.ownerFacing ?? false;

  const persistFallback = async ({
    reason,
    latencyMs,
    sourceAiOutputId = null
  }: {
    reason: string;
    latencyMs: number | null;
    sourceAiOutputId?: string | null;
  }) => {
    if (!fallback) return null;

    const safety = validateAiOutputSafety({
      kind,
      output: fallback.output,
      ownerFacing: shouldTreatAsOwnerFacing
    });

    if (!safety.ok) {
      const blocked = await writeAccountedAiOutput({
        db,
        clinicId,
        requestId,
        kind,
        status: "blocked",
        model: fallback.model,
        promptKey,
        promptVersion,
        promptHash,
        system,
        prompt,
        inputJson,
        outputJson: {
          blocked: true,
          reason: safety.reason,
          violations: safety.violations
        } as Json,
        latencyMs,
        confidence: null,
        failureReason: reason,
        blockedReason: safety.reason,
        sources
      });

      return {
        ok: false as const,
        status: "blocked" as const,
        aiOutputId: blocked.aiOutputId,
        model: fallback.model,
        promptHash,
        latencyMs,
        reason: safety.reason
      };
    }

    const fallbackSources = sourceAiOutputId
      ? [
          ...sources,
          {
            sourceType: "ai_output" as const,
            sourceId: sourceAiOutputId,
            sourceLabel: "blocked_output"
          }
        ]
      : sources;
    const written = await writeAccountedAiOutput({
      db,
      clinicId,
      requestId,
      kind,
      status: "fallback",
      model: fallback.model,
      promptKey,
      promptVersion,
      promptHash,
      system,
      prompt,
      inputJson,
      outputJson: fallback.output as Json,
      tokensIn: null,
      tokensOut: null,
      latencyMs,
      confidence: confidenceFromOutput(fallback.output),
      failureReason: reason,
      safetyWarnings: safety.warnings,
      sources: fallbackSources
    });

    return {
      ok: true as const,
      status: "fallback" as const,
      output: fallback.output,
      aiOutputId: written.aiOutputId,
      model: fallback.model,
      promptHash,
      latencyMs,
      tokensIn: null,
      tokensOut: null,
      fallbackReason: reason
    };
  };

  if (skipProviderReason) {
    const fallbackResult = await persistFallback({
      reason: skipProviderReason,
      latencyMs: 0
    });
    if (fallbackResult) return fallbackResult;
  } else {
    const generated = await generateJsonWithGateway({
      model,
      system,
      prompt,
      schema,
      timeoutMs,
      maxOutputTokens
    });

    if (generated.ok) {
      const output = transformOutput
        ? transformOutput(generated.output)
        : generated.output;
      const safety = validateAiOutputSafety({
        kind,
        output,
        ownerFacing: shouldTreatAsOwnerFacing
      });

      if (!safety.ok) {
        const blocked = await writeAccountedAiOutput({
          db,
          clinicId,
          requestId,
          kind,
          status: "blocked",
          model: generated.model,
          promptKey,
          promptVersion,
          promptHash,
          system,
          prompt,
          inputJson,
          outputJson: {
            blocked: true,
            reason: safety.reason,
            violations: safety.violations
          } as Json,
          tokensIn: generated.tokensIn,
          tokensOut: generated.tokensOut,
          latencyMs: generated.latencyMs,
          confidence: null,
          rawOutputText: generated.rawText,
          blockedReason: safety.reason,
          sources
        });
        const fallbackResult = await persistFallback({
          reason: `blocked:${safety.reason}`,
          latencyMs: generated.latencyMs,
          sourceAiOutputId: blocked.aiOutputId
        });
        if (fallbackResult) return fallbackResult;

        return {
          ok: false,
          status: "blocked",
          aiOutputId: blocked.aiOutputId,
          model: generated.model,
          promptHash,
          latencyMs: generated.latencyMs,
          reason: safety.reason
        };
      }

      const written = await writeAccountedAiOutput({
        db,
        clinicId,
        requestId,
        kind,
        status: "success",
        model: generated.model,
        promptKey,
        promptVersion,
        promptHash,
        system,
        prompt,
        inputJson,
        outputJson: output as Json,
        tokensIn: generated.tokensIn,
        tokensOut: generated.tokensOut,
        latencyMs: generated.latencyMs,
        confidence: confidenceFromOutput(output),
        rawOutputText: generated.rawText,
        safetyWarnings: safety.warnings,
        sources
      });

      return {
        ok: true,
        status: "success",
        output,
        aiOutputId: written.aiOutputId,
        model: generated.model,
        promptHash,
        latencyMs: generated.latencyMs,
        tokensIn: generated.tokensIn,
        tokensOut: generated.tokensOut,
        fallbackReason: null
      };
    }

    const fallbackResult = await persistFallback({
      reason: `${generated.status}:${generated.reason}`,
      latencyMs: generated.latencyMs
    });
    if (fallbackResult) return fallbackResult;

    const written = await writeAccountedAiOutput({
      db,
      clinicId,
      requestId,
      kind,
      status: generated.status,
      model: generated.model,
      promptKey,
      promptVersion,
      promptHash,
      system,
      prompt,
      inputJson,
      outputJson: {
        error: generated.reason,
        status: generated.status
      } as Json,
      tokensIn: generated.tokensIn ?? null,
      tokensOut: generated.tokensOut ?? null,
      latencyMs: generated.latencyMs,
      confidence: null,
      rawOutputText: generated.rawText ?? null,
      failureReason: generated.reason,
      sources
    });

    return {
      ok: false,
      status: generated.status,
      aiOutputId: written.aiOutputId,
      model: generated.model,
      promptHash,
      latencyMs: generated.latencyMs,
      reason: generated.reason
    };
  }

  const written = await writeAccountedAiOutput({
    db,
    clinicId,
    requestId,
    kind,
    status: "provider_error",
    model,
    promptKey,
    promptVersion,
    promptHash,
    system,
    prompt,
    inputJson,
    outputJson: {
      error: skipProviderReason ?? "provider_skipped_without_fallback",
      status: "provider_error"
    } as Json,
    latencyMs: 0,
    failureReason: skipProviderReason ?? "provider_skipped_without_fallback",
    sources
  });

  return {
    ok: false,
    status: "provider_error",
    aiOutputId: written.aiOutputId,
    model,
    promptHash,
    latencyMs: 0,
    reason: skipProviderReason ?? "provider_skipped_without_fallback"
  };
}
