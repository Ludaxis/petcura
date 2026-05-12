import Link from "next/link";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import {
  createTranslator,
  staffRoles,
  supportedLocales,
  type CopyKey,
  withLocale
} from "@petcura/shared";
import { getRequestLocale } from "@/lib/locale";
import { listAdminClinics } from "@/lib/admin/bootstrap";
import { requireSuperAdminContext } from "@/lib/auth/super-admin";
import { requirePublicEnv } from "@/lib/env";
import { AppShell } from "@/app/_components/AppShell";
import {
  addClinicStaff,
  createClinic,
  updateClinicStaffStatus
} from "./actions";

type AdminPageProps = {
  searchParams?: Promise<{
    admin_error?: string | string[];
    admin_status?: string | string[];
    lang?: string | string[];
  }>;
};

const roleOptions = staffRoles;

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = await getRequestLocale(params?.lang);
  const t = createTranslator(locale);
  // requireSuperAdminContext runs the auth gate; the AppShell also calls
  // requireStaffContext (cached), which is fine — super-admins are seeded
  // as clinic staff too in this build.
  await requireSuperAdminContext(locale);
  const clinics = await listAdminClinics();
  const env = requirePublicEnv();
  const statusKey = getStatusCopy(getSearchParam(params?.admin_status));
  const hasError = Boolean(getSearchParam(params?.admin_error));
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <AppShell
      locale={locale}
      currentPath="/admin"
      pageTitle={t("admin.title")}
    >
      <div className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        {/*
          The persistent sidebar carries identity (and a Super-admin entry
          for users who qualify), so the page header collapses to just the
          page title with the super-admin badge inline as a "you're in
          admin mode" cue.
        */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--ink)]">
              {t("admin.title")}
            </h1>
            <Badge tone="teal">
              <ShieldCheck aria-hidden="true" size={13} />
              {t("admin.superAdmin")}
            </Badge>
          </div>
        </div>

        <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
          {t("admin.description")}
        </p>

      {statusKey ? (
        <div className="rounded-[var(--radius)] border border-[var(--primary-soft)] bg-[var(--primary-soft)] p-3 text-sm font-medium text-[var(--primary)]">
          {t(statusKey)}
        </div>
      ) : null}

      {hasError ? (
        <div className="rounded-[var(--radius)] border border-[var(--red-soft)] bg-[var(--red-soft)] p-3 text-sm font-medium text-[var(--red)]">
          {t("admin.error")}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2
              aria-hidden="true"
              className="text-[var(--primary)]"
              size={18}
            />
            <h2 className="font-semibold">{t("admin.createClinic")}</h2>
          </div>
          <form action={createClinic} className="grid gap-4">
            <input name="lang" type="hidden" value={locale} />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="clinic-name">
                  {t("admin.name")}
                </label>
                <input
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  id="clinic-name"
                  name="name"
                  placeholder="Alex Veterinary Clinic"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="clinic-slug">
                  {t("admin.slug")}
                </label>
                <input
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  id="clinic-slug"
                  name="slug"
                  placeholder="alex-vet-demo"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="country">
                  {t("admin.country")}
                </label>
                <input
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  defaultValue="EE"
                  id="country"
                  maxLength={2}
                  name="country"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="timezone">
                  {t("admin.timezone")}
                </label>
                <input
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  defaultValue="Europe/Tallinn"
                  id="timezone"
                  name="timezone"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="clinic-locale">
                  {t("admin.locale")}
                </label>
                <select
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  defaultValue="en"
                  id="clinic-locale"
                  name="clinicLocale"
                >
                  {supportedLocales.map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button className="w-full sm:w-auto" type="submit">
              <Building2 aria-hidden="true" size={16} />
              {t("admin.create")}
            </Button>
          </form>
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus
              aria-hidden="true"
              className="text-[var(--primary)]"
              size={18}
            />
            <h2 className="font-semibold">{t("admin.addStaff")}</h2>
          </div>
          <form action={addClinicStaff} className="grid gap-4">
            <input name="lang" type="hidden" value={locale} />
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="clinic-id">
                {t("admin.clinic")}
              </label>
              <select
                className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                disabled={clinics.length === 0}
                id="clinic-id"
                name="clinicId"
                required
              >
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="staff-email">
                  {t("admin.email")}
                </label>
                <input
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  id="staff-email"
                  name="email"
                  placeholder="name@clinic.ee"
                  required
                  type="email"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="staff-role">
                  {t("admin.role")}
                </label>
                <select
                  className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                  defaultValue="reception"
                  id="staff-role"
                  name="role"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={clinics.length === 0}
              type="submit"
            >
              <UserPlus aria-hidden="true" size={16} />
              {t("admin.addStaffButton")}
            </Button>
          </form>
        </Panel>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{t("admin.clinics")}</h2>
          <Badge tone="neutral">{clinics.length}</Badge>
        </div>

        {clinics.map((clinic) => {
          const intakePath = `/intake?clinic=${clinic.slug}`;
          const intakeUrl = new URL(intakePath, env.NEXT_PUBLIC_APP_URL);

          return (
            <Panel className="min-w-0 p-5" key={clinic.id}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{clinic.name}</h3>
                    <Badge tone="teal">{clinic.slug}</Badge>
                    <Badge tone="neutral">{clinic.country}</Badge>
                    <Badge tone="neutral">
                      {clinic.locale.toUpperCase()} · {clinic.timezone}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm">
                    <span className="font-medium">{t("admin.intakeUrl")}</span>
                    <Link
                      className="inline-flex min-w-0 items-center gap-2 break-all text-[var(--primary)] hover:underline"
                      href={withLocale(intakePath, locale)}
                    >
                      {intakeUrl.toString()}
                      <ExternalLink
                        aria-hidden="true"
                        className="shrink-0"
                        size={14}
                      />
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    {dateFormatter.format(new Date(clinic.created_at))}
                  </p>
                </div>

                <div className="min-w-0">
                  <h4 className="font-semibold">{t("admin.staff")}</h4>
                  <div className="mt-3 grid gap-2">
                    {clinic.staff.map((member) => (
                      <div
                        className="grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
                        key={member.id}
                      >
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold">
                            {member.email}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge tone="neutral">{member.role}</Badge>
                            <Badge tone={member.is_active ? "teal" : "neutral"}>
                              {member.is_active
                                ? t("admin.active")
                                : t("admin.inactive")}
                            </Badge>
                          </div>
                        </div>
                        <form action={updateClinicStaffStatus}>
                          <input name="lang" type="hidden" value={locale} />
                          <input
                            name="membershipId"
                            type="hidden"
                            value={member.id}
                          />
                          <input
                            name="isActive"
                            type="hidden"
                            value={member.is_active ? "false" : "true"}
                          />
                          <Button
                            className="w-full sm:w-auto"
                            type="submit"
                            variant="secondary"
                          >
                            {member.is_active
                              ? t("admin.deactivate")
                              : t("admin.activate")}
                          </Button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          );
        })}
        </section>
      </div>
    </AppShell>
  );
}
