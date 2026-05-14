import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  intakeQuestionOutputSchema,
  type IntakeQuestionOutput,
  type IntakeRoutingSuggestion,
  type IntakeServiceIntent
} from "@petcura/ai";
import {
  normalizeLocale,
  type Database,
  type Json,
  type RequestCategory,
  type RequestChannel,
  type RequestStatus,
  type SupportedLocale
} from "@petcura/shared";
import type {
  WebIntakeMessageInput,
  WebIntakeStartInput
} from "@petcura/validation";
import { generateJsonWithGateway } from "@/lib/ai/gateway";
import {
  createOwnerRequest,
  runOwnerMessageAi
} from "@/lib/intake/create-owner-request";
import {
  buildEmergencyBanner,
  computeClinicOpenState,
  detectEmergencyLanguage,
  detectServiceIntent,
  fallbackIntakeOutput,
  routingForIntent,
  type ClinicHoursRow,
  type ClinicHolidayRow,
  type ClinicOpenState,
  type EmergencyBanner,
  type EmergencyDetection,
  type EmergencyPolicyText
} from "@/lib/intake/ai-assisted-core";
import {
  createAdminClient,
  getIntakeClinic
} from "@/lib/supabase/admin";

const intakePromptVersion = "intake-question-v1.0.0";
const rulesFallbackModel = "petcura/rules-fallback";
const defaultIntakeModel = "anthropic/claude-haiku-4.5";

type AdminClient = ReturnType<typeof createAdminClient>;
type IntakeClinic = Awaited<ReturnType<typeof getIntakeClinic>>;
type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];
type MessageRow = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "body" | "source_locale" | "created_at"
>;
type SessionRow = Pick<
  Database["public"]["Tables"]["web_intake_sessions"]["Row"],
  "id" | "clinic_id" | "owner_id" | "request_id" | "status" | "locale"
>;
type RequestRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  "id" | "clinic_id" | "owner_id" | "pet_id" | "category" | "status" | "channel"
> & {
  owners: { id: string; name: string; phone: string; preferred_language: string | null } | null;
  pets: { id: string; name: string; species: string } | null;
};

type WebIntakeConfig = {
  enabled: boolean;
  aiEnabled: boolean;
  allowedOrigins: string[];
  rateLimitPerHour: number;
};

