import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Users
} from "lucide-react";
import { Badge, Button, cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { requireStaffContext } from "@/lib/auth/staff";
import { requireStaffPermission } from "@/lib/auth/permissions";
import { getRequestLocale } from "@/lib/locale";
import {
  getReportsDashboard
} from "@/lib/reports/queries";
import {
  isReportRangePreset
} from "@/lib/reports/metrics";
import type {
  BreakdownItem,
  ReportMetric,
  ReportRangePreset,
  ReportsDashboard,
  ReportTab,
  RetentionCohort,
  WatchlistItem
} from "@/lib/reports/types";
import { CsvDownloadButton } from "./_components/CsvDownloadButton";
import {
  ReportBreakdownChart,
  ReportTrendChart
} from "./_components/ReportCharts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    range?: string | string[];
    tab?: string | string[];
  }>;
};

const tabs = ["overview", "owners", "pets", "operations", "ai"] as const;
const ranges: ReportRangePreset[] = ["7d", "30d", "90d"];
type ReportTabLabels = Record<ReportTab, string>;

const copy = {
  en: {
    title: "Reports",
    description:
      "Clinic intelligence for owner retention, communication flow, pet follow-up signals, AI safety, and PMS value.",
    range: "Range",
    export: "Export CSV",
    previous: "vs previous period",
    generated: "Generated",
    tabs: {
      overview: "Overview",
      owners: "Owners",
      pets: "Pets",
      operations: "Operations",
      ai: "AI & Safety"
    },
    sections: {
      requestTrend: "Request trend",
      insight: "What changed",
      pilot: "Pilot targets",
      cohort: "Retention cohort",
      risk: "Owners to re-engage",
      value: "Owner value",
      health: "Care follow-up watchlist",
      species: "Species mix",
      weights: "Latest weight signals",
      operations: "Operational mix",
      reminders: "Reminder funnel",
      delivery: "Delivery reliability",
      aiStatus: "AI output health",
      aiReview: "Review quality",
      aiKinds: "AI work mix",
      aiLatency: "AI activity trend"
    },
    empty: {
      noRisk: "No re-engagement list yet.",
      noValue: "PMS invoice summaries are not connected for this view.",
      restricted: "Financial reports are visible only to clinic owners and admins.",
      noWatch: "No pet follow-up signals in this range."
    }
  },
  et: {
    title: "Aruanded",
    description:
      "Kliiniku ülevaade omanike püsivuse, suhtluse, lemmikute järelkontrolli signaalide, AI ohutuse ja PMS väärtuse kohta.",
    range: "Periood",
    export: "Ekspordi CSV",
    previous: "võrreldes eelmise perioodiga",
    generated: "Genereeritud",
    tabs: {
      overview: "Ülevaade",
      owners: "Omanikud",
      pets: "Lemmikud",
      operations: "Töövoog",
      ai: "AI ja ohutus"
    },
    sections: {
      requestTrend: "Pöördumiste trend",
      insight: "Mis muutus",
      pilot: "Piloodi eesmärgid",
      cohort: "Püsivuse kohort",
      risk: "Omanikud, kellega ühendust võtta",
      value: "Omaniku väärtus",
      health: "Järelkontrolli jälgimisnimekiri",
      species: "Liikide jaotus",
      weights: "Viimased kaalusignaalid",
      operations: "Töövoo jaotus",
      reminders: "Meeldetuletuste lehter",
      delivery: "Kohaletoimetamise töökindlus",
      aiStatus: "AI väljundite seis",
      aiReview: "Ülevaatuse kvaliteet",
      aiKinds: "AI töö jaotus",
      aiLatency: "AI tegevuse trend"
    },
    empty: {
      noRisk: "Taasaktiveerimise nimekirja veel pole.",
      noValue: "PMS arvekokkuvõtted ei ole selles vaates ühendatud.",
      restricted: "Finantsaruanded on nähtavad ainult omanikele ja administraatoritele.",
      noWatch: "Selles perioodis pole lemmikute järelkontrolli signaale."
    }
  },
  ru: {
    title: "Отчёты",
    description:
      "Интеллектуальная сводка клиники: удержание владельцев, поток коммуникаций, сигналы ухода, безопасность AI и ценность из PMS.",
    range: "Период",
    export: "Экспорт CSV",
    previous: "к предыдущему периоду",
    generated: "Создано",
    tabs: {
      overview: "Обзор",
      owners: "Владельцы",
      pets: "Питомцы",
      operations: "Операции",
      ai: "AI и безопасность"
    },
    sections: {
      requestTrend: "Тренд запросов",
      insight: "Что изменилось",
      pilot: "Цели пилота",
      cohort: "Когорта удержания",
      risk: "Владельцы для повторного контакта",
      value: "Ценность владельцев",
      health: "Сигналы для проверки ухода",
      species: "Состав видов",
      weights: "Последние сигналы веса",
      operations: "Операционный состав",
      reminders: "Воронка напоминаний",
      delivery: "Надёжность доставки",
      aiStatus: "Состояние AI-выводов",
      aiReview: "Качество проверки",
      aiKinds: "Состав AI-работы",
      aiLatency: "Тренд AI-активности"
    },
    empty: {
      noRisk: "Списка для повторного контакта пока нет.",
      noValue: "Сводки счетов PMS не подключены для этого вида.",
      restricted: "Финансовые отчёты видны только владельцам и администраторам клиники.",
      noWatch: "В этом периоде нет сигналов ухода по питомцам."
    }
  }
} as const;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isReportTab(value: unknown): value is ReportTab {
  return typeof value === "string" && tabs.includes(value as ReportTab);
}

