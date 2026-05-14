import { describe, expect, it } from "vitest";
import {
  buildEmergencyBanner,
  computeClinicOpenState,
  detectEmergencyLanguage,
  detectServiceIntent,
  fallbackIntakeOutput
} from "./ai-assisted-core";

describe("AI-assisted intake safety rules", () => {
  it("detects conservative emergency language before AI", () => {
    const result = detectEmergencyLanguage(
      "My dog ate chocolate and now cannot breathe."
    );

    expect(result.triggered).toBe(true);
    expect(result.riskFlags).toContain("breathing difficulty");
    expect(result.riskFlags).toContain("possible toxin ingestion");
  });

  it("maps ancillary services as route-only intents", () => {
    expect(detectServiceIntent("Can you deliver medicine to us?", "admin")).toBe(
      "delivery"
    );
    expect(detectServiceIntent("Need grooming and nail trim", "appointment")).toBe(
      "grooming"
    );
  });

  it("creates a safe fallback intake output when AI is unavailable", () => {
    const emergency = detectEmergencyLanguage("Luna had a seizure.");
    const output = fallbackIntakeOutput({
      ownerName: "Marta",
      petName: "Luna",
      petSpecies: "Cat",
      category: "medical_question",
      message: "Luna had a seizure.",
      locale: "en",
      emergency
    });

    expect(output.emergencySignal).toBe(true);
    expect(output.urgencySuggestion).toBe("high");
    expect(output.routingSuggestion).toBe("on_call");
    expect(output.safetyNotes).toContain("no_diagnosis_no_prescription");
  });

  it("calculates open and closed clinic hours in clinic timezone", () => {
    const open = computeClinicOpenState({
      now: new Date("2026-05-14T09:00:00.000Z"),
      timezone: "Europe/Tallinn",
      hours: [
        {
          weekday: 4,
          opens_at: "09:00:00",
          closes_at: "17:00:00",
          is_closed: false
        }
      ],
      holidays: []
    });
    const closed = computeClinicOpenState({
      now: new Date("2026-05-14T18:00:00.000Z"),
      timezone: "Europe/Tallinn",
      hours: [
        {
          weekday: 4,
          opens_at: "09:00:00",
          closes_at: "17:00:00",
          is_closed: false
        }
      ],
      holidays: []
    });

    expect(open.status).toBe("open");
    expect(closed.status).toBe("closed");
  });

  it("uses after-hours emergency policy copy when closed", () => {
    const banner = buildEmergencyBanner({
      locale: "en",
      emergency: detectEmergencyLanguage("My cat cannot pee."),
      openState: {
        status: "closed",
        checkedAt: "2026-05-14T18:00:00.000Z",
        reason: "regular_hours"
      },
      policy: {
        emergencyPhone: "+372111",
        afterHoursPhone: "+372999",
        afterHoursInstructions: "Call the after-hours partner now."
      }
    });

    expect(banner?.isAfterHours).toBe(true);
    expect(banner?.phone).toBe("+372999");
    expect(banner?.body).toBe("Call the after-hours partner now.");
  });
});
