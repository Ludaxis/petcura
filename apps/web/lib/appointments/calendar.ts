import "server-only";

import type { Database } from "@petcura/shared";
import { createAdminClient } from "@/lib/supabase/admin";

type DynamicQuery = {
  select: (columns?: string) => DynamicQuery;
  insert: (values: unknown) => DynamicQuery;
  update: (values: unknown) => DynamicQuery;
  delete: () => DynamicQuery;
  eq: (column: string, value: unknown) => DynamicQuery;
  neq: (column: string, value: unknown) => DynamicQuery;
  in: (column: string, values: unknown[]) => DynamicQuery;
  gte: (column: string, value: unknown) => DynamicQuery;
  lte: (column: string, value: unknown) => DynamicQuery;
  lt: (column: string, value: unknown) => DynamicQuery;
  gt: (column: string, value: unknown) => DynamicQuery;
  order: (column: string, options?: { ascending?: boolean }) => DynamicQuery;
  limit: (count: number) => DynamicQuery;
  single: () => DynamicQuery;
  maybeSingle: () => DynamicQuery;
  then: PromiseLike<{ data: unknown; error: { message: string } | null }>["then"];
};

type DynamicDb = {
  from: (table: string) => DynamicQuery;
};

const SLOT_GRANULARITY_MINUTES = 15;
const DEFAULT_HOLD_MINUTES = 10;

export type CalendarStaff = {
  id: string;
  userId: string;
  role: Database["public"]["Enums"]["staff_role"];
  label: string;
};

export type AvailabilityRule = {
  id: string;
  clinicId: string;
  staffId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  serviceIds: string[];
  isActive: boolean;
};

export type StaffTimeOff = {
  id: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
};

export type AppointmentSlot = {
  staffId: string;
  staffLabel: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  serviceId: string | null;
};

export type AppointmentOffer = {
  id: string;
  appointmentId: string;
  requestId: string | null;
  status: "draft" | "sent" | "accepted" | "expired" | "cancelled";
  slots: AppointmentSlot[];
  expiresAt: string;
  acceptedSlotIndex: number | null;
  createdAt: string;
};

export type CalendarAppointment = {
  id: string;
  requestId: string | null;
  ownerId: string;
  ownerName: string;
  petId: string;
  petName: string;
  serviceId: string | null;
  serviceName: string;
  proposedWindow: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  staffId: string | null;
  status: Database["public"]["Enums"]["appointment_status"];
  notes: string | null;
  createdAt: string;
};

export type AppointmentContext = {
  appointment: CalendarAppointment;
  offers: AppointmentOffer[];
  suggestedSlots: AppointmentSlot[];
};

type AppointmentRow = {
  id: string;
  request_id: string | null;
  owner_id: string;
  pet_id: string;
  service_id: string | null;
  proposed_window: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  staff_id: string | null;
  status: Database["public"]["Enums"]["appointment_status"];
  notes: string | null;
  created_at: string;
  owners?: { id: string; name: string | null } | null;
  pets?: { id: string; name: string | null } | null;
  services?: { id: string; name_json: Record<string, string> | null; duration_minutes: number | null } | null;
};

type StaffRow = {
  id: string;
  user_id: string;
  role: Database["public"]["Enums"]["staff_role"];
};

type RuleRow = {
  id: string;
  clinic_id: string;
  staff_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  service_ids: string[] | null;
  is_active: boolean;
};

type TimeOffRow = {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

type OfferRow = {
  id: string;
  appointment_id: string;
  request_id: string | null;
  status: AppointmentOffer["status"];
  slots_json: unknown;
  expires_at: string;
  accepted_slot_index: number | null;
  created_at: string;
};

type BusyRange = {
  staffId: string;
  startsAt: Date;
  endsAt: Date;
};

function db(): DynamicDb {
  return createAdminClient() as unknown as DynamicDb;
}

function localizedName(value: Record<string, string> | null | undefined, locale: string) {
  return value?.[locale] ?? value?.en ?? Object.values(value ?? {})[0] ?? "Appointment";
}

function getParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second")
  };
}