export type WebIntakeRequestMeta = {
  origin?: string | null;
  referrer?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type WebIntakeAiResult = {
  output: IntakeQuestionOutput;
  aiOutputId: string | null;
  model: string;
  promptVersion: string;
  fallbackReason: string | null;
};

export type WebIntakeApiResult = {
  requestId: string;
  messageId: string | null;
  sessionToken: string;
  aiIntake: IntakeQuestionOutput;
  aiOutputId: string | null;
  emergencyBanner: EmergencyBanner | null;
  clinicOpenState: ClinicOpenState;
  fallbackReason: string | null;
};

export class WebIntakeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export async function startWebIntake({
  input,
  meta
}: {
  input: WebIntakeStartInput;
  meta: WebIntakeRequestMeta;
}): Promise<WebIntakeApiResult> {
  const admin = createAdminClient();
  const clinic = await getIntakeClinic(input.clinicSlug);
  const ipHash = hashOptional(meta.ipAddress);
  const userAgentHash = hashOptional(meta.userAgent);
  const context = await loadWebIntakeContext({
    admin,
    clinic,
    locale: input.preferredLanguage,
    origin: meta.origin ?? null,
    ipHash
  });

  const externalMessageId = input.idempotencyKey
    ? `web:start:${clinic.id}:${input.idempotencyKey}`
    : undefined;
  const created = await createOwnerRequest(
    {
      ...input,
      channel: "web",
      externalMessageId
    },
    clinic
  );

  if (!created.ok) {
    throw new WebIntakeError(500, "request_create_failed", created.message);
  }

  const request = await loadRequestForIntake(admin, clinic.id, created.caseId);
  if (!request) {
    throw new WebIntakeError(500, "request_missing", "Created request not found.");
  }

  const token = generateSessionToken();
  const { data: session, error: sessionError } = await admin
    .from("web_intake_sessions")
    .insert({
      clinic_id: clinic.id,
      public_token_hash: hashSecret(token),
      owner_id: request.owner_id,
      request_id: request.id,
      locale: input.preferredLanguage,
      consented_at: new Date().toISOString(),
      origin: normalizeOrigin(meta.origin),
      referrer: meta.referrer?.slice(0, 500) ?? null,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      status: "active"
    })
    .select("id")
    .single();

  if (sessionError) {
    throw new WebIntakeError(500, "session_create_failed", sessionError.message);
  }

  const aiResult = await generateAndPersistIntakeOutput({
    admin,
    clinic,
    sessionId: session.id,
    request,
    sourceMessageId: created.messageId ?? null,
    ownerName: input.ownerName,
    phone: input.phone,
    petName: input.petName,
    petSpecies: input.petSpecies,
    category: input.category,
    locale: input.preferredLanguage,
    messages: [
      {
        id: created.messageId ?? "initial",
        body: input.message,
        source_locale: input.preferredLanguage,
        created_at: new Date().toISOString()
      }
    ],
    context
  });
  const emergencyBanner = buildEmergencyBanner({
    locale: input.preferredLanguage,
    emergency: detectEmergencyLanguage(input.message),
    openState: context.openState,
    policy: context.policyText
  });

  await insertRequestEvents(admin, [
    {
      request_id: request.id,
      clinic_id: clinic.id,
      actor_type: "system",
      actor_id: null,
      event_type: "web_intake_session_started",
      payload_json: {
        session_id: session.id,
        locale: input.preferredLanguage,
        origin: normalizeOrigin(meta.origin)
      }
    },
    ...(emergencyBanner
      ? [
          {
            request_id: request.id,
            clinic_id: clinic.id,
            actor_type: "system" as const,
            actor_id: null,
            event_type: "emergency_banner_shown",
            payload_json: {
              session_id: session.id,
              is_after_hours: emergencyBanner.isAfterHours,
              phone_present: Boolean(emergencyBanner.phone)
            }
          }
        ]
      : [])
  ]);

  return {
    requestId: request.id,
    messageId: created.messageId ?? null,
    sessionToken: token,
    aiIntake: aiResult.output,
    aiOutputId: aiResult.aiOutputId,
    emergencyBanner,
    clinicOpenState: context.openState,
    fallbackReason: aiResult.fallbackReason
  };
}

export async function appendWebIntakeMessage({
  input,
  meta
}: {
  input: WebIntakeMessageInput;
  meta: WebIntakeRequestMeta;
}): Promise<WebIntakeApiResult> {
  const admin = createAdminClient();
  const session = await loadSessionByToken(admin, input.sessionToken);

  if (!session || session.status !== "active" || session.request_id !== input.requestId) {
    throw new WebIntakeError(404, "session_not_found", "Intake session is not active.");
  }

  const request = await loadRequestForIntake(
    admin,
    session.clinic_id,
    input.requestId
  );
  if (!request || !request.owner_id) {
    throw new WebIntakeError(404, "request_not_found", "Request is not available.");
  }

  const clinic = await loadClinicById(admin, session.clinic_id);
  const locale = normalizeLocale(input.preferredLanguage);
  const externalMessageId = input.idempotencyKey
    ? `web:message:${session.id}:${input.idempotencyKey}`
    : undefined;
  const message = await insertFollowUpOwnerMessage({
    admin,
    request,
    ownerId: request.owner_id,
    body: input.message,
    locale,
    externalMessageId
  });

  await admin
    .from("web_intake_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
      locale,
      ip_hash: hashOptional(meta.ipAddress),
      user_agent_hash: hashOptional(meta.userAgent)
    })
    .eq("id", session.id)
    .eq("clinic_id", session.clinic_id);

  if (!message.deduped) {
    await runOwnerMessageAi({
      clinicId: request.clinic_id,
      requestId: request.id,
      messageId: message.messageId,
      ownerId: request.owner_id,
      petId: request.pet_id ?? undefined,
      channel: request.channel as RequestChannel,
      sourceLocale: locale,
      hasAttachments: false
    });
  }

  const context = await loadWebIntakeContext({
    admin,
    clinic,
    locale,
    origin: meta.origin ?? null,
    ipHash: hashOptional(meta.ipAddress),
    enforceEnabled: false
  });
  const transcript = await loadRequestMessages(admin, request.clinic_id, request.id);
  const aiResult = await generateAndPersistIntakeOutput({
    admin,
    clinic,
    sessionId: session.id,
    request,
    sourceMessageId: message.messageId,
    ownerName: request.owners?.name ?? "Owner",
    phone: request.owners?.phone ?? "",
    petName: request.pets?.name ?? "Pet",
    petSpecies: request.pets?.species ?? "unknown",
    category: request.category,
    locale,
    messages: transcript,
    context
  });
  const emergency = detectEmergencyLanguage(
    transcript.map((row) => row.body).join("\n")
  );
  const emergencyBanner = buildEmergencyBanner({
    locale,
    emergency,
    openState: context.openState,
    policy: context.policyText
  });

  if (emergencyBanner) {
    await insertRequestEvents(admin, [
      {
        request_id: request.id,
        clinic_id: clinic.id,
        actor_type: "system",
        actor_id: null,
        event_type: "emergency_banner_shown",
        payload_json: {
          session_id: session.id,
          source_message_id: message.messageId,
          is_after_hours: emergencyBanner.isAfterHours,
          phone_present: Boolean(emergencyBanner.phone)
        }
      }
    ]);
  }

  return {
    requestId: request.id,
    messageId: message.messageId,
    sessionToken: input.sessionToken,
    aiIntake: aiResult.output,
    aiOutputId: aiResult.aiOutputId,
    emergencyBanner,
    clinicOpenState: context.openState,
    fallbackReason: aiResult.fallbackReason
  };
}

