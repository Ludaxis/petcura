import Link from "next/link";
import type { InputHTMLAttributes } from "react";
import {
  Building2,
  ExternalLink,
  Search,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  X
} from "lucide-react";
import { Badge, Button, Panel, Toast, cn } from "@petcura/ui";
import {
  createTranslator,
  staffRoles,
  supportedLocales,
  type CopyKey,
  type SupportedLocale,
  withLocale
} from "@petcura/shared";
import type { MarketingLeadStatus } from "@petcura/validation";
import { getRequestLocale } from "@/lib/locale";
import {
  listAdminActivity,
  listAdminClinics,
  listAdminMarketingLeads,
  type AdminActivityItem
} from "@/lib/admin/bootstrap";
import { getSuperAdminResult } from "@/lib/auth/super-admin";
import { requirePublicEnv } from "@/lib/env";
import { AppShell } from "@/app/_components/AppShell";
import { AdminLeadTable } from "./_components/AdminLeadTable";
import { AdminTabs } from "./_components/AdminTabs";
import {
  addClinicStaff,
  createClinic,
  updateClinicStaffStatus
} from "./actions";

type AdminTab = "leads" | "clinics" | "staff" | "activity";

type AdminPageProps = {
  searchParams?: Promise<{
    admin_error?: string | string[];
    admin_status?: string | string[];
    country?: string | string[];
    lang?: string | string[];
    prefillClinicName?: string | string[];
    prefillCountry?: string | string[];
    q?: string | string[];
    source?: string | string[];
    status?: string | string[];
    tab?: string | string[];
  }>;
};

const roleOptions = staffRoles;
const adminTabs: AdminTab[] = ["leads", "clinics", "staff", "activity"];
const leadStatuses = [
  "all",
  "new",
  "contacted",
  "qualified",
  "converted",
  "archived"
] as const;
const leadSourceLabels: Record<string, string> = {
  hero: "Hero",
  owner_path: "Owner path",
  pricing: "Pricing",
  final_cta: "Final CTA",
  mobile_bar: "Mobile bar",
  demo_page: "Demo page",
  sandbox: "Sandbox",
  trust: "Trust",
  footer: "Footer"
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAdminTab(value: string | string[] | undefined): AdminTab {
  const tab = getSearchParam(value);
  return adminTabs.includes(tab as AdminTab) ? (tab as AdminTab) : "leads";
}

function getLeadStatus(value: string | string[] | undefined) {
  const status = getSearchParam(value);
  return leadStatuses.includes(status as (typeof leadStatuses)[number])
    ? (status as MarketingLeadStatus | "all")
    : "all";
}

function getStatusCopy(status: string | undefined): CopyKey | null {
  if (status === "clinic_created") {
    return "admin.status.clinicCreated";
  }

  if (status === "staff_added") {
    return "admin.status.staffAdded";
  }

  if (status === "staff_updated") {
    return "admin.status.staffUpdated";
  }

  return null;
}

function adminHref(
  locale: SupportedLocale,
  tab: AdminTab,
  params: Record<string, string | undefined> = {}
) {
  const searchParams = new URLSearchParams({ lang: locale, tab });

  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }

  return `/admin?${searchParams.toString()}`;
}

