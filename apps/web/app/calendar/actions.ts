"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeLocale,
  type Database,
  type SupportedLocale
} from "@petcura/shared";
import {
  appointmentCancellationSchema,
  availabilityRuleInputSchema,
  slotOfferCreationSchema,
  timeOffInputSchema
} from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  hasStaffPermission,
  requireStaffPermission
} from "@/lib/auth/permissions";
import {
  expireStaleAppointmentHolds,
  findAppointmentSlots,
  holdExpiresAt,
  type AppointmentSlot
} from "@/lib/appointments/calendar";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueOutboundMessage } from "@/lib/twilio/outbox";

type DynamicQuery = {
  select: (columns?: string) => DynamicQuery;
  insert: (values: unknown) => DynamicQuery;
  update: (values: unknown) => DynamicQuery;
  delete: () => DynamicQuery;
  eq: (column: string, value: unknown) => DynamicQuery;
  in: (column: string, values: unknown[]) => DynamicQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicQuery;
  single: () => DynamicQuery;
  maybeSingle: () => DynamicQuery;
  then: PromiseLike<{ data: unknown; error: { message: string } | null }>["then"];
};

type DynamicDb = {
  from: (table: string) => DynamicQuery;
};

type RequestRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  "id" | "owner_id" | "channel" | "status"
> & {
  owners?: { phone: string | null } | null;
};

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  | "id"
  | "clinic_id"
  | "request_id"
  | "owner_id"
  | "pet_id"
  | "service_id"
  | "status"
>;

