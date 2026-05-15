import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSignedProfileImageUrls } from "@/lib/profile-media";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  preferredLanguage: string;
  notes: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  petCount: number;
  requestCount: number;
  openRequestCount: number;
  latestRequestAt: string | null;
  petNames: string[];
};

export type PetListItem = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birthDate: string | null;
  weightKg: number | null;
  allergies: string | null;
  medicalNotes: string | null;
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  ownerLanguage: string;
  requestCount: number;
  openRequestCount: number;
  latestRequestAt: string | null;
};

export type DirectorySort = "recent" | "name" | "latest" | "pets";

export type CustomerListFilters = {
  q?: string;
  lang?: string;
  hasOpenRequest?: boolean;
  recentDays?: number;
  sort?: DirectorySort;
  limit?: number;
  offset?: number;
};

export type PetListFilters = {
  q?: string;
  species?: string;
  lang?: string;
  hasOpenRequest?: boolean;
  recentDays?: number;
  sort?: DirectorySort;
  limit?: number;
  offset?: number;
};

export type CustomerListResult = {
  rows: CustomerListItem[];
  total: number;
};

export type PetListResult = {
  rows: PetListItem[];
  total: number;
};

export type ClinicRequestSummary = {
  id: string;
  ownerId: string;
  petId: string | null;
  petName: string | null;
  category: string;
  status: string;
  urgency: string;
  createdAt: string;
  updatedAt: string;
  latestMessage: string | null;
};

export type ClinicEntityActivity = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type CustomerDetail = CustomerListItem & {
  pets: PetListItem[];
  requests: ClinicRequestSummary[];
  activity: ClinicEntityActivity[];
};

export type PetDetail = PetListItem & {
  owner: CustomerListItem | null;
  requests: ClinicRequestSummary[];
  activity: ClinicEntityActivity[];
};

const OPEN_REQUEST_STATUSES = ["new", "waiting_staff", "waiting_owner"] as const;