function reportUrl({
  locale,
  range,
  tab
}: {
  locale: SupportedLocale;
  range: ReportRangePreset;
  tab: ReportTab;
}) {
  const params = new URLSearchParams({ lang: locale, range, tab });
  return `/reports?${params.toString()}`;
}

function formatDateTime(iso: string, locale: SupportedLocale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso));
}

function formatDate(iso: string | null, locale: SupportedLocale) {
  if (!iso) return "n/a";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function badgeTone(
  tone: ReportMetric["tone"]
): "neutral" | "teal" | "amber" | "red" {
  if (tone === "danger") return "red";
  if (tone === "warn") return "amber";
  if (tone === "good") return "teal";
  return "neutral";
}

function MetricCard({ metric }: { metric: ReportMetric }) {
  return (
    <article className="grid min-h-[126px] gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
          {metric.label}
        </p>
        {metric.delta ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold",
              metric.delta.direction === "up" &&
                "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
              metric.delta.direction === "down" &&
                "bg-[var(--amber-soft)] text-[var(--amber)]",
              metric.delta.direction === "flat" &&
                "bg-[var(--soft)] text-[var(--muted)]"
            )}
          >
            {metric.delta.label}
          </span>
        ) : null}
      </div>
      <p className="text-[30px] font-semibold leading-none text-[var(--ink)]">
        {metric.value}
      </p>
      <p className="text-[13px] leading-5 text-[var(--muted)]">{metric.detail}</p>
    </article>
  );
}

function MetricGrid({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={`${metric.label}-${metric.value}`} metric={metric} />
      ))}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
  className
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TabNav({
  activeTab,
  locale,
  range,
  labels
}: {
  activeTab: ReportTab;
  locale: SupportedLocale;
  range: ReportRangePreset;
  labels: ReportTabLabels;
}) {
  return (
    <nav aria-label="Reports sections" className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <Button
            key={tab}
            asChild
            size="sm"
            variant={active ? "primary" : "secondary"}
            className="shrink-0"
          >
            <Link href={reportUrl({ locale, range, tab })}>{labels[tab]}</Link>
          </Button>
        );
      })}
    </nav>
  );
}

