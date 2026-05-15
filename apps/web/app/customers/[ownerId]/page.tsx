import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  localeOptions,
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
import { getClinicCustomerDetail } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";
import { updateCustomerProfile } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CustomerCenterPage({
  params,
  searchParams
}: Props) {
  const { ownerId } = await params;
  const sp = (await searchParams) ?? {};
  const locale = await getRequestLocale(getSearchParam(sp.lang));
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(
    locale,
    `/customers/${ownerId}`
  );
  const actorRole = staffContext.membership.role as StaffRole;
  const canEdit = hasClinicPermission(actorRole, "customers:manage");
  const customer = await getClinicCustomerDetail(
    staffContext.supabase,
    staffContext.clinic.id,
    ownerId
  );

  if (!customer) notFound();

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const requestCategories = requestCategoryLabels[locale];
  const requestStatuses = requestStatusLabels[locale];
  const urgencies = urgencyLabels[locale];
  const returnTo = `/customers/${customer.id}`;

  return (
    <AppShell
      locale={locale}
      currentPath={returnTo}
      pageTitle={customer.name}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--soft)]">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <Link
            className="mb-3 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            href={`/directory?tab=owners&lang=${locale}`}
          >
            <ArrowLeft aria-hidden="true" size={16} />
            {t("nav.directory")}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatar
                className="h-14 w-14"
                imageUrl={customer.photoUrl}
                name={customer.name}
              />
              <div className="min-w-0">
                <h1 className="break-words text-[24px] font-semibold leading-tight text-[var(--ink)]">
                  {customer.name}
                </h1>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {customer.phone}
                  {customer.email ? ` · ${customer.email}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">
                {customer.preferredLanguage.toUpperCase()}
              </Badge>
              <Badge tone={customer.openRequestCount > 0 ? "amber" : "neutral"}>
                {customer.openRequestCount} {t("directory.owner.openLabel")}
              </Badge>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <main className="grid gap-4">
              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <UserRound
                    aria-hidden="true"
                    className="text-[var(--primary)]"
                    size={18}
                  />
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    {t("directory.detail.contact")}
                  </h2>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  <InfoItem label={t("customers.phone")} value={customer.phone} />
                  <InfoItem
                    label={t("customers.email")}
                    value={customer.email ?? "—"}
                  />
                  <InfoItem
                    label={t("customers.language")}
                    value={customer.preferredLanguage.toUpperCase()}
                  />
                  <InfoItem
                    label={t("directory.detail.audit.created")}
                    value={dateFormatter.format(new Date(customer.createdAt))}
                  />
                </dl>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                  {t("directory.detail.linkedPets")}
                </h2>
                <div className="mt-4 grid gap-2">
                  {customer.pets.map((pet) => (
                    <Link
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3",
                        "transition hover:bg-[var(--paper)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      )}
                      href={`/pets/${pet.id}?lang=${locale}`}
                      key={pet.id}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar
                          className="h-10 w-10"
                          imageUrl={pet.photoUrl}
                          name={pet.name}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                            {pet.name}
                          </span>
                          <span className="block truncate text-xs text-[var(--muted)]">
                            {pet.species}
                            {pet.breed ? ` · ${pet.breed}` : ""}
                          </span>
                        </span>
                      </span>
                      <Badge tone={pet.openRequestCount > 0 ? "amber" : "neutral"}>
                        {pet.openRequestCount}
                      </Badge>
                    </Link>
                  ))}
                  {customer.pets.length === 0 ? (
                    <p className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-4 text-[13px] text-[var(--muted)]">
                      {t("directory.results.emptyPets")}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                  {t("directory.detail.recentRequests")}
                </h2>
                <div className="mt-4 grid gap-2">
                  {customer.requests.map((request) => (
                    <Link
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 transition hover:bg-[var(--paper)]"
                      href={`/requests/${request.id}?lang=${locale}`}
                      key={request.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={request.urgency === "high" ? "red" : "neutral"}
                        >
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
                        {request.latestMessage ?? request.petName ?? request.id}
                      </p>
                      <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted-2)]">
                        {dateFormatter.format(new Date(request.updatedAt))}
                      </p>
                    </Link>
                  ))}
                  {customer.requests.length === 0 ? (
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
                  action={updateCustomerProfile}
                  description={<span>{customer.phone}</span>}
                  hiddenFields={
                    <>
                      <input name="lang" type="hidden" value={locale} />
                      <input name="ownerId" type="hidden" value={customer.id} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                    </>
                  }
                  imageLabel={t("profile.photo")}
                  imageUrl={customer.photoUrl}
                  name={customer.name}
                  submitLabel={t("profile.save")}
                  title={t("directory.edit.owner")}
                >
                  <ProfileField htmlFor="owner-name" label={t("customers.owner")}>
                    <input
                      className={profileInputClass}
                      defaultValue={customer.name}
                      id="owner-name"
                      name="name"
                      required
                    />
                  </ProfileField>
                  <ProfileField htmlFor="owner-phone" label={t("customers.phone")}>
                    <input
                      className={profileInputClass}
                      defaultValue={customer.phone}
                      id="owner-phone"
                      name="phone"
                      required
                      type="tel"
                    />
                  </ProfileField>
                  <ProfileField htmlFor="owner-email" label={t("customers.email")}>
                    <input
                      className={profileInputClass}
                      defaultValue={customer.email ?? ""}
                      id="owner-email"
                      name="email"
                      type="email"
                    />
                  </ProfileField>
                  <ProfileField
                    htmlFor="owner-language"
                    label={t("customers.language")}
                  >
                    <select
                      className={profileInputClass}
                      defaultValue={customer.preferredLanguage}
                      id="owner-language"
                      name="preferredLanguage"
                    >
                      {localeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </ProfileField>
                  <ProfileField htmlFor="owner-notes" label={t("customers.notes")}>
                    <textarea
                      className={profileTextareaClass}
                      defaultValue={customer.notes ?? ""}
                      id="owner-notes"
                      name="notes"
                      rows={4}
                    />
                  </ProfileField>
                </ProfileEditorCard>
              ) : null}

              <RecordActivityList
                emptyLabel={t("settings.emptyActivity")}
                locale={locale}
                rows={customer.activity}
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
