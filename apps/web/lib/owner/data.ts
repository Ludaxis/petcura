import "server-only";

import { normalizeLocale, type Database, type SupportedLocale } from "@petcura/shared";
import type { OwnerContext } from "@/lib/owner/auth";
import type {
  Appointment,
  ChatMessage,
  ChatMessageSender,
  Clinic,
  OwnerProfile,
  OwnerRequest,
  Pet,
  Service,
  Species,
  Vaccination,
  WeightEntry
} from "./types";

type JsonObject = Record<string, unknown>;
type OwnerSupabaseClient = OwnerContext["supabase"];

type PetRow = Pick<
  Database["public"]["Tables"]["pets"]["Row"],
  | "id"
  | "name"
  | "species"
  | "breed"
  | "sex"
  | "birth_date"
  | "weight_kg"
  | "photo_url"
  | "owner_notes"
>;

type VaccinationRow = Pick<
  Database["public"]["Tables"]["vaccinations"]["Row"],
  | "id"
  | "pet_id"
  | "vaccine_code"
  | "vaccine_name"
  | "administered_at"
  | "next_due_at"
  | "source"
>;

type WeightRow = Pick<
  Database["public"]["Tables"]["pet_weight_entries"]["Row"],
  "id" | "pet_id" | "weight_kg" | "measured_at" | "source"
>;

type ServiceRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  | "id"
  | "slug"
  | "category"
  | "name_i18n"
  | "description_i18n"
  | "duration_minutes"
  | "price_cents"
  | "currency"
  | "requires_pet_species"
  | "sort_order"
>;

type RequestRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  "id" | "pet_id" | "category" | "status" | "updated_at"
> & {
  pets: Pick<Database["public"]["Tables"]["pets"]["Row"], "name"> | null;
};

type MessageRow = Pick<
  Database["public"]["Tables"]["messages"]["Row"],
  "id" | "request_id" | "sender_type" | "body" | "created_at"
>;

type DeliveryRow = Pick<
  Database["public"]["Tables"]["message_delivery_events"]["Row"],
  "message_id" | "status" | "created_at"
>;

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  | "id"
  | "pet_id"
  | "request_id"
  | "status"
  | "proposed_window"
  | "scheduled_at"
> & {
  pets: Pick<Database["public"]["Tables"]["pets"]["Row"], "name"> | null;
  services: Pick<
    Database["public"]["Tables"]["services"]["Row"],
    "name_i18n"
  > | null;
};

const speciesValues: readonly Species[] = [
  "dog",
  "cat",
  "rabbit",
  "bird",
  "reptile",
  "other"
];

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function localizedText(value: unknown, locale: SupportedLocale) {
  const record = asObject(value);
  const localized = record[locale];
  const fallback = record.en;

  if (typeof localized === "string" && localized.trim()) return localized;
  if (typeof fallback === "string" && fallback.trim()) return fallback;

  for (const candidate of Object.values(record)) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  return "";
}

function toSpecies(value: string): Species {
  return speciesValues.includes(value as Species) ? (value as Species) : "other";
}

function toSex(value: string | null): Pet["sex"] {
  if (value === "male" || value === "female") return value;
  return "unknown";
}

function toPet(row: PetRow): Pet {
  return {
    id: row.id,
    name: row.name,
    species: toSpecies(row.species),
    breed: row.breed,
    sex: toSex(row.sex),
    birthDate: row.birth_date,
    weightKg: row.weight_kg,
    photoUrl: row.photo_url,
    ownerNotes: row.owner_notes
  };
}

function toVaccination(row: VaccinationRow): Vaccination {
  const source =
    row.source === "staff" ||
    row.source === "pms_import" ||
    row.source === "owner_attested"
      ? row.source
      : "staff";

  return {
    id: row.id,
    petId: row.pet_id,
    vaccineCode: row.vaccine_code,
    vaccineName: row.vaccine_name,
    administeredAt: row.administered_at,
    nextDueAt: row.next_due_at,
    source
  };
}

function toWeight(row: WeightRow): WeightEntry {
  const source = row.source === "owner" ? "owner" : "staff";

  return {
    id: row.id,
    petId: row.pet_id,
    weightKg: row.weight_kg,
    measuredAt: row.measured_at,
    source
  };
}

