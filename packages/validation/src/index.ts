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

const optionalIdempotencyKeySchema = z
  .union([trimmedString.min(8).max(140), z.literal("")])
  .optional()
  .transform((value) => value || undefined);

const booleanConsentSchema = z.union([
  z.boolean(),
  z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => value === "true" || value === "on")
]);

export const marketingLeadSourceSchema = z.enum([
  "hero",
  "owner_path",
  "pricing",
  "final_cta",
  "mobile_bar",
  "demo_page",
  "sandbox",
  "trust",
  "footer"
]);

export const monthlyRequestVolumeSchema = z.enum([
  "under_100",
  "100_300",
  "300_800",
  "800_plus",
  "unknown"
]);

const optionalTrimmedString = (max: number) =>
  z
    .union([trimmedString.max(max), z.literal("")])
    .optional()
    .transform((value) => value || undefined);

export const marketingLeadSchema = z.object({
  source: marketingLeadSourceSchema.default("demo_page"),
  locale: supportedLocaleSchema.default("en"),
  clinicName: trimmedString.min(2).max(160),
  contactName: trimmedString.min(2).max(140),
  workEmail: emailSchema,
  country: trimmedString.min(2).max(80),
  pmsSystem: optionalTrimmedString(100),
  monthlyRequestVolume: z
    .union([monthlyRequestVolumeSchema, z.literal("")])
    .optional()
    .transform((value) => value || undefined),
  message: optionalTrimmedString(1000),
  consentGiven: booleanConsentSchema.pipe(z.literal(true)),
  website: optionalTrimmedString(300)
});

export type MarketingLeadInput = z.infer<typeof marketingLeadSchema>;
export type MarketingLeadSource = z.infer<typeof marketingLeadSourceSchema>;
export type MonthlyRequestVolume = z.infer<typeof monthlyRequestVolumeSchema>;

export const marketingLeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "converted",
  "archived"
]);

export const marketingLeadBulkIdsSchema = z.array(uuidSchema).min(1).max(100);

export const marketingLeadStatusUpdateSchema = z.object({
  leadIds: marketingLeadBulkIdsSchema,
  status: z.enum(["new", "contacted", "qualified", "converted"])
});

export const marketingLeadArchiveSchema = z.object({
  leadIds: marketingLeadBulkIdsSchema
});

export const marketingLeadAdminNoteSchema = z.object({
  leadId: uuidSchema,
  adminNote: optionalTrimmedString(1200)
});

export const marketingLeadReplyHandoffSchema = z.object({
  leadId: uuidSchema
});

export type MarketingLeadStatus = z.infer<typeof marketingLeadStatusSchema>;

export const webIntakeStartSchema = intakeRequestSchema.extend({
  consent: booleanConsentSchema.pipe(z.literal(true)),
  idempotencyKey: optionalIdempotencyKeySchema
});

export type WebIntakeStartInput = z.infer<typeof webIntakeStartSchema>;

export const webIntakeMessageSchema = z.object({
  sessionToken: trimmedString.min(32).max(256),
  requestId: uuidSchema,
  message: trimmedString.min(1).max(4000),
  preferredLanguage: supportedLocaleSchema.default("en"),
  idempotencyKey: optionalIdempotencyKeySchema
});

export type WebIntakeMessageInput = z.infer<typeof webIntakeMessageSchema>;

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

export const userProfileSchema = z.object({
  fullName: trimmedString.min(1).max(140),
  displayName: trimmedString.max(80).optional(),
  phone: trimmedString.max(32).optional(),
  jobTitle: trimmedString.max(120).optional(),
  locale: supportedLocaleSchema.default("en")
});

export const updateTeamMemberProfileSchema = userProfileSchema.extend({
  membershipId: uuidSchema
});

export const ownerProfileSchema = z.object({
  ownerId: uuidSchema,
  name: trimmedString.min(1).max(140),
  phone: trimmedString.min(6).max(32),
  email: z.union([emailSchema, z.literal("")]).optional(),
  preferredLanguage: supportedLocaleSchema.default("en"),
  notes: trimmedString.max(1200).optional()
});

export const petProfileSchema = z.object({
  petId: uuidSchema,
  name: trimmedString.min(1).max(140),
  species: trimmedString.min(1).max(80),
  breed: trimmedString.max(120).optional(),
  sex: trimmedString.max(40).optional(),
  birthDate: z.union([z.iso.date(), z.literal("")]).optional(),
  weightKg: z.union([z.literal(""), z.coerce.number().min(0).max(999)]).optional(),
  allergies: trimmedString.max(1200).optional(),
  medicalNotes: trimmedString.max(2000).optional()
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

const timeOfDaySchema = trimmedString.regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  "Use HH:mm in 24-hour time."
);

export const appointmentStatusSchema = z.enum([
  "requested",
  "confirmed",
  "rescheduled",
  "completed",
  "cancelled",
  "no_show"
]);

export const availabilityRuleInputSchema = z
  .object({
    staffId: uuidSchema,
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    serviceIds: z.array(uuidSchema).max(30).default([]),
    isActive: z.coerce.boolean().default(true)
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"]
  });

export const timeOffInputSchema = z
  .object({
    staffId: uuidSchema,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    reason: trimmedString.max(240).optional()
  })
  .refine((value) => new Date(value.startsAt) < new Date(value.endsAt), {
    message: "End time must be after start time.",
    path: ["endsAt"]
  });

export const slotLookupSchema = z.object({
  appointmentId: uuidSchema,
  from: z.iso.datetime({ offset: true }).optional(),
  horizonDays: z.coerce.number().int().min(1).max(60).default(14),
  limit: z.coerce.number().int().min(1).max(12).default(3)
});

export const appointmentSlotSchema = z
  .object({
    staffId: uuidSchema,
    staffLabel: trimmedString.min(1).max(160),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    durationMinutes: z.coerce.number().int().min(5).max(480),
    serviceId: z.union([uuidSchema, z.null()]).optional()
  })
  .refine((value) => new Date(value.startsAt) < new Date(value.endsAt), {
    message: "End time must be after start time.",
    path: ["endsAt"]
  });

export const slotOfferCreationSchema = z.object({
  requestId: uuidSchema,
  appointmentId: uuidSchema,
  slots: z.array(appointmentSlotSchema).min(1).max(3),
  messageBody: trimmedString.max(2000).optional()
});

export const ownerSlotConfirmationSchema = z.object({
  requestId: uuidSchema,
  offerId: uuidSchema,
  slotIndex: z.coerce.number().int().min(0).max(2)
});

export const appointmentCancellationSchema = z.object({
  appointmentId: uuidSchema,
  reason: trimmedString.max(500).optional()
});

export const reminderTypeSchema = z.enum([
  "follow_up",
  "recheck",
  "vaccination",
  "refill",
  "appointment"
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

/**
 * Kanban board drop targets. Mixes two axes:
 *  - `urgent` flips urgency=high (status untouched).
 *  - Everything else maps to a RequestStatus.
 *
 * Server action picks the axis based on the column name so the schema can stay
 * a single enum — the visual columns are the source of truth for both UI and
 * audit events.
 */
export const boardColumnSchema = z.enum([
  "new",
  "urgent",
  "waiting_staff",
  "waiting_owner",
  "resolved"
]);

export const boardMoveSchema = z.object({
  requestId: uuidSchema,
  targetColumn: boardColumnSchema
});

export type BoardMoveInput = z.infer<typeof boardMoveSchema>;
