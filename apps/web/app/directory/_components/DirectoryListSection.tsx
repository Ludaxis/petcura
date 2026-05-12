import "server-only";

import { Badge } from "@petcura/ui";
import {
  createTranslator,
  localeOptions,
  type SupportedLocale
} from "@petcura/shared";
import {
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { updateCustomerProfile } from "@/app/customers/actions";
import { updatePetProfile } from "@/app/pets/actions";
import type { StaffContext } from "@/lib/auth/staff";
import {
  listClinicCustomers,
  listClinicPets,
  type DirectorySort
} from "@/lib/clinic/directory";

type DirectoryTab = "owners" | "pets";

type DirectoryListSectionProps = {
  staffContext: StaffContext;
  locale: SupportedLocale;
  tab: DirectoryTab;
  q: string;
  sort: DirectorySort;
  selectedLanguage: string | undefined;
  selectedSpecies: string | undefined;
  recentDays: number | undefined;
  hasOpenRequest: boolean;
};

function formatDate(value: string | null, locale: SupportedLocale) {
  if (!value) return "No activity";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

/**
 * Async server component that performs the per-tab directory fetch and
 * renders the list. Wrapped by the page in `<Suspense key=...>` so tab and
 * filter changes show DirectoryListSkeleton in ~100ms instead of blocking
 * the whole route segment.
 *
 * NOTE on `React.cache` deduplication: the page no longer awaits the list at
 * the top level — there's only one caller per request (this component) for
 * the active tab. Deduplication is therefore moot; if a future change adds a
 * separate top-level counts fetch with identical args, wrap `listClinicCustomers`
 * / `listClinicPets` in `cache(...)` at the lib boundary so both callers
 * share one DB round-trip.
 */
export async function DirectoryListSection({
  staffContext,
  locale,
  tab,
  q,
  sort,
  selectedLanguage,
  selectedSpecies,
  recentDays,
  hasOpenRequest
}: DirectoryListSectionProps) {
  const t = createTranslator(locale);

  if (tab === "owners") {
    const owners = await listClinicCustomers(
      staffContext.supabase,
      staffContext.clinic.id,
      {
        q,
        hasOpenRequest,
        sort,
        limit: 60,
        ...(selectedLanguage ? { lang: selectedLanguage } : {}),
        ...(recentDays ? { recentDays } : {})
      }
    );

    return (
      <>
        <div className="flex items-center justify-end">
          <Badge tone="neutral">
            {t("directory.results.count").replace("{count}", String(owners.total))}
          </Badge>
        </div>
        <div className="grid gap-3">
          {owners.rows.length ? (
            owners.rows.map((owner, index) => (
              <div
                key={owner.id}
                className="pc-row-in"
                style={
                  { ["--pc-row-i" as string]: String(index) } as React.CSSProperties
                }
              >
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
              </div>
            ))
          ) : (
            <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
              {t("directory.results.emptyOwners")}
            </p>
          )}
        </div>
      </>
    );
  }

  const pets = await listClinicPets(
    staffContext.supabase,
    staffContext.clinic.id,
    {
      q,
      hasOpenRequest,
      sort,
      limit: 60,
      ...(selectedSpecies ? { species: selectedSpecies } : {}),
      ...(selectedLanguage ? { lang: selectedLanguage } : {}),
      ...(recentDays ? { recentDays } : {})
    }
  );

  return (
    <>
      <div className="flex items-center justify-end">
        <Badge tone="neutral">
          {t("directory.results.count").replace("{count}", String(pets.total))}
        </Badge>
      </div>
      <div className="grid gap-3">
        {pets.rows.length ? (
          pets.rows.map((pet, index) => (
            <div
              key={pet.id}
              className="pc-row-in"
              style={
                { ["--pc-row-i" as string]: String(index) } as React.CSSProperties
              }
            >
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
                <ProfileField htmlFor={`pet-breed-${pet.id}`} label="Breed">
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
            </div>
          ))
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
            {t("directory.results.emptyPets")}
          </p>
        )}
      </div>
    </>
  );
}
