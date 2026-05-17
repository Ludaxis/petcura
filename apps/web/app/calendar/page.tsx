import Link from "next/link";
import { CalendarClock, Clock, Filter, Sparkles } from "lucide-react";
import { Badge, Button, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import { LazyRealtimeRefresh as RealtimeRefresh } from "@/app/_components/LazyRealtimeRefresh";
import { requireStaffContext } from "@/lib/auth/staff";
import { requireStaffPermission } from "@/lib/auth/permissions";
import {
  findAppointmentSlots,
  listCalendarAppointments,
  listCalendarStaff
} from "@/lib/appointments/calendar";
import { getRequestLocale } from "@/lib/locale";
import { eqFilter, makeRealtimeChannelName } from "@/lib/realtime-refresh";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    staff?: string | string[];
    status?: string | string[];
    view?: string | string[];
  }>;
};

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function calendarWindow(view: string | undefined) {
  const now = new Date();
  const days = view === "week" ? 7 : view === "3day" ? 3 : 1;
  return {
    from: now,
    to: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
    days
  };
}

function statusTone(status: string) {
  if (status === "confirmed") return "teal" as const;
  if (status === "cancelled" || status === "no_show") return "red" as const;
  if (status === "rescheduled") return "amber" as const;
  return "neutral" as const;
}

export default async function CalendarPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const locale = await getRequestLocale(param(sp.lang));
  const staffFilter = param(sp.staff) ?? "all";
  const statusFilter = param(sp.status) ?? "all";
  const view = param(sp.view) ?? "3day";
  const ctx = await requireStaffContext(locale, "/calendar");
  requireStaffPermission(ctx, "appointments:view");

  const { from, to, days } = calendarWindow(view);
  const [staff, appointments] = await Promise.all([
    listCalendarStaff(ctx.clinic.id),
    listCalendarAppointments(ctx.clinic.id, locale, {
      from,
      to,
      staffId: staffFilter,
      status: statusFilter
    })
  ]);
  const requested = appointments.filter(
    (appointment) =>
      appointment.status === "requested" || appointment.status === "rescheduled"
  );
  const slotSource = requested[0] ?? appointments.find((appointment) => !appointment.scheduledAt);
  const nextSlots = slotSource
    ? await findAppointmentSlots({
        clinicId: ctx.clinic.id,
        appointmentId: slotSource.id,
        locale,
        timeZone: ctx.clinic.timezone,
        limit: 5
      })
    : [];
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ctx.clinic.timezone
  });
  const timeOnly = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ctx.clinic.timezone
  });
  const visibleAppointments = appointments.filter((appointment) => {
    if (statusFilter !== "all" && appointment.status !== statusFilter) return false;
    if (staffFilter !== "all" && appointment.staffId !== staffFilter) return false;
    return true;
  });

  return (
    <AppShell
      locale={locale}
      currentPath="/calendar"
      pageTitle="Calendar"
    >
      <RealtimeRefresh
        channelName={makeRealtimeChannelName("calendar", ctx.clinic.id)}
        targets={[
          { table: "appointments", filter: eqFilter("clinic_id", ctx.clinic.id) },
          {
            table: "appointment_slot_offers",
            filter: eqFilter("clinic_id", ctx.clinic.id)
          },
          {
            table: "appointment_holds",
            filter: eqFilter("clinic_id", ctx.clinic.id)
          },
          {
            table: "staff_availability_rules",
            filter: eqFilter("clinic_id", ctx.clinic.id)
          },
          {
            table: "staff_time_off",
            filter: eqFilter("clinic_id", ctx.clinic.id)
          }
        ]}
        pollMs={15_000}
      />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--soft)]">
        <header className="shrink-0 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <CalendarClock aria-hidden="true" size={17} />
                </span>
                <h1 className="text-[22px] font-semibold text-[var(--ink)]">
                  Appointment calendar
                </h1>
                <Badge tone="neutral">{ctx.clinic.timezone}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                Staff-approved scheduling with trusted availability. AI can draft from these slots, but staff owns the booking.
              </p>
            </div>
            <Link href="/settings?tab=availability">
              <Button variant="secondary">
                <Clock aria-hidden="true" size={15} />
                Availability
              </Button>
            </Link>
          </div>

          <form className="mt-4 flex flex-wrap items-end gap-2">
            <input name="lang" type="hidden" value={locale} />
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                View
              </span>
              <select
                name="view"
                defaultValue={view}
                className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              >
                <option value="day">Day</option>
                <option value="3day">3 days</option>
                <option value="week">Week</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Staff
              </span>
              <select
                name="staff"
                defaultValue={staffFilter}
                className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              >
                <option value="all">All staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                Status
              </span>
              <select
                name="status"
                defaultValue={statusFilter}
                className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <Button type="submit" variant="secondary">
              <Filter aria-hidden="true" size={15} />
              Apply
            </Button>
          </form>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-h-0 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] shadow-sm">
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {days === 1 ? "Today" : `${days}-day agenda`}
              </p>
            </div>
            <ol className="divide-y divide-[var(--line)]">
              {visibleAppointments.length > 0 ? (
                visibleAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={appointment.requestId ? `/requests/${appointment.requestId}` : "#"}
                      className={cn(
                        "grid gap-3 p-4 transition hover:bg-[var(--soft)]",
                        "md:grid-cols-[160px_minmax(0,1fr)_160px]"
                      )}
                    >
                      <div className="font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--muted)]">
                        {appointment.scheduledAt
                          ? dateTime.format(new Date(appointment.scheduledAt))
                          : "Needs slot"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[15px] font-semibold text-[var(--ink)]">
                            {appointment.petName}
                          </p>
                          <span className="text-[var(--muted)]">·</span>
                          <p className="truncate text-sm text-[var(--muted)]">
                            {appointment.ownerName}
                          </p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--muted)]">
                          {appointment.serviceName}
                          {appointment.notes ? ` · ${appointment.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <Badge tone={statusTone(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        {appointment.durationMinutes ? (
                          <span className="font-mono text-[11px] text-[var(--muted)]">
                            {appointment.durationMinutes}m
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-8 text-center text-sm text-[var(--muted)]">
                  No appointments match this view yet.
                </li>
              )}
            </ol>
          </section>

          <aside className="grid content-start gap-4">
            <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" size={16} className="text-[var(--primary)]" />
                <h2 className="text-[15px] font-semibold text-[var(--ink)]">
                  Next free slots
                </h2>
              </div>
              {slotSource ? (
                <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">
                  For {slotSource.petName} · {slotSource.serviceName}
                </p>
              ) : null}
              <ol className="mt-3 grid gap-2">
                {nextSlots.length > 0 ? (
                  nextSlots.map((slot) => (
                    <li
                      key={`${slot.staffId}-${slot.startsAt}`}
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3"
                    >
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {dateTime.format(new Date(slot.startsAt))}
                      </p>
                      <p className="mt-1 text-[12px] text-[var(--muted)]">
                        {slot.staffLabel} · {timeOnly.format(new Date(slot.startsAt))}–{timeOnly.format(new Date(slot.endsAt))}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="rounded-[var(--radius)] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                    Add availability rules to unlock AI slot suggestions.
                  </li>
                )}
              </ol>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
