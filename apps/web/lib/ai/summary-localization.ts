import "server-only";

import {
  summaryLocalizationOutputSchema,
  type SummaryLocalizationOutput
} from "@petcura/ai";
import type { Json, SupportedLocale } from "@petcura/shared";
import { generateJsonWithGateway, type GatewayJsonResult } from "./gateway";

export const summaryTranslationPromptVersion =
  "summary_translation.v1.2026-05-12";

const targetLocaleNames: Record<SupportedLocale, string> = {
  en: "English",
  et: "Estonian",
  ru: "Russian"
};

export type AiSummaryLocalization = {
  summaryText: string;
  riskFlags: string[];
  sourceLocale: "en";
  targetLocale: SupportedLocale;
  promptVersion: string;
  model: string | null;
  confidence: number | null;
  aiOutputId: string | null;
  reviewedBy: string | null;
  edited: boolean;
  updatedAt: string;
};

export type AiSummaryLocalizationMap = Partial<
  Record<SupportedLocale, AiSummaryLocalization>
>;

function getSummaryTranslationModel() {
  return (
    process.env.PETCURA_AI_SUMMARY_TRANSLATION_MODEL ??
    process.env.PETCURA_AI_TRANSLATION_MODEL ??
    "anthropic/claude-haiku-4.5"
  );
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickRiskFlags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((flag): flag is string => typeof flag === "string");
}

export function readAiSummaryLocalizationMap(
  value: Json | null | undefined
): AiSummaryLocalizationMap {
  if (!isRecord(value)) return {};

  const map: AiSummaryLocalizationMap = {};
  for (const locale of ["en", "et", "ru"] as const) {
    const entry = value[locale];
    if (!isRecord(entry) || typeof entry.summaryText !== "string") continue;
    map[locale] = {
      summaryText: entry.summaryText,
      riskFlags: pickRiskFlags(entry.riskFlags),
      sourceLocale: "en",
      targetLocale: locale,
      promptVersion:
        typeof entry.promptVersion === "string"
          ? entry.promptVersion
          : summaryTranslationPromptVersion,
      model: typeof entry.model === "string" ? entry.model : null,
      confidence:
        typeof entry.confidence === "number" ? entry.confidence : null,
      aiOutputId:
        typeof entry.aiOutputId === "string" ? entry.aiOutputId : null,
      reviewedBy:
        typeof entry.reviewedBy === "string" ? entry.reviewedBy : null,
      edited: entry.edited === true,
      updatedAt:
        typeof entry.updatedAt === "string"
          ? entry.updatedAt
          : new Date(0).toISOString()
    };
  }

  return map;
}

export function writeAiSummaryLocalization(
  existing: Json | null | undefined,
  locale: SupportedLocale,
  localization: AiSummaryLocalization
): Json {
  const current = readAiSummaryLocalizationMap(existing);
  current[locale] = localization;
  return current as unknown as Json;
}

export function buildEditedAiSummaryLocalization({
  locale,
  summaryText,
  riskFlags,
  reviewedBy
}: {
  locale: SupportedLocale;
  summaryText: string;
  riskFlags: string[];
  reviewedBy: string;
}): AiSummaryLocalization {
  return {
    summaryText,
    riskFlags,
    sourceLocale: "en",
    targetLocale: locale,
    promptVersion: summaryTranslationPromptVersion,
    model: null,
    confidence: null,
    aiOutputId: null,
    reviewedBy,
    edited: true,
    updatedAt: new Date().toISOString()
  };
}

export async function generateAiSummaryLocalization({
  summaryText,
  riskFlags,
  targetLocale
}: {
  summaryText: string;
  riskFlags: string[];
  targetLocale: Exclude<SupportedLocale, "en">;
}): Promise<GatewayJsonResult<SummaryLocalizationOutput>> {
  const model = getSummaryTranslationModel();
  const targetLanguage = targetLocaleNames[targetLocale];

  return generateJsonWithGateway({
    model,
    system:
      "You are PetCura's veterinary clinic translation assistant. Translate staff-facing case summaries exactly and neutrally. Do not diagnose, prescribe, add facts, remove uncertainty, or soften urgent owner language.",
    prompt: [
      `Translate this veterinary clinic staff summary from English to ${targetLanguage}.`,
      "Preserve clinical uncertainty and urgency language exactly.",
      "Translate risk flags as short staff-facing phrases.",
      "Return only JSON with keys: summaryText, riskFlags, confidence.",
      "",
      `Summary: ${summaryText}`,
      "",
      `Risk flags: ${riskFlags.length > 0 ? riskFlags.join("; ") : "none"}`
    ].join("\n"),
    schema: summaryLocalizationOutputSchema,
    timeoutMs: 8_000,
    maxOutputTokens: 900
  });
}