async function generateAndPersistIntakeOutput({
  admin,
  clinic,
  sessionId,
  request,
  sourceMessageId,
  ownerName,
  phone,
  petName,
  petSpecies,
  category,
  locale,
  messages,
  context
}: {
  admin: AdminClient;
  clinic: IntakeClinic;
  sessionId: string;
  request: RequestRow;
  sourceMessageId: string | null;
  ownerName: string;
  phone: string;
  petName: string;
  petSpecies: string;
  category: RequestCategory;
  locale: SupportedLocale;
  messages: MessageRow[];
  context: Awaited<ReturnType<typeof loadWebIntakeContext>>;
}): Promise<WebIntakeAiResult> {
  const transcript = messages.map((message) => message.body).join("\n\n");
  const emergency = detectEmergencyLanguage(transcript);
  const fallback = fallbackIntakeOutput({
    ownerName,
    petName,
    petSpecies,
    category,
    message: transcript,
    locale,
    emergency
  });
  const serviceIntent = detectServiceIntent(transcript, category);
  const promptInput = {
    owner: { name: ownerName, phone },
    pet: { name: petName, species: petSpecies },
    category,
    locale,
    transcript: messages.map((message) => ({
      body: message.body,
      sourceLocale: message.source_locale,
      createdAt: message.created_at
    })),
    clinic: {
      id: clinic.id,
      timezone: clinic.timezone,
      openState: context.openState
    },
    ruleSignals: {
      emergency,
      serviceIntent
    }
  };
  let output = fallback;
  let model = rulesFallbackModel;
  let latencyMs: number | null = null;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  let fallbackReason: string | null = context.config.aiEnabled
    ? null
    : "ai_disabled_for_clinic";

  if (context.config.aiEnabled) {
    const requestedModel =
      process.env.PETCURA_AI_INTAKE_MODEL?.trim() || defaultIntakeModel;
    const generated = await generateJsonWithGateway({
      model: requestedModel,
      system: buildSystemPrompt(),
      prompt: JSON.stringify(promptInput, null, 2),
      schema: intakeQuestionOutputSchema,
      timeoutMs: 8_000,
      maxOutputTokens: 900
    });

    if (generated.ok) {
      output = mergeRuleSafety(generated.output, fallback, emergency, serviceIntent);
      model = generated.model;
      latencyMs = generated.latencyMs;
      tokensIn = generated.tokensIn;
      tokensOut = generated.tokensOut;
    } else {
      fallbackReason = generated.reason;
    }
  }

  const { data: aiOutput, error: aiError } = await admin
    .from("ai_outputs")
    .insert({
      clinic_id: clinic.id,
      request_id: request.id,
      kind: "intake_question",
      model,
      prompt_version: intakePromptVersion,
      input_json: promptInput as Json,
      output_json: output as unknown as Json,
      confidence: output.confidence,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latencyMs,
      accepted: null
    })
    .select("id")
    .single();

  if (aiError) {
    throw new WebIntakeError(500, "ai_output_write_failed", aiError.message);
  }

  const { error: requestUpdateError } = await admin
    .from("requests")
    .update({
      urgency_suggestion: output.urgencySuggestion ?? null,
      risk_flags_json: output.riskFlags as unknown as Json,
      routing_suggestion: output.routingSuggestion,
      service_intent: output.serviceIntent,
      intake_ai_output_id: aiOutput.id,
      web_intake_session_id: sessionId
    })
    .eq("clinic_id", clinic.id)
    .eq("id", request.id);

  if (requestUpdateError) {
    throw new WebIntakeError(
      500,
      "request_ai_update_failed",
      requestUpdateError.message
    );
  }

  await insertRequestEvents(admin, [
    {
      request_id: request.id,
      clinic_id: clinic.id,
      actor_type: "ai",
      actor_id: null,
      event_type: "ai_intake_suggestion_created",
      payload_json: {
        ai_output_id: aiOutput.id,
        session_id: sessionId,
        source_message_id: sourceMessageId,
        routing_suggestion: output.routingSuggestion,
        service_intent: output.serviceIntent,
        category_suggestion: output.categorySuggestion,
        urgency_suggestion: output.urgencySuggestion,
        emergency_signal: output.emergencySignal,
        fallback_reason: fallbackReason
      }
    }
  ]);

  return {
    output,
    aiOutputId: aiOutput.id,
    model,
    promptVersion: intakePromptVersion,
    fallbackReason
  };
}

