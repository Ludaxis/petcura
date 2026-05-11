import { z } from "zod";

export const aiOutputKindSchema = z.enum([
  "intake_question",
  "summary",
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

export const summaryOutputSchema = z.object({
  summaryText: z.string().min(1).max(700).optional(),
  petName: z.string().optional(),
  issue: z.string().min(1).max(300),
  duration: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  urgencySuggestion: z.enum(["low", "medium", "high"]).optional(),
  confidence: z.number().min(0).max(1)
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

export const translationOutputSchema = z.object({
  translatedText: z.string().min(1).max(4000),
  confidence: z.number().min(0).max(1)
});

export type TranslationOutput = z.infer<typeof translationOutputSchema>;

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
