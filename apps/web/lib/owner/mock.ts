import type {
  Appointment,
  ChatMessage,
  Clinic,
  OwnerProfile,
  OwnerRequest,
  Pet,
  Service,
  Vaccination,
  WeightEntry
} from "./types";

export const mockOwner: OwnerProfile = {
  id: "owner-1",
  name: "Marta Tamm",
  email: "marta.tamm@example.ee",
  phone: "+372 5123 4567",
  preferredLanguage: "en",
  photoUrl: null
};

export const mockClinic: Clinic = {
  id: "clinic-1",
  slug: "polyclinic-tallinn",
  name: "Polyclinic Tallinn",
  locale: "en",
  timezone: "Europe/Tallinn"
};

export const mockPets: Pet[] = [
  {
    id: "pet-luna",
    name: "Luna",
    species: "cat",
    breed: "British Shorthair",
    sex: "female",
    birthDate: "2021-03-14",
    weightKg: 4.2,
    photoUrl: null,
    ownerNotes: "Shy with new people. Prefers tuna treats."
  },
  {
    id: "pet-bruno",
    name: "Bruno",
    species: "dog",
    breed: "Labrador mix",
    sex: "male",
    birthDate: "2019-08-02",
    weightKg: 28.4,
    photoUrl: null,
    ownerNotes: null
  }
];

export const mockVaccinations: Vaccination[] = [
  { id: "vax-1", petId: "pet-luna", vaccineCode: "FVRCP", vaccineName: "FVRCP", administeredAt: "2025-04-12", nextDueAt: "2026-04-12", source: "staff" },
  { id: "vax-2", petId: "pet-luna", vaccineCode: "rabies", vaccineName: "Rabies", administeredAt: "2024-10-01", nextDueAt: "2026-06-01", source: "staff" },
  { id: "vax-3", petId: "pet-bruno", vaccineCode: "DHPP", vaccineName: "DHPP", administeredAt: "2025-09-15", nextDueAt: "2026-09-15", source: "staff" },
  { id: "vax-4", petId: "pet-bruno", vaccineCode: "rabies", vaccineName: "Rabies", administeredAt: "2024-03-20", nextDueAt: "2026-03-20", source: "staff" }
];

export const mockWeights: WeightEntry[] = [
  { id: "w-1", petId: "pet-luna", weightKg: 4.0, measuredAt: "2025-04-12", source: "staff" },
  { id: "w-2", petId: "pet-luna", weightKg: 4.2, measuredAt: "2025-11-08", source: "staff" },
  { id: "w-3", petId: "pet-bruno", weightKg: 27.9, measuredAt: "2024-09-15", source: "staff" },
  { id: "w-4", petId: "pet-bruno", weightKg: 28.4, measuredAt: "2025-09-15", source: "staff" }
];

export const mockAppointments: Appointment[] = [
  {
    id: "appt-1",
    petId: "pet-bruno",
    petName: "Bruno",
    serviceName: "Annual checkup",
    status: "confirmed",
    proposedWindowStart: "2026-05-20T10:00:00.000Z",
    proposedWindowEnd: "2026-05-20T11:00:00.000Z",
    scheduledAt: "2026-05-20T10:30:00.000Z"
  }
];

export const mockRequests: OwnerRequest[] = [
  {
    id: "req-1",
    petId: "pet-luna",
    petName: "Luna",
    category: "medical_question",
    status: "waiting_owner",
    lastMessageAt: "2026-05-12T08:22:00.000Z",
    lastMessagePreview:
      "We can see Luna tomorrow at 10:30 or Friday at 14:00. Which works better?",
    unreadByOwner: 1
  },
  {
    id: "req-2",
    petId: "pet-bruno",
    petName: "Bruno",
    category: "refill",
    status: "resolved",
    lastMessageAt: "2026-05-05T14:11:00.000Z",
    lastMessagePreview: "Refill approved. Ready for pickup tomorrow.",
    unreadByOwner: 0
  }
];

