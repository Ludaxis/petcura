import { z } from "zod";

const trimmedString = z.string().trim();
const uuidSchema = z.uuid();
const emailSchema = trimmedString.toLowerCase().pipe(z.email());

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .regex(
      /^sb_publishable_/,
      "Use the current Supabase publishable key, not the legacy anon key."
    )
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

export const staffRoleSchema = z.enum([
  "owner",
  "admin",
  "vet",
  "tech",
  "reception",
  "viewer"
]);

export const clinicSlugSchema = trimmedString
  .min(2)
  .max(80)
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens."
  );

export const intakeRequestSchema = z.object({
  clinicSlug: z
    .union([clinicSlugSchema, z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  ownerName: trimmedString.min(1).max(120),
  phone: trimmedString.min(6).max(32),
  petName: trimmedString.min(1).max(120),
  petSpecies: trimmedString.min(1).max(80).default("unknown"),
  category: requestCategorySchema,
  message: trimmedString.min(10).max(4000),
  preferredLanguage: supportedLocaleSchema.default("en")
});

export type IntakeRequestInput = z.infer<typeof intakeRequestSchema>;

export const createClinicSchema = z.object({
  name: trimmedString.min(2).max(160),
  slug: clinicSlugSchema,
  country: trimmedString
    .min(2)
    .max(2)
    .toUpperCase()
    .regex(/^[A-Z]{2}$/),
  timezone: trimmedString.min(3).max(80).default("Europe/Tallinn"),
  locale: supportedLocaleSchema.default("en")
});

export const createClinicStaffSchema = z.object({
  clinicId: uuidSchema,
  email: emailSchema,
  role: staffRoleSchema.default("reception")
});

export const updateClinicStaffStatusSchema = z.object({
  membershipId: uuidSchema,
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
});

export const updateClinicStaffRoleSchema = z.object({
  membershipId: uuidSchema,
  role: staffRoleSchema
});

export const staffReplySchema = z.object({
  requestId: uuidSchema,
  body: trimmedString.min(1).max(4000)
});

export const internalNoteSchema = z.object({
  requestId: uuidSchema,
  body: trimmedString.min(1).max(4000)
});

export const requestStatusUpdateSchema = z.object({
  requestId: uuidSchema,
  status: requestStatusSchema
});

export const requestUrgencyUpdateSchema = z.object({
  requestId: uuidSchema,
  urgency: urgencySchema
});

export const requestAssignmentSchema = z.object({
  requestId: uuidSchema,
  staffMemberId: z.union([uuidSchema, z.literal("unassigned")])
});

export const reminderTypeSchema = z.enum([
  "follow_up",
  "recheck",
  "vaccination",
  "refill"
]);

export const reminderStatusSchema = z.enum([
  "scheduled",
  "sent",
  "acknowledged",
  "completed",
  "missed",
  "cancelled"
]);

export const createReminderSchema = z.object({
  requestId: uuidSchema,
  type: reminderTypeSchema,
  title: trimmedString.min(1).max(160),
  body: trimmedString.max(1000).optional(),
  dueAt: z.iso.datetime({ offset: true }),
  channel: z.enum(["whatsapp", "sms"]).default("whatsapp")
});

export const reminderStatusActionSchema = z.object({
  reminderId: uuidSchema,
  status: z.enum(["acknowledged", "completed", "cancelled"])
});

export const aiDraftDecisionSchema = z.object({
  requestId: uuidSchema,
  aiOutputId: uuidSchema
});

export const aiDraftEditSchema = z.object({
  requestId: uuidSchema,
  aiOutputId: uuidSchema,
  editedText: trimmedString.min(1).max(4000),
  /**
   * Discriminator. `true` (default) writes the edit but leaves
   * `accepted=null`, so staff can review again or finalize. `false` writes
   * the edit and sets `accepted=true` (the legacy "Save & accept" path).
   */
  saveOnly: z.boolean().default(true)
});

export const aiDraftRejectSchema = z.object({
  requestId: uuidSchema,
  aiOutputId: uuidSchema,
  reason: trimmedString.max(280).optional()
});

export const aiSummaryEditSchema = z.object({
  requestId: uuidSchema,
  targetLocale: supportedLocaleSchema,
  summaryText: trimmedString.min(1).max(1200),
  riskFlagsText: trimmedString.max(1200).default("")
});

export const aiSummaryTranslateSchema = z.object({
  requestId: uuidSchema,
  targetLocale: supportedLocaleSchema
});

export const translationRevealSchema = z.object({
  requestId: uuidSchema,
  messageId: uuidSchema,
  targetLocale: supportedLocaleSchema
});

export const aiMemoryDecisionSchema = z.object({
  requestId: uuidSchema,
  memoryItemId: uuidSchema
});

export const aiMemoryEditSchema = z.object({
  requestId: uuidSchema,
  memoryItemId: uuidSchema,
  contentText: trimmedString.min(8).max(700)
});

export const aiReplyDraftGenerationSchema = z.object({
  requestId: uuidSchema,
  locale: supportedLocaleSchema.default("en")
});