function withinRecentWindow(iso: string | null, recentDays: number | undefined) {
  if (!recentDays || !iso) return recentDays ? false : true;
  const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

function compareCustomers(
  a: CustomerListItem,
  b: CustomerListItem,
  sort: DirectorySort
) {
  switch (sort) {
    case "name":
      return a.name.localeCompare(b.name);
    case "latest": {
      const aT = a.latestRequestAt ? new Date(a.latestRequestAt).getTime() : 0;
      const bT = b.latestRequestAt ? new Date(b.latestRequestAt).getTime() : 0;
      return bT - aT;
    }
    case "pets":
      return b.petCount - a.petCount || a.name.localeCompare(b.name);
    case "recent":
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

function comparePets(a: PetListItem, b: PetListItem, sort: DirectorySort) {
  switch (sort) {
    case "name":
      return a.name.localeCompare(b.name);
    case "latest": {
      const aT = a.latestRequestAt ? new Date(a.latestRequestAt).getTime() : 0;
      const bT = b.latestRequestAt ? new Date(b.latestRequestAt).getTime() : 0;
      return bT - aT;
    }
    case "pets":
    case "recent":
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

function normalize(value: string | undefined | null) {
  return (value ?? "").trim().toLocaleLowerCase("en-US");
}

export async function listClinicCustomers(
  supabase: SupabaseClient,
  clinicId: string,
  filters: CustomerListFilters = {}
): Promise<CustomerListResult> {
  const [ownersResult, petsResult, requestsResult] = await Promise.all([
    supabase
      .from("owners")
      .select(
        "id, name, phone, email, preferred_language, notes, photo_url, created_at"
      )
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("pets")
      .select("id, owner_id, name")
      .eq("clinic_id", clinicId)
      .is("deleted_at", null),
    supabase
      .from("requests")
      .select("id, owner_id, status, updated_at")
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

  const petNamesByOwner = new Map<string, string[]>();
  for (const pet of petsResult.data ?? []) {
    const names = petNamesByOwner.get(pet.owner_id) ?? [];
    names.push(pet.name);
    petNamesByOwner.set(pet.owner_id, names);
  }

  const requestCounts = new Map<string, number>();
  const openRequestCounts = new Map<string, number>();
  const latestRequestByOwner = new Map<string, string>();
  for (const request of requestsResult.data ?? []) {
    requestCounts.set(
      request.owner_id,
      (requestCounts.get(request.owner_id) ?? 0) + 1
    );
    if (
      OPEN_REQUEST_STATUSES.includes(
        request.status as (typeof OPEN_REQUEST_STATUSES)[number]
      )
    ) {
      openRequestCounts.set(
        request.owner_id,
        (openRequestCounts.get(request.owner_id) ?? 0) + 1
      );
    }
    if (!latestRequestByOwner.has(request.owner_id)) {
      latestRequestByOwner.set(request.owner_id, request.updated_at);
    }
  }

  const photoUrls = await getSignedProfileImageUrls(
    (ownersResult.data ?? []).map((owner) => owner.photo_url)
  );

  const enriched: CustomerListItem[] = (ownersResult.data ?? []).map((owner) => {
    const petNames = petNamesByOwner.get(owner.id) ?? [];
    return {
      id: owner.id,
      name: owner.name ?? owner.phone,
      phone: owner.phone,
      email: owner.email,
      preferredLanguage: owner.preferred_language,
      notes: owner.notes,
      photoPath: owner.photo_url,
      photoUrl: owner.photo_url
        ? photoUrls.get(owner.photo_url) ?? null
        : null,
      createdAt: owner.created_at,
      petCount: petNames.length,
      requestCount: requestCounts.get(owner.id) ?? 0,
      openRequestCount: openRequestCounts.get(owner.id) ?? 0,
      latestRequestAt: latestRequestByOwner.get(owner.id) ?? null,
      petNames
    };
  });

  const q = normalize(filters.q);
  const lang = filters.lang;
  const filtered = enriched.filter((owner) => {
    if (q) {
      const haystack = [
        owner.name,
        owner.phone,
        owner.email ?? "",
        owner.petNames.join(" ")
      ]
        .join(" ")
        .toLocaleLowerCase("en-US");
      if (!haystack.includes(q)) return false;
    }
    if (lang && owner.preferredLanguage !== lang) return false;
    if (filters.hasOpenRequest && owner.openRequestCount === 0) return false;
    if (
      filters.recentDays &&
      !withinRecentWindow(owner.latestRequestAt, filters.recentDays)
    ) {
      return false;
    }
    return true;
  });

  const sort = filters.sort ?? "recent";
  filtered.sort((a, b) => compareCustomers(a, b, sort));

  const offset = Math.max(0, filters.offset ?? 0);
  const limit = filters.limit && filters.limit > 0 ? filters.limit : filtered.length;
  return {
    rows: filtered.slice(offset, offset + limit),
    total: filtered.length
  };
}

export async function listClinicPets(
  supabase: SupabaseClient,
  clinicId: string,
  filters: PetListFilters = {}
): Promise<PetListResult> {
  const [petsResult, requestsResult] = await Promise.all([
    supabase
      .from("pets")
      .select(
        "id, owner_id, name, species, breed, sex, birth_date, weight_kg, allergies, medical_notes, photo_url, created_at, owners(id, name, phone, preferred_language)"
      )
      .eq("clinic_id", clinicId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id, pet_id, status, updated_at")
      .eq("clinic_id", clinicId)
      .order("updated_at", { ascending: false })
  ]);

  if (petsResult.error) {
    throw new Error(`Could not load pets: ${petsResult.error.message}`);
  }
  if (requestsResult.error) {
    throw new Error(`Could not load pet requests: ${requestsResult.error.message}`);
  }

  const requestCounts = new Map<string, number>();
  const openRequestCounts = new Map<string, number>();
  const latestRequestByPet = new Map<string, string>();
  for (const request of requestsResult.data ?? []) {
    if (!request.pet_id) continue;
    requestCounts.set(request.pet_id, (requestCounts.get(request.pet_id) ?? 0) + 1);
    if (
      OPEN_REQUEST_STATUSES.includes(
        request.status as (typeof OPEN_REQUEST_STATUSES)[number]
      )
    ) {
      openRequestCounts.set(
        request.pet_id,
        (openRequestCounts.get(request.pet_id) ?? 0) + 1
      );
    }
    if (!latestRequestByPet.has(request.pet_id)) {
      latestRequestByPet.set(request.pet_id, request.updated_at);
    }
  }

  const photoUrls = await getSignedProfileImageUrls(
    (petsResult.data ?? []).map((pet) => pet.photo_url)
  );

  const enriched: PetListItem[] = (petsResult.data ?? []).map((pet) => {
    const owner = Array.isArray(pet.owners) ? pet.owners[0] : pet.owners;
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      birthDate: pet.birth_date,
      weightKg: pet.weight_kg,
      allergies: pet.allergies,
      medicalNotes: pet.medical_notes,
      photoPath: pet.photo_url,
      photoUrl: pet.photo_url ? photoUrls.get(pet.photo_url) ?? null : null,
      createdAt: pet.created_at,
      ownerId: owner?.id ?? pet.owner_id,
      ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
      ownerPhone: owner?.phone ?? "",
      ownerLanguage: owner?.preferred_language ?? "en",
      requestCount: requestCounts.get(pet.id) ?? 0,
      openRequestCount: openRequestCounts.get(pet.id) ?? 0,
      latestRequestAt: latestRequestByPet.get(pet.id) ?? null
    };
  });

  const q = normalize(filters.q);
  const species = normalize(filters.species);
  const lang = filters.lang;
  const filtered = enriched.filter((pet) => {
    if (q) {
      const haystack = [pet.name, pet.breed ?? "", pet.ownerName, pet.ownerPhone]
        .join(" ")
        .toLocaleLowerCase("en-US");
      if (!haystack.includes(q)) return false;
    }
    if (species && normalize(pet.species) !== species) return false;
    if (lang && pet.ownerLanguage !== lang) return false;
    if (filters.hasOpenRequest && pet.openRequestCount === 0) return false;
    if (
      filters.recentDays &&
      !withinRecentWindow(pet.latestRequestAt, filters.recentDays)
    ) {
      return false;
    }
    return true;
  });

  const sort = filters.sort ?? "recent";
  filtered.sort((a, b) => comparePets(a, b, sort));

  const offset = Math.max(0, filters.offset ?? 0);
  const limit = filters.limit && filters.limit > 0 ? filters.limit : filtered.length;
  return {
    rows: filtered.slice(offset, offset + limit),
    total: filtered.length
  };
}

export async function listClinicSpecies(
  supabase: SupabaseClient,
  clinicId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("pets")
    .select("species")
    .eq("clinic_id", clinicId)
    .is("deleted_at", null);
  if (error || !data) return [];
  const set = new Set<string>();
  for (const pet of data) {
    if (pet.species) set.add(pet.species);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

async function listClinicRequestsForEntity(
  supabase: SupabaseClient,
  clinicId: string,
  filter: { ownerId?: string; petId?: string }
): Promise<ClinicRequestSummary[]> {
  let query = supabase
    .from("requests")
    .select(
      "id, owner_id, pet_id, category, status, urgency, created_at, updated_at, messages(body, created_at), pets(name)"
    )
    .eq("clinic_id", clinicId)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (filter.ownerId) query = query.eq("owner_id", filter.ownerId);
  if (filter.petId) query = query.eq("pet_id", filter.petId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Could not load request summaries: ${error.message}`);
  }

  return (data ?? []).map((request) => {
    const messages = Array.isArray(request.messages)
      ? request.messages.slice().sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at))
        )
      : [];
    const pet = Array.isArray(request.pets) ? request.pets[0] : request.pets;

    return {
      id: request.id,
      ownerId: request.owner_id,
      petId: request.pet_id,
      petName: pet?.name ?? null,
      category: request.category,
      status: request.status,
      urgency: request.urgency,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      latestMessage: messages[0]?.body ?? null
    };
  });
}

async function listClinicEntityActivity(
  supabase: SupabaseClient,
  clinicId: string,
  entityType: "owners" | "pets",
  entityId: string
): Promise<ClinicEntityActivity[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, created_at")
    .eq("clinic_id", clinicId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(`Could not load activity: ${error.message}`);
  }

  return (data ?? []).map((event) => ({
    id: event.id,
    actorId: event.actor_id,
    action: event.action,
    entityType: event.entity_type,
    entityId: event.entity_id,
    createdAt: event.created_at
  }));
}

export async function getClinicCustomerDetail(
  supabase: SupabaseClient,
  clinicId: string,
  ownerId: string
): Promise<CustomerDetail | null> {
  const [customers, pets, requests, activity] = await Promise.all([
    listClinicCustomers(supabase, clinicId),
    listClinicPets(supabase, clinicId),
    listClinicRequestsForEntity(supabase, clinicId, { ownerId }),
    listClinicEntityActivity(supabase, clinicId, "owners", ownerId)
  ]);
  const owner = customers.rows.find((row) => row.id === ownerId);
  if (!owner) return null;

  return {
    ...owner,
    pets: pets.rows.filter((pet) => pet.ownerId === ownerId),
    requests,
    activity
  };
}

export async function getClinicPetDetail(
  supabase: SupabaseClient,
  clinicId: string,
  petId: string
): Promise<PetDetail | null> {
  const [pets, customers, requests, activity] = await Promise.all([
    listClinicPets(supabase, clinicId),
    listClinicCustomers(supabase, clinicId),
    listClinicRequestsForEntity(supabase, clinicId, { petId }),
    listClinicEntityActivity(supabase, clinicId, "pets", petId)
  ]);
  const pet = pets.rows.find((row) => row.id === petId);
  if (!pet) return null;

  return {
    ...pet,
    owner: customers.rows.find((owner) => owner.id === pet.ownerId) ?? null,
    requests,
    activity
  };
}
