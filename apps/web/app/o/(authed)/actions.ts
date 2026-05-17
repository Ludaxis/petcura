"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeLocale,
  type Database,
  type SupportedLocale
} from "@petcura/shared";
import {
  ownerSlotConfirmationSchema,
  requestCategorySchema
} from "@petcura/validation";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import { getOwnerRequest, listOwnerPets } from "@/lib/owner/data";
import { parseAppointmentSlots } from "@/lib/appointments/calendar";
import {
  hasUsableProfileImage,
  uploadProfileImage
} from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];
type PetWeightInsert =
  Database["public"]["Tables"]["pet_weight_entries"]["Insert"];

type DynamicQuery = {
  select: (columns?: string) => DynamicQuery;
  insert: (values: unknown) => DynamicQuery;
  update: (values: unknown) => DynamicQuery;
  eq: (column: string, value: unknown) => DynamicQuery;
  maybeSingle: () => DynamicQuery;
  then: PromiseLike<{ data: unknown; error: { message: string } | null }>["then"];
};

type DynamicDb = {
  from: (table: string) => DynamicQuery;
};

type OwnerAppointmentOfferRow = {
  id: string;
  appointment_id: string;
  request_id: string | null;
  status: "draft" | "sent" | "accepted" | "expired" | "cancelled";
  slots_json: unknown;
  expires_at: string;
};

type OwnerAppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "owner_id" | "request_id" | "status"
>;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPhoto(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && hasUsableProfileImage(value) ? value : null;
}

function nullable(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

function dynamicDb(admin: ReturnType<typeof createAdminClient>): DynamicDb {
  return admin as unknown as DynamicDb;
}

function ownerRedirect(
  locale: SupportedLocale,
  path: string,
  params: Record<string, string> = {}
): never {
  const searchParams = new URLSearchParams({ lang: locale, ...params });
  redirect(`${path}?${searchParams.toString()}`);
}

function requireUuid(value: string, label: string) {
  if (!uuidRegex.test(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
}

export async function submitOwnerMessage(requestId: string, text: string) {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, `/o/chat/${requestId}`);
  const body = text.trim();

  if (!uuidRegex.test(requestId) || body.length === 0 || body.length > 4000) {
    throw new Error("Invalid owner message.");
  }

  const request = await getOwnerRequest(context, requestId);
  if (!request) {
    throw new Error("Request is not available to this owner.");
  }

  const admin = createAdminClient();
  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: requestId,
      clinic_id: context.clinic.id,
      sender_type: "owner",
      sender_id: context.owner.id,
      body,
      source_locale: context.owner.preferred_language
    })
    .select("id")
    .single();

  if (messageError) {
    throw new Error(`Could not send owner message: ${messageError.message}`);
  }

  const nextStatus =
    request.status === "waiting_owner" || request.status === "resolved"
      ? "waiting_staff"
      : request.status;

  const { error: updateError } = await admin
    .from("requests")
    .update({
      status: nextStatus,
      resolved_at: null
    })
    .eq("clinic_id", context.clinic.id)
    .eq("id", requestId);

  if (updateError) {
    throw new Error(`Could not update request status: ${updateError.message}`);
  }

  const events: RequestEventInsert[] = [
    {
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "owner",
      actor_id: context.owner.id,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        source_locale: context.owner.preferred_language,
        channel: "web"
      }
    }
  ];

  if (nextStatus !== request.status) {
    events.push({
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "system",
      actor_id: context.owner.id,
      event_type: "status_changed",
      payload_json: {
        from: request.status,
        to: nextStatus,
        reason: "owner_reply"
      }
    });
  }

  const { error: eventError } = await admin.from("request_events").insert(events);
  if (eventError) {
    throw new Error(`Could not record owner message event: ${eventError.message}`);
  }

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_web_message_sent",
    entity_type: "request",
    entity_id: requestId,
    payload_json: {
      owner_id: context.owner.id,
      message_id: message.id
    }
  });

  revalidatePath(`/o/chat/${requestId}`);
  revalidatePath("/o/chat");
  revalidatePath("/o");
}