async function loadWebIntakeContext({
  admin,
  clinic,
  locale,
  origin,
  ipHash,
  enforceEnabled = true
}: {
  admin: AdminClient;
  clinic: IntakeClinic;
  locale: SupportedLocale;
  origin?: string | null;
  ipHash?: string | null;
  enforceEnabled?: boolean;
}) {
  const [configResult, hoursResult, holidaysResult, policyResult] =
    await Promise.all([
      admin
        .from("clinic_web_intake_configs")
        .select("enabled, ai_enabled, allowed_origins, rate_limit_per_hour")
        .eq("clinic_id", clinic.id)
        .maybeSingle(),
      admin
        .from("clinic_hours")
        .select("weekday, opens_at, closes_at, is_closed")
        .eq("clinic_id", clinic.id),
      admin
        .from("clinic_holidays")
        .select("holiday_date, is_closed, opens_at, closes_at")
        .eq("clinic_id", clinic.id),
      admin
        .from("clinic_emergency_policies")
        .select(
          "emergency_phone, after_hours_phone, emergency_url, instructions_i18n, after_hours_instructions_i18n"
        )
        .eq("clinic_id", clinic.id)
        .maybeSingle()
    ]);

  if (configResult.error) {
    throw new WebIntakeError(500, "config_load_failed", configResult.error.message);
  }
  if (hoursResult.error) {
    throw new WebIntakeError(500, "hours_load_failed", hoursResult.error.message);
  }
  if (holidaysResult.error) {
    throw new WebIntakeError(500, "holidays_load_failed", holidaysResult.error.message);
  }
  if (policyResult.error) {
    throw new WebIntakeError(500, "policy_load_failed", policyResult.error.message);
  }

  const config: WebIntakeConfig = {
    enabled: configResult.data?.enabled ?? true,
    aiEnabled: configResult.data?.ai_enabled ?? true,
    allowedOrigins: configResult.data?.allowed_origins ?? [],
    rateLimitPerHour: configResult.data?.rate_limit_per_hour ?? 20
  };

  if (enforceEnabled && !config.enabled) {
    throw new WebIntakeError(403, "web_intake_disabled", "Web intake is disabled.");
  }
  if (enforceEnabled && !isAllowedOrigin(origin, config.allowedOrigins)) {
    throw new WebIntakeError(403, "origin_not_allowed", "Origin is not allowed.");
  }
  if (enforceEnabled && ipHash) {
    await enforceRateLimit(admin, clinic.id, ipHash, config.rateLimitPerHour);
  }

  const openState = computeClinicOpenState({
    timezone: clinic.timezone,
    hours: (hoursResult.data ?? []) as ClinicHoursRow[],
    holidays: (holidaysResult.data ?? []) as ClinicHolidayRow[]
  });

  return {
    config,
    openState,
    policyText: policyResult.data
      ? {
          emergencyPhone: policyResult.data.emergency_phone,
          afterHoursPhone: policyResult.data.after_hours_phone,
          emergencyUrl: policyResult.data.emergency_url,
          instructions: localizedJsonText(policyResult.data.instructions_i18n, locale),
          afterHoursInstructions: localizedJsonText(
            policyResult.data.after_hours_instructions_i18n,
            locale
          )
        }
      : (null as EmergencyPolicyText | null)
  };
}

