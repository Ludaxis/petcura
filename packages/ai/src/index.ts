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
  petName: z.string().optional(),
  issue: z.string(),
  duration: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  riskFlags: z.array(z.string()).default([]),
  urgencySuggestion: z.enum(["low", "medium", "high"]).optional(),
  confidence: z.number().min(0).max(1)
});

export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
