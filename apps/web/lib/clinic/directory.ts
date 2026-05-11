import "server-only";

import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredLanguage: string;
  notes: string | null;
  createdAt: string;
  petCount: number;
  requestCount: number;
  latestRequestAt: string | null;
};

export type PetListItem = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  weightKg: number | null;
  allergies: string | null;
  medicalNotes: string | null;
  createdAt: string;
  ownerName: string;
  ownerPhone: string;
  requestCount: number;
};

export async function listClinicCustomers(
  supabase: SupabaseClient,
  clinicId: string
): Promise<CustomerListItem[]> {
  const [ownersResult, petsResult, requestsResult] = await Promise.all([
    supabase
      .from("owners")
      .select("id, name, phone, email, preferred_language, notes, created_at")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("pets")
      .select("id, owner_id")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null),
    supabase
      .from("requests")
      .select("id, owner_id, updated_at")
      .eq("clinic_id", clinicId)
      .order("updated_at", { ascending: false })
  ]);

  if (ownersResult.error) {
    throw new Error(`Could not load customers: ${ownersResult.error.message}`);
  }
  if (petsResult.error) {
    throw new Error(`Could not load customer pets: ${petsResult.error.message}`);
  }
  if (requestsResult.error) {
    throw new Error(
      `Could not load customer requests: ${requestsResult.error.message}`
    );
  }

  const petCounts = new Map<string, number>();
  for (const pet of petsResult.data ?? []) {
    petCounts.set(pet.owner_id, (petCounts.get(pet.owner_id) ?? 0) + 1);
  }

  const requestCounts = new Map<string, number>();
  const latestRequestByOwner = new Map<string, string>();
  for (const request of requestsResult.data ?? []) {
    requestCounts.set(
      request.owner_id,
      (requestCounts.get(request.owner_id) ?? 0) + 1
    );
    if (!latestRequestByOwner.has(request.owner_id)) {
      latestRequestByOwner.set(request.owner_id, request.updated_at);
    }
  }

  return (ownersResult.data ?? []).map((owner) => ({
    id: owner.id,
    name: owner.name ?? owner.phone,
    phone: owner.phone,
    email: owner.email,
    preferredLanguage: owner.preferred_language,
    notes: owner.notes,
    createdAt: owner.created_at,
    petCount: petCounts.get(owner.id) ?? 0,
    requestCount: requestCounts.get(owner.id) ?? 0,
    latestRequestAt: latestRequestByOwner.get(owner.id) ?? null
  }));
}

export async function listClinicPets(
  supabase: SupabaseClient,
  clinicId: string
): Promise<PetListItem[]> {
  const [petsResult, requestsResult] = await Promise.all([
    supabase
      .from("pets")
      .select(
        "id, owner_id, name, species, breed, sex, weight_kg, allergies, medical_notes, created_at, owners(id, name, phone)"
      )
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id, pet_id")
      .eq("clinic_id", clinicId)
  ]);

  if (petsResult.error) {
    throw new Error(`Could not load pets: ${petsResult.error.message}`);
  }
  if (requestsResult.error) {
    throw new Error(`Could not load pet requests: ${requestsResult.error.message}`);
  }

  const requestCounts = new Map<string, number>();
  for (const request of requestsResult.data ?? []) {
    if (!request.pet_id) continue;
    requestCounts.set(request.pet_id, (requestCounts.get(request.pet_id) ?? 0) + 1);
  }

  return (petsResult.data ?? []).map((pet) => {
    const owner = Array.isArray(pet.owners) ? pet.owners[0] : pet.owners;
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      weightKg: pet.weight_kg,
      allergies: pet.allergies,
      medicalNotes: pet.medical_notes,
      createdAt: pet.created_at,
      ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
      ownerPhone: owner?.phone ?? "",
      requestCount: requestCounts.get(pet.id) ?? 0
    };
  });
}
