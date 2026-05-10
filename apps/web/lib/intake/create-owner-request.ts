import "server-only";

import {
  normalizeLocale,
  type RequestCategory,
  type RequestChannel,
  type SupportedLocale
} from "@petcura/shared";
import {
  createAdminClient,
  getClinicBySlug,
  getIntakeClinic
} from "@/lib/supabase/admin";

type IntakeClinic = Awaited<ReturnType<typeof getClinicBySlug>>;

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
  return phone.replace(/[^\d+]/g, "");
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

export async function getClinicForOwnerChannel(
  channel: RequestChannel,
  externalId?: string
) {
  const normalizedExternalId = externalId?.trim();

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
  const channelExternalId = input.channelExternalId?.trim() || phone;
  const messageBody = fallbackMessage(input.message, input.channel);

  if (input.externalMessageId) {
    const { data: existingMessage, error: existingMessageError } = await admin
      .from("messages")
      .select("id, request_id")
      .eq("clinic_id", clinic.id)
      .eq("external_id", input.externalMessageId)
      .maybeSingle();

    if (existingMessageError) {
      return { ok: false, message: existingMessageError.message };
    }

    if (existingMessage) {
      return {
        ok: true,
        caseId: existingMessage.request_id,
        messageId: existingMessage.id,
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

  const { data: message, error: messageError } = await admin
    .from("messages")
    .insert({
      request_id: request.id,
      clinic_id: clinic.id,
      sender_type: "owner",
      sender_id: owner.id,
      body: messageBody,
      source_locale: normalizeLocale(input.preferredLanguage),
      external_id: input.externalMessageId ?? null
    })
    .select("id")
    .single();

  if (messageError) {
    return { ok: false, message: messageError.message };
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
        preferred_language: normalizeLocale(input.preferredLanguage)
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
        source_locale: normalizeLocale(input.preferredLanguage)
      }
    }
  ]);

  if (eventError) {
    return { ok: false, message: eventError.message };
  }

  return {
    ok: true,
    caseId: request.id,
    messageId: message.id
  };
}
