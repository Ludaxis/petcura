import type {
  BreakdownItem,
  BuildReportsInput,
  MetricDelta,
  ReportMetric,
  ReportRange,
  ReportRangePreset,
  ReportsDashboard,
  RetentionCohort,
  TrendPoint,
  WatchlistItem
} from "./types";

const PRESET_DAYS: Record<ReportRangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const VACCINE_DUE_SOON_DAYS = 30;
const WEIGHT_WATCH_RATIO = 0.1;

export function isReportRangePreset(value: unknown): value is ReportRangePreset {
  return value === "7d" || value === "30d" || value === "90d";
}

export function createReportRange(
  preset: ReportRangePreset = "30d",
  now = new Date()
): ReportRange {
  const days = PRESET_DAYS[preset];
  const end = new Date(now);
  const start = new Date(end.getTime() - days * MS_PER_DAY);
  const previousEnd = new Date(start);
  const previousStart = new Date(start.getTime() - days * MS_PER_DAY);

  return {
    preset,
    days,
    start: start.toISOString(),
    end: end.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
    generatedAt: now.toISOString()
  };
}

function inRange(iso: string | null | undefined, start: string, end: string) {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return time >= new Date(start).getTime() && time < new Date(end).getTime();
}

function before(iso: string | null | undefined, end: string) {
  if (!iso) return false;
  return new Date(iso).getTime() < new Date(end).getTime();
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle] ?? null;
  const left = sorted[middle - 1] ?? 0;
  const right = sorted[middle] ?? 0;
  return (left + right) / 2;
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))] ?? null;
}

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function numberFmt(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function minutesFmt(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) return "n/a";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(hours < 10 ? 1 : 0)}h`;
  }
  return `${(hours / 24).toFixed(1)}d`;
}

function moneyFmt(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function delta(current: number, previous: number, suffix = ""): MetricDelta {
  const diff = current - previous;
  if (previous === 0) {
    return {
      value: diff,
      label: current === 0 ? "No change" : `+${numberFmt(current)}${suffix}`,
      direction: current === 0 ? "flat" : "up"
    };
  }
  const pct = Math.round((diff / previous) * 100);
  return {
    value: pct,
    label: `${pct > 0 ? "+" : ""}${pct}%`,
    direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat"
  };
}

function metric(
  label: string,
  value: string,
  detail: string,
  options: Pick<ReportMetric, "delta" | "tone"> = {}
): ReportMetric {
  return { label, value, detail, ...options };
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function dayLabel(isoDay: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${isoDay}T12:00:00.000Z`));
}

function buildDailyTrend(
  range: ReportRange,
  dates: string[],
  previousDates: string[] = []
): TrendPoint[] {
  const counts = new Map<string, number>();
  const previousCounts = new Map<string, number>();
  for (const date of dates) {
    counts.set(dayKey(date), (counts.get(dayKey(date)) ?? 0) + 1);
  }
  for (const date of previousDates) {
    previousCounts.set(dayKey(date), (previousCounts.get(dayKey(date)) ?? 0) + 1);
  }

  const points: TrendPoint[] = [];
  const startMs = new Date(range.start).getTime();
  const prevStartMs = new Date(range.previousStart).getTime();
  for (let i = 0; i < range.days; i += 1) {
    const currentDay = new Date(startMs + i * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
    const previousDay = new Date(prevStartMs + i * MS_PER_DAY)
      .toISOString()
      .slice(0, 10);
    points.push({
      date: currentDay,
      label: dayLabel(currentDay),
      value: counts.get(currentDay) ?? 0,
      comparison: previousCounts.get(previousDay) ?? 0
    });
  }
  return points;
}

function breakdown(
  rows: string[],
  labels: Record<string, string> = {}
): BreakdownItem[] {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row, (counts.get(row) ?? 0) + 1);
  const total = rows.length;
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      key,
      label: labels[key] ?? key.replaceAll("_", " "),
      value,
      percent: percent(value, total)
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function firstResponseMinutes(input: BuildReportsInput) {
  const messagesByRequest = new Map<string, BuildReportsInput["messages"]>();
  for (const message of input.messages) {
    const next = messagesByRequest.get(message.requestId) ?? [];
    next.push(message);
    messagesByRequest.set(message.requestId, next);
  }

  const values: number[] = [];
  for (const request of input.requests) {
    if (!inRange(request.createdAt, input.range.start, input.range.end)) {
      continue;
    }
    const messages = (messagesByRequest.get(request.id) ?? []).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
    const firstOwner = messages.find((message) => message.senderType === "owner");
    if (!firstOwner) continue;
    const firstStaff = messages.find(
      (message) =>
        message.senderType === "staff" &&
        new Date(message.createdAt).getTime() >
          new Date(firstOwner.createdAt).getTime()
    );
    if (!firstStaff) continue;
    values.push(
      (new Date(firstStaff.createdAt).getTime() -
        new Date(firstOwner.createdAt).getTime()) /
        60000
    );
  }
  return values;
}

function riskFlagCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

function addMonths(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit"
  }).format(new Date(`${month}-01T12:00:00.000Z`));
}