function db(): DynamicDb {
  return createAdminClient() as unknown as DynamicDb;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getAllStrings(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function calendarRedirect(
  locale: SupportedLocale,
  params: Record<string, string> = {}
): never {
  const searchParams = new URLSearchParams({ lang: locale, ...params });
  redirect(`/calendar?${searchParams.toString()}`);
}

function settingsRedirect(
  locale: SupportedLocale,
  params: Record<string, string> = {}
): never {
  const searchParams = new URLSearchParams({
    lang: locale,
    tab: "availability",
    ...params
  });
  redirect(`/settings?${searchParams.toString()}`);
}

function requestRedirect(
  requestId: string,
  locale: SupportedLocale,
  params: Record<string, string> = {}
): never {
  const searchParams = new URLSearchParams({ lang: locale, ...params });
  redirect(`/requests/${requestId}?${searchParams.toString()}`);
}

async function loadRequest(clinicId: string, requestId: string) {
  const { data, error } = await createAdminClient()
    .from("requests")
    .select("id, owner_id, channel, status, owners(phone)")
    .eq("clinic_id", clinicId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) throw new Error(`Could not load request: ${error.message}`);
  return data as RequestRow | null;
}

async function loadAppointment(clinicId: string, appointmentId: string) {
  const { data, error } = await createAdminClient()
    .from("appointments")
    .select("id, clinic_id, request_id, owner_id, pet_id, service_id, status")
    .eq("clinic_id", clinicId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(`Could not load appointment: ${error.message}`);
  return data as AppointmentRow | null;
}

async function recordAppointmentEvent(input: {
  clinicId: string;
  appointmentId: string;
  requestId: string | null;
  actorType: "staff" | "owner" | "system" | "ai";
  actorId: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
}) {
  await db().from("appointment_events").insert({
    clinic_id: input.clinicId,
    appointment_id: input.appointmentId,
    request_id: input.requestId,
    actor_type: input.actorType,
    actor_id: input.actorId,
    event_type: input.eventType,
    payload_json: input.payload ?? {}
  });
}

export async function saveAvailabilityRule(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const ctx = await requireStaffContext(locale, "/settings?tab=availability");
  if (!hasStaffPermission(ctx, "availability:manage")) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  const parsed = availabilityRuleInputSchema.safeParse({
    staffId: getString(formData, "staffId"),
    weekday: getString(formData, "weekday"),
    startTime: getString(formData, "startTime"),
    endTime: getString(formData, "endTime"),
    serviceIds: getAllStrings(formData, "serviceIds"),
    isActive: getString(formData, "isActive") || "true"
  });

  if (!parsed.success) {
    settingsRedirect(locale, { settings_error: "invalid_availability" });
  }

  const admin = db();
  const { error } = await admin.from("staff_availability_rules").insert({
    clinic_id: ctx.clinic.id,
    staff_id: parsed.data.staffId,
    weekday: parsed.data.weekday,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    service_ids: parsed.data.serviceIds,
    is_active: parsed.data.isActive
  });

  if (error) settingsRedirect(locale, { settings_error: "availability_failed" });

  revalidatePath("/settings");
  revalidatePath("/calendar");
  settingsRedirect(locale, { settings_status: "availability_saved" });
}

export async function deleteAvailabilityRule(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const ctx = await requireStaffContext(locale, "/settings?tab=availability");
  if (!hasStaffPermission(ctx, "availability:manage")) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }
  const ruleId = getString(formData, "ruleId");
  const { error } = await db()
    .from("staff_availability_rules")
    .delete()
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", ruleId);

  if (error) settingsRedirect(locale, { settings_error: "availability_failed" });

  revalidatePath("/settings");
  revalidatePath("/calendar");
  settingsRedirect(locale, { settings_status: "availability_saved" });
}

export async function addTimeOff(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const ctx = await requireStaffContext(locale, "/settings?tab=availability");
  if (!hasStaffPermission(ctx, "availability:manage")) {
    settingsRedirect(locale, { settings_error: "forbidden" });
  }

  const startsAtInput = getString(formData, "startsAt");
  const endsAtInput = getString(formData, "endsAt");
  const startsAt = new Date(startsAtInput);
  const endsAt = new Date(endsAtInput);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    settingsRedirect(locale, { settings_error: "invalid_availability" });
  }

  const parsed = timeOffInputSchema.safeParse({
    staffId: getString(formData, "staffId"),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    reason: getString(formData, "reason")
  });

  if (!parsed.success) {
    settingsRedirect(locale, { settings_error: "invalid_availability" });
  }

  const { error } = await db().from("staff_time_off").insert({
    clinic_id: ctx.clinic.id,
    staff_id: parsed.data.staffId,
    starts_at: parsed.data.startsAt,
    ends_at: parsed.data.endsAt,
    reason: parsed.data.reason ?? null
  });

  if (error) settingsRedirect(locale, { settings_error: "availability_failed" });

  revalidatePath("/settings");
  revalidatePath("/calendar");
  settingsRedirect(locale, { settings_status: "availability_saved" });
}

export async function offerAppointmentSlots(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const requestId = getString(formData, "requestId");
  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  requireStaffPermission(ctx, "appointments:manage");

  await expireStaleAppointmentHolds(ctx.clinic.id);
  let slots: AppointmentSlot[] = [];
  try {
    slots = JSON.parse(getString(formData, "slotsJson") || "[]") as AppointmentSlot[];
  } catch {
    requestRedirect(requestId, locale, { action_error: "appointment" });
  }
  const parsed = slotOfferCreationSchema.safeParse({
    requestId,
    appointmentId: getString(formData, "appointmentId"),
    slots,
    messageBody: getString(formData, "messageBody")
  });

  if (!parsed.success) {
    requestRedirect(requestId, locale, { action_error: "appointment" });
  }

  const [appointment, request] = await Promise.all([
    loadAppointment(ctx.clinic.id, parsed.data.appointmentId),
    loadRequest(ctx.clinic.id, requestId)
  ]);
  if (!appointment || !request) {
    requestRedirect(requestId, locale, { action_error: "not_found" });
  }

  const expiresAt = holdExpiresAt();
  const admin = createAdminClient();
  const { data: offer, error: offerError } = await db()
    .from("appointment_slot_offers")
    .insert({
      clinic_id: ctx.clinic.id,
      appointment_id: appointment.id,
      request_id: requestId,
      offered_by_staff_id: ctx.membership.id,
      status: "sent",
      slots_json: parsed.data.slots,
      expires_at: expiresAt
    })
    .select("id")
    .single();

  if (offerError || !offer || typeof (offer as { id?: unknown }).id !== "string") {
    throw new Error(`Could not create slot offer: ${offerError?.message ?? "missing offer id"}`);
  }

  const offerId = (offer as { id: string }).id;
  const holdRows = parsed.data.slots.map((slot) => ({
    clinic_id: ctx.clinic.id,
    appointment_id: appointment.id,
    offer_id: offerId,
    staff_id: slot.staffId,
    starts_at: slot.startsAt,
    ends_at: slot.endsAt,
    status: "held",
    expires_at: expiresAt
  }));
  const { error: holdError } = await db().from("appointment_holds").insert(holdRows);
  if (holdError) throw new Error(`Could not hold appointment slots: ${holdError.message}`);

  let messageId: string | null = null;
  const body = parsed.data.messageBody?.trim();
  if (body) {
    const { data: message, error: messageError } = await admin
      .from("messages")
      .insert({
        clinic_id: ctx.clinic.id,
        request_id: requestId,
        sender_type: "staff",
        sender_id: ctx.user.id,
        body,
        source_locale: locale,
        external_id: null
      })
      .select("id")
      .single();

    if (messageError) throw new Error(`Could not save offer message: ${messageError.message}`);
    messageId = message.id;

    await db()
      .from("appointment_slot_offers")
      .update({ message_id: messageId })
      .eq("clinic_id", ctx.clinic.id)
      .eq("id", offerId);

    await admin
      .from("requests")
      .update({ status: "waiting_owner", resolved_at: null })
      .eq("clinic_id", ctx.clinic.id)
      .eq("id", requestId);

    const ownerPhone = request.owners?.phone ?? null;
    if (request.channel === "whatsapp" && ownerPhone) {
      await enqueueOutboundMessage({
        supabase: admin,
        clinicId: ctx.clinic.id,
        requestId,
        messageId,
        ownerId: request.owner_id,
        createdBy: ctx.user.id,
        source: "appointment_offer",
        channel: "whatsapp",
        toPhone: ownerPhone,
        body,
        idempotencyKey: `appointment-offer:${offerId}:${messageId}`
      });
    }
  }

  await Promise.all([
    recordAppointmentEvent({
      clinicId: ctx.clinic.id,
      appointmentId: appointment.id,
      requestId,
      actorType: "staff",
      actorId: ctx.user.id,
      eventType: "slots_offered",
      payload: { offer_id: offerId, slots: parsed.data.slots }
    }),
    admin.from("request_events").insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "appointment_slots_offered",
      payload_json: { offer_id: offerId, message_id: messageId }
    })
  ]);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/calendar");
  requestRedirect(requestId, locale, { action_status: "appointment_offered" });
}

