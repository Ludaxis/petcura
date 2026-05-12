import { LockKeyhole, ShieldCheck, UserPlus, Users } from "lucide-react";
import {
  canAssignStaffRole,
  canManageStaffMember,
  hasClinicPermission,
  localeOptions,
  staffRoles,
  type CopyKey,
  type StaffRole
} from "@petcura/shared";
import { Badge, Button, cn } from "@petcura/ui";
import { createTranslator } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { PendingSubmitButton } from "@/app/_components/forms/PendingSubmitButton";
import {
  ProfileAvatar,
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicTeam } from "@/lib/clinic/team";
import { getRequestLocale } from "@/lib/locale";
import {
  addClinicTeamMember,
  updateClinicTeamMemberProfile,
  updateClinicTeamMemberRole,
  updateClinicTeamMemberStatus
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    settings_error?: string | string[];
    settings_status?: string | string[];
  }>;
};

const roleCopyKeys: Record<StaffRole, CopyKey> = {
  owner: "role.owner",
  admin: "role.admin",
  vet: "role.vet",
  tech: "role.tech",
  reception: "role.reception",
  viewer: "role.viewer"
};

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getStatusCopy(status: string | undefined): CopyKey | null {
  if (status === "staff_added") return "settings.status.staffAdded";
  if (status === "role_updated") return "settings.status.roleUpdated";
  if (status === "staff_updated") return "settings.status.staffUpdated";
  if (status === "profile_saved") return "profile.saved";
  return null;
}

function roleLabel(t: ReturnType<typeof createTranslator>, role: StaffRole) {
  return t(roleCopyKeys[role]);
}

function RoleSelect({
  id,
  name,
  defaultValue,
  actorRole,
  labels
}: {
  id: string;
  name: string;
  defaultValue: StaffRole;
  actorRole: StaffRole;
  labels: Record<StaffRole, string>;
}) {
  const assignableRoles = staffRoles.filter((role) =>
    canAssignStaffRole(actorRole, role)
  );

  return (
    <select
      className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
      defaultValue={defaultValue}
      id={id}
      name={name}
    >
      {assignableRoles.map((role) => (
        <option key={role} value={role}>
          {labels[role]}
        </option>
      ))}
    </select>
  );
}