function buildRetentionCohorts(input: BuildReportsInput): RetentionCohort[] {
  const requestsByOwner = new Map<string, string[]>();
  for (const request of input.requests) {
    const next = requestsByOwner.get(request.ownerId) ?? [];
    next.push(request.createdAt);
    requestsByOwner.set(request.ownerId, next);
  }

  const cohorts = new Map<string, string[]>();
  for (const owner of input.owners) {
    const key = monthKey(owner.createdAt);
    const next = cohorts.get(key) ?? [];
    next.push(owner.id);
    cohorts.set(key, next);
  }

  return Array.from(cohorts.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .reverse()
    .map(([cohort, ownerIds]) => {
      const cells = Array.from({ length: 6 }).map((_, offset) => {
        const targetMonth = addMonths(cohort, offset);
        const retained = ownerIds.filter((ownerId) =>
          (requestsByOwner.get(ownerId) ?? []).some(
            (createdAt) => monthKey(createdAt) === targetMonth
          )
        ).length;
        return {
          offset,
          retained,
          total: ownerIds.length,
          percent: percent(retained, ownerIds.length)
        };
      });
      return {
        cohort,
        label: monthLabel(cohort),
        total: ownerIds.length,
        cells
      };
    });
}

export function buildReportsDashboard(input: BuildReportsInput): ReportsDashboard {
  const currentRequests = input.requests.filter((request) =>
    inRange(request.createdAt, input.range.start, input.range.end)
  );
  const previousRequests = input.requests.filter((request) =>
    inRange(request.createdAt, input.range.previousStart, input.range.previousEnd)
  );
  const openRequests = input.requests.filter(
    (request) => request.status !== "resolved"
  );

  const ownersById = new Map(input.owners.map((owner) => [owner.id, owner]));
  const petsById = new Map(input.pets.map((pet) => [pet.id, pet]));
  const petNamesByOwner = new Map<string, string[]>();
  for (const pet of input.pets) {
    const next = petNamesByOwner.get(pet.ownerId) ?? [];
    next.push(pet.name);
    petNamesByOwner.set(pet.ownerId, next);
  }

  const currentOwnerIds = new Set(currentRequests.map((request) => request.ownerId));
  const previousOwnerIds = new Set(
    previousRequests.map((request) => request.ownerId)
  );
  const lifetimeRequestCountByOwner = new Map<string, number>();
  const latestRequestByOwner = new Map<string, string>();
  for (const request of input.requests) {
    lifetimeRequestCountByOwner.set(
      request.ownerId,
      (lifetimeRequestCountByOwner.get(request.ownerId) ?? 0) + 1
    );
    const currentLatest = latestRequestByOwner.get(request.ownerId);
    if (!currentLatest || request.createdAt > currentLatest) {
      latestRequestByOwner.set(request.ownerId, request.createdAt);
    }
  }

  const activeOwners = currentOwnerIds.size;
  const previousActiveOwners = previousOwnerIds.size;
  const newOwners = input.owners.filter((owner) =>
    inRange(owner.createdAt, input.range.start, input.range.end)
  ).length;
  const repeatOwners = Array.from(currentOwnerIds).filter(
    (ownerId) => (lifetimeRequestCountByOwner.get(ownerId) ?? 0) >= 2
  ).length;
  const reactivatedOwners = Array.from(currentOwnerIds).filter(
    (ownerId) =>
      !previousOwnerIds.has(ownerId) &&
      input.requests.some(
        (request) =>
          request.ownerId === ownerId && before(request.createdAt, input.range.start)
      )
  ).length;

  const atRiskOwners = input.owners
    .filter((owner) => {
      const lastRequestAt = latestRequestByOwner.get(owner.id);
      return Boolean(lastRequestAt && before(lastRequestAt, input.range.start));
    })
    .filter((owner) => !currentOwnerIds.has(owner.id))
    .map((owner) => ({
      ownerId: owner.id,
      ownerName: owner.name ?? owner.phone,
      petNames: petNamesByOwner.get(owner.id) ?? [],
      lastRequestAt: latestRequestByOwner.get(owner.id) ?? null,
      requestCount: lifetimeRequestCountByOwner.get(owner.id) ?? 0
    }))
    .sort((a, b) => String(b.lastRequestAt).localeCompare(String(a.lastRequestAt)))
    .slice(0, 8);

  const firstResponseValues = firstResponseMinutes(input);
  const firstResponseMedian = median(firstResponseValues);
  const resolutionValues = currentRequests
    .filter((request) => request.resolvedAt)
    .map(
      (request) =>
        (new Date(request.resolvedAt as string).getTime() -
          new Date(request.createdAt).getTime()) /
        60000
    )
    .filter((value) => value >= 0);
  const resolutionMedian = median(resolutionValues);
  const currentReopenEvents = input.requestEvents.filter(
    (event) =>
      event.eventType === "reopened" &&
      inRange(event.createdAt, input.range.start, input.range.end)
  );
  const resolvedInRange = currentRequests.filter(
    (request) => request.resolvedAt && inRange(request.resolvedAt, input.range.start, input.range.end)
  ).length;

  const currentReminders = input.reminders.filter((reminder) =>
    inRange(reminder.dueAt, input.range.start, input.range.end)
  );
  const sentReminders = currentReminders.filter((reminder) =>
    ["sent", "acknowledged", "completed"].includes(reminder.status)
  ).length;
  const acknowledgedReminders = currentReminders.filter(
    (reminder) => reminder.status === "acknowledged" || reminder.acknowledgedAt
  ).length;

  const currentOutbound = input.outboundMessages.filter((message) =>
    inRange(message.createdAt, input.range.start, input.range.end)
  );
  const failedOutbound = currentOutbound.filter(
    (message) => message.status === "failed"
  ).length;
  const fallbackOutbound = currentOutbound.filter(
    (message) =>
      message.source === "sms_fallback" || message.fallbackOfOutboundMessageId
  ).length;

  const today = new Date(input.range.generatedAt);
  const dueSoonCutoff = new Date(
    today.getTime() + VACCINE_DUE_SOON_DAYS * MS_PER_DAY
  );
  const vaccineOverdue = input.vaccinations.filter(
    (vaccination) =>
      vaccination.nextDueAt &&
      new Date(vaccination.nextDueAt).getTime() < today.getTime()
  );
  const vaccineDueSoon = input.vaccinations.filter(
    (vaccination) =>
      vaccination.nextDueAt &&
      new Date(vaccination.nextDueAt).getTime() >= today.getTime() &&
      new Date(vaccination.nextDueAt).getTime() <= dueSoonCutoff.getTime()
  );

  const weightsByPet = new Map<string, BuildReportsInput["weights"]>();
  for (const weight of input.weights) {
    const next = weightsByPet.get(weight.petId) ?? [];
    next.push(weight);
    weightsByPet.set(weight.petId, next);
  }
  const weightWatchItems: WatchlistItem[] = [];
  const weightTrendPoints: TrendPoint[] = [];
  for (const [petId, rows] of weightsByPet) {
    const sorted = [...rows].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
    const latest = sorted[0];
    const previous = sorted[1];
    if (latest) {
      weightTrendPoints.push({
        date: latest.measuredAt,
        label: dayLabel(dayKey(latest.measuredAt)),
        value: latest.weightKg
      });
    }
    if (!latest || !previous) continue;
    const ratio = (latest.weightKg - previous.weightKg) / previous.weightKg;
    if (Math.abs(ratio) >= WEIGHT_WATCH_RATIO) {
      const pet = petsById.get(petId);
      const owner = pet ? ownersById.get(pet.ownerId) : null;
      weightWatchItems.push({
        id: `weight-${petId}`,
        petId,
        petName: pet?.name ?? "Unknown pet",
        ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
        reason: "Weight change",
        detail: `${ratio > 0 ? "+" : ""}${Math.round(ratio * 100)}% since prior entry`,
        tone: Math.abs(ratio) >= 0.15 ? "danger" : "warn"
      });
    }
  }

  const medicalSignalsByPet = new Map<string, number>();
  for (const request of currentRequests) {
    if (!request.petId) continue;
    if (
      request.category === "medical_question" ||
      request.urgency === "high" ||
      riskFlagCount(request.riskFlags) > 0
    ) {
      medicalSignalsByPet.set(
        request.petId,
        (medicalSignalsByPet.get(request.petId) ?? 0) + 1
      );
    }
  }
  const repeatMedicalWatch: WatchlistItem[] = Array.from(
    medicalSignalsByPet.entries()
  )
    .filter(([, count]) => count >= 2)
    .map(([petId, count]) => {
      const pet = petsById.get(petId);
      const owner = pet ? ownersById.get(pet.ownerId) : null;
      return {
        id: `medical-${petId}`,
        petId,
        petName: pet?.name ?? "Unknown pet",
        ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
        reason: "Repeat health signal",
        detail: `${count} health-related requests in this range`,
        tone: "warn" as const
      };
    });

  const vaccineWatch: WatchlistItem[] = [...vaccineOverdue, ...vaccineDueSoon]
    .slice(0, 8)
    .map((vaccination) => {
      const pet = petsById.get(vaccination.petId);
      const owner = pet ? ownersById.get(pet.ownerId) : null;
      const overdue =
        vaccination.nextDueAt &&
        new Date(vaccination.nextDueAt).getTime() < today.getTime();
      return {
        id: `vaccine-${vaccination.id}`,
        petId: vaccination.petId,
        petName: pet?.name ?? "Unknown pet",
        ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
        reason: overdue ? "Vaccine overdue" : "Vaccine due soon",
        detail: `${vaccination.vaccineName} due ${vaccination.nextDueAt ?? "soon"}`,
        tone: overdue ? "danger" : "warn"
      };
    });

  const currentAiOutputs = input.aiOutputs.filter((output) =>
    inRange(output.createdAt, input.range.start, input.range.end)
  );
  const reviewedDrafts = currentAiOutputs.filter(
    (output) =>
      output.kind === "reply_draft" &&
      !["pending", "not_reviewable"].includes(output.reviewStatus)
  );
  const editedDrafts = reviewedDrafts.filter((output) =>
    ["accepted_with_edits", "edited"].includes(output.reviewStatus)
  ).length;
  const aiLatency = currentAiOutputs
    .map((output) => output.latencyMs)
    .filter((value): value is number => typeof value === "number");
  const p95Latency = percentile(aiLatency, 95);
  const blockedAi = currentAiOutputs.filter(
    (output) => output.status === "blocked"
  ).length;
  const providerErrors = currentAiOutputs.filter(
    (output) => output.status === "provider_error"
  ).length;
  const memoryInRange = input.aiMemoryItems.filter((memory) =>
    inRange(memory.createdAt, input.range.start, input.range.end)
  );
  const acceptedMemory = memoryInRange.filter(
    (memory) => memory.status === "accepted"
  ).length;
  const rejectedMemory = memoryInRange.filter(
    (memory) => memory.status === "rejected"
  ).length;

  const invoices = input.canViewFinancial
    ? input.invoices.filter(
        (invoice) =>
          !invoice.voidedAt &&
          inRange(invoice.issuedAt, input.range.start, input.range.end)
      )
    : [];
  const invoiceCurrency = invoices[0]?.currency ?? "EUR";
  const totalSpend = invoices.reduce(
    (sum, invoice) => sum + invoice.grossAmountCents,
    0
  );
  const spendByOwner = new Map<string, number>();
  for (const invoice of invoices) {
    spendByOwner.set(
      invoice.ownerId,
      (spendByOwner.get(invoice.ownerId) ?? 0) + invoice.grossAmountCents
    );
  }
  const topOwnerValue = Array.from(spendByOwner.entries())
    .map(([ownerId, spendCents]) => {
      const owner = ownersById.get(ownerId);
      return {
        ownerId,
        ownerName: owner?.name ?? owner?.phone ?? "Unknown owner",
        petNames: petNamesByOwner.get(ownerId) ?? [],
        spendCents,
        requestCount: lifetimeRequestCountByOwner.get(ownerId) ?? 0
      };
    })
    .sort((a, b) => b.spendCents - a.spendCents)
    .slice(0, 8);

  const requestTrend = buildDailyTrend(
    input.range,
    currentRequests.map((request) => request.createdAt),
    previousRequests.map((request) => request.createdAt)
  );

  const overviewMetrics = [
    metric("Requests", numberFmt(currentRequests.length), "New owner requests", {
      delta: delta(currentRequests.length, previousRequests.length)
    }),
    metric("Active owners", numberFmt(activeOwners), "Owners with a request", {
      delta: delta(activeOwners, previousActiveOwners)
    }),
    metric("First response", minutesFmt(firstResponseMedian), "Median staff reply"),
    metric("AI draft edit rate", `${percent(editedDrafts, reviewedDrafts.length)}%`, "Reviewed drafts edited")
  ];

  const insightChips = [
    `${repeatOwners} repeat owner${repeatOwners === 1 ? "" : "s"} active`,
    `${openRequests.length} open request${openRequests.length === 1 ? "" : "s"}`,
    `${vaccineOverdue.length + vaccineDueSoon.length} vaccine follow-up signal${
      vaccineOverdue.length + vaccineDueSoon.length === 1 ? "" : "s"
    }`,
    input.canViewFinancial && invoices.length > 0
      ? `${moneyFmt(totalSpend, invoiceCurrency)} PMS value imported`
      : "PMS spend waits for invoice-summary import"
  ];

  return {
    range: input.range,
    overview: {
      metrics: overviewMetrics,
      requestTrend,
      insightChips,
      pilotTargets: [
        metric("150 requests", `${currentRequests.length}/150`, "Pilot processed-request target"),
        metric("<=4h response", minutesFmt(firstResponseMedian), "Median first response"),
        metric("95% reminders", `${percent(sentReminders, currentReminders.length)}%`, "Reminder send success proxy"),
        metric("Zero safety incidents", `${blockedAi}`, "Blocked AI outputs to review")
      ]
    },
    owners: {
      metrics: [
        metric("Retention", `${percent(repeatOwners, activeOwners)}%`, "Repeat-owner share"),
        metric("New owners", numberFmt(newOwners), "Created in range"),
        metric("Reactivated", numberFmt(reactivatedOwners), "Returned after quiet period"),
        metric(
          "Owner value",
          input.canViewFinancial && invoices.length > 0
            ? moneyFmt(totalSpend, invoiceCurrency)
            : "Not connected",
          "Requires PMS invoice summaries",
          { tone: input.canViewFinancial ? "neutral" : "warn" }
        )
      ],
      retentionCohorts: buildRetentionCohorts(input),
      atRiskOwners,
      topOwnerValue,
      financialAvailable: input.canViewFinancial && invoices.length > 0,
      financialRestricted: !input.canViewFinancial
    },
    pets: {
      metrics: [
        metric("Overdue vaccines", numberFmt(vaccineOverdue.length), "Need staff review", {
          tone: vaccineOverdue.length > 0 ? "danger" : "good"
        }),
        metric("Due soon", numberFmt(vaccineDueSoon.length), "Next 30 days"),
        metric("Weight watch", numberFmt(weightWatchItems.length), ">=10% latest change"),
        metric("Repeat health signals", numberFmt(repeatMedicalWatch.length), "Pets with 2+ signals")
      ],
      watchlist: [...vaccineWatch, ...weightWatchItems, ...repeatMedicalWatch].slice(0, 12),
      speciesBreakdown: breakdown(input.pets.map((pet) => pet.species)),
      weightTrend: weightTrendPoints
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)
    },
    operations: {
      metrics: [
        metric("Resolution", minutesFmt(resolutionMedian), "Median time to resolved"),
        metric("Backlog", numberFmt(openRequests.length), "Open requests now"),
        metric("Reminder ack", `${percent(acknowledgedReminders, sentReminders)}%`, "Acknowledged after send"),
        metric("Delivery failures", `${percent(failedOutbound, currentOutbound.length)}%`, `${fallbackOutbound} SMS fallback`),
        metric("Reopen rate", `${percent(currentReopenEvents.length, resolvedInRange)}%`, "Reopened after resolved")
      ],
      categoryBreakdown: breakdown(currentRequests.map((request) => request.category)),
      urgencyBreakdown: breakdown(currentRequests.map((request) => request.urgency)),
      channelBreakdown: breakdown(currentRequests.map((request) => request.channel)),
      reminderFunnel: breakdown(currentReminders.map((reminder) => reminder.status)),
      deliveryBreakdown: breakdown(currentOutbound.map((message) => message.status))
    },
    ai: {
      metrics: [
        metric("AI outputs", numberFmt(currentAiOutputs.length), "Generated in range"),
        metric("Draft edit rate", `${percent(editedDrafts, reviewedDrafts.length)}%`, "Edited before acceptance"),
        metric("Memory accepted", `${percent(acceptedMemory, acceptedMemory + rejectedMemory)}%`, "Accepted vs rejected"),
        metric("p95 latency", p95Latency ? `${Math.round(p95Latency)}ms` : "n/a", `${providerErrors} provider errors`)
      ],
      outputStatusBreakdown: breakdown(currentAiOutputs.map((output) => output.status)),
      reviewStatusBreakdown: breakdown(
        currentAiOutputs.map((output) => output.reviewStatus)
      ),
      kindBreakdown: breakdown(currentAiOutputs.map((output) => output.kind)),
      latencyTrend: buildDailyTrend(
        input.range,
        currentAiOutputs
          .filter((output) => output.latencyMs !== null)
          .map((output) => output.createdAt)
      )
    },
    exports: {
      overviewCsv: [
        ["Metric", "Value", "Detail"],
        ...overviewMetrics.map((row) => [row.label, row.value, row.detail])
      ],
      ownersCsv: [
        ["Owner", "Pets", "Last request", "Requests"],
        ...atRiskOwners.map((owner) => [
          owner.ownerName,
          owner.petNames.join(", "),
          owner.lastRequestAt ?? "",
          String(owner.requestCount)
        ])
      ],
      petsCsv: [
        ["Pet", "Owner", "Reason", "Detail"],
        ...[...vaccineWatch, ...weightWatchItems, ...repeatMedicalWatch].map((item) => [
          item.petName,
          item.ownerName,
          item.reason,
          item.detail
        ])
      ],
      operationsCsv: [
        ["Metric", "Value", "Detail"],
        ...[
          metric("Resolution", minutesFmt(resolutionMedian), "Median time to resolved"),
          metric("Backlog", numberFmt(openRequests.length), "Open requests now"),
          metric("Reminder ack", `${percent(acknowledgedReminders, sentReminders)}%`, "Acknowledged after send"),
          metric("Delivery failures", `${percent(failedOutbound, currentOutbound.length)}%`, `${fallbackOutbound} SMS fallback`),
          metric("Reopen rate", `${percent(currentReopenEvents.length, resolvedInRange)}%`, "Reopened after resolved")
        ].map((row) => [row.label, row.value, row.detail])
      ],
      aiCsv: [
        ["Metric", "Value", "Detail"],
        ...[
          metric("AI outputs", numberFmt(currentAiOutputs.length), "Generated in range"),
          metric("Draft edit rate", `${percent(editedDrafts, reviewedDrafts.length)}%`, "Edited before acceptance"),
          metric("Memory accepted", `${percent(acceptedMemory, acceptedMemory + rejectedMemory)}%`, "Accepted vs rejected"),
          metric("p95 latency", p95Latency ? `${Math.round(p95Latency)}ms` : "n/a", `${providerErrors} provider errors`)
        ].map((row) => [row.label, row.value, row.detail])
      ]
    }
  };
}
