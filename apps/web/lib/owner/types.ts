import type { SupportedLocale } from "@petcura/shared";

export type Species = "dog" | "cat" | "rabbit" | "bird" | "reptile" | "other";

export type Pet = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  sex: "male" | "female" | "unknown";
  birthDate: string | null;
  weightKg: number | null;
  photoUrl: string | null;
  ownerNotes: string | null;
};

export type WeightEntry = {
  id: string;
  petId: string;
  weightKg: number;
  measuredAt: string;
  source: "owner" | "staff";
};

export type VaccineUrgency = "ok" | "due_soon" | "overdue" | "no_due";

export type Vaccination = {
  id: string;
  petId: string;
  vaccineCode: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt: string | null;
  source: "staff" | "pms_import" | "owner_attested";
};

export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  petId: string;
  petName: string;
  serviceName: string;
  status: AppointmentStatus;
  proposedWindowStart: string;
  proposedWindowEnd: string;
  scheduledAt: string | null;
};

export type ChatMessageSender = "owner" | "staff" | "system" | "ai";

export type ChatMessage = {
  id: string;
  requestId: string;
  sender: ChatMessageSender;
  body: string;
  createdAt: string;
  delivery: "queued" | "sent" | "delivered" | "read" | "failed" | null;
};

export type RequestStatus =
  | "new"
  | "waiting_staff"
  | "waiting_owner"
  | "resolved";

export type OwnerRequest = {
  id: string;
  petId: string;
  petName: string;
  category: "medical_question" | "refill" | "appointment" | "follow_up" | "admin";
  status: RequestStatus;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadByOwner: number;
};

export type Service = {
  slug: string;
  category:
    | "checkup"
    | "vaccination"
    | "refill"
    | "grooming"
    | "consultation"
    | "surgery"
    | "other";
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number | null;
  currency: string;
  requiresPetSpecies: Species[];
};

export type Clinic = {
  id: string;
  slug: string;
  name: string;
  locale: SupportedLocale;
  timezone: string;
};

export type OwnerProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  preferredLanguage: SupportedLocale;
  photoUrl: string | null;
};