export function toOwnerProfile(context: OwnerContext): OwnerProfile {
  return {
    id: context.owner.id,
    name: context.owner.name ?? "",
    email: context.owner.email,
    phone: context.owner.phone,
    preferredLanguage: normalizeLocale(context.owner.preferred_language),
    photoUrl: context.owner.photo_url
  };
}

export function toOwnerClinic(context: OwnerContext): Clinic {
  return {
    id: context.clinic.id,
    slug: context.clinic.slug,
    name: context.clinic.name,
    locale: normalizeLocale(context.clinic.locale),
    timezone: context.clinic.timezone
  };
}

function toService(row: ServiceRow, locale: SupportedLocale): Service {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    name: localizedText(row.name_i18n, locale),
    description: localizedText(row.description_i18n, locale),
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    currency: row.currency,
    requiresPetSpecies: row.requires_pet_species
      .map(toSpecies)
      .filter((species, index, all) => all.indexOf(species) === index)
  };
}

function parseTstzRange(value: unknown) {
  if (typeof value !== "string") {
    return { start: new Date().toISOString(), end: new Date().toISOString() };
  }

  const match = value.match(/^[[(]"?([^",]+)"?,"?([^"\])]+)"?[\])]$/);
  if (!match) {
    return { start: new Date().toISOString(), end: new Date().toISOString() };
  }

  const start = new Date(match[1] ?? "");
  const end = new Date(match[2] ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { start: new Date().toISOString(), end: new Date().toISOString() };
  }

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function latestDeliveryStatus(events: DeliveryRow[]) {
  const status = events
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.status;

  if (
    status === "queued" ||
    status === "sent" ||
    status === "delivered" ||
    status === "read" ||
    status === "failed"
  ) {
    return status;
  }

  if (status === "acknowledged") return "read";
  return null;
}

export async function listOwnerPets(context: OwnerContext): Promise<Pet[]> {
  const { data, error } = await context.supabase
    .from("pets")
    .select(
      "id, name, species, breed, sex, birth_date, weight_kg, photo_url, owner_notes"
    )
    .eq("clinic_id", context.clinic.id)
    .eq("owner_id", context.owner.id)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Could not load owner pets: ${error.message}`);
  }

  return ((data ?? []) as PetRow[]).map(toPet);
}

export async function listOwnerVaccinations(
  context: OwnerContext
): Promise<Vaccination[]> {
  const { data, error } = await context.supabase
    .from("vaccinations")
    .select(
      "id, pet_id, vaccine_code, vaccine_name, administered_at, next_due_at, source"
    )
    .eq("clinic_id", context.clinic.id)
    .order("administered_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load vaccinations: ${error.message}`);
  }

  return ((data ?? []) as VaccinationRow[]).map(toVaccination);
}

export async function listOwnerWeightEntries(
  context: OwnerContext
): Promise<WeightEntry[]> {
  const { data, error } = await context.supabase
    .from("pet_weight_entries")
    .select("id, pet_id, weight_kg, measured_at, source")
    .eq("clinic_id", context.clinic.id)
    .order("measured_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load weight history: ${error.message}`);
  }

  return ((data ?? []) as WeightRow[]).map(toWeight);
}

export async function listOwnerAppointments(
  context: OwnerContext,
  locale: SupportedLocale
): Promise<Appointment[]> {
  const { data, error } = await context.supabase
    .from("appointments")
    .select(
      "id, pet_id, request_id, status, proposed_window, scheduled_at, pets(name), services(name_i18n)"
    )
    .eq("clinic_id", context.clinic.id)
    .eq("owner_id", context.owner.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load appointments: ${error.message}`);
  }

  return ((data ?? []) as unknown as AppointmentRow[]).map((row) => {
    const range = parseTstzRange(row.proposed_window);

    return {
      id: row.id,
      petId: row.pet_id,
      petName: row.pets?.name ?? "",
      serviceName: localizedText(row.services?.name_i18n, locale),
      status: row.status,
      proposedWindowStart: range.start,
      proposedWindowEnd: range.end,
      scheduledAt: row.scheduled_at,
      requestId: row.request_id
    };
  });
}

async function fetchLatestMessagesByRequest(
  supabase: OwnerSupabaseClient,
  requestIds: string[]
) {
  const latest = new Map<string, Pick<MessageRow, "body" | "created_at">>();
  if (requestIds.length === 0) return latest;

  const { data, error } = await supabase
    .from("messages")
    .select("request_id, body, created_at")
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load latest messages: ${error.message}`);
  }

  for (const message of data ?? []) {
    latest.set(message.request_id, message);
  }

  return latest;
}

