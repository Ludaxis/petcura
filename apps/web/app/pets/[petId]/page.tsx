import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PawPrint, UserRound } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  requestCategoryLabels,
  requestStatusLabels,
  urgencyLabels,
  type StaffRole
} from "@petcura/shared";
import { Badge, cn } from "@petcura/ui";
import { AppShell } from "@/app/_components/AppShell";
import {
  ProfileAvatar,
  ProfileEditorCard,
  ProfileField,
  profileInputClass,
  profileTextareaClass
} from "@/app/_components/profile/ProfileEditor";
import { RecordActivityList } from "@/app/_components/records/RecordActivityList";
import { requireStaffContext } from "@/lib/auth/staff";
import { getClinicPetDetail } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";
import { updatePetProfile } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ petId: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PetCenterPage({ params, searchParams }: Props) {
  const { petId } = await params;
  const sp = (await searchParams) ?? {};
  const locale = await getRequestLocale(getSearchParam(sp.lang));
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, `/pets/${petId}`);
  const actorRole = staffContext.membership.role as StaffRole;
  const canEdit = hasClinicPermission(actorRole, "pets:manage");
  const pet = await getClinicPetDetail(
    staffContext.supabase,
    staffContext.clinic.id,
    petId
  );

  if (!pet) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const requestCategories = requestCategoryLabels[locale];
  const requestStatuses = requestStatusLabels[locale];
  const urgencies = urgencyLabels[locale];
  const returnTo = `/pets/${pet.id}`;

  return (
    <AppShell locale={locale} currentPath={returnTo} pageTitle={pet.name}>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--soft)]">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <Link
            className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            href={`/directory?tab=pets&lang=${locale}`}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            {t("nav.directory")}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatar
                className="h-14 w-14"
                imageUrl={pet.photoUrl}
                name={pet.name}
              />
              <div className="min-w-0">
                <h1 className="break-words text-[24px] font-semibold leading-tight text-[var(--ink)]">
                  {pet.name}
                </h1>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {pet.species}
                  {pet.breed ? ` · ${pet.breed}` : ""}
                  {pet.ownerName ? ` · ${pet.ownerName}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={pet.openRequestCount > 0 ? "amber" : "neutral"}>
                {pet.openRequestCount} {t("directory.pet.openLabel")}
              </Badge>
              <Badge tone="neutral">{pet.requestCount} {t("pets.requests")}</Badge>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <main className="grid gap-4">
              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <PawPrint
                    aria-hidden="true"
                    className="text-[var(--primary)]"
                    size={18}
                  />
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    {t("directory.detail.medical")}
                  </h2>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoItem label={t("pets.species")} value={pet.species} />
                  <InfoItem label={t("pets.breed")} value={pet.breed ?? "—"} />
                  <InfoItem label={t("profile.sex")} value={pet.sex ?? "—"} />
                  <InfoItem
                    label={t("pets.weight")}
                    value={pet.weightKg ? `${pet.weightKg.toFixed(1)} kg` : "—"}
                  />
                  <InfoItem
                    label={t("profile.birthDate")}
                    value={pet.birthDate ?? "—"}
                  />
                  <InfoItem
                    label={t("directory.detail.audit.created")}
                    value={dateFormatter.format(new Date(pet.createdAt))}
                  />
                </dl>
                <div className="mt-3 grid gap-2">
                  <TextBlock label={t("pets.allergies")} value={pet.allergies} />
                  <TextBlock label={t("pets.notes")} value={pet.medicalNotes} />
                </div>
              </section>

              {pet.owner ? (
                <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <UserRound
                      aria-hidden="true"
                      className="text-[var(--primary)]"
                      size={18}
                    />
                    <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                      {t("pets.owner")}
                    </h2>
                  </div>
                  <Link
                    className={cn(
                      "mt-4 flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3",
                      "transition hover:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    )}
                    href={`/customers/${pet.owner.id}?lang=${locale}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <ProfileAvatar
                        className="h-10 w-10"
                        imageUrl={pet.owner.photoUrl}
                        name={pet.owner.name}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                          {pet.owner.name}
                        </span>
                        <span className="block truncate text-xs text-[var(--muted)]">
                          {pet.owner.phone}
                        </span>
                      </span>
                    </span>
                    <Badge tone="neutral">{pet.owner.preferredLanguage.toUpperCase()}</Badge>
                  </Link>
                </section>
              ) : null}

              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                  {t("directory.detail.recentRequests")}
                </h2>
                <div className="mt-4 grid gap-2">
                  {pet.requests.map((request) => (
                    <Link
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 transition hover:bg-[var(--paper)]"
                      href={`/requests/${request.id}?lang=${locale}`}
                      key={request.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={request.urgency === "high" ? "red" : "neutral"}>
                          {urgencies[request.urgency as keyof typeof urgencies] ??
                            request.urgency}
                        </Badge>
                        <Badge tone="neutral">
                          {requestStatuses[
                            request.status as keyof typeof requestStatuses
                          ] ?? request.status}
                        </Badge>
                        <Badge tone="neutral">
                          {requestCategories[
                            request.category as keyof typeof requestCategories
                          ] ?? request.category}
                        </Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--ink)]">
                        {request.latestMessage ?? request.id}
                      </p>
                      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted-2)]">
                        {dateFormatter.format(new Date(request.updatedAt))}
                      </p>
                    </Link>
                  ))}
                  {pet.requests.length === 0 ? (
                    <p className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-[13px] text-[var(--muted)]">
                      {t("directory.detail.noRequests")}
                    </p>
                  ) : null}
                </div>
              </section>
            </main>

            <aside className="grid content-start gap-4">
              {canEdit ? (
                <ProfileEditorCard
                  action={updatePetProfile}
                  description={<span>{pet.ownerName}</span>}
                  hiddenFields={
                    <>
                      <input name="lang" type="hidden" value={locale} />
                      <input name="petId" type="hidden" value={pet.id} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                    </>
                  }
                  imageLabel={t("profile.photo")}
                  imageUrl={pet.photoUrl}
                  name={pet.name}
                  submitLabel={t("profile.save")}
                  title={t("directory.edit.pet")}
                >
                  <ProfileField htmlFor="pet-name" label={t("profile.petName")}>
                    <input
                      className={profileInputClass}
                      defaultValue={pet.name}
                      id="pet-name"
                      name="name"
                      required
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-species" label={t("pets.species")}>
                    <input
                      className={profileInputClass}
                      defaultValue={pet.species}
                      id="pet-species"
                      name="species"
                      required
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-breed" label={t("profile.breed")}>
                    <input
                      className={profileInputClass}
                      defaultValue={pet.breed ?? ""}
                      id="pet-breed"
                      name="breed"
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-sex" label={t("profile.sex")}>
                    <input
                      className={profileInputClass}
                      defaultValue={pet.sex ?? ""}
                      id="pet-sex"
                      name="sex"
                    />
                  </ProfileField>
                  <ProfileField
                    htmlFor="pet-birth-date"
                    label={t("profile.birthDate")}
                  >
                    <input
                      className={profileInputClass}
                      defaultValue={pet.birthDate ?? ""}
                      id="pet-birth-date"
                      name="birthDate"
                      type="date"
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-weight" label={t("pets.weight")}>
                    <input
                      className={profileInputClass}
                      defaultValue={pet.weightKg ?? ""}
                      id="pet-weight"
                      min="0"
                      name="weightKg"
                      step="0.1"
                      type="number"
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-allergies" label={t("pets.allergies")}>
                    <textarea
                      className={profileTextareaClass}
                      defaultValue={pet.allergies ?? ""}
                      id="pet-allergies"
                      name="allergies"
                      rows={3}
                    />
                  </ProfileField>
                  <ProfileField htmlFor="pet-notes" label={t("pets.notes")}>
                    <textarea
                      className={profileTextareaClass}
                      defaultValue={pet.medicalNotes ?? ""}
                      id="pet-notes"
                      name="medicalNotes"
                      rows={4}
                    />
                  </ProfileField>
                </ProfileEditorCard>
              ) : null}

              <RecordActivityList
                emptyLabel={t("settings.emptyActivity")}
                locale={locale}
                rows={pet.activity}
                title={t("directory.detail.audit")}
              />
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-[var(--ink)]">
        {value}
      </dd>
    </div>
  );
}

function TextBlock({
  label,
  value
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">
        {value || "—"}
      </p>
    </div>
  );
}