export async function requestOwnerAppointment(formData: FormData) {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/services");
  const petId = requireUuid(getString(formData, "petId"), "pet");
  const serviceId = requireUuid(getString(formData, "serviceId"), "service");
  const proposedAt = getString(formData, "proposedAt");
  const notes = getString(formData, "notes");
  const idempotencyKey = getString(formData, "idempotencyKey") || randomUUID();
  const startsAt = new Date(proposedAt);

  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Invalid appointment time.");
  }

  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const proposedWindow = `[${startsAt.toISOString()},${endsAt.toISOString()})`;
  const { data: appointmentId, error } = await context.supabase.rpc(
    "request_appointment",
    {
      p_pet_id: petId,
      p_service_id: serviceId,
      p_proposed_window: proposedWindow,
      p_notes: notes || null,
      p_idempotency_key: idempotencyKey
    }
  );

  if (error || !appointmentId) {
    throw new Error(error?.message ?? "Could not request appointment.");
  }

  const { data: appointment, error: appointmentError } = await context.supabase
    .from("appointments")
    .select("request_id")
    .eq("clinic_id", context.clinic.id)
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    throw new Error(
      `Could not load requested appointment: ${appointmentError.message}`
    );
  }

  revalidatePath("/o/services");
  revalidatePath("/o/chat");
  revalidatePath("/o");

  redirect(appointment?.request_id ? `/o/chat/${appointment.request_id}` : "/o");
}

export async function confirmOwnerAppointmentSlot(formData: FormData) {
  const locale = await getRequestLocale();
  const parsed = ownerSlotConfirmationSchema.safeParse({
    requestId: getString(formData, "requestId"),
    offerId: getString(formData, "offerId"),
    slotIndex: getString(formData, "slotIndex")
  });

  if (!parsed.success) {
    ownerRedirect(locale, "/o/chat", { chat_error: "invalid_appointment" });
  }

  const { requestId, offerId, slotIndex } = parsed.data;
  const context = await requireOwnerContext(locale, `/o/chat/${requestId}`);
  const request = await getOwnerRequest(context, requestId);
  if (!request || request.category !== "appointment") {
    ownerRedirect(locale, "/o/chat", { chat_error: "invalid_appointment" });
  }

  const admin = createAdminClient();
  const dynamic = dynamicDb(admin);
  const { data: offerRow, error: offerError } = await dynamic
    .from("appointment_slot_offers")
    .select("id, appointment_id, request_id, status, slots_json, expires_at")
    .eq("clinic_id", context.clinic.id)
    .eq("request_id", requestId)
    .eq("id", offerId)
    .maybeSingle();

  if (offerError) {
    throw new Error(`Could not load slot offer: ${offerError.message}`);
  }

  const offer = offerRow as OwnerAppointmentOfferRow | null;
  if (!offer || offer.status !== "sent" || new Date(offer.expires_at) <= new Date()) {
    ownerRedirect(locale, `/o/chat/${requestId}`, {
      chat_error: "appointment_offer_expired"
    });
  }

  const slots = parseAppointmentSlots(offer.slots_json);
  const slot = slots[slotIndex];
  if (!slot) {
    ownerRedirect(locale, `/o/chat/${requestId}`, {
      chat_error: "invalid_appointment"
    });
  }

  const { data: appointmentRow, error: appointmentError } = await admin
    .from("appointments")
    .select("id, owner_id, request_id, status")
    .eq("clinic_id", context.clinic.id)
    .eq("id", offer.appointment_id)
    .maybeSingle();

  if (appointmentError) {
    throw new Error(`Could not load appointment: ${appointmentError.message}`);
  }

  const appointment = appointmentRow as OwnerAppointmentRow | null;
  if (
    !appointment ||
    appointment.owner_id !== context.owner.id ||
    appointment.request_id !== requestId ||
    appointment.status === "cancelled" ||
    appointment.status === "completed" ||
    appointment.status === "no_show"
  ) {
    ownerRedirect(locale, `/o/chat/${requestId}`, {
      chat_error: "invalid_appointment"
    });
  }

  const nextAppointmentStatus =
    appointment.status === "confirmed" ? "rescheduled" : "confirmed";
  const { error: updateError } = await admin
    .from("appointments")
    .update({
      scheduled_at: slot.startsAt,
      duration_minutes: slot.durationMinutes,
      staff_id: slot.staffId,
      status: nextAppointmentStatus
    })
    .eq("clinic_id", context.clinic.id)
    .eq("id", appointment.id);

  if (updateError) {
    throw new Error(`Could not confirm appointment: ${updateError.message}`);
  }

  await dynamic
    .from("appointment_slot_offers")
    .update({
      status: "accepted",
      accepted_slot_index: slotIndex,
      accepted_at: new Date().toISOString()
    })
    .eq("clinic_id", context.clinic.id)
    .eq("id", offerId);

  await dynamic
    .from("appointment_holds")
    .update({ status: "cancelled" })
    .eq("clinic_id", context.clinic.id)
    .eq("offer_id", offerId);
  await dynamic
    .from("appointment_holds")
    .update({ status: "accepted" })
    .eq("clinic_id", context.clinic.id)
    .eq("offer_id", offerId)
    .eq("staff_id", slot.staffId)
    .eq("starts_at", slot.startsAt);

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: context.clinic.timezone
  });
  const confirmationBody = `Appointment confirmed for ${formatter.format(
    new Date(slot.startsAt)
  )}.`;
  const { data: message } = await admin
    .from("messages")
    .insert({
      request_id: requestId,
      clinic_id: context.clinic.id,
      sender_type: "system",
      sender_id: context.owner.id,
      body: confirmationBody,
      source_locale: locale
    })
    .select("id")
    .maybeSingle();

  await admin
    .from("requests")
    .update({ status: "waiting_staff", resolved_at: null })
    .eq("clinic_id", context.clinic.id)
    .eq("id", requestId);

  await dynamic.from("appointment_events").insert({
    clinic_id: context.clinic.id,
    appointment_id: appointment.id,
    request_id: requestId,
    actor_type: "owner",
    actor_id: context.owner.id,
    event_type: "slot_confirmed",
    payload_json: {
      offer_id: offerId,
      slot_index: slotIndex,
      slot
    }
  });

  await admin.from("request_events").insert([
    {
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "owner",
      actor_id: context.owner.id,
      event_type: "appointment_slot_confirmed",
      payload_json: {
        appointment_id: appointment.id,
        offer_id: offerId,
        slot_index: slotIndex,
        message_id: message?.id ?? null
      }
    },
    {
      request_id: requestId,
      clinic_id: context.clinic.id,
      actor_type: "system",
      actor_id: context.owner.id,
      event_type: "status_changed",
      payload_json: {
        from: request.status,
        to: "waiting_staff",
        reason: "owner_confirmed_appointment"
      }
    }
  ] satisfies RequestEventInsert[]);

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_appointment_slot_confirmed",
    entity_type: "appointments",
    entity_id: appointment.id,
    payload_json: {
      request_id: requestId,
      offer_id: offerId,
      slot_index: slotIndex
    }
  });

  revalidatePath(`/o/chat/${requestId}`);
  revalidatePath("/o/chat");
  revalidatePath("/o");
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/calendar");
  ownerRedirect(locale, `/o/chat/${requestId}`, {
    chat_status: "appointment_confirmed"
  });
}

