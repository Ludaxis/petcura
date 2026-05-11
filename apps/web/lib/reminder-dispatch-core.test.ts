import { describe, expect, it } from "vitest";
import {
  buildReminderWhatsAppBody,
  getFailureStatus,
  shouldRetryReminder
} from "./reminder-dispatch-core";

describe("reminder dispatch core", () => {
  it("builds localized WhatsApp copy for owners", () => {
    expect(
      buildReminderWhatsAppBody({
        clinicName: "Alex Vet",
        petName: "Lumi",
        title: "Vaccination due",
        body: "Please book a visit this week.",
        type: "vaccination",
        ownerLanguage: "et"
      })
    ).toContain("Meeldetuletus kliinikult Alex Vet");
  });

  it("waits before retrying an in-flight reminder", () => {
    const now = new Date("2026-05-11T12:00:00.000Z");

    expect(
      shouldRetryReminder("2026-05-11T11:59:00.000Z", now, 4 * 60 * 1000)
    ).toBe(false);
    expect(
      shouldRetryReminder("2026-05-11T11:55:00.000Z", now, 4 * 60 * 1000)
    ).toBe(true);
  });

  it("marks a reminder missed only after the maximum attempts", () => {
    expect(getFailureStatus(1, 3)).toBe("scheduled");
    expect(getFailureStatus(3, 3)).toBe("missed");
  });
});
