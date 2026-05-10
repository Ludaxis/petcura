"use server";

import { intakeRequestSchema } from "@petcura/validation";
import { createAdminClient, getDefaultClinic } from "@/lib/supabase/admin";

export type IntakeFormState = {
  ok: boolean;
  caseId?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const initialState: IntakeFormState = {
  ok: false
};

export { initialState as initialIntakeFormState };

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export async function submitOwnerIntake(
  _previousState: IntakeFormState,
  formData: FormData
): Promise<IntakeFormState> {
  const parsed = intakeRequestSchema.safeParse({
    ownerName: formData.get("ownerName"),
    phone: formData.get("phone"),
    petName: formData.get("petName"),
    petSpecies: formData.get("petSpecies"),
    category: formData.get("category"),
    message: formData.get("message"),
    preferredLanguage: formData.get("preferredLanguage")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const admin = createAdminClient();
  const clinic = await getDefaultClinic();
  const input = {
    ...parsed.data,
    phone: normalizePhone(parsed.data.phone)
  };

  const { data: owner, error: ownerError } = await admin
    .from("owners")
    .upsert(
      {
        clinic_id: clinic.id,
        phone: input.phone,
        name: input.ownerName,
        preferred_language: input.preferredLanguage,
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

  const { error: channelError } = await admin.from("owner_channel_identities").upsert(
    {
      clinic_id: clinic.id,
      owner_id: owner.id,
      channel: "web",
      external_id: input.phone,
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

  const { data: existingPet, error: existingPetError } = await admin
    .from("pets")
    .select("id")
    .eq("clinic_id", clinic.id)
    .eq("owner_id", owner.id)
    .eq("name", input.petName)
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
        name: input.petName,
        species: input.petSpecies
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
      channel: "web"
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
      body: input.message,
      source_locale: input.preferredLanguage
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
        channel: "web",
        preferred_language: input.preferredLanguage
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
        source_locale: input.preferredLanguage
      }
    }
  ]);

  if (eventError) {
    return { ok: false, message: eventError.message };
  }

  return {
    ok: true,
    caseId: request.id
  };
}
