import { describe, expect, it } from "vitest";
import { intakeRequestSchema, requestStatusSchema } from "./index";

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
