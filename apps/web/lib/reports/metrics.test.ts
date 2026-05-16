import { describe, expect, it } from "vitest";
import { buildReportsDashboard, createReportRange } from "./metrics";
import type { BuildReportsInput } from "./types";

const now = new Date("2026-05-16T12:00:00.000Z");
const range = createReportRange("30d", now);

function baseInput(
  override: Partial<BuildReportsInput> = {}
): BuildReportsInput {
  return {
    range,
    clinicName: "Alex Veterinary Clinic",
    canViewFinancial: true,
    owners: [
      {
        id: "owner-a",
        name: "Marta",
        phone: "+3721",
        createdAt: "2026-03-01T09:00:00.000Z"
      },
      {
        id: "owner-b",
        name: "Ivan",
        phone: "+3722",
        createdAt: "2026-05-01T09:00:00.000Z"
      },
      {
        id: "owner-c",
        name: "Katrin",
        phone: "+3723",
        createdAt: "2026-01-01T09:00:00.000Z"
      }
    ],
    pets: [
      { id: "pet-a", ownerId: "owner-a", name: "Luna", species: "Cat" },
      { id: "pet-b", ownerId: "owner-b", name: "Bruno", species: "Dog" },
      { id: "pet-c", ownerId: "owner-c", name: "Milo", species: "Rabbit" }
    ],
    requests: [
      {
        id: "req-a1",
        ownerId: "owner-a",
        petId: "pet-a",
        category: "medical_question",
        status: "resolved",
        urgency: "high",
        channel: "whatsapp",
        createdAt: "2026-05-10T09:00:00.000Z",
        updatedAt: "2026-05-10T12:00:00.000Z",
        resolvedAt: "2026-05-10T12:00:00.000Z",
        riskFlags: ["not_eating"]
      },
      {
        id: "req-a2",
        ownerId: "owner-a",
        petId: "pet-a",
        category: "medical_question",
        status: "new",
        urgency: "medium",
        channel: "web",
        createdAt: "2026-05-12T09:00:00.000Z",
        updatedAt: "2026-05-12T09:00:00.000Z",
        resolvedAt: null,
        riskFlags: []
      },
      {
        id: "req-b1",
        ownerId: "owner-b",
        petId: "pet-b",
        category: "refill",
        status: "waiting_owner",
        urgency: "low",
        channel: "web",
        createdAt: "2026-05-13T09:00:00.000Z",
        updatedAt: "2026-05-13T09:00:00.000Z",
        resolvedAt: null,
        riskFlags: []
      },
      {
        id: "req-c-old",
        ownerId: "owner-c",
        petId: "pet-c",
        category: "appointment",
        status: "resolved",
        urgency: "low",
        channel: "whatsapp",
        createdAt: "2026-03-15T09:00:00.000Z",
        updatedAt: "2026-03-15T10:00:00.000Z",
        resolvedAt: "2026-03-15T10:00:00.000Z",
        riskFlags: []
      }
    ],
    messages: [
      {
        id: "m1",
        requestId: "req-a1",
        senderType: "owner",
        createdAt: "2026-05-10T09:00:00.000Z"
      },
      {
        id: "m2",
        requestId: "req-a1",
        senderType: "staff",
        createdAt: "2026-05-10T09:45:00.000Z"
      }
    ],
    requestEvents: [
      {
        id: "ev1",
        requestId: "req-a1",
        eventType: "reopened",
        createdAt: "2026-05-11T09:00:00.000Z"
      }
    ],
    reminders: [
      {
        id: "rem-1",
        type: "vaccination",
        status: "sent",
        dueAt: "2026-05-08T09:00:00.000Z",
        sentAt: "2026-05-08T09:00:00.000Z",
        acknowledgedAt: null,
        completedAt: null
      },
      {
        id: "rem-2",
        type: "follow_up",
        status: "acknowledged",
        dueAt: "2026-05-09T09:00:00.000Z",
        sentAt: "2026-05-09T09:00:00.000Z",
        acknowledgedAt: "2026-05-09T10:00:00.000Z",
        completedAt: null
      }
    ],
    vaccinations: [
      {
        id: "vac-1",
        petId: "pet-a",
        vaccineName: "Rabies",
        administeredAt: "2025-05-01",
        nextDueAt: "2026-05-01"
      },
      {
        id: "vac-2",
        petId: "pet-b",
        vaccineName: "DHPP",
        administeredAt: "2025-06-01",
        nextDueAt: "2026-06-01"
      }
    ],
    weights: [
      {
        id: "w1",
        petId: "pet-a",
        weightKg: 5.5,
        measuredAt: "2026-05-01"
      },
      {
        id: "w0",
        petId: "pet-a",
        weightKg: 4.8,
        measuredAt: "2026-03-01"
      }
    ],
    aiOutputs: [
      {
        id: "ai1",
        kind: "reply_draft",
        status: "success",
        reviewStatus: "accepted_with_edits",
        accepted: true,
        latencyMs: 900,
        createdAt: "2026-05-10T09:00:00.000Z"
      },
      {
        id: "ai2",
        kind: "summary",
        status: "blocked",
        reviewStatus: "not_reviewable",
        accepted: null,
        latencyMs: 1500,
        createdAt: "2026-05-11T09:00:00.000Z"
      }
    ],
    aiMemoryItems: [
      {
        id: "mem1",
        status: "accepted",
        createdAt: "2026-05-10T09:00:00.000Z"
      },
      {
        id: "mem2",
        status: "rejected",
        createdAt: "2026-05-11T09:00:00.000Z"
      }
    ],
    outboundMessages: [
      {
        id: "out-1",
        channel: "whatsapp",
        source: "staff_reply",
        status: "failed",
        fallbackOfOutboundMessageId: null,
        createdAt: "2026-05-10T09:00:00.000Z"
      },
      {
        id: "out-2",
        channel: "sms",
        source: "sms_fallback",
        status: "delivered",
        fallbackOfOutboundMessageId: "out-1",
        createdAt: "2026-05-10T09:05:00.000Z"
      }
    ],
    invoices: [
      {
        id: "inv-1",
        ownerId: "owner-a",
        petId: "pet-a",
        issuedAt: "2026-05-10T09:00:00.000Z",
        currency: "EUR",
        grossAmountCents: 12900,
        serviceCategory: "consultation",
        voidedAt: null
      },
      {
        id: "inv-void",
        ownerId: "owner-a",
        petId: "pet-a",
        issuedAt: "2026-05-11T09:00:00.000Z",
        currency: "EUR",
        grossAmountCents: 50000,
        serviceCategory: "voided",
        voidedAt: "2026-05-12T09:00:00.000Z"
      }
    ],
    ...override
  };
}

