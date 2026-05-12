import type { ReactNode } from "react";
import { ClipboardList, PawPrint, Scale, User } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  type StaffRole
} from "@petcura/shared";
import { Badge } from "@petcura/ui";
import {
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { AppShell } from "@/app/_components/AppShell";
import { updatePetProfile } from "@/app/pets/actions";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicPets } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    pets_error?: string | string[];
    pets_status?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MiniMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 line-clamp-2 font-semibold text-[var(--ink)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function PetsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/pets");
  const actorRole = staffContext.membership.role as StaffRole;
  const canManagePets = hasClinicPermission(actorRole, "pets:manage");
  const rows = await listClinicPets(staffContext.supabase, staffContext.clinic.id);
  const hasError = Boolean(getSearchParam(sp.pets_error));
  const status = getSearchParam(sp.pets_status);

  return (
    <AppShell
      locale={locale}
      currentPath="/pets"
      pageTitle={t("nav.headerTitle.pets")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <PawPrint aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("pets.title")}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("pets.description")}
              </p>
            </div>
            <Badge tone="teal">{rows.length}</Badge>
          </div>

          {status === "saved" ? (
            <p className="mt-3 rounded-[var(--radius)] bg-[var(--primary-soft)] px-3 py-2 text-[13px] font-medium text-[var(--primary-strong)]">
              {t("profile.saved")}
            </p>
          ) : null}
          {hasError ? (
            <p className="mt-3 rounded-[var(--radius)] bg-[var(--red-soft)] px-3 py-2 text-[13px] font-medium text-[var(--red)]">
              {t("profile.error")}
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          {rows.length === 0 ? (
            <div className="mx-auto flex max-w-6xl items-center rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)] shadow-sm">
              {t("pets.empty")}
            </div>
          ) : (
            <ol className="mx-auto grid max-w-6xl gap-3">
              {rows.map((pet) => (
                <li key={pet.id}>
                  <ProfileEditorCard
                    action={updatePetProfile}
                    disabled={!canManagePets}
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
                    description={
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>
                          {pet.ownerName} · {pet.ownerPhone}
                        </span>
                        <Badge tone="neutral">{pet.species}</Badge>
                      </span>
                    }
                  >
                    <ProfileField htmlFor={`pet-name-${pet.id}`} label={t("profile.petName")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.name}
                        disabled={!canManagePets}
                        id={`pet-name-${pet.id}`}
                        name="name"
                        required
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-species-${pet.id}`} label={t("intake.petSpecies")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.species}
                        disabled={!canManagePets}
                        id={`pet-species-${pet.id}`}
                        name="species"
                        required
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-breed-${pet.id}`} label={t("profile.breed")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.breed ?? ""}
                        disabled={!canManagePets}
                        id={`pet-breed-${pet.id}`}
                        name="breed"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-sex-${pet.id}`} label={t("profile.sex")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.sex ?? ""}
                        disabled={!canManagePets}
                        id={`pet-sex-${pet.id}`}
                        name="sex"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-birth-${pet.id}`} label={t("profile.birthDate")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.birthDate ?? ""}
                        disabled={!canManagePets}
                        id={`pet-birth-${pet.id}`}
                        name="birthDate"
                        type="date"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-weight-${pet.id}`} label={t("pets.weight")}>
                      <input
                        className={profileInputClass}
                        defaultValue={pet.weightKg ?? ""}
                        disabled={!canManagePets}
                        id={`pet-weight-${pet.id}`}
                        min="0"
                        name="weightKg"
                        step="0.01"
                        type="number"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-allergies-${pet.id}`} label={t("pets.allergies")} wide>
                      <textarea
                        className={profileTextareaClass}
                        defaultValue={pet.allergies ?? ""}
                        disabled={!canManagePets}
                        id={`pet-allergies-${pet.id}`}
                        name="allergies"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`pet-notes-${pet.id}`} label={t("pets.notes")} wide>
                      <textarea
                        className={profileTextareaClass}
                        defaultValue={pet.medicalNotes ?? ""}
                        disabled={!canManagePets}
                        id={`pet-notes-${pet.id}`}
                        name="medicalNotes"
                      />
                    </ProfileField>
                    <dl className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
                      <MiniMetric
                        icon={<ClipboardList aria-hidden="true" size={12} />}
                        label={t("pets.requests")}
                        value={pet.requestCount}
                      />
                      <MiniMetric
                        icon={<User aria-hidden="true" size={12} />}
                        label={t("pets.owner")}
                        value={pet.ownerName}
                      />
                      <MiniMetric
                        icon={<Scale aria-hidden="true" size={12} />}
                        label={t("pets.weight")}
                        value={pet.weightKg ? `${pet.weightKg} kg` : "—"}
                      />
                    </dl>
                  </ProfileEditorCard>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </AppShell>
  );
}
