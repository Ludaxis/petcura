import type { ReactNode } from "react";
import { Languages, MessageSquareText, PawPrint, Phone, Users } from "lucide-react";
import {
  createTranslator,
  hasClinicPermission,
  localeOptions,
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
import { updateCustomerProfile } from "@/app/customers/actions";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicCustomers } from "@/lib/clinic/directory";
import { getRequestLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    customers_error?: string | string[];
    customers_status?: string | string[];
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
  icon: React.ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] bg-[var(--surface-soft)] p-2">
      <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted-2)]">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate font-semibold text-[var(--ink)]">
        {value || "—"}
      </dd>
    </div>
  );
}

export default async function CustomersPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/customers");
  const actorRole = staffContext.membership.role as StaffRole;
  const canManageCustomers = hasClinicPermission(actorRole, "customers:manage");
  const rows = await listClinicCustomers(
    staffContext.supabase,
    staffContext.clinic.id
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  const hasError = Boolean(getSearchParam(sp.customers_error));
  const status = getSearchParam(sp.customers_status);

  return (
    <AppShell
      locale={locale}
      currentPath="/customers"
      pageTitle={t("nav.headerTitle.customers")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <Users aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("customers.title")}
                </h1>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("customers.description")}
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
              {t("customers.empty")}
            </div>
          ) : (
            <ol className="mx-auto grid max-w-6xl gap-3">
              {rows.map((owner) => (
                <li key={owner.id}>
                  <ProfileEditorCard
                    action={updateCustomerProfile}
                    disabled={!canManageCustomers}
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
                    description={
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>{owner.phone}</span>
                        <Badge tone="neutral">
                          {owner.preferredLanguage.toUpperCase()}
                        </Badge>
                      </span>
                    }
                  >
                    <ProfileField htmlFor={`owner-name-${owner.id}`} label={t("profile.fullName")}>
                      <input
                        className={profileInputClass}
                        defaultValue={owner.name}
                        disabled={!canManageCustomers}
                        id={`owner-name-${owner.id}`}
                        name="name"
                        required
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`owner-phone-${owner.id}`} label={t("customers.phone")}>
                      <input
                        className={profileInputClass}
                        defaultValue={owner.phone}
                        disabled={!canManageCustomers}
                        id={`owner-phone-${owner.id}`}
                        name="phone"
                        required
                        type="tel"
                      />
                    </ProfileField>
                    <ProfileField htmlFor={`owner-email-${owner.id}`} label={t("customers.email")}>
                      <input
                        className={profileInputClass}
                        defaultValue={owner.email ?? ""}
                        disabled={!canManageCustomers}
                        id={`owner-email-${owner.id}`}
                        name="email"
                        placeholder={t("profile.noEmail")}
                        type="email"
                      />
                    </ProfileField>
                    <ProfileField
                      htmlFor={`owner-language-${owner.id}`}
                      label={t("customers.language")}
                    >
                      <select
                        className={profileInputClass}
                        defaultValue={owner.preferredLanguage}
                        disabled={!canManageCustomers}
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
                    <ProfileField htmlFor={`owner-notes-${owner.id}`} label={t("pets.notes")} wide>
                      <textarea
                        className={profileTextareaClass}
                        defaultValue={owner.notes ?? ""}
                        disabled={!canManageCustomers}
                        id={`owner-notes-${owner.id}`}
                        name="notes"
                      />
                    </ProfileField>
                    <dl className="grid gap-2 sm:col-span-2 sm:grid-cols-4">
                      <MiniMetric
                        icon={<PawPrint aria-hidden="true" size={12} />}
                        label={t("customers.pets")}
                        value={owner.petCount}
                      />
                      <MiniMetric
                        icon={<MessageSquareText aria-hidden="true" size={12} />}
                        label={t("customers.requests")}
                        value={owner.requestCount}
                      />
                      <MiniMetric
                        icon={<Languages aria-hidden="true" size={12} />}
                        label={t("customers.language")}
                        value={owner.preferredLanguage.toUpperCase()}
                      />
                      <MiniMetric
                        icon={<Phone aria-hidden="true" size={12} />}
                        label={t("customers.latestRequest")}
                        value={
                          owner.latestRequestAt
                            ? dateFormatter.format(new Date(owner.latestRequestAt))
                            : "—"
                        }
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