export async function confirmAppointmentFirstSlot(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const requestId = getString(formData, "requestId");
  const appointmentId = getString(formData, "appointmentId");
  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  requireStaffPermission(ctx, "appointments:manage");

  const slot = (
    await findAppointmentSlots({
      clinicId: ctx.clinic.id,
      appointmentId,
      locale,
      timeZone: ctx.clinic.timezone,
      limit: 1
    })
  )[0];

  if (!slot) {
    requestRedirect(requestId, locale, { action_error: "appointment" });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({
      scheduled_at: slot.startsAt,
      duration_minutes: slot.durationMinutes,
      staff_id: slot.staffId,
      status: "confirmed"
    })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", appointmentId);

  if (error) throw new Error(`Could not confirm appointment: ${error.message}`);

  await Promise.all([
    recordAppointmentEvent({
      clinicId: ctx.clinic.id,
      appointmentId,
      requestId,
      actorType: "staff",
      actorId: ctx.user.id,
      eventType: "confirmed",
      payload: { slot }
    }),
    admin.from("request_events").insert({
      clinic_id: ctx.clinic.id,
      request_id: requestId,
      actor_type: "staff",
      actor_id: ctx.user.id,
      event_type: "appointment_confirmed",
      payload_json: { appointment_id: appointmentId, slot }
    })
  ]);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/calendar");
  requestRedirect(requestId, locale, { action_status: "appointment_confirmed" });
}

export async function cancelAppointment(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const requestId = getString(formData, "requestId");
  const ctx = await requireStaffContext(locale, `/requests/${requestId}`);
  requireStaffPermission(ctx, "appointments:manage");
  const parsed = appointmentCancellationSchema.safeParse({
    appointmentId: getString(formData, "appointmentId"),
    reason: getString(formData, "reason")
  });

  if (!parsed.success) {
    requestRedirect(requestId, locale, { action_error: "appointment" });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_reason: parsed.data.reason ?? null
    })
    .eq("clinic_id", ctx.clinic.id)
    .eq("id", parsed.data.appointmentId);

  if (error) throw new Error(`Could not cancel appointment: ${error.message}`);

  await recordAppointmentEvent({
    clinicId: ctx.clinic.id,
    appointmentId: parsed.data.appointmentId,
    requestId,
    actorType: "staff",
    actorId: ctx.user.id,
    eventType: "cancelled",
    payload: { reason: parsed.data.reason ?? null }
  });

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/calendar");
  requestRedirect(requestId, locale, { action_status: "appointment_cancelled" });
}
