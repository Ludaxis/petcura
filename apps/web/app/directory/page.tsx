import { FolderOpen, PawPrint, Search, UserRound } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  localeOptions,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import { Badge, Button, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import {
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { OwnerRow } from "@/app/directory/_components/OwnerRow";
import { PetRow } from "@/app/directory/_components/PetRow";
// formatDate is no longer needed at the page level — the rows now render
// their own relative-time labels via formatRelativeFor() below.
import { requireStaffContext } from "@/lib/auth/staff";
import {
  listClinicCustomers,
  listClinicPets,
  listClinicSpecies,
  type DirectorySort
} from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";

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

  const [owners, pets, species] = await Promise.all([
    listClinicCustomers(staffContext.supabase, staffContext.clinic.id, {
      q,
      hasOpenRequest,
      sort,
      limit: 60,
      ...(selectedLanguage ? { lang: selectedLanguage } : {}),
      ...(recentDays ? { recentDays } : {})
    }),
    listClinicPets(staffContext.supabase, staffContext.clinic.id, {
      q,
      hasOpenRequest,
      sort,
      limit: 60,
      ...(selectedSpecies ? { species: selectedSpecies } : {}),
      ...(selectedLanguage ? { lang: selectedLanguage } : {}),
      ...(recentDays ? { recentDays } : {})
    }),
    listClinicSpecies(staffContext.supabase, staffContext.clinic.id)
  ]);

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
            <p
              role="status"
              className="mt-3 rounded-[var(--radius)] bg-[var(--primary-soft)] px-3 py-2 text-[13px] font-medium text-[var(--primary-strong)]"
            >
              {t("profile.saved")}
            </p>
          ) : null}
          {hasError ? (
            <p
              role="alert"
              className="mt-3 rounded-[var(--radius)] bg-[var(--red-soft)] px-3 py-2 text-[13px] font-medium text-[var(--red)]"
            >
              {t("profile.error")}
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm">
              <div className="flex rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-1">
                {(["owners", "pets"] as const).map((item) => (
                  <Button
                    asChild
                    key={item}
                    variant={tab === item ? "primary" : "ghost"}
                  >
                    <a
                      href={directoryUrl({
                        locale,
                        tab: item,
                        q,
                        language: selectedLanguage,
                        species: selectedSpecies,
                        sort,
                        recent: recentDays,
                        open: hasOpenRequest
                      })}
                    >
                      {item === "owners" ? (
                        <UserRound aria-hidden="true" size={15} />
                      ) : (
                        <PawPrint aria-hidden="true" size={15} />
                      )}
                      {t(
                        item === "owners"
                          ? "directory.tabs.owners"
                          : "directory.tabs.pets"
                      )}
                    </a>
                  </Button>
                ))}
              </div>
              <Badge tone="neutral">
                {countLabel(t, tab === "owners" ? owners.total : pets.total)}
              </Badge>
            </div>

            <form
              className="grid gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm lg:grid-cols-[minmax(12rem,1fr)_10rem_10rem_10rem_auto_auto]"
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
                {t("directory.sort.label")}
              </Button>
            </form>

            {tab === "owners" ? (
              <div className="grid">
                {owners.rows.length ? (
                  owners.rows.map((owner, index) => (
                    <OwnerRow
                      canEdit={canEditOwners}
                      density="comfortable"
                      formatRelative={formatRelative}
                      href={directoryUrl({
                        locale,
                        tab,
                        ...(q ? { q } : {}),
                        language: selectedLanguage ?? undefined,
                        species: selectedSpecies ?? undefined,
                        sort,
                        recent: recentDays,
                        open: hasOpenRequest
                      }) + `&id=${owner.id}`}
                      index={index}
                      key={owner.id}
                      locale={locale}
                      owner={owner}
                      selected={selectedId === owner.id}
                    />
                  ))
                ) : (
                  <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
                    {t("directory.results.emptyOwners")}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid">
                {pets.rows.length ? (
                  pets.rows.map((pet, index) => (
                    <PetRow
                      canEdit={canEditPets}
                      density="comfortable"
                      formatRelative={formatRelative}
                      href={directoryUrl({
                        locale,
                        tab,
                        ...(q ? { q } : {}),
                        language: selectedLanguage ?? undefined,
                        species: selectedSpecies ?? undefined,
                        sort,
                        recent: recentDays,
                        open: hasOpenRequest
                      }) + `&id=${pet.id}`}
                      index={index}
                      key={pet.id}
                      locale={locale}
                      pet={pet}
                      selected={selectedId === pet.id}
                    />
                  ))
                ) : (
                  <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
                    {t("directory.results.emptyPets")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
