import { Suspense } from "react";
import { FolderOpen, Search } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  localeOptions,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import { Badge, Button, Toast, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import {
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { OwnerRow } from "@/app/directory/_components/OwnerRow";
import { PetRow } from "@/app/directory/_components/PetRow";
import { requireStaffContext } from "@/lib/auth/staff";
import {
  listClinicSpecies,
  type DirectorySort
} from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";
import { DirectoryListSection } from "./_components/DirectoryListSection";
import { DirectoryListSkeleton } from "./_components/DirectoryListSkeleton";
import { DirectoryTabs } from "./_components/DirectoryTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DirectoryTab = "owners" | "pets";

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    tab?: string | string[];
    q?: string | string[];
    sort?: string | string[];
    language?: string | string[];
    species?: string | string[];
    recent?: string | string[];
    open?: string | string[];
    directory_status?: string | string[];
    directory_error?: string | string[];
    id?: string | string[];
  }>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getTab(value: string | string[] | undefined): DirectoryTab {
  return getParam(value) === "pets" ? "pets" : "owners";
}

function getSort(value: string | string[] | undefined): DirectorySort {
  const next = getParam(value);
  return next === "name" || next === "latest" || next === "pets"
    ? next
    : "recent";
}

function getRecentDays(value: string | string[] | undefined) {
  const parsed = Number(getParam(value));
  return parsed === 7 || parsed === 30 || parsed === 90 ? parsed : undefined;
}

function directoryUrl({
  locale,
  tab,
  q,
  language,
  species,
  sort,
  recent,
  open
}: {
  locale: SupportedLocale;
  tab: DirectoryTab;
  q?: string;
  language?: string | undefined;
  species?: string | undefined;
  sort?: DirectorySort | undefined;
  recent?: number | undefined;
  open?: boolean;
}) {
  const params = new URLSearchParams({ lang: locale, tab });
  if (q) params.set("q", q);
  if (language) params.set("language", language);
  if (species) params.set("species", species);
  if (sort && sort !== "recent") params.set("sort", sort);
  if (recent) params.set("recent", String(recent));
  if (open) params.set("open", "1");
  return `/directory?${params.toString()}`;
}

function formatRelativeFor(locale: SupportedLocale) {
  // Lightweight relative-time formatter consumed by the row components.
  // Falls back to a localized date for anything older than ~30 days so
  // staff scanning a list still see a fixed anchor instead of "1 month ago".
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return (iso: string) => {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = then - Date.now();
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const abs = Math.abs(diffMs);
    if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
    if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
    if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), "day");
    return dtf.format(new Date(iso));
  };
}

function countLabel(
  t: ReturnType<typeof createTranslator>,
  count: number
) {
  return t("directory.results.count").replace("{count}", String(count));
}