function zonedDateTimeToUtc(
  date: { year: number; month: number; day: number },
  time: string,
  timeZone: string
) {
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hour ?? 0,
    minute ?? 0
  );
  const probe = new Date(localAsUtc);
  const parts = getParts(probe, timeZone);
  const probeLocalAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const offset = probeLocalAsUtc - probe.getTime();
  return new Date(localAsUtc - offset);
}

function addDays(date: { year: number; month: number; day: number }, days: number) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function weekday(date: { year: number; month: number; day: number }) {
  return new Date(Date.UTC(date.year, date.month - 1, date.day, 12)).getUTCDay();
}

function roundUp(date: Date, minutes: number) {
  const step = minutes * 60_000;
  return new Date(Math.ceil(date.getTime() / step) * step);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function parseAppointmentSlots(value: unknown): AppointmentSlot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((slot) => {
      if (!slot || typeof slot !== "object") return null;
      const row = slot as Record<string, unknown>;
      if (
        typeof row.staffId !== "string" ||
        typeof row.staffLabel !== "string" ||
        typeof row.startsAt !== "string" ||
        typeof row.endsAt !== "string" ||
        typeof row.durationMinutes !== "number"
      ) {
        return null;
      }
      return {
        staffId: row.staffId,
        staffLabel: row.staffLabel,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        durationMinutes: row.durationMinutes,
        serviceId: typeof row.serviceId === "string" ? row.serviceId : null
      };
    })
    .filter((slot): slot is AppointmentSlot => slot !== null);
}

function mapOffer(row: OfferRow): AppointmentOffer {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    requestId: row.request_id,
    status: row.status,
    slots: parseAppointmentSlots(row.slots_json),
    expiresAt: row.expires_at,
    acceptedSlotIndex: row.accepted_slot_index,
    createdAt: row.created_at
  };
}

function mapAppointment(row: AppointmentRow, locale: string): CalendarAppointment {
  return {
    id: row.id,
    requestId: row.request_id,
    ownerId: row.owner_id,
    ownerName: row.owners?.name ?? "Owner",
    petId: row.pet_id,
    petName: row.pets?.name ?? "Unknown pet",
    serviceId: row.service_id,
    serviceName: localizedName(row.services?.name_json, locale),
    proposedWindow: row.proposed_window,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? row.services?.duration_minutes ?? 30,
    staffId: row.staff_id,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at
  };
}

export async function listCalendarStaff(clinicId: string): Promise<CalendarStaff[]> {
  const { data, error } = await db()
    .from("clinic_staff")
    .select("id, user_id, role")
    .eq("clinic_id", clinicId)
    .eq("is_active", true)
    .in("role", ["owner", "admin", "vet", "reception"])
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Could not load calendar staff: ${error.message}`);

  return ((data ?? []) as StaffRow[]).map((staff) => ({
    id: staff.id,
    userId: staff.user_id,
    role: staff.role,
    label: `${staff.role} ${staff.id.slice(0, 4)}`
  }));
}

export async function listAvailabilityRules(clinicId: string): Promise<AvailabilityRule[]> {
  const { data, error } = await db()
    .from("staff_availability_rules")
    .select("id, clinic_id, staff_id, weekday, start_time, end_time, service_ids, is_active")
    .eq("clinic_id", clinicId)
    .order("weekday", { ascending: true });

  if (error) throw new Error(`Could not load availability: ${error.message}`);

  return ((data ?? []) as RuleRow[]).map((rule) => ({
    id: rule.id,
    clinicId: rule.clinic_id,
    staffId: rule.staff_id,
    weekday: rule.weekday,
    startTime: rule.start_time.slice(0, 5),
    endTime: rule.end_time.slice(0, 5),
    serviceIds: rule.service_ids ?? [],
    isActive: rule.is_active
  }));
}

export async function listStaffTimeOff(
  clinicId: string,
  from: Date,
  to: Date
): Promise<StaffTimeOff[]> {
  const { data, error } = await db()
    .from("staff_time_off")
    .select("id, staff_id, starts_at, ends_at, reason")
    .eq("clinic_id", clinicId)
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString())
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`Could not load time off: ${error.message}`);

  return ((data ?? []) as TimeOffRow[]).map((row) => ({
    id: row.id,
    staffId: row.staff_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason
  }));
}

export async function listCalendarAppointments(
  clinicId: string,
  locale: string,
  options?: { from?: Date; to?: Date; status?: string; staffId?: string }
) {
  let query = db()
    .from("appointments")
    .select(
      "id, request_id, owner_id, pet_id, service_id, proposed_window, scheduled_at, duration_minutes, staff_id, status, notes, created_at, owners(id, name), pets(id, name), services(id, name_json, duration_minutes)"
    )
    .eq("clinic_id", clinicId)
    .order("scheduled_at", { ascending: true });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.staffId && options.staffId !== "all") {
    query = query.eq("staff_id", options.staffId);
  }
  if (options?.from) {
    query = query.gte("created_at", new Date(options.from.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load appointments: ${error.message}`);

  return ((data ?? []) as AppointmentRow[]).map((row) =>
    mapAppointment(row, locale)
  );
}