function CohortHeatmap({ cohorts }: { cohorts: RetentionCohort[] }) {
  if (cohorts.length === 0) {
    return <p className="text-[13px] text-[var(--muted)]">No owner cohorts yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[560px] border-separate border-spacing-1 text-left">
        <thead>
          <tr>
            <th className="px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
              Cohort
            </th>
            {Array.from({ length: 6 }).map((_, offset) => (
              <th
                key={offset}
                className="px-2 py-1 text-center text-[11px] font-semibold text-[var(--muted)]"
              >
                M{offset}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort}>
              <th className="whitespace-nowrap px-2 py-1 text-[12px] font-semibold text-[var(--ink)]">
                {cohort.label}
                <span className="ml-2 font-normal text-[var(--muted)]">
                  {cohort.total}
                </span>
              </th>
              {cohort.cells.map((cell) => {
                const opacity = Math.max(0.08, cell.percent / 100);
                return (
                  <td key={cell.offset} className="p-0.5">
                    <div
                      className="flex h-9 min-w-16 items-center justify-center rounded-[var(--radius)] border border-[var(--line)] text-[12px] font-semibold text-[var(--ink)]"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(
                          opacity * 72
                        )}%, var(--paper))`
                      }}
                      title={`${cell.retained}/${cell.total}`}
                    >
                      {cell.percent}%
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownList({ items }: { items: BreakdownItem[] }) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--muted)]">No data in range.</p>;
  }
  return (
    <div className="grid gap-2">
      {items.slice(0, 6).map((item) => (
        <div key={item.key} className="grid gap-1">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="font-medium capitalize text-[var(--ink)]">
              {item.label}
            </span>
            <span className="font-mono text-[var(--muted)]">
              {item.value} · {item.percent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--soft)]">
            <span
              className="block h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Watchlist({
  items,
  emptyLabel
}: {
  items: WatchlistItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-[13px] text-[var(--muted)]">{emptyLabel}</p>;
  }
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-[var(--ink)]">
                {item.petName}
              </p>
              <p className="text-[12px] text-[var(--muted)]">{item.ownerName}</p>
            </div>
            <Badge tone={badgeTone(item.tone)}>{item.reason}</Badge>
          </div>
          <p className="text-[13px] leading-5 text-[var(--muted)]">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

async function ReportsBody({
  dashboardPromise,
  tab,
  locale
}: {
  dashboardPromise: Promise<ReportsDashboard>;
  tab: ReportTab;
  locale: SupportedLocale;
}) {
  const dashboard = await dashboardPromise;
  const c = copy[locale];

  if (tab === "owners") {
    return (
      <div className="grid gap-4">
        <MetricGrid metrics={dashboard.owners.metrics} />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
          <Panel
            title={c.sections.cohort}
            action={
              <CsvDownloadButton
                filename="petcura-owner-reports.csv"
                rows={dashboard.exports.ownersCsv}
                label={c.export}
              />
            }
          >
            <CohortHeatmap cohorts={dashboard.owners.retentionCohorts} />
          </Panel>
          <Panel title={c.sections.risk}>
            {dashboard.owners.atRiskOwners.length === 0 ? (
              <p className="text-[13px] text-[var(--muted)]">{c.empty.noRisk}</p>
            ) : (
              <div className="grid gap-2">
                {dashboard.owners.atRiskOwners.map((owner) => (
                  <div
                    key={owner.ownerId}
                    className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--ink)]">
                          {owner.ownerName}
                        </p>
                        <p className="text-[12px] text-[var(--muted)]">
                          {owner.petNames.join(", ") || "No pets linked"}
                        </p>
                      </div>
                      <Badge>{owner.requestCount}</Badge>
                    </div>
                    <p className="mt-2 text-[12px] text-[var(--muted)]">
                      Last request {formatDate(owner.lastRequestAt, locale)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
        <Panel title={c.sections.value}>
          {dashboard.owners.financialRestricted ? (
            <p className="text-[13px] text-[var(--muted)]">{c.empty.restricted}</p>
          ) : dashboard.owners.topOwnerValue.length === 0 ? (
            <p className="text-[13px] text-[var(--muted)]">{c.empty.noValue}</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {dashboard.owners.topOwnerValue.map((owner) => (
                <article
                  key={owner.ownerId}
                  className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-3"
                >
                  <p className="text-[13px] font-semibold text-[var(--ink)]">
                    {owner.ownerName}
                  </p>
                  <p className="mt-1 text-[22px] font-semibold text-[var(--ink)]">
                    {formatMoney(owner.spendCents)}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--muted)]">
                    {owner.petNames.join(", ") || "No pets linked"} ·{" "}
                    {owner.requestCount} requests
                  </p>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    );
  }

  if (tab === "pets") {
    return (
      <div className="grid gap-4">
        <MetricGrid metrics={dashboard.pets.metrics} />
        <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.85fr)_minmax(0,1.15fr)]">
          <Panel
            title={c.sections.health}
            action={
              <CsvDownloadButton
                filename="petcura-pet-reports.csv"
                rows={dashboard.exports.petsCsv}
                label={c.export}
              />
            }
          >
            <Watchlist
              items={dashboard.pets.watchlist}
              emptyLabel={c.empty.noWatch}
            />
          </Panel>
          <div className="grid gap-4">
            <Panel title={c.sections.species}>
              <ReportBreakdownChart
                data={dashboard.pets.speciesBreakdown}
                label={c.sections.species}
              />
            </Panel>
            <Panel title={c.sections.weights}>
              <ReportTrendChart
                data={dashboard.pets.weightTrend}
                label={c.sections.weights}
                valueLabel="Weight"
              />
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "operations") {
    return (
      <div className="grid gap-4">
        <MetricGrid metrics={dashboard.operations.metrics} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={c.sections.operations}
            action={
              <CsvDownloadButton
                filename="petcura-operations-reports.csv"
                rows={dashboard.exports.operationsCsv}
                label={c.export}
              />
            }
          >
            <div className="grid gap-4 md:grid-cols-3">
              <BreakdownList items={dashboard.operations.categoryBreakdown} />
              <BreakdownList items={dashboard.operations.urgencyBreakdown} />
              <BreakdownList items={dashboard.operations.channelBreakdown} />
            </div>
          </Panel>
          <Panel title={c.sections.reminders}>
            <ReportBreakdownChart
              data={dashboard.operations.reminderFunnel}
              label={c.sections.reminders}
            />
          </Panel>
          <Panel title={c.sections.delivery} className="lg:col-span-2">
            <ReportBreakdownChart
              data={dashboard.operations.deliveryBreakdown}
              label={c.sections.delivery}
            />
          </Panel>
        </div>
      </div>
    );
  }

  if (tab === "ai") {
    return (
      <div className="grid gap-4">
        <MetricGrid metrics={dashboard.ai.metrics} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title={c.sections.aiStatus}
            action={
              <CsvDownloadButton
                filename="petcura-ai-reports.csv"
                rows={dashboard.exports.aiCsv}
                label={c.export}
              />
            }
          >
            <ReportBreakdownChart
              data={dashboard.ai.outputStatusBreakdown}
              label={c.sections.aiStatus}
            />
          </Panel>
          <Panel title={c.sections.aiReview}>
            <ReportBreakdownChart
              data={dashboard.ai.reviewStatusBreakdown}
              label={c.sections.aiReview}
            />
          </Panel>
          <Panel title={c.sections.aiKinds}>
            <ReportBreakdownChart
              data={dashboard.ai.kindBreakdown}
              label={c.sections.aiKinds}
            />
          </Panel>
          <Panel title={c.sections.aiLatency}>
            <ReportTrendChart
              data={dashboard.ai.latencyTrend}
              label={c.sections.aiLatency}
              valueLabel="AI outputs"
            />
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <MetricGrid metrics={dashboard.overview.metrics} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Panel
          title={c.sections.requestTrend}
          action={
            <CsvDownloadButton
              filename="petcura-overview-reports.csv"
              rows={dashboard.exports.overviewCsv}
              label={c.export}
            />
          }
        >
          <ReportTrendChart
            data={dashboard.overview.requestTrend}
            label={c.sections.requestTrend}
            valueLabel="Current requests"
            comparisonLabel="Previous requests"
          />
        </Panel>
        <div className="grid gap-4">
          <Panel title={c.sections.insight}>
            <div className="flex flex-wrap gap-2">
              {dashboard.overview.insightChips.map((chip) => (
                <Badge key={chip} tone="teal">
                  {chip}
                </Badge>
              ))}
            </div>
          </Panel>
          <Panel title={c.sections.pilot}>
            <div className="grid gap-2">
              {dashboard.overview.pilotTargets.map((target) => (
                <div
                  key={target.label}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius)] bg-[var(--soft)] px-3 py-2"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--ink)]">
                      {target.label}
                    </p>
                    <p className="text-[12px] text-[var(--muted)]">
                      {target.detail}
                    </p>
                  </div>
                  <Badge tone={badgeTone(target.tone)}>{target.value}</Badge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ReportsFallback() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[126px] animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]"
          />
        ))}
      </div>
      <div className="h-[340px] animate-pulse rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]" />
    </div>
  );
}

export default async function ReportsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = getParam(sp.lang);
  const locale = await getRequestLocale(langParam);
  const c = copy[locale];
  const rawRange = getParam(sp.range);
  const range: ReportRangePreset = isReportRangePreset(rawRange)
    ? rawRange
    : "30d";
  const rawTab = getParam(sp.tab);
  const tab: ReportTab = isReportTab(rawTab) ? rawTab : "overview";
  const staffContext = await requireStaffContext(locale, "/reports");
  requireStaffPermission(staffContext, "reports:view");

  const dashboardPromise = getReportsDashboard({
    supabase: staffContext.supabase,
    clinic: staffContext.clinic,
    membership: staffContext.membership,
    preset: range
  });

  return (
    <AppShell
      locale={locale}
      currentPath="/reports"
      pageTitle={c.title}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <FileText aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {c.title}
                </h1>
                <Badge tone="neutral">{staffContext.clinic.name}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {c.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ranges.map((option) => (
                <Button
                  key={option}
                  asChild
                  size="sm"
                  variant={option === range ? "primary" : "secondary"}
                >
                  <Link href={reportUrl({ locale, range: option, tab })}>
                    {option.replace("d", " days")}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <TabNav
              activeTab={tab}
              locale={locale}
              range={range}
              labels={c.tabs}
            />
            <Suspense fallback={null}>
              <GeneratedAt
                dashboardPromise={dashboardPromise}
                locale={locale}
                label={c.generated}
              />
            </Suspense>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <div className="mx-auto grid max-w-7xl gap-4">
            <section className="grid grid-cols-2 gap-2 text-[12px] text-[var(--muted)] md:grid-cols-4">
              <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--paper)] px-3 py-2">
                <Users aria-hidden="true" size={14} />
                Owner retention
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--paper)] px-3 py-2">
                <Activity aria-hidden="true" size={14} />
                Operations flow
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--paper)] px-3 py-2">
                <HeartPulse aria-hidden="true" size={14} />
                Care signals
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--paper)] px-3 py-2">
                <ShieldCheck aria-hidden="true" size={14} />
                AI accountability
              </div>
            </section>

            <Suspense fallback={<ReportsFallback />}>
              <ReportsBody
                dashboardPromise={dashboardPromise}
                tab={tab}
                locale={locale}
              />
            </Suspense>
          </div>
        </main>
      </section>
    </AppShell>
  );
}

async function GeneratedAt({
  dashboardPromise,
  locale,
  label
}: {
  dashboardPromise: Promise<ReportsDashboard>;
  locale: SupportedLocale;
  label: string;
}) {
  const dashboard = await dashboardPromise;
  return (
    <p className="flex items-center gap-1 text-[12px] text-[var(--muted)]">
      <LineChart aria-hidden="true" size={14} />
      {label}: {formatDateTime(dashboard.range.generatedAt, locale)}
    </p>
  );
}
