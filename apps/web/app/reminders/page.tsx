import { Suspense } from "react";
import { Bell } from "lucide-react";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { Badge, Shimmer, SkeletonList, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import { LazyRealtimeRefresh as RealtimeRefresh } from "@/app/_components/LazyRealtimeRefresh";
import { getRequestLocale } from "@/lib/locale";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  isReminderFilter,
  listReminderCounts,
  reminderFilterOrder,
  type ReminderFilter
} from "@/lib/reminders";
import { eqFilter, makeRealtimeChannelName } from "@/lib/realtime-refresh";
import { ReminderListSection } from "./_components/ReminderListSection";
import { ReminderTabs } from "./_components/ReminderTabs";

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

function filterLabelKey(filter: ReminderFilter) {
  return `reminders.tabs.${filter}` as const;
}

function ReminderTabsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-4 flex gap-2 overflow-hidden pb-1"
    >
      {[76, 108, 80, 132, 92, 112, 110].map((width) => (
        <Shimmer
          key={width}
          className="h-8 shrink-0 rounded-full"
          style={{ width }}
        />
      ))}
    </div>
  );
}

function ReminderListFallback({
  label = "Loading reminders"
}: {
  label?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] shadow-sm">
      <SkeletonList rows={8} label={label} density="comfortable" />
    </div>
  );
}

async function ReminderTotalBadge({
  countsPromise
}: {
  countsPromise: Promise<Record<ReminderFilter, number>>;
}) {
  const counts = await countsPromise;
  return <Badge tone="teal">{counts.all}</Badge>;
}

async function ReminderTabsLoader({
  activeFilter,
  ariaLabel,
  countsPromise,
  locale,
  loadingLabel
}: {
  activeFilter: ReminderFilter;
  ariaLabel: string;
  countsPromise: Promise<Record<ReminderFilter, number>>;
  locale: SupportedLocale;
  loadingLabel: string;
}) {
  const t = createTranslator(locale);
  const counts = await countsPromise;

  return (
    <ReminderTabs
      activeFilter={activeFilter}
      ariaLabel={ariaLabel}
      loadingLabel={loadingLabel}
      tabs={reminderFilterOrder.map((status) => ({
        id: status,
        href: withLocale(`/reminders?status=${status}`, locale),
        label: t(filterLabelKey(status)),
        count: counts[status]
      }))}
    />
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
  const countsPromise = listReminderCounts(
    staffContext.supabase,
    staffContext.clinic.id
  );
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
            <Suspense fallback={<Shimmer className="h-6 w-10 rounded-full" />}>
              <ReminderTotalBadge countsPromise={countsPromise} />
            </Suspense>
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

          <Suspense fallback={<ReminderTabsSkeleton />}>
            <ReminderTabsLoader
              activeFilter={filter}
              ariaLabel={t("nav.reminders")}
              countsPromise={countsPromise}
              locale={locale}
              loadingLabel="Loading reminders"
            />
          </Suspense>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <Suspense
            key={`reminders-${filter}`}
            fallback={<ReminderListFallback />}
          >
            <ReminderListSection
              clinicId={staffContext.clinic.id}
              filter={filter}
              locale={locale}
              supabase={staffContext.supabase}
            />
          </Suspense>
        </section>
      </section>
    </AppShell>
  );
}