export const mockMessages: Record<string, ChatMessage[]> = {
  "req-1": [
    {
      id: "m-1",
      requestId: "req-1",
      sender: "owner",
      body: "Luna hasn't eaten since yesterday and she's hiding.",
      createdAt: "2026-05-11T18:12:00.000Z",
      delivery: "read"
    },
    {
      id: "m-2",
      requestId: "req-1",
      sender: "staff",
      body: "Thanks for the message. How long exactly and any vomiting?",
      createdAt: "2026-05-11T18:40:00.000Z",
      delivery: null
    },
    {
      id: "m-3",
      requestId: "req-1",
      sender: "owner",
      body: "About 24 hours. No vomiting, she still drinks a little.",
      createdAt: "2026-05-11T19:02:00.000Z",
      delivery: "read"
    },
    {
      id: "m-4",
      requestId: "req-1",
      sender: "staff",
      body: "We can see Luna tomorrow at 10:30 or Friday at 14:00. Which works better?",
      createdAt: "2026-05-12T08:22:00.000Z",
      delivery: null
    }
  ],
  "req-2": [
    {
      id: "m-5",
      requestId: "req-2",
      sender: "owner",
      body: "Can we refill Bruno's allergy medicine this week?",
      createdAt: "2026-05-05T13:50:00.000Z",
      delivery: "read"
    },
    {
      id: "m-6",
      requestId: "req-2",
      sender: "staff",
      body: "Refill approved. Ready for pickup tomorrow.",
      createdAt: "2026-05-05T14:11:00.000Z",
      delivery: null
    }
  ]
};

export const mockServices: Service[] = [
  { slug: "annual-checkup", category: "checkup", name: "Annual checkup", description: "A general wellness visit covering weight, teeth, coat, behavior, and questions.", durationMinutes: 30, priceCents: 4500, currency: "EUR", requiresPetSpecies: [] },
  { slug: "vaccination", category: "vaccination", name: "Vaccination visit", description: "Routine vaccination plus quick wellness check.", durationMinutes: 20, priceCents: 3500, currency: "EUR", requiresPetSpecies: [] },
  { slug: "prescription-refill", category: "refill", name: "Prescription refill", description: "Renew an ongoing prescription. Subject to staff review.", durationMinutes: 10, priceCents: null, currency: "EUR", requiresPetSpecies: [] },
  { slug: "dental-cleaning", category: "surgery", name: "Dental cleaning", description: "Scale and polish under anesthesia. Includes pre-anesthetic check.", durationMinutes: 60, priceCents: 18000, currency: "EUR", requiresPetSpecies: ["dog", "cat"] },
  { slug: "wellness-consultation", category: "consultation", name: "Wellness consultation", description: "Nutrition, behavior, or general health concerns.", durationMinutes: 30, priceCents: 4000, currency: "EUR", requiresPetSpecies: [] },
  { slug: "grooming", category: "grooming", name: "Grooming", description: "Bath, trim, and nail clipping.", durationMinutes: 60, priceCents: 5000, currency: "EUR", requiresPetSpecies: ["dog", "cat"] }
];

export function getPet(id: string): Pet | undefined {
  return mockPets.find((p) => p.id === id);
}

export function getVaccinationsForPet(petId: string): Vaccination[] {
  return mockVaccinations
    .filter((v) => v.petId === petId)
    .sort((a, b) => b.administeredAt.localeCompare(a.administeredAt));
}

export function getWeightsForPet(petId: string): WeightEntry[] {
  return mockWeights
    .filter((w) => w.petId === petId)
    .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
}

export function getRequest(id: string): OwnerRequest | undefined {
  return mockRequests.find((r) => r.id === id);
}

export function getMessagesForRequest(requestId: string): ChatMessage[] {
  return mockMessages[requestId] ?? [];
}

export function getService(slug: string): Service | undefined {
  return mockServices.find((s) => s.slug === slug);
}
