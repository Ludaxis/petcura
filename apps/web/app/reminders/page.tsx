import Link from "next/link";
import { Bell, Check, Clock, X } from "lucide-react";
import {
  createTranslator,
  getChannelLabel,
  getReminderStatusLabel,
  getReminderTypeLabel,
  withLocale,
  type ReminderStatus
} from "@petcura/shared";
import { Badge, Button, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import { LazyRealtimeRefresh as RealtimeRefresh } from "@/app/_components/LazyRealtimeRefresh";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  isReminderFilter,
  listReminders,
  reminderFilterOrder,
  type ReminderFilter,
  type ReminderListItem
} from "@/lib/reminders";
import { eqFilter, makeRealtimeChannelName } from "@/lib/realtime-refresh";
import { updateReminderStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    action_error?: string | string[];
    action_status?: string | string[];
    lang?: string | string[];
    status?: string | string[];
  }>;
};

const actionableStatuses = new Set<ReminderStatus>([
  "scheduled",
  "sent",
  "acknowledged",
  "missed"
]);

function statusTone(status: ReminderStatus): "neutral" | "teal" | "amber" | "red" {
  if (status === "missed") return "amber";
  if (status === "cancelled") return "red";
  if (status === "sent" || status === "acknowledged") return "teal";
  return "neutral";
}

function filterLabelKey(filter: ReminderFilter) {
  return `reminders.tabs.${filter}` as const;
}

function ActionForm({
  reminder,
  locale,
  filter,
  status,
  label,
  icon
}: {
  reminder: ReminderListItem;
  locale: string;
  filter: ReminderFilter;
  status: "acknowledged" | "completed" | "cancelled";
  label: string;
  icon: "check" | "complete" | "cancel";
}) {
  const Icon = icon === "cancel" ? X : icon === "complete" ? Check : Clock;
  return (
    <form action={updateReminderStatus}>
      <input name="lang" type="hidden" value={locale} />
      <input name="filter" type="hidden" value={filter} />
      <input name="reminderId" type="hidden" value={reminder.id} />
      <input name="status" type="hidden" value={status} />
      <Button size="sm" variant="secondary" type="submit">
        <Icon aria-hidden="true" size={13} />
        {label}
      </Button>
    </form>
  );
}

