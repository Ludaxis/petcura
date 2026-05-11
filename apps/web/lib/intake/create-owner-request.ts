import "server-only";

import {
  normalizeLocale,
  type Database,
  type RequestCategory,
  type RequestChannel,
  type RequestStatus,
  type SupportedLocale
} from "@petcura/shared";
import {
  createAdminClient,
  getClinicBySlug,
  getIntakeClinic
} from "@/lib/supabase/admin";

type IntakeClinic = Awaited<ReturnType<typeof getClinicBySlug>>;
type AdminClient = ReturnType<typeof createAdminClient>;
type RequestEventInsert =
  Database["public"]["Tables"]["request_events"]["Insert"];

type AppendableRequest = {
  id: string;
  status: RequestStatus;
};

export type CreateOwnerRequestInput = {
  clinicSlug?: string | undefined;
  ownerName: string;
  phone: string;
  petName: string;
  petSpecies: string;
  category: RequestCategory;
  message: string;
  preferredLanguage: SupportedLocale;
  channel: RequestChannel;
  channelExternalId?: string | undefined;
  externalMessageId?: string | undefined;
  attachments?: CreateOwnerRequestAttachmentInput[] | undefined;
};

export type CreateOwnerRequestAttachmentInput = {
  storagePath: string;
  mimeType: string;
  sizeBytes?: number | undefined;
  providerUrl?: string | undefined;
};

export type CreateOwnerRequestResult =
  | {
      ok: true;
      caseId: string;
      messageId?: string;
      deduped?: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export function normalizePhone(phone: string) {
  const withoutChannelPrefix = phone.replace(/^whatsapp:/i, "").trim();
  const hasLeadingPlus = withoutChannelPrefix.startsWith("+");
  const digitsOnly = withoutChannelPrefix.replace(/\D/g, "");

  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

function fallbackPetName(petName: string) {
  const normalized = petName.trim();
  return normalized.length > 0 ? normalized : "Unknown pet";
}

function fallbackSpecies(species: string) {
  const normalized = species.trim();
  return normalized.length > 0 ? normalized : "unknown";
}

function fallbackMessage(message: string, channel: RequestChannel) {
  const normalized = message.trim();
  if (normalized.length > 0) {
    return normalized;
  }
  return channel === "whatsapp"
    ? "[WhatsApp message without text]"
    : "[Message without text]";
}

async function findExistingMessage(
  admin: AdminClient,
  clinicId: string,
  externalMessageId: string
) {
  const { data, error } = await admin
    .from("messages")
    .select("id, request_id")
    .eq("clinic_id", clinicId)
    .eq("external_id", externalMessageId)
    .maybeSingle();

  if (error) {
    return { error: error.message, message: null };
  }

  return { error: null, message: data };
}

async function findAppendableOwnerRequest({
  admin,
  clinicId,
  ownerId,
  channel
}: {
  admin: AdminClient;
  clinicId: string;
  ownerId: string;
  channel: RequestChannel;
}): Promise<{ request: AppendableRequest | null; error: string | null }> {
  if (channel !== "whatsapp") {
    return { request: null, error: null };
  }

  const { data, error } = await admin
    .from("requests")
    .select("id, status")
    .eq("clinic_id", clinicId)
    .eq("owner_id", ownerId)
    .eq("channel", channel)
    .neq("status", "resolved")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { request: null, error: error.message };
  }

  return {
    request: data as AppendableRequest | null,
    error: null
  };
}

async function insertAttachments({
  admin,
  requestId,
  clinicId,
  messageId,
  ownerId,
  attachments
}: {
  admin: AdminClient;
  requestId: string;
  clinicId: string;
  messageId: string;
  ownerId: string;
  attachments: CreateOwnerRequestAttachmentInput[];
}): Promise<{ attachmentIds: string[]; error: string | null }> {
  if (attachments.length === 0) {
    return { attachmentIds: [], error: null };
  }

  const { data, error } = await admin
    .from("attachments")
    .insert(
      attachments.map((attachment) => ({
        request_id: requestId,
        clinic_id: clinicId,
        message_id: messageId,
        storage_path: attachment.storagePath,
        mime_type: attachment.mimeType,
        size_bytes: attachment.sizeBytes ?? 0,
        uploaded_by: ownerId
      }))
    )
    .select("id");

  if (error) {
    return { attachmentIds: [], error: error.message };
  }

  return {
    attachmentIds: data.map((attachment) => attachment.id),
    error: null
  };
}

async function appendOwnerMessageToRequest({
  admin,
  clinicId,
  ownerId,
  request,
  input,
  messageBody,
  attachments
}: {
  admin: AdminClient;
  clinicId: string;
  ownerId: string;
  request: AppendableRequest;
  input: CreateOwnerRequestInput;
  messageBody: string;
  attachments: CreateOwnerRequestAttachmentInput[];
}): Promise<CreateOwnerRequestResult> {
  const sourceLocale = normalizeLocale(input.preferredLanguage);
  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: request.id,
      clinic_id: clinicId,
      sender_type: "owner",
      sender_id: ownerId,
      body: messageBody,
      source_locale: sourceLocale,
      external_id: input.externalMessageId ?? null
    })
    .select("id")
    .single();

  if (messageError) {
    if (messageError.code === "23505" && input.externalMessageId) {
      const existing = await findExistingMessage(
        admin,
        clinicId,
        input.externalMessageId
      );

      if (existing.error) {
        return { ok: false, message: existing.error };
      }

      if (existing.message) {
        return {
          ok: true,
          caseId: existing.message.request_id,
          messageId: existing.message.id,
          deduped: true
        };
      }
    }

    return { ok: false, message: messageError.message };
  }

  const insertedAttachments = await insertAttachments({
    admin,
    requestId: request.id,
    clinicId,
    messageId: message.id,
    ownerId,
    attachments
  });

  if (insertedAttachments.error) {
    return { ok: false, message: insertedAttachments.error };
  }

  const nextStatus: RequestStatus =
    request.status === "waiting_owner" ? "waiting_staff" : request.status;
  const { error: updateError } = await admin
    .from("requests")
    .update({
      status: nextStatus,
      resolved_at: null
    })
    .eq("clinic_id", clinicId)
    .eq("id", request.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const events: RequestEventInsert[] = [
    {
      request_id: request.id,
      clinic_id: clinicId,
      actor_type: "owner",
      actor_id: ownerId,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        external_id: input.externalMessageId,
        source_locale: sourceLocale,
        attachment_ids: insertedAttachments.attachmentIds
      }
    }
  ];

  if (request.status !== nextStatus) {
    events.push({
      request_id: request.id,
      clinic_id: clinicId,
      actor_type: "system",
      actor_id: null,
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
    return { ok: false, message: eventError.message };
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    clinic_id: clinicId,
    actor_id: null,
    action: "owner_message_received",
    entity_type: "request",
    entity_id: request.id,
    payload_json: {
      channel: input.channel,
      owner_id: ownerId,
      message_id: message.id,
      external_id: input.externalMessageId,
      attachment_count: attachments.length
    }
  });

  if (auditError) {
    return { ok: false, message: auditError.message };
  }

  return {
    ok: true,
    caseId: request.id,
    messageId: message.id
  };
}