async function enforceRateLimit(
  admin: AdminClient,
  clinicId: string,
  ipHash: string,
  limit: number
) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("web_intake_sessions")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    throw new WebIntakeError(500, "rate_limit_check_failed", error.message);
  }
  if ((count ?? 0) >= limit) {
    throw new WebIntakeError(429, "rate_limited", "Too many intake sessions.");
  }
}

async function loadClinicById(admin: AdminClient, clinicId: string) {
  const { data, error } = await admin
    .from("clinics")
    .select("id, name, slug, timezone, locale")
    .eq("id", clinicId)
    .single();

  if (error) {
    throw new WebIntakeError(500, "clinic_load_failed", error.message);
  }

  return data;
}

async function loadRequestForIntake(
  admin: AdminClient,
  clinicId: string,
  requestId: string
): Promise<RequestRow | null> {
  const { data, error } = await admin
    .from("requests")
    .select(
      "id, clinic_id, owner_id, pet_id, category, status, channel, owners(id, name, phone, preferred_language), pets(id, name, species)"
    )
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new WebIntakeError(500, "request_load_failed", error.message);
  }

  return data as unknown as RequestRow | null;
}

async function loadSessionByToken(admin: AdminClient, token: string) {
  const { data, error } = await admin
    .from("web_intake_sessions")
    .select("id, clinic_id, owner_id, request_id, status, locale")
    .eq("public_token_hash", hashSecret(token))
    .maybeSingle();

  if (error) {
    throw new WebIntakeError(500, "session_load_failed", error.message);
  }

  return data as SessionRow | null;
}

async function loadRequestMessages(
  admin: AdminClient,
  clinicId: string,
  requestId: string
): Promise<MessageRow[]> {
  const { data, error } = await admin
    .from("messages")
    .select("id, body, source_locale, created_at")
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .limit(20);

  if (error) {
    throw new WebIntakeError(500, "messages_load_failed", error.message);
  }

  return (data ?? []) as MessageRow[];
}

async function insertFollowUpOwnerMessage({
  admin,
  request,
  ownerId,
  body,
  locale,
  externalMessageId
}: {
  admin: AdminClient;
  request: RequestRow;
  ownerId: string;
  body: string;
  locale: SupportedLocale;
  externalMessageId?: string | undefined;
}) {
  if (externalMessageId) {
    const existing = await findExistingMessage(admin, request.clinic_id, externalMessageId);
    if (existing) {
      return { messageId: existing.id, deduped: true };
    }
  }

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: request.id,
      clinic_id: request.clinic_id,
      sender_type: "owner",
      sender_id: ownerId,
      body,
      source_locale: locale,
      external_id: externalMessageId ?? null
    })
    .select("id")
    .single();

  if (messageError) {
    if (messageError.code === "23505" && externalMessageId) {
      const existing = await findExistingMessage(
        admin,
        request.clinic_id,
        externalMessageId
      );
      if (existing) {
        return { messageId: existing.id, deduped: true };
      }
    }
    throw new WebIntakeError(500, "message_insert_failed", messageError.message);
  }

  const nextStatus: RequestStatus =
    request.status === "waiting_owner" ? "waiting_staff" : request.status;
  const { error: updateError } = await admin
    .from("requests")
    .update({
      status: nextStatus,
      resolved_at: null
    })
    .eq("clinic_id", request.clinic_id)
    .eq("id", request.id);

  if (updateError) {
    throw new WebIntakeError(500, "request_update_failed", updateError.message);
  }

  await insertRequestEvents(admin, [
    {
      request_id: request.id,
      clinic_id: request.clinic_id,
      actor_type: "owner",
      actor_id: ownerId,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        external_id: externalMessageId,
        source_locale: locale,
        source: "web_intake"
      }
    },
    ...(request.status !== nextStatus
      ? [
          {
            request_id: request.id,
            clinic_id: request.clinic_id,
            actor_type: "system" as const,
            actor_id: null,
            event_type: "status_changed",
            payload_json: {
              from: request.status,
              to: nextStatus,
              reason: "web_intake_owner_reply"
            }
          }
        ]
      : [])
  ]);

  const { error: auditError } = await admin.from("audit_logs").insert({
    clinic_id: request.clinic_id,
    actor_id: null,
    action: "owner_message_received",
    entity_type: "request",
    entity_id: request.id,
    payload_json: {
      channel: request.channel,
      owner_id: ownerId,
      message_id: message.id,
      external_id: externalMessageId,
      source: "web_intake"
    }
  });

  if (auditError) {
    throw new WebIntakeError(500, "audit_write_failed", auditError.message);
  }

  return { messageId: message.id, deduped: false };
}