export default async function SettingsPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/settings");
  const actorRole = staffContext.membership.role as StaffRole;
  const canManageTeam = hasClinicPermission(actorRole, "team:manage");
  const team = await listClinicTeam(
    staffContext.clinic.id,
    staffContext.user.id
  );
  const statusKey = getStatusCopy(getSearchParam(sp.settings_status));
  const hasError = Boolean(getSearchParam(sp.settings_error));
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium"
  });
  const roleLabels = Object.fromEntries(
    staffRoles.map((role) => [role, roleLabel(t, role)])
  ) as Record<StaffRole, string>;

  return (
    <AppShell
      locale={locale}
      currentPath="/settings"
      pageTitle={t("nav.headerTitle.settings")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <ShieldCheck aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("settings.title")}
                </h1>
                <Badge tone="teal">{roleLabel(t, actorRole)}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("settings.description")}
              </p>
            </div>
            <Badge tone="neutral">{staffContext.clinic.name}</Badge>
          </div>

          {statusKey ? (
            <p
              role="status"
              className="mt-3 rounded-[var(--radius)] bg-[var(--primary-soft)] px-3 py-2 text-[13px] font-medium text-[var(--primary-strong)]"
            >
              {t(statusKey)}
            </p>
          ) : null}
          {hasError ? (
            <p
              role="alert"
              className="mt-3 rounded-[var(--radius)] bg-[var(--red-soft)] px-3 py-2 text-[13px] font-medium text-[var(--red)]"
            >
              {t("settings.error")}
            </p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4">
            <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Users
                      aria-hidden="true"
                      className="text-[var(--primary)]"
                      size={18}
                    />
                    <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                      {t("settings.teamTitle")}
                    </h2>
                  </div>
                  <p className="mt-2 max-w-3xl text-[12.5px] leading-5 text-[var(--muted)]">
                    {t("settings.teamDescription")}
                  </p>
                </div>
                <Badge tone="neutral">{team.length}</Badge>
              </div>

              {!canManageTeam ? (
                <div className="mt-4 flex gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-[13px] text-[var(--ink-2)]">
                  <LockKeyhole
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--muted)]"
                    size={16}
                  />
                  <p>{t("settings.noTeamManage")}</p>
                </div>
              ) : (
                <form
                  action={addClinicTeamMember}
                  className="mt-4 grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
                >
                  <input name="lang" type="hidden" value={locale} />
                  <div className="grid gap-1.5">
                    <label
                      className="text-[12px] font-semibold text-[var(--ink)]"
                      htmlFor="settings-staff-email"
                    >
                      {t("settings.email")}
                    </label>
                    <input
                      className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
                      id="settings-staff-email"
                      name="email"
                      placeholder="name@clinic.ee"
                      required
                      type="email"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label
                      className="text-[12px] font-semibold text-[var(--ink)]"
                      htmlFor="settings-staff-role"
                    >
                      {t("settings.role")}
                    </label>
                    <RoleSelect
                      actorRole={actorRole}
                      defaultValue="reception"
                      id="settings-staff-role"
                      labels={roleLabels}
                      name="role"
                    />
                  </div>
                  <PendingSubmitButton
                    className="self-end"
                    icon={<UserPlus aria-hidden="true" size={16} />}
                  >
                    {t("settings.addStaff")}
                  </PendingSubmitButton>
                </form>
              )}

              <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
                {t("settings.ownerGuard")}
              </p>
            </section>

            <ol className="grid gap-2">
              {team.map((member) => {
                const memberRole = member.role as StaffRole;
                const manageable =
                  canManageTeam && canManageStaffMember(actorRole, memberRole);
                const roleSelectId = `role-${member.id}`;
                const statusTone = member.is_active ? "teal" : "neutral";
                const profileName =
                  member.profile.displayName ||
                  member.profile.fullName ||
                  member.email;

                return (
                  <li
                    className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-3 shadow-sm"
                    key={member.id}
                  >
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,auto)] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-3">
                          <ProfileAvatar
                            className="h-11 w-11"
                            imageUrl={member.profile.avatarUrl}
                            name={profileName}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="min-w-0 break-words text-[14px] font-semibold text-[var(--ink)]">
                                {profileName}
                              </p>
                              {member.isCurrentUser ? (
                                <Badge tone="teal">
                                  {t("settings.currentUser")}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-[12.5px] text-[var(--muted)]">
                              {member.email}
                            </p>
                            {member.profile.jobTitle ? (
                              <p className="mt-1 truncate text-[12px] text-[var(--muted-2)]">
                                {member.profile.jobTitle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">
                            {roleLabel(t, memberRole)}
                          </Badge>
                          <Badge tone={statusTone}>
                            {member.is_active
                              ? t("settings.active")
                              : t("settings.inactive")}
                          </Badge>
                          <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted-2)]">
                            {dateFormatter.format(new Date(member.created_at))}
                          </span>
                        </div>
                      </div>

                      {manageable ? (
                        <div className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto_auto]">
                          <form
                            action={updateClinicTeamMemberRole}
                            className="contents"
                          >
                            <input name="lang" type="hidden" value={locale} />
                            <input
                              name="membershipId"
                              type="hidden"
                              value={member.id}
                            />
                            <label className="sr-only" htmlFor={roleSelectId}>
                              {t("settings.role")}
                            </label>
                            <RoleSelect
                              actorRole={actorRole}
                              defaultValue={memberRole}
                              id={roleSelectId}
                              labels={roleLabels}
                              name="role"
                            />
                            <PendingSubmitButton
                              className="w-full sm:w-auto"
                              variant="secondary"
                            >
                              {t("settings.saveRole")}
                            </PendingSubmitButton>
                          </form>
                          {!member.isCurrentUser ? (
                            <form action={updateClinicTeamMemberStatus}>
                              <input
                                name="lang"
                                type="hidden"
                                value={locale}
                              />
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
                              <PendingSubmitButton
                                className="w-full sm:w-auto"
                                variant="secondary"
                              >
                                {member.is_active
                                  ? t("settings.deactivate")
                                  : t("settings.activate")}
                              </PendingSubmitButton>
                            </form>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--line)] px-3 text-sm text-[var(--muted)]"
                              )}
                            >
                              {t("settings.currentUser")}
                            </span>
                          )}
                        </div>
                      ) : (
                        // Per-row read-only affordance. The full prose is
                        // already shown once in the top-of-section banner
                        // when the viewer can't manage the team at all
                        // (`!canManageTeam`); repeating the same string
                        // next to every row turned the team list into
                        // visual noise. So:
                        //   * canManageTeam=true but row not manageable
                        //     (owner-vs-admin guard) → keep the prose so
                        //     the user knows WHICH rows are locked.
                        //   * !canManageTeam → compact lock affordance
                        //     only; the top banner carries the why.
                        canManageTeam ? (
                          <div className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--surface-soft)] px-3 py-2 text-[12.5px] text-[var(--muted)]">
                            <LockKeyhole aria-hidden="true" size={14} />
                            {t("settings.noTeamManage")}
                          </div>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--surface-soft)] text-[var(--muted-2)]"
                          >
                            <LockKeyhole size={14} />
                          </span>
                        )
                      )}
                    </div>

                    {manageable ? (
                      <details className="mt-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                        <summary className="cursor-pointer text-[12.5px] font-semibold text-[var(--ink)]">
                          {t("profile.editProfile")}
                        </summary>
                        <form
                          action={updateClinicTeamMemberProfile}
                          className="mt-3 grid gap-3 sm:grid-cols-2"
                          encType="multipart/form-data"
                        >
                          <input name="lang" type="hidden" value={locale} />
                          <input
                            name="membershipId"
                            type="hidden"
                            value={member.id}
                          />
                          <ProfileField
                            htmlFor={`member-full-name-${member.id}`}
                            label={t("profile.fullName")}
                          >
                            <input
                              className={profileInputClass}
                              defaultValue={member.profile.fullName ?? ""}
                              id={`member-full-name-${member.id}`}
                              name="fullName"
                              placeholder={member.email}
                              required
                            />
                          </ProfileField>
                          <ProfileField
                            htmlFor={`member-display-name-${member.id}`}
                            label={t("profile.displayName")}
                          >
                            <input
                              className={profileInputClass}
                              defaultValue={member.profile.displayName ?? ""}
                              id={`member-display-name-${member.id}`}
                              name="displayName"
                            />
                          </ProfileField>
                          <ProfileField
                            htmlFor={`member-phone-${member.id}`}
                            label={t("profile.phone")}
                          >
                            <input
                              className={profileInputClass}
                              defaultValue={member.profile.phone ?? ""}
                              id={`member-phone-${member.id}`}
                              name="phone"
                              type="tel"
                            />
                          </ProfileField>
                          <ProfileField
                            htmlFor={`member-job-title-${member.id}`}
                            label={t("profile.jobTitle")}
                          >
                            <input
                              className={profileInputClass}
                              defaultValue={member.profile.jobTitle ?? ""}
                              id={`member-job-title-${member.id}`}
                              name="jobTitle"
                            />
                          </ProfileField>
                          <ProfileField
                            htmlFor={`member-language-${member.id}`}
                            label={t("profile.language")}
                          >
                            <select
                              className={profileInputClass}
                              defaultValue={member.profile.locale}
                              id={`member-language-${member.id}`}
                              name="profileLocale"
                            >
                              {localeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </ProfileField>
                          <ProfileField
                            htmlFor={`member-photo-${member.id}`}
                            label={t("profile.photo")}
                          >
                            <input
                              accept="image/jpeg,image/png,image/webp,image/heic"
                              className={profileInputClass}
                              id={`member-photo-${member.id}`}
                              name="photo"
                              type="file"
                            />
                          </ProfileField>
                          <div className="flex justify-end sm:col-span-2">
                            <PendingSubmitButton variant="secondary">
                              {t("profile.save")}
                            </PendingSubmitButton>
                          </div>
                        </form>
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
