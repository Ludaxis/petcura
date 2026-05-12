import { z } from "zod";

export const aiOutputKindSchema = z.enum([
  "intake_question",
  "summary",
  "summary_translation",
  "reply_draft",
  "translation",
  "category_suggestion",
  "risk_flags"
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