export async function updateOwnerSelfProfile(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const context = await requireOwnerContext(locale, "/o/me");
  const name = getString(formData, "name");
  const email = getString(formData, "email");
  const preferredLanguage = normalizeLocale(
    getString(formData, "preferredLanguage") || locale
  );

  if (name.length === 0 || name.length > 140 || email.length > 320) {
    ownerRedirect(locale, "/o/me", { profile_error: "invalid_profile" });
  }

  const photo = getPhoto(formData);
  let photoUrl: string | undefined;

  if (photo) {
    try {
      photoUrl = await uploadProfileImage({
        clinicId: context.clinic.id,
        entity: "owners",
        entityId: context.owner.id,
        file: photo
      });
    } catch {
      ownerRedirect(locale, "/o/me", { profile_error: "photo_upload_failed" });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("owners")
    .update({
      name,
      email: nullable(email),
      preferred_language: preferredLanguage,
      ...(photoUrl ? { photo_url: photoUrl } : {})
    })
    .eq("clinic_id", context.clinic.id)
    .eq("id", context.owner.id);

  if (error) {
    ownerRedirect(locale, "/o/me", { profile_error: "profile_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_profile_self_updated",
    entity_type: "owners",
    entity_id: context.owner.id,
    payload_json: {
      source: "owner_app",
      preferred_language: preferredLanguage,
      avatar_url: Boolean(photoUrl)
    }
  });

  revalidatePath("/o/me");
  revalidatePath("/o");
  ownerRedirect(preferredLanguage, "/o/me", { profile_status: "saved" });
}

export async function updateOwnerPetSelfService(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const petId = requireUuid(getString(formData, "petId"), "pet");
  const context = await requireOwnerContext(locale, `/o/pets/${petId}`);
  const pets = await listOwnerPets(context);
  const pet = pets.find((item) => item.id === petId);

  if (!pet) {
    throw new Error("Pet is not available to this owner.");
  }

  const ownerNotes = getString(formData, "ownerNotes");
  const measuredAt = getString(formData, "measuredAt");
  const weightKg = getString(formData, "weightKg");
  const photo = getPhoto(formData);
  let photoUrl: string | undefined;

  if (ownerNotes.length > 1200) {
    ownerRedirect(locale, `/o/pets/${petId}`, { pet_error: "invalid_profile" });
  }

  const admin = createAdminClient();
  if (photo) {
    try {
      photoUrl = await uploadProfileImage({
        clinicId: context.clinic.id,
        entity: "pets",
        entityId: petId,
        file: photo
      });
    } catch {
      ownerRedirect(locale, `/o/pets/${petId}`, {
        pet_error: "photo_upload_failed"
      });
    }
  }

  const { error: petError } = await admin
    .from("pets")
    .update({
      owner_notes: nullable(ownerNotes),
      ...(photoUrl ? { photo_url: photoUrl } : {})
    })
    .eq("clinic_id", context.clinic.id)
    .eq("owner_id", context.owner.id)
    .eq("id", petId);

  if (petError) {
    ownerRedirect(locale, `/o/pets/${petId}`, {
      pet_error: "profile_update_failed"
    });
  }

  const parsedWeight = weightKg ? Number(weightKg) : null;
  if (parsedWeight !== null) {
    const measuredDate = measuredAt || new Date().toISOString().slice(0, 10);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(measuredDate);
    if (
      !Number.isFinite(parsedWeight) ||
      parsedWeight <= 0 ||
      parsedWeight >= 200 ||
      !validDate
    ) {
      ownerRedirect(locale, `/o/pets/${petId}`, {
        pet_error: "invalid_profile"
      });
    }

    const entry: PetWeightInsert = {
      clinic_id: context.clinic.id,
      pet_id: petId,
      weight_kg: parsedWeight,
      measured_at: measuredDate,
      source: "owner",
      created_by: context.user.id
    };
    const { error: weightError } = await admin
      .from("pet_weight_entries")
      .insert(entry);

    if (weightError) {
      ownerRedirect(locale, `/o/pets/${petId}`, {
        pet_error: "weight_update_failed"
      });
    }
  }

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_pet_self_updated",
    entity_type: "pets",
    entity_id: petId,
    payload_json: {
      source: "owner_app",
      owner_id: context.owner.id,
      avatar_url: Boolean(photoUrl),
      owner_notes: Boolean(nullable(ownerNotes)),
      weight_entry: parsedWeight !== null
    }
  });

  revalidatePath(`/o/pets/${petId}`);
  revalidatePath("/o");
  ownerRedirect(locale, `/o/pets/${petId}`, { pet_status: "saved" });
}

export async function startOwnerRequest(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const context = await requireOwnerContext(locale, "/o/chat/new");
  const body = getString(formData, "message");
  const petId = getString(formData, "petId");
  const category = requestCategorySchema.safeParse(
    getString(formData, "category") || "medical_question"
  );

  if (!category.success || body.length === 0 || body.length > 4000) {
    ownerRedirect(locale, "/o/chat/new", { chat_error: "invalid_message" });
  }

  const pets = await listOwnerPets(context);
  const resolvedPetId = petId
    ? pets.find((pet) => pet.id === petId)?.id ?? null
    : null;

  if (petId && !resolvedPetId) {
    ownerRedirect(locale, "/o/chat/new", { chat_error: "invalid_pet" });
  }

  const admin = createAdminClient();
  const { data: request, error: requestError } = await admin
    .from("requests")
    .insert({
      clinic_id: context.clinic.id,
      owner_id: context.owner.id,
      pet_id: resolvedPetId,
      category: category.data,
      status: "waiting_staff",
      urgency: "low",
      channel: "web",
      ai_summary: null
    })
    .select("id")
    .single();

  if (requestError) {
    throw new Error(`Could not create owner request: ${requestError.message}`);
  }

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: request.id,
      clinic_id: context.clinic.id,
      sender_type: "owner",
      sender_id: context.owner.id,
      body,
      source_locale: context.owner.preferred_language
    })
    .select("id")
    .single();

  if (messageError) {
    throw new Error(`Could not start owner chat: ${messageError.message}`);
  }

  const { error: eventError } = await admin.from("request_events").insert([
    {
      request_id: request.id,
      clinic_id: context.clinic.id,
      actor_type: "owner",
      actor_id: context.owner.id,
      event_type: "created",
      payload_json: {
        channel: "web",
        source: "owner_app",
        preferred_language: context.owner.preferred_language
      }
    },
    {
      request_id: request.id,
      clinic_id: context.clinic.id,
      actor_type: "owner",
      actor_id: context.owner.id,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        source_locale: context.owner.preferred_language,
        channel: "web"
      }
    }
  ] satisfies RequestEventInsert[]);

  if (eventError) {
    throw new Error(`Could not record owner request event: ${eventError.message}`);
  }

  await admin.from("audit_logs").insert({
    clinic_id: context.clinic.id,
    actor_id: context.user.id,
    action: "owner_web_request_created",
    entity_type: "request",
    entity_id: request.id,
    payload_json: {
      owner_id: context.owner.id,
      pet_id: resolvedPetId,
      message_id: message.id,
      source: "owner_app"
    }
  });

  revalidatePath("/o/chat");
  revalidatePath("/o");
  redirect(`/o/chat/${request.id}?lang=${locale}`);
}