export default async function RemindersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const rawFilter = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const filter: ReminderFilter = isReminderFilter(rawFilter) ? rawFilter : "all";
  const actionStatus = Array.isArray(sp.action_status)
    ? sp.action_status[0]
    : sp.action_status;
  const actionError = Array.isArray(sp.action_error)
    ? sp.action_error[0]
    : sp.action_error;

  const staffContext = await requireStaffContext(locale, "/reminders");
  const allReminders = await listReminders(
    staffContext.supabase,
    staffContext.clinic.id,
    "all"
  );
  const rows =
    filter === "all"
      ? allReminders
      : allReminders.filter((reminder) => reminder.status === filter);
  const counts = Object.fromEntries(
    reminderFilterOrder.map((status) => [
      status,
      status === "all"
        ? allReminders.length
        : allReminders.filter((reminder) => reminder.status === status).length
    ])
  ) as Record<ReminderFilter, number>;

  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const formatDateTime = (iso: string) =>
    dateTimeFormatter.format(new Date(iso));
  const announcement =
    actionError === "reminder"
      ? t("reminders.error")
      : actionStatus === "reminder_updated"
        ? t("reminders.statusUpdated")
        : null;

  return (
    <AppShell
      locale={locale}
      currentPath="/reminders"
      pageTitle={t("nav.reminders")}
    >
      <RealtimeRefresh
        channelName={makeRealtimeChannelName(
          "reminders",
          staffContext.clinic.id
        )}
        targets={[
          {
            table: "reminders",
            filter: eqFilter("clinic_id", staffContext.clinic.id)
          },
          {
            table: "request_events",
            filter: eqFilter("clinic_id", staffContext.clinic.id)
          }
        ]}
        pollMs={45_000}
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <Bell aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight">
                  {t("reminders.title")}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("reminders.description")}
              </p>
            </div>
            <Badge tone="teal">{counts.all}</Badge>
          </div>

          {announcement ? (
            <p
              className={cn(
                "mt-3 rounded-[var(--radius)] px-3 py-2 text-[13px]",
                actionError
                  ? "bg-[var(--red-soft)] text-[var(--red)]"
                  : "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              )}
            >
              {announcement}
            </p>
          ) : null}

          <nav
            aria-label={t("nav.reminders")}
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            {reminderFilterOrder.map((status) => {
              const active = status === filter;
              return (
                <Link
                  key={status}
                  href={withLocale(`/reminders?status=${status}`, locale)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition",
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--paper)]"
                      : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--soft)]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {t(filterLabelKey(status))}
                  <span className={active ? "text-[var(--paper)]" : "text-[var(--muted)]"}>
                    {counts[status]}
                  </span>
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          {rows.length > 0 ? (
            <ol className="mx-auto flex max-w-6xl flex-col gap-2">
              {rows.map((reminder) => (
                <li
                  key={reminder.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
                >
                  <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(reminder.status)}>
                          {getReminderStatusLabel(reminder.status, locale)}
                        </Badge>
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          {getReminderTypeLabel(reminder.type, locale)}
                        </span>
                      </div>
                      <h2 className="mt-2 break-words text-[15px] font-semibold text-[var(--ink)]">
                        {reminder.title}
                      </h2>
                      {reminder.body ? (
                        <p className="mt-1 break-words text-[12.5px] leading-5 text-[var(--ink-2)]">
                          {reminder.body}
                        </p>
                      ) : null}
                      {reminder.lastSendError ? (
                        <p className="mt-2 break-words rounded-[var(--radius)] bg-[var(--red-soft)] px-2 py-1 text-[12px] text-[var(--red)]">
                          {reminder.lastSendError}
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] text-[var(--ink-2)] sm:grid-cols-4 lg:grid-cols-2">
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("reminders.pet")}
                        </dt>
                        <dd className="mt-0.5 truncate">
                          {reminder.petName} · {reminder.species}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("reminders.owner")}
                        </dt>
                        <dd className="mt-0.5 truncate">{reminder.ownerName}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("reminders.due")}
                        </dt>
                        <dd className="mt-0.5">{formatDateTime(reminder.dueAt)}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
                          {t("request.reminder.channel")}
                        </dt>
                        <dd className="mt-0.5">
                          {getChannelLabel(reminder.channel, locale)}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      {reminder.requestId ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link
                            href={withLocale(
                              `/requests/${reminder.requestId}`,
                              locale
                            )}
                          >
                            {t("reminders.openRequest")}
                          </Link>
                        </Button>
                      ) : null}
                      {actionableStatuses.has(reminder.status) ? (
                        <>
                          {reminder.status !== "acknowledged" ? (
                            <ActionForm
                              reminder={reminder}
                              locale={locale}
                              filter={filter}
                              status="acknowledged"
                              icon="check"
                              label={t("reminders.markAcknowledged")}
                            />
                          ) : null}
                          <ActionForm
                            reminder={reminder}
                            locale={locale}
                            filter={filter}
                            status="completed"
                            icon="complete"
                            label={t("reminders.markCompleted")}
                          />
                          <ActionForm
                            reminder={reminder}
                            locale={locale}
                            filter={filter}
                            status="cancelled"
                            icon="cancel"
                            label={t("reminders.cancel")}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mx-auto mt-8 max-w-xl rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-center">
              <h2 className="text-[18px] font-semibold">{t("reminders.empty")}</h2>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
                {t("reminders.emptyBody")}
              </p>
            </div>
          )}
        </section>
      </section>
    </AppShell>
  );
}
