import "server-only";

import type {
  Database,
  RequestCategory,
  RequestChannel,
  RequestStatus,
  RequestUrgency,
  SupportedLocale
} from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type InboxStream =
  | "all"
  | "urgent"
  | "today"
  | "week"
  | "routine"
  | "mine"
  | "unassigned"
  | "resolved";

export type InboxView = "list" | "board";

export type UrgencyTier = "urgent" | "today" | "week" | "routine";

export type InboxRowData = {
  id: string;
  status: RequestStatus;
  urgency: RequestUrgency;
  tier: UrgencyTier;
  category: RequestCategory;
  channel: RequestChannel;
  petName: string;
  ownerName: string;
  ownerLanguage: string;
  preview: string;
  updatedAt: string;
  createdAt: string;
  assignedStaffId: string | null;
  assignedToCurrentUser: boolean;
};

type RequestRow = Pick<
  Database["public"]["Tables"]["requests"]["Row"],
  | "id"
  | "assigned_staff_id"
  | "category"
  | "channel"
  | "status"
  | "urgency"
  | "ai_summary"
  | "created_at"
  | "updated_at"
> & {
  owners: Pick<
    Database["public"]["Tables"]["owners"]["Row"],
    "id" | "name" | "phone" | "preferred_language"
  > | null;
  pets: Pick<
    Database["public"]["Tables"]["pets"]["Row"],
    "id" | "name" | "species"
  > | null;
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const EIGHT_HOURS_MS = 8 * ONE_HOUR_MS;
const FIVE_DAYS_MS = 5 * 24 * ONE_HOUR_MS;

export function classifyTier(input: {
  urgency: RequestUrgency;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  now?: number;
}): UrgencyTier {
  const now = input.now ?? Date.now();
  const updated = new Date(input.updatedAt).getTime();
  const age = now - updated;

  if (input.status === "resolved") {
    return "routine";
  }
  if (input.urgency === "high" || age <= ONE_HOUR_MS) {
    return "urgent";
  }
  if (input.urgency === "medium" || age <= EIGHT_HOURS_MS) {
    return "today";
  }
  if (age <= FIVE_DAYS_MS) {
    return "week";
  }
  return "routine";
}

function previewFromSummary(row: RequestRow) {
  if (row.ai_summary) {
    return row.ai_summary;
  }
  return `${row.pets?.name ?? "Pet"} request from ${row.owners?.name ?? "owner"}`;
}

function toRow(row: RequestRow, currentStaffId: string | null): InboxRowData {
  const tier = classifyTier({
    urgency: row.urgency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });

  return {
    id: row.id,
    status: row.status,
    urgency: row.urgency,
    tier,
    category: row.category,
    channel: row.channel,
    petName: row.pets?.name ?? "Unknown pet",
    ownerName: row.owners?.name ?? "Unknown owner",
    ownerLanguage: row.owners?.preferred_language ?? "en",
    preview: previewFromSummary(row),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    assignedStaffId: row.assigned_staff_id,
    assignedToCurrentUser:
      currentStaffId !== null && row.assigned_staff_id === currentStaffId
  };
}

function applyStreamFilter(rows: InboxRowData[], stream: InboxStream) {
  switch (stream) {
    case "urgent":
      return rows.filter((r) => r.tier === "urgent" && r.status !== "resolved");
    case "today":
      return rows.filter((r) => r.tier === "today" && r.status !== "resolved");
    case "week":
      return rows.filter((r) => r.tier === "week" && r.status !== "resolved");
    case "routine":
      return rows.filter(
        (r) => r.tier === "routine" && r.status !== "resolved"
      );
    case "mine":
      return rows.filter(
        (r) => r.assignedToCurrentUser && r.status !== "resolved"
      );
    case "unassigned":
      return rows.filter(
        (r) => r.assignedStaffId === null && r.status !== "resolved"
      );
    case "resolved":
      // "Resolved" is a real stream now, not an absent-status edge case.
      // It surfaces the cool-down lane and feeds the new sidebar tab.
      return rows.filter((r) => r.status === "resolved");
    case "all":
    default:
      // "All open" hides resolved threads — keep this lane focused on work
      // that still needs attention. Resolved has its own stream.
      return rows.filter((r) => r.status !== "resolved");
  }
}

export type ListInboxRequestsOptions = {
  stream?: InboxStream;
  view?: InboxView;
  locale?: SupportedLocale;
  staffMembershipId?: string | null;
};

export async function listInboxRequests(
  supabase: ServerSupabaseClient,
  clinicId: string,
  options: ListInboxRequestsOptions = {}
) {
  const stream = options.stream ?? "all";
  const staffId = options.staffMembershipId ?? null;

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, assigned_staff_id, category, channel, status, urgency, ai_summary, created_at, updated_at, owners(id, name, phone, preferred_language), pets(id, name, species)"
    )
    .eq("clinic_id", clinicId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load inbox requests: ${error.message}`);
  }

  const rows = ((data ?? []) as unknown as RequestRow[]).map((row) =>
    toRow(row, staffId)
  );

  return applyStreamFilter(rows, stream);
}

export type StreamCounts = Record<InboxStream, number>;

export async function getInboxStreamCounts(
  supabase: ServerSupabaseClient,
  clinicId: string,
  staffMembershipId: string | null
): Promise<StreamCounts> {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, assigned_staff_id, status, urgency, created_at, updated_at"
    )
    .eq("clinic_id", clinicId);

  if (error) {
    throw new Error(`Could not load inbox counts: ${error.message}`);
  }

  const now = Date.now();
  const counts: StreamCounts = {
    all: 0,
    urgent: 0,
    today: 0,
    week: 0,
    routine: 0,
    mine: 0,
    unassigned: 0,
    resolved: 0
  };

  for (const row of data ?? []) {
    const tier = classifyTier({
      urgency: row.urgency,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      now
    });

    if (row.status === "resolved") {
      // Resolved threads live in their own stream now — they no longer
      // inflate the top-level "All open" count shown next to Inbox in the
      // sidebar.
      counts.resolved += 1;
      continue;
    }
    counts.all += 1;
    counts[tier] += 1;
    if (row.assigned_staff_id === null) {
      counts.unassigned += 1;
    }
    if (
      staffMembershipId !== null &&
      row.assigned_staff_id === staffMembershipId
    ) {
      counts.mine += 1;
    }
  }

  return counts;
}

export function isInboxStream(value: unknown): value is InboxStream {
  return (
    typeof value === "string" &&
    [
      "all",
      "urgent",
      "today",
      "week",
      "routine",
      "mine",
      "unassigned",
      "resolved"
    ].includes(value)
  );
}

export function isInboxView(value: unknown): value is InboxView {
  return value === "list" || value === "board";
}