export async function listOwnerRequests(
  context: OwnerContext
): Promise<OwnerRequest[]> {
  const { data, error } = await context.supabase
    .from("requests")
    .select("id, pet_id, category, status, updated_at, pets(name)")
    .eq("clinic_id", context.clinic.id)
    .eq("owner_id", context.owner.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load owner requests: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RequestRow[];
  const latestMessages = await fetchLatestMessagesByRequest(
    context.supabase,
    rows.map((row) => row.id)
  );

  return rows.map((row) => {
    const latest = latestMessages.get(row.id);

    return {
      id: row.id,
      petId: row.pet_id ?? "",
      petName: row.pets?.name ?? "",
      category: row.category,
      status: row.status,
      lastMessageAt: latest?.created_at ?? row.updated_at,
      lastMessagePreview: latest?.body ?? "",
      unreadByOwner: 0
    };
  });
}

export async function getOwnerRequest(
  context: OwnerContext,
  requestId: string
): Promise<OwnerRequest | null> {
  const requests = await listOwnerRequests(context);
  return requests.find((request) => request.id === requestId) ?? null;
}

export async function listMessagesForOwnerRequest(
  context: OwnerContext,
  requestId: string
): Promise<ChatMessage[]> {
  const { data, error } = await context.supabase
    .from("messages")
    .select("id, request_id, sender_type, body, created_at")
    .eq("clinic_id", context.clinic.id)
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load owner messages: ${error.message}`);
  }

  const rows = (data ?? []) as MessageRow[];
  const eventsByMessage = new Map<string, DeliveryRow[]>();

  if (rows.length > 0) {
    const { data: deliveryRows, error: deliveryError } = await context.supabase
      .from("message_delivery_events")
      .select("message_id, status, created_at")
      .eq("clinic_id", context.clinic.id)
      .in(
        "message_id",
        rows.map((row) => row.id)
      )
      .order("created_at", { ascending: true });

    if (deliveryError) {
      throw new Error(
        `Could not load owner message delivery: ${deliveryError.message}`
      );
    }

    for (const event of (deliveryRows ?? []) as DeliveryRow[]) {
      const events = eventsByMessage.get(event.message_id) ?? [];
      events.push(event);
      eventsByMessage.set(event.message_id, events);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    requestId: row.request_id,
    sender: row.sender_type as ChatMessageSender,
    body: row.body,
    createdAt: row.created_at,
    delivery: latestDeliveryStatus(eventsByMessage.get(row.id) ?? []) ?? null
  }));
}

export async function listOwnerServices(
  context: OwnerContext,
  locale: SupportedLocale,
  pets?: Pet[]
): Promise<Service[]> {
  const { data, error } = await context.supabase
    .from("services")
    .select(
      "id, slug, category, name_i18n, description_i18n, duration_minutes, price_cents, currency, requires_pet_species, sort_order"
    )
    .eq("clinic_id", context.clinic.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Could not load services: ${error.message}`);
  }

  const ownerSpecies = new Set((pets ?? (await listOwnerPets(context))).map((pet) => pet.species));

  return ((data ?? []) as ServiceRow[])
    .map((row) => toService(row, locale))
    .filter(
      (service) =>
        service.requiresPetSpecies.length === 0 ||
        service.requiresPetSpecies.some((species) => ownerSpecies.has(species))
    );
}

export async function getOwnerService(
  context: OwnerContext,
  slug: string,
  locale: SupportedLocale
): Promise<Service | null> {
  const { data, error } = await context.supabase
    .from("services")
    .select(
      "id, slug, category, name_i18n, description_i18n, duration_minutes, price_cents, currency, requires_pet_species, sort_order"
    )
    .eq("clinic_id", context.clinic.id)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load service: ${error.message}`);
  }

  return data ? toService(data as ServiceRow, locale) : null;
}

export function getEligiblePetsForService(service: Service, pets: Pet[]) {
  if (service.requiresPetSpecies.length === 0) return pets;
  const species = new Set(service.requiresPetSpecies);
  return pets.filter((pet) => species.has(pet.species));
}