export async function listAppointmentOffers(
  clinicId: string,
  requestId: string
): Promise<AppointmentOffer[]> {
  const { data, error } = await db()
    .from("appointment_slot_offers")
    .select("id, appointment_id, request_id, status, slots_json, expires_at, accepted_slot_index, created_at")
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load appointment offers: ${error.message}`);

  return ((data ?? []) as OfferRow[]).map(mapOffer);
}

async function busyRanges(clinicId: string, from: Date, to: Date): Promise<BusyRange[]> {
  const [appointments, holds] = await Promise.all([
    db()
      .from("appointments")
      .select("staff_id, scheduled_at, duration_minutes")
      .eq("clinic_id", clinicId)
      .in("status", ["confirmed", "rescheduled"])
      .gte("scheduled_at", from.toISOString())
      .lte("scheduled_at", to.toISOString()),
    db()
      .from("appointment_holds")
      .select("staff_id, starts_at, ends_at")
      .eq("clinic_id", clinicId)
      .eq("status", "held")
      .gt("expires_at", new Date().toISOString())
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString())
  ]);

  if (appointments.error) {
    throw new Error(`Could not load busy appointments: ${appointments.error.message}`);
  }
  if (holds.error) {
    throw new Error(`Could not load held slots: ${holds.error.message}`);
  }

  const confirmed = ((appointments.data ?? []) as Array<{
    staff_id: string | null;
    scheduled_at: string | null;
    duration_minutes: number | null;
  }>)
    .filter((row) => row.staff_id && row.scheduled_at)
    .map((row) => {
      const startsAt = new Date(row.scheduled_at!);
      return {
        staffId: row.staff_id!,
        startsAt,
        endsAt: new Date(startsAt.getTime() + (row.duration_minutes ?? 30) * 60_000)
      };
    });

  const held = ((holds.data ?? []) as Array<{
    staff_id: string;
    starts_at: string;
    ends_at: string;
  }>).map((row) => ({
    staffId: row.staff_id,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at)
  }));

  return [...confirmed, ...held];
}

export async function findAppointmentSlots({
  clinicId,
  appointmentId,
  locale,
  timeZone,
  from = new Date(),
  horizonDays = 14,
  limit = 3
}: {
  clinicId: string;
  appointmentId: string;
  locale: string;
  timeZone: string;
  from?: Date;
  horizonDays?: number;
  limit?: number;
}): Promise<AppointmentSlot[]> {
  const { data, error } = await db()
    .from("appointments")
    .select(
      "id, service_id, duration_minutes, services(id, name_json, duration_minutes)"
    )
    .eq("clinic_id", clinicId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error) throw new Error(`Could not load appointment for slots: ${error.message}`);
  if (!data) return [];

  const appointment = data as AppointmentRow;
  const serviceId = appointment.service_id;
  const durationMinutes =
    appointment.duration_minutes ?? appointment.services?.duration_minutes ?? 30;
  const to = new Date(from.getTime() + horizonDays * 24 * 60 * 60 * 1000);
  const [staff, rules, timeOff, busy] = await Promise.all([
    listCalendarStaff(clinicId),
    listAvailabilityRules(clinicId),
    listStaffTimeOff(clinicId, from, to),
    busyRanges(clinicId, from, to)
  ]);
  const staffById = new Map(staff.map((member) => [member.id, member]));
  const slots: AppointmentSlot[] = [];
  const startPlain = getParts(from, timeZone);
  const startDate = {
    year: startPlain.year,
    month: startPlain.month,
    day: startPlain.day
  };

  for (let dayOffset = 0; dayOffset < horizonDays && slots.length < limit; dayOffset += 1) {
    const plainDate = addDays(startDate, dayOffset);
    const weekdayNumber = weekday(plainDate);
    const dayRules = rules.filter(
      (rule) =>
        rule.isActive &&
        rule.weekday === weekdayNumber &&
        staffById.has(rule.staffId) &&
        (rule.serviceIds.length === 0 || (serviceId ? rule.serviceIds.includes(serviceId) : true))
    );

    for (const rule of dayRules) {
      const staffMember = staffById.get(rule.staffId);
      if (!staffMember) continue;

      const ruleStart = zonedDateTimeToUtc(plainDate, rule.startTime, timeZone);
      const ruleEnd = zonedDateTimeToUtc(plainDate, rule.endTime, timeZone);
      let cursor = roundUp(new Date(Math.max(ruleStart.getTime(), from.getTime())), SLOT_GRANULARITY_MINUTES);

      while (cursor.getTime() + durationMinutes * 60_000 <= ruleEnd.getTime()) {
        const endsAt = new Date(cursor.getTime() + durationMinutes * 60_000);
        const unavailable =
          timeOff.some(
            (block) =>
              block.staffId === rule.staffId &&
              overlaps(cursor, endsAt, new Date(block.startsAt), new Date(block.endsAt))
          ) ||
          busy.some(
            (range) =>
              range.staffId === rule.staffId &&
              overlaps(cursor, endsAt, range.startsAt, range.endsAt)
          );

        if (!unavailable) {
          slots.push({
            staffId: rule.staffId,
            staffLabel: staffMember.label,
            startsAt: cursor.toISOString(),
            endsAt: endsAt.toISOString(),
            durationMinutes,
            serviceId
          });
          if (slots.length >= limit) break;
        }
        cursor = new Date(cursor.getTime() + SLOT_GRANULARITY_MINUTES * 60_000);
      }
      if (slots.length >= limit) break;
    }
  }

  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getAppointmentContextForRequest({
  clinicId,
  requestId,
  locale,
  timeZone
}: {
  clinicId: string;
  requestId: string;
  locale: string;
  timeZone: string;
}): Promise<AppointmentContext | null> {
  const { data, error } = await db()
    .from("appointments")
    .select(
      "id, request_id, owner_id, pet_id, service_id, proposed_window, scheduled_at, duration_minutes, staff_id, status, notes, created_at, owners(id, name), pets(id, name), services(id, name_json, duration_minutes)"
    )
    .eq("clinic_id", clinicId)
    .eq("request_id", requestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not load appointment context: ${error.message}`);
  if (!data) return null;

  const appointment = mapAppointment(data as AppointmentRow, locale);
  const [offers, suggestedSlots] = await Promise.all([
    listAppointmentOffers(clinicId, requestId),
    findAppointmentSlots({
      clinicId,
      appointmentId: appointment.id,
      locale,
      timeZone,
      limit: 3
    })
  ]);

  return { appointment, offers, suggestedSlots };
}

export async function expireStaleAppointmentHolds(clinicId: string) {
  const now = new Date().toISOString();
  await db()
    .from("appointment_holds")
    .update({ status: "expired" })
    .eq("clinic_id", clinicId)
    .eq("status", "held")
    .lt("expires_at", now);
  await db()
    .from("appointment_slot_offers")
    .update({ status: "expired" })
    .eq("clinic_id", clinicId)
    .eq("status", "sent")
    .lt("expires_at", now);
}

export function holdExpiresAt() {
  return new Date(Date.now() + DEFAULT_HOLD_MINUTES * 60_000).toISOString();
}