async function findExistingMessage(
  admin: AdminClient,
  clinicId: string,
  externalMessageId: string
) {
  const { data, error } = await admin
    .from("messages")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("external_id", externalMessageId)
    .maybeSingle();

  if (error) {
    throw new WebIntakeError(500, "idempotency_lookup_failed", error.message);
  }

  return data;
}

async function insertRequestEvents(
  admin: AdminClient,
  events: RequestEventInsert[]
) {
  if (events.length === 0) return;
  const { error } = await admin.from("request_events").insert(events);
  if (error) {
    throw new WebIntakeError(500, "event_write_failed", error.message);
  }
}

function mergeRuleSafety(
  generated: IntakeQuestionOutput,
  fallback: IntakeQuestionOutput,
  emergency: EmergencyDetection,
  serviceIntent: IntakeServiceIntent
): IntakeQuestionOutput {
  const emergencySignal = emergency.triggered || generated.emergencySignal;
  const categorySuggestion = generated.categorySuggestion;
  const routingSuggestion: IntakeRoutingSuggestion = emergencySignal
    ? "on_call"
    : generated.routingSuggestion ||
      routingForIntent({
        emergency: emergencySignal,
        serviceIntent,
        category: categorySuggestion
      });

  return {
    ...generated,
    serviceIntent:
      generated.serviceIntent === "unknown" ? fallback.serviceIntent : generated.serviceIntent,
    routingSuggestion,
    urgencySuggestion: emergencySignal ? "high" : generated.urgencySuggestion,
    emergencySignal,
    riskFlags: Array.from(
      new Set([...fallback.riskFlags, ...generated.riskFlags].filter(Boolean))
    ),
    safetyNotes: Array.from(
      new Set([
        ...generated.safetyNotes,
        "advisory_only",
        "staff_review_required",
        "no_diagnosis_no_prescription"
      ])
    )
  };
}

function buildSystemPrompt() {
  return [
    "You are PetCura's AI-assisted veterinary clinic intake organizer.",
    "Return only valid JSON matching the requested schema.",
    "You may suggest category, service intent, routing target, conservative urgency suggestion, missing fields, safe clarification questions, risk flags, and a staff handoff summary.",
    "You must not diagnose, prescribe, set final urgency, promise availability, or send medical advice.",
    "Emergency language is advisory and conservative. If ruleSignals.emergency.triggered is true, keep emergencySignal true, urgencySuggestion high, and route on_call or vet.",
    "Grooming, delivery, walking, and boarding are route-only intents in v1. Do not propose marketplace, logistics, payments, sitters, or provider matching.",
    "Clarifying questions must be non-medical intake questions that help staff triage."
  ].join("\n");
}

function localizedJsonText(value: Json | null, locale: SupportedLocale) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, Json | undefined>;
  const localized = record[locale] ?? record.en;
  return typeof localized === "string" && localized.trim()
    ? localized.trim()
    : null;
}

function isAllowedOrigin(origin: string | null | undefined, allowed: string[]) {
  if (allowed.length === 0) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  const allowedSet = new Set(
    allowed
      .map((entry) => normalizeOrigin(entry))
      .filter((entry): entry is string => Boolean(entry))
  );
  return allowedSet.has(normalized);
}

function normalizeOrigin(origin: string | null | undefined) {
  if (!origin) return null;
  try {
    return new URL(origin).origin.toLowerCase();
  } catch {
    return null;
  }
}

function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hashOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? hashSecret(normalized.slice(0, 500)) : null;
}