function slugifyClinicName(value: string | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function guessCountryCode(country: string | undefined) {
  if (!country) return "";
  const normalized = country.trim().toLowerCase();
  if (normalized === "estonia" || normalized === "ee") return "EE";
  if (normalized.length === 2) return normalized.toUpperCase();
  return "";
}

function renderPayload(payload: AdminActivityItem["payload"]) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  return Object.entries(payload)
    .slice(0, 6)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  const activeTab = getAdminTab(params?.tab);
  const leadStatus = getLeadStatus(params?.status);
  const q = getSearchParam(params?.q)?.trim() ?? "";
  const source = getSearchParam(params?.source) ?? "";
  const country = getSearchParam(params?.country) ?? "";
  const prefillClinicName = getSearchParam(params?.prefillClinicName) ?? "";
  const prefillCountry = getSearchParam(params?.prefillCountry) ?? "";

  const superAdmin = await getSuperAdminResult(locale);
  if (superAdmin.kind === "forbidden") {
    return (
      <AppShell
        locale={locale}
        currentPath="/admin"
        pageTitle={t("admin.title")}
      >
        <div className="mx-auto flex w-full min-h-0 max-w-2xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
          <Panel
            role="alert"
            aria-labelledby="admin-forbidden-title"
            className="w-full p-6"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--red-soft)] text-[var(--red)]">
                <ShieldOff aria-hidden="true" size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted-2)]">
                  PetCura · {t("admin.forbidden.kicker")}
                </p>
                <h1
                  id="admin-forbidden-title"
                  className="mt-1 text-[20px] font-semibold leading-tight text-[var(--ink)]"
                >
                  {t("admin.forbidden.title")}
                </h1>
                <p className="mt-2 text-[13.5px] leading-6 text-[var(--muted)]">
                  {t("admin.forbidden.body")}
                </p>
                <p className="mt-3 break-words font-mono text-[11.5px] text-[var(--muted-2)]">
                  {superAdmin.user.email}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={withLocale("/inbox", locale)}>
                    <Button size="sm">
                      {t("admin.forbidden.backToInbox")}
                    </Button>
                  </Link>
                  <Link href={withLocale("/settings", locale)}>
                    <Button size="sm" variant="secondary">
                      {t("admin.forbidden.viewSettings")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </AppShell>
    );
  }

  const [clinics, marketingLeadList, activity] = await Promise.all([
    listAdminClinics(),
    listAdminMarketingLeads({
      status: leadStatus,
      query: q,
      source,
      country,
      includeArchived: leadStatus === "archived"
    }),
    listAdminActivity()
  ]);
  const env = requirePublicEnv();
  const statusKey = getStatusCopy(getSearchParam(params?.admin_status));
  const hasError = Boolean(getSearchParam(params?.admin_error));
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const compactDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium"
  });
  const staffCount = clinics.reduce((count, clinic) => count + clinic.staff.length, 0);

  return (
    <AppShell
      locale={locale}
      currentPath="/admin"
      pageTitle={t("admin.title")}
    >
      <div className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--ink)]">
                {t("admin.title")}
              </h1>
              <Badge tone="teal">
                <ShieldCheck aria-hidden="true" size={13} />
                {t("admin.superAdmin")}
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {t("admin.description")}
            </p>
          </div>
        </div>

        {statusKey ? <Toast tone="success">{t(statusKey)}</Toast> : null}

        {hasError ? <Toast tone="error">{t("admin.error")}</Toast> : null}

        <AdminTabs
          activeTab={activeTab}
          ariaLabel={t("admin.tabs.ariaLabel")}
          loadingLabel="Loading admin"
          tabs={adminTabs.map((tab) => ({
            id: tab,
            href: adminHref(locale, tab),
            label: t(`admin.tabs.${tab}` as CopyKey),
            count:
              tab === "leads"
                ? marketingLeadList.statusCounts.all
                : tab === "clinics"
                  ? clinics.length
                  : tab === "staff"
                    ? staffCount
                    : activity.length
          }))}
        />

        {activeTab === "leads" ? (
          <section className="grid gap-3">
            <LeadFilters
              country={country}
              countries={marketingLeadList.countries}
              locale={locale}
              q={q}
              source={source}
              status={leadStatus}
              t={t}
            />
            <Panel className="overflow-hidden p-0">
              {marketingLeadList.leads.length === 0 ? (
                <div className="p-6 text-sm leading-6 text-[var(--muted)]">
                  {t("admin.demoLeadsEmpty")}
                </div>
              ) : (
                <AdminLeadTable
                  labels={{
                    selected: t("admin.leads.selected"),
                    reply: t("admin.leads.reply"),
                    details: t("admin.leads.details"),
                    markContacted: t("admin.leads.markContacted"),
                    markQualified: t("admin.leads.markQualified"),
                    archive: t("admin.leads.archive"),
                    copyEmails: t("admin.leads.copyEmails"),
                    convert: t("admin.leads.convert"),
                    adminNote: t("admin.leads.adminNote"),
                    saveNote: t("admin.leads.saveNote"),
                    events: t("admin.leads.events"),
                    noEvents: t("admin.leads.noEvents"),
                    updated: t("admin.leads.updated"),
                    status: t("admin.leads.status"),
                    source: t("admin.leads.source"),
                    country: t("admin.country"),
                    contact: t("admin.leads.contact"),
                    pms: t("admin.demoLeadsPms"),
                    volume: t("admin.demoLeadsVolume"),
                    message: t("admin.demoLeadsMessage"),
                    consent: t("admin.demoLeadsConsent"),
                    notProvided: t("admin.demoLeadsNotProvided"),
                    actionDone: t("admin.leads.actionDone"),
                    actionFailed: t("admin.leads.actionFailed"),
                    emailsCopied: t("admin.leads.emailsCopied"),
                    archiveConfirm: t("admin.leads.archiveConfirm"),
                    statusNew: t("admin.leads.status.new"),
                    statusContacted: t("admin.leads.status.contacted"),
                    statusQualified: t("admin.leads.status.qualified"),
                    statusConverted: t("admin.leads.status.converted"),
                    statusArchived: t("admin.leads.status.archived")
                  }}
                  leads={marketingLeadList.leads}
                  locale={locale}
                />
              )}
            </Panel>
          </section>
        ) : null}

        {activeTab === "clinics" ? (
          <ClinicsTab
            compactDateFormatter={compactDateFormatter}
            defaultCountry={guessCountryCode(prefillCountry) || "EE"}
            defaultName={prefillClinicName}
            defaultSlug={slugifyClinicName(prefillClinicName)}
            envAppUrl={env.NEXT_PUBLIC_APP_URL}
            locale={locale}
            t={t}
            clinics={clinics}
          />
        ) : null}

        {activeTab === "staff" ? (
          <StaffTab
            compactDateFormatter={compactDateFormatter}
            locale={locale}
            t={t}
            clinics={clinics}
          />
        ) : null}

        {activeTab === "activity" ? (
          <ActivityTab
            activity={activity}
            dateFormatter={dateFormatter}
            t={t}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function LeadFilters({
  country,
  countries,
  locale,
  q,
  source,
  status,
  t
}: {
  country: string;
  countries: string[];
  locale: SupportedLocale;
  q: string;
  source: string;
  status: MarketingLeadStatus | "all";
  t: ReturnType<typeof createTranslator>;
}) {
  return (
    <Panel className="p-3">
      <form className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_180px_auto]">
        <input name="lang" type="hidden" value={locale} />
        <input name="tab" type="hidden" value="leads" />
        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
            {t("admin.leads.search")}
          </span>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-2)]"
              size={15}
            />
            <input
              className="h-10 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
              defaultValue={q}
              name="q"
              placeholder={t("admin.leads.searchPlaceholder")}
            />
          </div>
        </label>
        <AdminSelect
          label={t("admin.leads.status")}
          name="status"
          options={[
            { value: "all", label: t("admin.leads.allStatuses") },
            { value: "new", label: t("admin.leads.status.new") },
            { value: "contacted", label: t("admin.leads.status.contacted") },
            { value: "qualified", label: t("admin.leads.status.qualified") },
            { value: "converted", label: t("admin.leads.status.converted") },
            { value: "archived", label: t("admin.leads.viewArchived") }
          ]}
          value={status}
        />
        <AdminSelect
          label={t("admin.leads.source")}
          name="source"
          options={[
            { value: "", label: t("admin.leads.allSources") },
            ...Object.entries(leadSourceLabels).map(([value, label]) => ({
              value,
              label
            }))
          ]}
          value={source}
        />
        <AdminSelect
          label={t("admin.country")}
          name="country"
          options={[
            { value: "", label: t("admin.leads.allCountries") },
            ...countries.map((item) => ({ value: item, label: item }))
          ]}
          value={country}
        />
        <div className="flex items-end gap-2">
          <Button className="h-10" type="submit">
            {t("admin.leads.applyFilters")}
          </Button>
          <Button asChild className="h-10" type="button" variant="ghost">
            <Link href={adminHref(locale, "leads")}>
              <X aria-hidden="true" size={14} />
              {t("admin.leads.clearFilters")}
            </Link>
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function AdminSelect({
  label,
  name,
  options,
  value
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-2)]">
        {label}
      </span>
      <select
        className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
        defaultValue={value}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClinicsTab({
  clinics,
  compactDateFormatter,
  defaultCountry,
  defaultName,
  defaultSlug,
  envAppUrl,
  locale,
  t
}: {
  clinics: Awaited<ReturnType<typeof listAdminClinics>>;
  compactDateFormatter: Intl.DateTimeFormat;
  defaultCountry: string;
  defaultName: string;
  defaultSlug: string;
  envAppUrl: string;
  locale: SupportedLocale;
  t: ReturnType<typeof createTranslator>;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <Building2 aria-hidden="true" className="text-[var(--primary)]" size={18} />
          <h2 className="font-semibold">{t("admin.createClinic")}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {t("admin.clinicsDescription")}
        </p>
        <form action={createClinic} className="mt-4 grid gap-3">
          <input name="lang" type="hidden" value={locale} />
          <AdminInput
            defaultValue={defaultName}
            label={t("admin.name")}
            name="name"
            required
          />
          <AdminInput
            defaultValue={defaultSlug}
            label={t("admin.slug")}
            name="slug"
            required
          />
          <AdminInput
            defaultValue={defaultCountry}
            label={t("admin.country")}
            maxLength={2}
            name="country"
            required
          />
          <AdminInput
            defaultValue="Europe/Tallinn"
            label={t("admin.timezone")}
            name="timezone"
            required
          />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">{t("admin.locale")}</span>
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              defaultValue={locale}
              name="clinicLocale"
            >
              {supportedLocales.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">{t("admin.create")}</Button>
        </form>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-lg font-semibold">{t("admin.clinics")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
              <tr>
                <th className="px-4 py-3">{t("admin.clinic")}</th>
                <th className="px-3 py-3">{t("admin.country")}</th>
                <th className="px-3 py-3">{t("admin.locale")}</th>
                <th className="px-3 py-3">{t("admin.staff")}</th>
                <th className="px-3 py-3">{t("admin.intakeUrl")}</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => {
                const intakeUrl = `${envAppUrl}/intake/${clinic.slug}?lang=${clinic.locale}`;
                return (
                  <tr key={clinic.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--ink)]">
                        {clinic.name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {clinic.slug} · {compactDateFormatter.format(new Date(clinic.created_at))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {clinic.country}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {clinic.locale.toUpperCase()}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {clinic.staff.length}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        className="inline-flex items-center gap-1 break-all text-[var(--primary)] hover:underline"
                        href={intakeUrl}
                      >
                        {intakeUrl}
                        <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function StaffTab({
  clinics,
  compactDateFormatter,
  locale,
  t
}: {
  clinics: Awaited<ReturnType<typeof listAdminClinics>>;
  compactDateFormatter: Intl.DateTimeFormat;
  locale: SupportedLocale;
  t: ReturnType<typeof createTranslator>;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Panel className="p-4">
        <div className="flex items-center gap-2">
          <UserPlus aria-hidden="true" className="text-[var(--primary)]" size={18} />
          <h2 className="font-semibold">{t("admin.addStaff")}</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {t("admin.staffDescription")}
        </p>
        <form action={addClinicStaff} className="mt-4 grid gap-3">
          <input name="lang" type="hidden" value={locale} />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">{t("admin.clinic")}</span>
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              name="clinicId"
              required
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </label>
          <AdminInput label={t("admin.email")} name="email" required type="email" />
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">{t("admin.role")}</span>
            <select
              className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
              defaultValue="reception"
              name="role"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">{t("admin.addStaffButton")}</Button>
        </form>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-[var(--line)] p-4">
          <h2 className="text-lg font-semibold">{t("admin.staff")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-2)]">
              <tr>
                <th className="px-4 py-3">{t("admin.email")}</th>
                <th className="px-3 py-3">{t("admin.clinic")}</th>
                <th className="px-3 py-3">{t("admin.role")}</th>
                <th className="px-3 py-3">{t("admin.leads.status")}</th>
                <th className="px-3 py-3 text-right">{t("admin.activate")}</th>
              </tr>
            </thead>
            <tbody>
              {clinics.flatMap((clinic) =>
                clinic.staff.map((member) => (
                  <tr key={member.id} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--ink)]">
                        {member.email}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {compactDateFormatter.format(new Date(member.created_at))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {clinic.name}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted)]">
                      {member.role}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={member.is_active ? "teal" : "neutral"}>
                        {member.is_active ? t("admin.active") : t("admin.inactive")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <form action={updateClinicStaffStatus}>
                        <input name="lang" type="hidden" value={locale} />
                        <input name="membershipId" type="hidden" value={member.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={member.is_active ? "false" : "true"}
                        />
                        <Button size="sm" type="submit" variant="secondary">
                          {member.is_active
                            ? t("admin.deactivate")
                            : t("admin.activate")}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  );
}

function AdminInput({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
        {...props}
      />
    </label>
  );
}

function ActivityTab({
  activity,
  dateFormatter,
  t
}: {
  activity: AdminActivityItem[];
  dateFormatter: Intl.DateTimeFormat;
  t: ReturnType<typeof createTranslator>;
}) {
  return (
    <Panel className="overflow-hidden p-0">
      {activity.length === 0 ? (
        <div className="p-6 text-sm text-[var(--muted)]">
          {t("admin.activity.empty")}
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {activity.map((item) => (
            <article className="grid gap-2 p-4" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Badge tone={item.entityType === "marketing_lead" ? "teal" : "neutral"}>
                    {item.entityType.replace("_", " ")}
                  </Badge>
                  <h3 className="truncate font-semibold capitalize text-[var(--ink)]">
                    {item.action.replaceAll("_", " ")}
                  </h3>
                </div>
                <time className="text-sm text-[var(--muted)]">
                  {dateFormatter.format(new Date(item.createdAt))}
                </time>
              </div>
              <p className="break-words text-sm text-[var(--muted)]">
                {item.entityLabel}
              </p>
              <p className="text-xs text-[var(--muted-2)]">
                {item.actorEmail ?? item.actorId ?? "system"}
              </p>
              {renderPayload(item.payload) ? (
                <p className="rounded-[var(--radius)] bg-[var(--soft)] px-3 py-2 text-xs text-[var(--muted)]">
                  {t("admin.activity.payload")}: {renderPayload(item.payload)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
