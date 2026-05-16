import type { RequestCategory, RequestChannel, RequestUrgency } from "@petcura/shared";

export type ReportRangePreset = "7d" | "30d" | "90d";
export type ReportTab = "overview" | "owners" | "pets" | "operations" | "ai";

export type ReportRange = {
  preset: ReportRangePreset;
  days: number;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  generatedAt: string;
};

export type MetricDelta = {
  value: number;
  label: string;
  direction: "up" | "down" | "flat";
};

export type ReportMetric = {
  label: string;
  value: string;
  detail: string;
  delta?: MetricDelta;
  tone?: "neutral" | "good" | "warn" | "danger";
};

export type TrendPoint = {
  date: string;
  label: string;
  value: number;
  comparison?: number;
};

export type BreakdownItem = {
  key: string;
  label: string;
  value: number;
  percent: number;
};

export type CohortCell = {
  offset: number;
  retained: number;
  total: number;
  percent: number;
};

export type RetentionCohort = {
  cohort: string;
  label: string;
  total: number;
  cells: CohortCell[];
};

export type WatchlistItem = {
  id: string;
  petId: string;
  petName: string;
  ownerName: string;
  reason: string;
  detail: string;
  tone: "warn" | "danger" | "neutral";
};

export type OwnerValueItem = {
  ownerId: string;
  ownerName: string;
  petNames: string[];
  spendCents: number;
  requestCount: number;
};

export type ReportsDashboard = {
  range: ReportRange;
  overview: {
    metrics: ReportMetric[];
    requestTrend: TrendPoint[];
    insightChips: string[];
    pilotTargets: ReportMetric[];
  };
  owners: {
    metrics: ReportMetric[];
    retentionCohorts: RetentionCohort[];
    atRiskOwners: Array<{
      ownerId: string;
      ownerName: string;
      petNames: string[];
      lastRequestAt: string | null;
      requestCount: number;
    }>;
    topOwnerValue: OwnerValueItem[];
    financialAvailable: boolean;
    financialRestricted: boolean;
  };
  pets: {
    metrics: ReportMetric[];
    watchlist: WatchlistItem[];
    speciesBreakdown: BreakdownItem[];
    weightTrend: TrendPoint[];
  };
  operations: {
    metrics: ReportMetric[];
    categoryBreakdown: BreakdownItem[];
    urgencyBreakdown: BreakdownItem[];
    channelBreakdown: BreakdownItem[];
    reminderFunnel: BreakdownItem[];
    deliveryBreakdown: BreakdownItem[];
  };
  ai: {
    metrics: ReportMetric[];
    outputStatusBreakdown: BreakdownItem[];
    reviewStatusBreakdown: BreakdownItem[];
    kindBreakdown: BreakdownItem[];
    latencyTrend: TrendPoint[];
  };
  exports: {
    overviewCsv: string[][];
    ownersCsv: string[][];
    petsCsv: string[][];
    operationsCsv: string[][];
    aiCsv: string[][];
  };
};

export type ReportOwnerRow = {
  id: string;
  name: string | null;
  phone: string;
  createdAt: string;
};

export type ReportPetRow = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
};

export type ReportRequestRow = {
  id: string;
  ownerId: string;
  petId: string | null;
  category: RequestCategory;
  status: string;
  urgency: RequestUrgency;
  channel: RequestChannel;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  riskFlags: unknown;
};

export type ReportMessageRow = {
  id: string;
  requestId: string;
  senderType: "owner" | "staff" | "system" | "ai";
  createdAt: string;
};

export type ReportRequestEventRow = {
  id: string;
  requestId: string;
  eventType: string;
  createdAt: string;
};

export type ReportReminderRow = {
  id: string;
  type: string;
  status: string;
  dueAt: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
};

export type ReportVaccinationRow = {
  id: string;
  petId: string;
  vaccineName: string;
  administeredAt: string;
  nextDueAt: string | null;
};

export type ReportWeightRow = {
  id: string;
  petId: string;
  weightKg: number;
  measuredAt: string;
};

export type ReportAiOutputRow = {
  id: string;
  kind: string;
  status: string;
  reviewStatus: string;
  accepted: boolean | null;
  latencyMs: number | null;
  createdAt: string;
};

export type ReportAiMemoryRow = {
  id: string;
  status: string;
  createdAt: string;
};

export type ReportOutboundRow = {
  id: string;
  channel: RequestChannel;
  source: string;
  status: string;
  fallbackOfOutboundMessageId: string | null;
  createdAt: string;
};

export type ReportInvoiceRow = {
  id: string;
  ownerId: string;
  petId: string | null;
  issuedAt: string;
  currency: string;
  grossAmountCents: number;
  serviceCategory: string | null;
  voidedAt: string | null;
};

export type BuildReportsInput = {
  range: ReportRange;
  clinicName: string;
  canViewFinancial: boolean;
  owners: ReportOwnerRow[];
  pets: ReportPetRow[];
  requests: ReportRequestRow[];
  messages: ReportMessageRow[];
  requestEvents: ReportRequestEventRow[];
  reminders: ReportReminderRow[];
  vaccinations: ReportVaccinationRow[];
  weights: ReportWeightRow[];
  aiOutputs: ReportAiOutputRow[];
  aiMemoryItems: ReportAiMemoryRow[];
  outboundMessages: ReportOutboundRow[];
  invoices: ReportInvoiceRow[];
};
