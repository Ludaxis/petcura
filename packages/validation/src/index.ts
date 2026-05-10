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

export const intakeRequestSchema = z.object({
  ownerName: z.string().min(1).max(120),
  phone: z.string().min(6).max(32),
  petName: z.string().min(1).max(120),
  category: requestCategorySchema,
  message: z.string().min(10).max(4000)
});

export type IntakeRequestInput = z.infer<typeof intakeRequestSchema>;