export default async function DirectoryPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = getParam(sp.lang);
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/directory");
  const tab = getTab(sp.tab);
  const q = getParam(sp.q)?.trim() ?? "";
  const selectedLanguage = getParam(sp.language);
  const selectedSpecies = getParam(sp.species);
  const sort = getSort(sp.sort);
  const recentDays = getRecentDays(sp.recent);
  const hasOpenRequest = getParam(sp.open) === "1";
  const status = getParam(sp.directory_status);
  const hasError = Boolean(getParam(sp.directory_error));
  const selectedId = getParam(sp.id);

  const actorRole = staffContext.membership.role as StaffRole;
  const canEditOwners = hasClinicPermission(actorRole, "customers:manage");
  const canEditPets = hasClinicPermission(actorRole, "pets:manage");
  const formatRelative = formatRelativeFor(locale);

  // Species powers the filter dropdown in the header and is cheap (single
  // SELECT DISTINCT). The per-tab list fetch was hoisted into
  // DirectoryListSection so tab/filter switches can show a Suspense skeleton
  // in the list region without blocking the header — see the Suspense
  // boundary below.
  const species = await listClinicSpecies(
    staffContext.supabase,
    staffContext.clinic.id
  );

  return (
    <AppShell
      locale={locale}
      currentPath="/directory"
      pageTitle={t("nav.headerTitle.directory")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <FolderOpen aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("directory.title")}
                </h1>
                <Badge tone="neutral">{staffContext.clinic.name}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("directory.description")}
              </p>
            </div>
          </div>

          {status === "saved" ? (
            <Toast tone="success" className="mt-3">
              {t("profile.saved")}
            </Toast>
          ) : null}
          {hasError ? (
            <Toast tone="error" className="mt-3">
              {t("profile.error")}
            </Toast>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-3">
            {/*
              Tabs and filter form sit directly on the --soft canvas — the
              former cards-in-card chrome (border + shadow + paper bg) was
              flagged in the 2026-05-16 QA pass. The list section below
              keeps its own paper surface so rows still read as a unit.
            */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/*
                Tabs render synchronously so clicks feel instant. The active
                tab's count badge is rendered inside DirectoryListSection
                (which awaits the per-tab list) so it can't block this header.
              */}
              <DirectoryTabs
                activeTab={tab}
                loadingLabel={t("directory.loading.label")}
                tabs={(["owners", "pets"] as const).map((item) => ({
                  id: item,
                  href: directoryUrl({
                    locale,
                    tab: item,
                    q,
                    language: selectedLanguage,
                    species: selectedSpecies,
                    sort,
                    recent: recentDays,
                    open: hasOpenRequest
                  }),
                  label: t(
                    item === "owners"
                      ? "directory.tabs.owners"
                      : "directory.tabs.pets"
                  )
                }))}
              />
            </div>

            <form
              className="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_10rem_auto_auto]"
              method="get"
            >
              <input name="lang" type="hidden" value={locale} />
              <input name="tab" type="hidden" value={tab} />
              <label className="relative grid gap-1.5" htmlFor="directory-q">
                <span className="text-[12px] font-semibold text-[var(--ink)]">
                  {t("directory.search.placeholder")}
                </span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 left-3 text-[var(--muted)]"
                  size={15}
                />
                <input
                  className={cn(profileInputClass, "pl-9")}
                  defaultValue={q}
                  id="directory-q"
                  name="q"
                />
              </label>
              <ProfileField
                htmlFor="directory-language"
                label={t("directory.filter.language")}
              >
                <select
                  className={profileInputClass}
                  defaultValue={selectedLanguage ?? ""}
                  id="directory-language"
                  name="language"
                >
                  <option value="">{t("directory.filter.allLanguages")}</option>
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ProfileField>
              <ProfileField
                htmlFor="directory-species"
                label={t("directory.filter.species")}
              >
                <select
                  aria-describedby={
                    tab !== "pets" ? "directory-species-hint" : undefined
                  }
                  className={profileInputClass}
                  defaultValue={selectedSpecies ?? ""}
                  disabled={tab !== "pets"}
                  id="directory-species"
                  name="species"
                >
                  <option value="">{t("directory.filter.allSpecies")}</option>
                  {species.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {tab !== "pets" ? (
                  <p
                    id="directory-species-hint"
                    className="mt-1 text-[11.5px] text-[var(--muted)]"
                  >
                    {t("directory.filter.speciesPetsTabHint")}
                  </p>
                ) : null}
              </ProfileField>
              <ProfileField htmlFor="directory-sort" label={t("directory.sort.label")}>
                <select
                  className={profileInputClass}
                  defaultValue={sort}
                  id="directory-sort"
                  name="sort"
                >
                  <option value="recent">{t("directory.sort.recent")}</option>
                  <option value="name">{t("directory.sort.name")}</option>
                  <option value="latest">{t("directory.sort.latest")}</option>
                  <option value="pets">{t("directory.sort.pets")}</option>
                </select>
              </ProfileField>
              <label className="flex items-end gap-2 pb-2 text-[13px] font-medium text-[var(--ink)]">
                <input
                  className="h-4 w-4 rounded border-[var(--line)] accent-[var(--primary)]"
                  defaultChecked={hasOpenRequest}
                  name="open"
                  type="checkbox"
                  value="1"
                />
                {t("directory.filter.openRequests")}
              </label>
              <Button className="self-end" type="submit" variant="secondary">
                {t("directory.filter.apply")}
              </Button>
            </form>

            {/*
              List section streams independently. The Suspense key includes
              every param that triggers a refetch so tab/filter/sort/search
              changes re-fall back to DirectoryListSkeleton (~100ms) while
              the header above stays interactive. DirectoryListSection
              renders OwnerRow / PetRow with the inline expand-to-edit
              affordance (canEditOwners / canEditPets are passed through).
            */}
            <Suspense
              key={`directory-${tab}-${q}-${sort}-${hasOpenRequest ? 1 : 0}-${recentDays ?? "all"}-${selectedLanguage ?? "any"}-${selectedSpecies ?? "any"}`}
              fallback={<DirectoryListSkeleton />}
            >
              <DirectoryListSection
                staffContext={staffContext}
                locale={locale}
                tab={tab}
                q={q}
                sort={sort}
                selectedLanguage={selectedLanguage ?? undefined}
                selectedSpecies={selectedSpecies ?? undefined}
                recentDays={recentDays ?? undefined}
                hasOpenRequest={hasOpenRequest}
                canEditOwners={canEditOwners}
                canEditPets={canEditPets}
                selectedId={selectedId}
                queryString={q ? `&id=` : "&id="}
              />
            </Suspense>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
