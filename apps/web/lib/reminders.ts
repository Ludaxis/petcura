import "server-only";

import type {
  Database,
  ReminderStatus,
  ReminderType,
  RequestChannel
} from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ReminderFilter = ReminderStatus | "all";

export const reminderFilterOrder: ReminderFilter[] = [
  "all",
  "scheduled",
  "sent",
  "acknowledged",
  "missed",
  "completed",
  "cancelled"
];

export function isReminderFilter(value: unknown): value is ReminderFilter {
  return (
    typeof value === "string" &&
    reminderFilterOrder.includes(value as ReminderFilter)
  );
}

type ReminderRow = Pick<
  Database["public"]["Tables"]["reminders"]["Row"],
  | "id"
  | "request_id"
  | "pet_id"
  | "type"
  | "title"
  | "body"
  | "due_at"
  | "channel"
  | "status"
  | "sent_at"
  | "acknowledged_at"
  | "completed_at"
  | "send_attempts"
  | "last_send_error"
  | "created_at"
> & {
  pets: {
    id: string;
    name: string;
    species: string;
    owners: {
      id: string;
      name: string;
      phone: string;
      preferred_language: string;
    } | null;
  } | null;
  requests: {
    id: string;
    owners: {
      id: string;
      name: string;
      phone: string;
      preferred_language: string;
    } | null;
  } | null;
};

export type ReminderListItem = {
  id: string;
  requestId: string | null;
  petId: string | null;
  type: ReminderType;
  title: string;
  body: string | null;
  dueAt: string;
  channel: RequestChannel;
  status: ReminderStatus;
  sentAt: string | null;
  acknowledgedAt: string | null;
  completedAt: string | null;
  sendAttempts: number;
  lastSendError: string | null;
  createdAt: string;
  petName: string;
  species: string;
  ownerName: string;
  ownerPhone: string;
  ownerLanguage: string;
};

function toReminderListItem(row: ReminderRow): ReminderListItem {
  const owner = row.requests?.owners ?? row.pets?.owners ?? null;
  return {
    id: row.id,
    requestId: row.request_id,
    petId: row.pet_id,
    type: row.type as ReminderType,
    title: row.title,
    body: row.body,
    dueAt: row.due_at,
    channel: row.channel,
    status: row.status as ReminderStatus,
    sentAt: row.sent_at,
    acknowledgedAt: row.acknowledged_at,
    completedAt: row.completed_at,
    sendAttempts: row.send_attempts,
    lastSendError: row.last_send_error,
    createdAt: row.created_at,
    petName: row.pets?.name ?? "Unknown pet",
    species: row.pets?.species ?? "unknown",
    ownerName: owner?.name ?? "Unknown owner",
    ownerPhone: owner?.phone ?? "",
    ownerLanguage: owner?.preferred_language ?? "en"
  };
}

export async function listReminders(
  supabase: ServerSupabaseClient,
  clinicId: string,
  filter: ReminderFilter = "all"
) {
  let query = supabase
    .from("reminders")
    .select(
      "id, request_id, pet_id, type, title, body, due_at, channel, status, sent_at, acknowledged_at, completed_at, send_attempts, last_send_error, created_at, pets(id, name, species, owners(id, name, phone, preferred_language)), requests(id, owners(id, name, phone, preferred_language))"
    )
    .eq("clinic_id", clinicId)
    .order("due_at", { ascending: true });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load reminders: ${error.message}`);
  }

  return ((data ?? []) as unknown as ReminderRow[]).map(toReminderListItem);
}

export async function listReminderCounts(
  supabase: ServerSupabaseClient,
  clinicId: string
) {
  const entries = await Promise.all(
    reminderFilterOrder.map(async (status) => {
      let query = supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId);

      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Could not load reminder count: ${error.message}`);
      }

      return [status, count ?? 0] as const;
    })
  );

  return Object.fromEntries(entries) as Record<ReminderFilter, number>;
}

export async function listRequestReminders(
  supabase: ServerSupabaseClient,
  clinicId: string,
  requestId: string
) {
  const { data, error } = await supabase
    .from("reminders")
    .select(
      "id, request_id, pet_id, type, title, body, due_at, channel, status, sent_at, acknowledged_at, completed_at, send_attempts, last_send_error, created_at, pets(id, name, species, owners(id, name, phone, preferred_language)), requests(id, owners(id, name, phone, preferred_language))"
    )
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("due_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load request reminders: ${error.message}`);
  }

  return ((data ?? []) as unknown as ReminderRow[]).map(toReminderListItem);
}

export async function getOpenReminderCount(
  supabase: ServerSupabaseClient,
  clinicId: string
) {
  const { count, error } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("clinic_id", clinicId)
    .in("status", ["scheduled", "sent", "missed"]);

  if (error) {
    throw new Error(`Could not load reminder count: ${error.message}`);
  }

  return count ?? 0;
}
