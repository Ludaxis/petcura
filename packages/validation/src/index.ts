import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20)
});

export const requestCategorySchema = z.enum([
  "medical_question",
  "refill",
  "appointment",
  "follow_up",
  "admin"
]);

export const requestStatusSchema = z.enum([
  "new",
  "waiting_staff",
  "waiting_owner",
  "resolved"
]);

export const urgencySchema = z.enum(["low", "medium", "high"]);

export const supportedLocaleSchema = z.enum(["en", "et", "ru"]);

const trimmedString = z.string().trim();

export const intakeRequestSchema = z.object({
  ownerName: trimmedString.min(1).max(120),
  phone: trimmedString.min(6).max(32),
  petName: trimmedString.min(1).max(120),
  petSpecies: trimmedString.min(1).max(80).default("unknown"),
  category: requestCategorySchema,
  message: trimmedString.min(10).max(4000),
  preferredLanguage: supportedLocaleSchema.default("en")
});

export type IntakeRequestInput = z.infer<typeof intakeRequestSchema>;