export async function getClinicForOwnerChannel(
  channel: RequestChannel,
  externalId?: string
) {
  const normalizedExternalId =
    channel === "whatsapp" || channel === "sms"
      ? normalizePhone(externalId ?? "")
      : externalId?.trim();

  if (!normalizedExternalId) {
    return getIntakeClinic();
  }

  const admin = createAdminClient();
  const { data: channelRow, error: channelError } = await admin
    .from("clinic_channels")
    .select("clinic_id")
    .eq("channel", channel)
    .eq("external_id", normalizedExternalId)
    .eq("is_active", true)
    .maybeSingle();

  if (channelError) {
    throw new Error(`Could not resolve clinic channel: ${channelError.message}`);
  }

  if (!channelRow) {
    return getIntakeClinic();
  }

  const { data: clinic, error: clinicError } = await admin
    .from("clinics")
    .select("id, name, slug, timezone, locale")
    .eq("id", channelRow.clinic_id)
    .single();

  if (clinicError) {
    throw new Error(`Clinic is not available: ${clinicError.message}`);
  }

  return clinic;
}

export async function createOwnerRequest(
  input: CreateOwnerRequestInput,
  clinicOverride?: IntakeClinic
): Promise<CreateOwnerRequestResult> {
  const admin = createAdminClient();
  const clinic = clinicOverride ?? (await getIntakeClinic(input.clinicSlug));
  const phone = normalizePhone(input.phone);
  const channelExternalId =
    input.channel === "whatsapp" || input.channel === "sms"
      ? normalizePhone(input.channelExternalId ?? phone)
      : input.channelExternalId?.trim() || phone;
  const messageBody = fallbackMessage(input.message, input.channel);

  if (input.externalMessageId) {
    const existing = await findExistingMessage(
      admin,
      clinic.id,
      input.externalMessageId
    );

    if (existing.error) {
      return { ok: false, message: existing.error };
    }

    if (existing.message) {
      return {
        ok: true,
        caseId: existing.message.request_id,
        messageId: existing.message.id,
        deduped: true
      };
    }
  }

  const { data: owner, error: ownerError } = await admin
    .from("owners")
    .upsert(
      {
        clinic_id: clinic.id,
        phone,
        name: input.ownerName,
        preferred_language: normalizeLocale(input.preferredLanguage),
        gdpr_consent_at: new Date().toISOString()
      },
      {
        onConflict: "clinic_id,phone"
      }
    )
    .select("id")
    .single();

  if (ownerError) {
    return { ok: false, message: ownerError.message };
  }

  const { error: channelError } = await admin
    .from("owner_channel_identities")
    .upsert(
      {
        clinic_id: clinic.id,
        owner_id: owner.id,
        channel: input.channel,
        external_id: channelExternalId,
        is_primary: true,
        consented_at: new Date().toISOString()
      },
      {
        onConflict: "clinic_id,channel,external_id"
      }
    );

  if (channelError) {
    return { ok: false, message: channelError.message };
  }

  const appendableRequest = await findAppendableOwnerRequest({
    admin,
    clinicId: clinic.id,
    ownerId: owner.id,
    channel: input.channel
  });

  if (appendableRequest.error) {
    return { ok: false, message: appendableRequest.error };
  }

  const attachments = input.attachments ?? [];

  if (appendableRequest.request) {
    return appendOwnerMessageToRequest({
      admin,
      clinicId: clinic.id,
      ownerId: owner.id,
      request: appendableRequest.request,
      input,
      messageBody,
      attachments
    });
  }

  const petName = fallbackPetName(input.petName);
  const { data: existingPet, error: existingPetError } = await admin
    .from("pets")
    .select("id")
    .eq("clinic_id", clinic.id)
    .eq("owner_id", owner.id)
    .eq("name", petName)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existingPetError) {
    return { ok: false, message: existingPetError.message };
  }

  let petId = existingPet?.id;

  if (!petId) {
    const { data: pet, error: petError } = await admin
      .from("pets")
      .insert({
        clinic_id: clinic.id,
        owner_id: owner.id,
        name: petName,
        species: fallbackSpecies(input.petSpecies)
      })
      .select("id")
      .single();

    if (petError) {
      return { ok: false, message: petError.message };
    }

    petId = pet.id;
  }

  const { data: request, error: requestError } = await admin
    .from("requests")
    .insert({
      clinic_id: clinic.id,
      owner_id: owner.id,
      pet_id: petId,
      category: input.category,
      status: "new",
      urgency: "low",
      channel: input.channel
    })
    .select("id")
    .single();

  if (requestError) {
    return { ok: false, message: requestError.message };
  }

  const sourceLocale = normalizeLocale(input.preferredLanguage);
  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: request.id,
      clinic_id: clinic.id,
      sender_type: "owner",
      sender_id: owner.id,
      body: messageBody,
      source_locale: sourceLocale,
      external_id: input.externalMessageId ?? null
    })
    .select("id")
    .single();

  if (messageError) {
    return { ok: false, message: messageError.message };
  }

  const insertedAttachments = await insertAttachments({
    admin,
    requestId: request.id,
    clinicId: clinic.id,
    messageId: message.id,
    ownerId: owner.id,
    attachments
  });

  if (insertedAttachments.error) {
    return { ok: false, message: insertedAttachments.error };
  }

  const { error: eventError } = await admin.from("request_events").insert([
    {
      request_id: request.id,
      clinic_id: clinic.id,
      actor_type: "owner",
      actor_id: owner.id,
      event_type: "created",
      payload_json: {
        category: input.category,
        channel: input.channel,
        preferred_language: sourceLocale,
        attachment_count: attachments.length
      }
    },
    {
      request_id: request.id,
      clinic_id: clinic.id,
      actor_type: "owner",
      actor_id: owner.id,
      event_type: "message_received",
      payload_json: {
        message_id: message.id,
        external_id: input.externalMessageId,
        source_locale: sourceLocale,
        attachment_ids: insertedAttachments.attachmentIds
      }
    }
  ]);

  if (eventError) {
    return { ok: false, message: eventError.message };
  }

  const { error: auditError } = await admin.from("audit_logs").insert({
    clinic_id: clinic.id,
    actor_id: null,
    action: "owner_request_created",
    entity_type: "request",
    entity_id: request.id,
    payload_json: {
      channel: input.channel,
      owner_id: owner.id,
      pet_id: petId,
      message_id: message.id,
      external_id: input.externalMessageId,
      attachment_count: attachments.length
    }
  });

  if (auditError) {
    return { ok: false, message: auditError.message };
  }

  return {
    ok: true,
    caseId: request.id,
    messageId: message.id
  };
}