describe("reports metrics", () => {
  it("calculates owner retention and at-risk owners", () => {
    const dashboard = buildReportsDashboard(baseInput());

    expect(dashboard.owners.metrics[0]?.value).toBe("50%");
    expect(dashboard.owners.metrics[1]?.value).toBe("1");
    expect(dashboard.owners.atRiskOwners.map((owner) => owner.ownerName)).toEqual([
      "Katrin"
    ]);
  });

  it("calculates operations response, resolution, reminders, delivery, and reopen rate", () => {
    const dashboard = buildReportsDashboard(baseInput());

    expect(dashboard.overview.metrics[2]?.value).toBe("45m");
    expect(dashboard.operations.metrics[0]?.value).toBe("3h");
    expect(dashboard.operations.metrics[2]?.value).toBe("50%");
    expect(dashboard.operations.metrics[3]?.value).toBe("50%");
    expect(dashboard.operations.metrics[4]?.value).toBe("100%");
  });

  it("surfaces pet health follow-up signals without diagnosis", () => {
    const dashboard = buildReportsDashboard(baseInput());

    expect(dashboard.pets.metrics[0]?.value).toBe("1");
    expect(dashboard.pets.metrics[1]?.value).toBe("1");
    expect(dashboard.pets.metrics[2]?.value).toBe("1");
    expect(dashboard.pets.watchlist.map((item) => item.reason)).toContain(
      "Repeat health signal"
    );
  });

  it("calculates AI accountability and financial metrics only when available", () => {
    const dashboard = buildReportsDashboard(baseInput());
    const restricted = buildReportsDashboard(
      baseInput({ canViewFinancial: false, invoices: [] })
    );

    expect(dashboard.ai.metrics[1]?.value).toBe("100%");
    expect(dashboard.ai.metrics[2]?.value).toBe("50%");
    expect(dashboard.owners.financialAvailable).toBe(true);
    expect(dashboard.owners.topOwnerValue[0]?.spendCents).toBe(12900);
    expect(restricted.owners.financialRestricted).toBe(true);
    expect(restricted.owners.topOwnerValue).toEqual([]);
  });
});
