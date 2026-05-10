import { describe, expect, it } from "vitest";
import {
  intakeRequestSchema,
  internalNoteSchema,
  requestAssignmentSchema,
  requestStatusSchema,
  requestStatusUpdateSchema,
  requestUrgencyUpdateSchema,
  staffReplySchema
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
      preferredLanguage: "et"
    });

    expect(parsed).toMatchObject({
      ownerName: "Marta Tamm",
      phone: "+372 5555 0000",
      petName: "Luna",
      petSpecies: "Cat",
      preferredLanguage: "et"
    });
  });

  it("rejects urgent as a persisted status", () => {
    expect(requestStatusSchema.safeParse("urgent").success).toBe(false);
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

  it("rejects empty staff action bodies", () => {
    expect(staffReplySchema.safeParse({ requestId, body: "" }).success).toBe(
      false
    );
    expect(internalNoteSchema.safeParse({ requestId, body: "" }).success).toBe(
      false
    );
  });
});
