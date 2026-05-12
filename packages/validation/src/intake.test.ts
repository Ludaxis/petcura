import { describe, expect, it } from "vitest";
import {
  clinicSlugSchema,
  createClinicSchema,
  createClinicStaffSchema,
  createReminderSchema,
  intakeRequestSchema,
  internalNoteSchema,
  ownerProfileSchema,
  petProfileSchema,
  reminderStatusActionSchema,
  requestAssignmentSchema,
  requestStatusSchema,
  requestStatusUpdateSchema,
  requestUrgencyUpdateSchema,
  staffReplySchema,
  userProfileSchema
} from "./index";

const requestId = "11111111-1111-4111-8111-111111111111";
const staffMemberId = "22222222-2222-4222-8222-222222222222";

describe("intakeRequestSchema", () => {
  it("accepts a complete multilingual owner intake", () => {
    const parsed = intakeRequestSchema.parse({
      ownerName: "  Marta Tamm ",
      phone: " +372 5555 0000 ",
      petName: " Luna ",
      petSpecies: " Cat ",
      category: "medical_question",
      message: "Luna has not eaten since yesterday morning.",
      clinicSlug: "alex-vet-demo",
      preferredLanguage: "et"
    });

    expect(parsed).toMatchObject({
      ownerName: "Marta Tamm",
      phone: "+372 5555 0000",
      petName: "Luna",
      petSpecies: "Cat",
      clinicSlug: "alex-vet-demo",
      preferredLanguage: "et"
    });
  });

  it("rejects urgent as a persisted status", () => {
    expect(requestStatusSchema.safeParse("urgent").success).toBe(false);
  });
});

describe("admin bootstrap schemas", () => {
  it("normalizes clinic setup inputs", () => {
    expect(clinicSlugSchema.parse(" Alex-Vet-Demo ")).toBe("alex-vet-demo");
    expect(
      createClinicSchema.parse({
        name: " Alex Veterinary Clinic ",
        slug: "Alex-Vet-Demo",
        country: "ee",
        timezone: "Europe/Tallinn",
        locale: "et"
      })
    ).toMatchObject({
      name: "Alex Veterinary Clinic",
      slug: "alex-vet-demo",
      country: "EE",
      locale: "et"
    });
  });

  it("validates staff provisioning inputs", () => {
    expect(
      createClinicStaffSchema.parse({
        clinicId: "33333333-3333-4333-8333-333333333333",
        email: " Staff@Clinic.ee ",
        role: "vet"
      })
    ).toMatchObject({
      email: "staff@clinic.ee",
      role: "vet"
    });
  });

  it("rejects unsafe clinic slugs", () => {
    expect(clinicSlugSchema.safeParse("../admin").success).toBe(false);
    expect(clinicSlugSchema.safeParse("clinic--name").success).toBe(false);
  });
});

describe("staff action schemas", () => {
  it("accepts staff replies and internal notes", () => {
    expect(
      staffReplySchema.parse({
        requestId,
        body: "Please bring Luna in tomorrow morning."
      })
    ).toMatchObject({ requestId });
    expect(
      internalNoteSchema.parse({
        requestId,
        body: "Owner prefers Estonian."
      })
    ).toMatchObject({ requestId });
  });

  it("accepts status, urgency, and assignment updates", () => {
    expect(
      requestStatusUpdateSchema.parse({
        requestId,
        status: "waiting_owner"
      })
    ).toMatchObject({ status: "waiting_owner" });
    expect(
      requestUrgencyUpdateSchema.parse({
        requestId,
        urgency: "high"
      })
    ).toMatchObject({ urgency: "high" });
    expect(
      requestAssignmentSchema.parse({
        requestId,
        staffMemberId
      })
    ).toMatchObject({ staffMemberId });
    expect(
      requestAssignmentSchema.parse({
        requestId,
        staffMemberId: "unassigned"
      })
    ).toMatchObject({ staffMemberId: "unassigned" });
  });

  it("accepts reminder creation and status actions", () => {
    expect(
      createReminderSchema.parse({
        requestId,
        type: "recheck",
        title: "Recheck Luna",
        body: "Please confirm if Luna is eating again.",
        dueAt: "2026-05-12T09:00:00.000+03:00",
        channel: "whatsapp"
      })
    ).toMatchObject({
      requestId,
      type: "recheck",
      channel: "whatsapp"
    });

    expect(
      reminderStatusActionSchema.parse({
        reminderId: requestId,
        status: "completed"
      })
    ).toMatchObject({ status: "completed" });
  });

  it("rejects invalid reminder contracts", () => {
    expect(
      createReminderSchema.safeParse({
        requestId,
        type: "diagnosis",
        title: "Bad type",
        dueAt: "2026-05-12T09:00:00.000+03:00",
        channel: "whatsapp"
      }).success
    ).toBe(false);
    expect(
      reminderStatusActionSchema.safeParse({
        reminderId: requestId,
        status: "sent"
      }).success
    ).toBe(false);
  });

  it("rejects empty staff action bodies", () => {
    expect(staffReplySchema.safeParse({ requestId, body: "" }).success).toBe(
      false
    );
    expect(internalNoteSchema.safeParse({ requestId, body: "" }).success).toBe(
      false
    );
  });
});

describe("profile schemas", () => {
  it("normalizes staff profile input", () => {
    expect(
      userProfileSchema.parse({
        fullName: " Reza Hassanzadeh ",
        displayName: " Reza ",
        phone: " +37258046666 ",
        jobTitle: " Founder ",
        locale: "et"
      })
    ).toEqual({
      fullName: "Reza Hassanzadeh",
      displayName: "Reza",
      phone: "+37258046666",
      jobTitle: "Founder",
      locale: "et"
    });
  });

  it("accepts editable customer and pet profile fields", () => {
    expect(
      ownerProfileSchema.parse({
        ownerId: "00000000-0000-4000-8000-000000000001",
        name: " Alex Owner ",
        phone: " +3725550000 ",
        email: "",
        preferredLanguage: "ru",
        notes: " Needs Russian reminders. "
      })
    ).toMatchObject({
      name: "Alex Owner",
      preferredLanguage: "ru"
    });

    expect(
      petProfileSchema.parse({
        petId: "00000000-0000-4000-8000-000000000002",
        name: " Lumi ",
        species: " Cat ",
        weightKg: "4.7",
        birthDate: ""
      })
    ).toMatchObject({
      name: "Lumi",
      species: "Cat",
      weightKg: 4.7
    });
  });
});
