import { FolderOpen, PawPrint, Search, UserRound } from "lucide-react";
import {
  createTranslator,
  localeOptions,
  type SupportedLocale
} from "@petcura/shared";
import { Badge, Button, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import {
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { updateCustomerProfile } from "@/app/customers/actions";
import { updatePetProfile } from "@/app/pets/actions";
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

function formatDate(value: string | null, locale: SupportedLocale) {
  if (!value) return "No activity";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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
              <div className="grid gap-3">
                {owners.rows.length ? (
                  owners.rows.map((owner) => (
                    <ProfileEditorCard
                      action={updateCustomerProfile}
                      description={
                        <span>
                          {owner.phone}
                          {owner.email ? ` · ${owner.email}` : ""}
                          {` · ${owner.petCount} ${t("directory.owner.petsLabel")}`}
                          {` · ${owner.openRequestCount} ${t("directory.owner.openLabel")}`}
                          {` · ${formatDate(owner.latestRequestAt, locale)}`}
                        </span>
                      }
                      hiddenFields={
                        <>
                          <input name="lang" type="hidden" value={locale} />
                          <input name="ownerId" type="hidden" value={owner.id} />
                        </>
                      }
                      imageLabel={t("profile.photo")}
                      imageUrl={owner.photoUrl}
                      key={owner.id}
                      name={owner.name}
                      submitLabel={t("profile.save")}
                      title={owner.name}
                    >
                      <ProfileField
                        htmlFor={`owner-name-${owner.id}`}
                        label={t("profile.fullName")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={owner.name}
                          id={`owner-name-${owner.id}`}
                          name="name"
                          required
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`owner-phone-${owner.id}`}
                        label={t("profile.phone")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={owner.phone}
                          id={`owner-phone-${owner.id}`}
                          name="phone"
                          required
                          type="tel"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`owner-email-${owner.id}`}
                        label={t("settings.email")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={owner.email ?? ""}
                          id={`owner-email-${owner.id}`}
                          name="email"
                          type="email"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`owner-language-${owner.id}`}
                        label={t("profile.language")}
                      >
                        <select
                          className={profileInputClass}
                          defaultValue={owner.preferredLanguage}
                          id={`owner-language-${owner.id}`}
                          name="preferredLanguage"
                        >
                          {localeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </ProfileField>
                      <ProfileField
                        htmlFor={`owner-notes-${owner.id}`}
                        label={t("directory.detail.notes")}
                        wide
                      >
                        <textarea
                          className={profileTextareaClass}
                          defaultValue={owner.notes ?? ""}
                          id={`owner-notes-${owner.id}`}
                          name="notes"
                        />
                      </ProfileField>
                    </ProfileEditorCard>
                  ))
                ) : (
                  <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
                    {t("directory.results.emptyOwners")}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {pets.rows.length ? (
                  pets.rows.map((pet) => (
                    <ProfileEditorCard
                      action={updatePetProfile}
                      description={
                        <span>
                          {pet.species}
                          {pet.breed ? ` · ${pet.breed}` : ""}
                          {` · ${pet.ownerName}`}
                          {` · ${pet.openRequestCount} ${t("directory.pet.openLabel")}`}
                          {` · ${formatDate(pet.latestRequestAt, locale)}`}
                        </span>
                      }
                      hiddenFields={
                        <>
                          <input name="lang" type="hidden" value={locale} />
                          <input name="petId" type="hidden" value={pet.id} />
                        </>
                      }
                      imageLabel={t("profile.photo")}
                      imageUrl={pet.photoUrl}
                      key={pet.id}
                      name={pet.name}
                      submitLabel={t("profile.save")}
                      title={pet.name}
                    >
                      <ProfileField
                        htmlFor={`pet-name-${pet.id}`}
                        label={t("profile.fullName")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={pet.name}
                          id={`pet-name-${pet.id}`}
                          name="name"
                          required
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-species-${pet.id}`}
                        label={t("directory.filter.species")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={pet.species}
                          id={`pet-species-${pet.id}`}
                          name="species"
                          required
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-breed-${pet.id}`}
                        label="Breed"
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={pet.breed ?? ""}
                          id={`pet-breed-${pet.id}`}
                          name="breed"
                        />
                      </ProfileField>
                      <ProfileField htmlFor={`pet-sex-${pet.id}`} label="Sex">
                        <input
                          className={profileInputClass}
                          defaultValue={pet.sex ?? ""}
                          id={`pet-sex-${pet.id}`}
                          name="sex"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-birth-date-${pet.id}`}
                        label={t("directory.pet.ageLabel")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={pet.birthDate ?? ""}
                          id={`pet-birth-date-${pet.id}`}
                          name="birthDate"
                          type="date"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-weight-${pet.id}`}
                        label={t("directory.pet.weightLabel")}
                      >
                        <input
                          className={profileInputClass}
                          defaultValue={pet.weightKg ?? ""}
                          id={`pet-weight-${pet.id}`}
                          name="weightKg"
                          step="0.1"
                          type="number"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-allergies-${pet.id}`}
                        label={t("directory.detail.medical")}
                        wide
                      >
                        <textarea
                          className={profileTextareaClass}
                          defaultValue={pet.allergies ?? ""}
                          id={`pet-allergies-${pet.id}`}
                          name="allergies"
                        />
                      </ProfileField>
                      <ProfileField
                        htmlFor={`pet-medical-notes-${pet.id}`}
                        label={t("directory.detail.notes")}
                        wide
                      >
                        <textarea
                          className={profileTextareaClass}
                          defaultValue={pet.medicalNotes ?? ""}
                          id={`pet-medical-notes-${pet.id}`}
                          name="medicalNotes"
                        />
                      </ProfileField>
                    </ProfileEditorCard>
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
