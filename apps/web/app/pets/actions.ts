"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  hasClinicPermission,
  normalizeLocale,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import { petProfileSchema } from "@petcura/validation";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  hasUsableProfileImage,
  uploadProfileImage
} from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

function petsRedirect(
  locale: SupportedLocale,
  params: Record<string, string>
): never {
  const searchParams = new URLSearchParams({
    lang: locale,
    ...params
  });

  redirect(`/pets?${searchParams.toString()}`);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPhoto(formData: FormData) {
  const value = formData.get("photo");
  return value instanceof File && hasUsableProfileImage(value) ? value : null;
}

function nullable(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

export async function updatePetProfile(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const staffContext = await requireStaffContext(locale, "/pets");
  const actorRole = staffContext.membership.role as StaffRole;

  if (!hasClinicPermission(actorRole, "pets:manage")) {
    petsRedirect(locale, { pets_error: "forbidden" });
  }

  const parsed = petProfileSchema.safeParse({
    petId: getString(formData, "petId"),
    name: getString(formData, "name"),
    species: getString(formData, "species"),
    breed: getString(formData, "breed"),
    sex: getString(formData, "sex"),
    birthDate: getString(formData, "birthDate"),
    weightKg: getString(formData, "weightKg"),
    allergies: getString(formData, "allergies"),
    medicalNotes: getString(formData, "medicalNotes")
  });

  if (!parsed.success) {
    petsRedirect(locale, { pets_error: "invalid_profile" });
  }

  const admin = createAdminClient();
  const { data: pet, error: petError } = await admin
    .from("pets")
    .select("id, clinic_id, owner_id")
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", parsed.data.petId)
    .maybeSingle();

  if (petError || !pet) {
    petsRedirect(locale, { pets_error: "not_found" });
  }

  const photo = getPhoto(formData);
  let photoUrl: string | undefined;

  if (photo) {
    try {
      photoUrl = await uploadProfileImage({
        clinicId: staffContext.clinic.id,
        entity: "pets",
        entityId: pet.id,
        file: photo
      });
    } catch {
      petsRedirect(locale, { pets_error: "photo_upload_failed" });
    }
  }

  const weightKg =
    parsed.data.weightKg === "" || parsed.data.weightKg === undefined
      ? null
      : parsed.data.weightKg;

  const { error } = await admin
    .from("pets")
    .update({
      name: parsed.data.name,
      species: parsed.data.species,
      breed: nullable(parsed.data.breed),
      sex: nullable(parsed.data.sex),
      birth_date: nullable(parsed.data.birthDate),
      weight_kg: weightKg,
      allergies: nullable(parsed.data.allergies),
      medical_notes: nullable(parsed.data.medicalNotes),
      ...(photoUrl ? { photo_url: photoUrl } : {})
    })
    .eq("clinic_id", staffContext.clinic.id)
    .eq("id", pet.id);

  if (error) {
    petsRedirect(locale, { pets_error: "profile_update_failed" });
  }

  await admin.from("audit_logs").insert({
    clinic_id: staffContext.clinic.id,
    actor_id: staffContext.user.id,
    action: "pet_profile_updated",
    entity_type: "pets",
    entity_id: pet.id,
    payload_json: {
      source: "pet_center",
      owner_id: pet.owner_id,
      avatar_url: Boolean(photoUrl)
    }
  });

  revalidatePath("/pets");
  petsRedirect(locale, { pets_status: "saved" });
}
