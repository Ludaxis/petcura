import { z } from "zod";

export const aiOutputKindSchema = z.enum([
  "intake_question",
  "summary",
  "summary_translation",
  "reply_draft",
  "translation",
  "category_suggestion",
  "risk_flags",
  "memory_extraction",
  "context_retrieval"
]);

export const aiSafetyRules = [
  "AI assists staff and never replaces veterinary professionals.",
  "AI must not diagnose, prescribe, or set final urgency.",
  "Owner-facing medical content requires staff approval.",
  "Every AI output must be logged with model and prompt version."
] as const;

function optionalText(max: number) {
  return z.preprocess((value) => {
    if (value == null) return undefined;
    if (typeof value === "string") return value.trim();
    return String(value).trim();
  }, z.string().min(1).max(max).optional());
}

const stringArray = z.preprocess((value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.string()).default([]));

const confidenceScore = z.preprocess((value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return numeric > 1 ? numeric / 100 : numeric;
}, z.number().min(0).max(1).catch(0.5));

const optionalUrgencySuggestion = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") return value.toLowerCase();
  return value;
}, z.enum(["low", "medium", "high"]).optional());

const baseSummaryOutputSchema = z.object({
  summaryText: optionalText(700),
  petName: optionalText(120),
  issue: optionalText(300),
  duration: optionalText(120),
  symptoms: stringArray,
  riskFlags: stringArray,
  urgencySuggestion: optionalUrgencySuggestion,
  confidence: confidenceScore
});

export const summaryOutputSchema = baseSummaryOutputSchema.transform(
  (summary) => ({
    ...summary,
    issue: summary.issue ?? summary.summaryText ?? "Owner request received."
  })
);

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

export const translationOutputSchema = z.object({
  translatedText: z.string().min(1).max(4000),
  confidence: z.number().min(0).max(1)
});

export type TranslationOutput = z.infer<typeof translationOutputSchema>;

export const summaryLocalizationOutputSchema = z.object({
  summaryText: z.string().trim().min(1).max(900),
  riskFlags: stringArray,
  confidence: confidenceScore
});

export type SummaryLocalizationOutput = z.infer<
  typeof summaryLocalizationOutputSchema
>;

export const aiMemoryScopeSchema = z.enum(["request", "pet", "owner"]);

export const aiMemoryTypeSchema = z.enum([
  "request_context",
  "pet_context",
  "owner_preference",
  "communication_preference",
  "follow_up_context",
  "safety_context",
  "operational_note"
]);

export const aiMemoryStatusSchema = z.enum([
  "candidate",
  "accepted",
  "rejected",
  "expired"
]);

export const aiMemorySourceSchema = z.object({
  sourceType: z.enum(["request", "message", "internal_note", "ai_output"]),
  sourceId: z.uuid()
});

const optionalIsoDateTime = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (typeof value === "string") return value;
  return undefined;
}, z.iso.datetime({ offset: true }).optional());

export const aiMemoryCandidateSchema = z.object({
  scopeType: aiMemoryScopeSchema,
  scopeId: z.uuid(),
  memoryType: aiMemoryTypeSchema,
  text: z.string().trim().min(8).max(700),
  content: z.record(z.string(), z.unknown()).default({}),
  sourceLocale: optionalText(20),
  confidence: confidenceScore,
  expiresAt: optionalIsoDateTime,
  sources: z.array(aiMemorySourceSchema).min(1).max(6)
});

export const memoryExtractionOutputSchema = z.object({
  candidates: z.array(aiMemoryCandidateSchema).max(6).default([]),
  confidence: confidenceScore
});

export type AiMemoryCandidate = z.infer<typeof aiMemoryCandidateSchema>;
export type MemoryExtractionOutput = z.infer<
  typeof memoryExtractionOutputSchema
>;

export const contextRetrievalItemSchema = z.object({
  id: z.uuid(),
  scopeType: aiMemoryScopeSchema,
  scopeId: z.uuid(),
  memoryType: aiMemoryTypeSchema,
  text: z.string().trim().min(1).max(700),
  confidence: z.number().min(0).max(1).nullable().optional(),
  updatedAt: z.string(),
  sources: z.array(aiMemorySourceSchema).default([])
});

export const contextRetrievalOutputSchema = z.object({
  taskKind: z.enum(["summary", "reply_draft", "memory_extraction"]),
  selectedMemoryIds: z.array(z.uuid()).default([]),
  contextItems: z.array(contextRetrievalItemSchema).default([]),
  promptContextHash: z.string().min(8),
  rationale: z.string().max(500).optional()
});

export type ContextRetrievalOutput = z.infer<
  typeof contextRetrievalOutputSchema
>;

export const replyDraftOutputSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  confidence: confidenceScore,
  usedMemoryIds: z.array(z.uuid()).default([]),
  safetyNotes: stringArray
});

export type ReplyDraftOutput = z.infer<typeof replyDraftOutputSchema>;

export function formatSummaryForStaff(summary: SummaryOutput) {
  if (summary.summaryText?.trim()) {
    return summary.summaryText.trim();
  }

  const parts = [summary.issue.trim()];
  if (summary.duration?.trim()) {
    parts.push(`Duration: ${summary.duration.trim()}.`);
  }
  if (summary.symptoms.length > 0) {
    parts.push(`Symptoms: ${summary.symptoms.join(", ")}.`);
  }
  if (summary.riskFlags.length > 0) {
    parts.push(`Risk flags: ${summary.riskFlags.join(", ")}.`);
  }

  return parts.join(" ").trim();
}
