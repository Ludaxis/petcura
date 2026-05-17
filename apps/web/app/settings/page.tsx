import {
  Activity,
  Archive,
  Building2,
  CalendarClock,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  Users
} from "lucide-react";
import {
  canAssignStaffRole,
  canManageStaffMember,
  hasClinicPermission,
  localeOptions,
  staffRoles,
  withLocale,
  type CopyKey,
  type StaffRole
} from "@petcura/shared";
import { Badge, Toast, cn } from "@petcura/ui";
import { createTranslator } from "@petcura/shared";
import { AppShell } from "@/app/_components/AppShell";
import { PendingForm } from "@/app/_components/forms/PendingForm";
import { PendingSubmitButton } from "@/app/_components/forms/PendingSubmitButton";
import {
  ProfileAvatar,
  ProfileEditorCard,
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { requireStaffContext } from "@/lib/auth/staff";
import { listClinicTeam, listClinicTeamActivity } from "@/lib/clinic/team";
import {
  listAvailabilityRules,
  listCalendarStaff,
  listStaffTimeOff
} from "@/lib/appointments/calendar";
import { getRequestLocale } from "@/lib/locale";
import {
  addClinicTeamMember,
  updateClinicTeamMemberProfile,
  updateClinicTeamMemberRole,
  updateClinicTeamMemberStatus
} from "./actions";
import {
  addTimeOff,
  deleteAvailabilityRule,
  saveAvailabilityRule
} from "@/app/calendar/actions";
import { SettingsTabs } from "./_components/SettingsTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    settings_error?: string | string[];
    settings_status?: string | string[];
    tab?: string | string[];
  }>;
};

type SettingsTab = "team" | "archived" | "activity" | "clinic" | "availability";

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
  if (status === "availability_saved") return "settings.status.availabilitySaved";
  return null;
}

function getSettingsTab(value: string | undefined): SettingsTab {
  if (
    value === "archived" ||
    value === "activity" ||
    value === "clinic" ||
    value === "availability"
  ) {
    return value;
  }

  return "team";
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
  const activeTab = getSettingsTab(getSearchParam(sp.tab));
  const canManageAvailability = hasClinicPermission(actorRole, "availability:manage");
  const now = new Date();
  const [team, activity, calendarStaff, availabilityRules, timeOff] = await Promise.all([
    listClinicTeam(staffContext.clinic.id, staffContext.user.id),
    listClinicTeamActivity(staffContext.clinic.id),
    listCalendarStaff(staffContext.clinic.id),
    listAvailabilityRules(staffContext.clinic.id),
    listStaffTimeOff(
      staffContext.clinic.id,
      now,
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    )
  ]);
  const activeTeam = team.filter((member) => member.is_active);
  const archivedTeam = team.filter((member) => !member.is_active);
  const statusKey = getStatusCopy(getSearchParam(sp.settings_status));
  const hasError = Boolean(getSearchParam(sp.settings_error));
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium"
  });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: staffContext.clinic.timezone
  });
  const roleLabels = Object.fromEntries(
    staffRoles.map((role) => [role, roleLabel(t, role)])
  ) as Record<StaffRole, string>;
  const tabs: Array<{
    id: SettingsTab;
    label: string;
    count?: number;
  }> = [
    { id: "team", label: t("settings.tabs.team"), count: activeTeam.length },
    {
      id: "archived",
      label: t("settings.tabs.archived"),
      count: archivedTeam.length
    },
    { id: "activity", label: t("settings.tabs.activity") },
    { id: "availability", label: t("settings.tabs.availability") },
    { id: "clinic", label: t("settings.tabs.clinic") }
  ];

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
            <Toast tone="success" className="mt-3">
              {t(statusKey)}
            </Toast>
          ) : null}
          {hasError ? (
            <Toast tone="error" className="mt-3">
              {t("settings.error")}
            </Toast>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--soft)] p-3 sm:p-4">
          <div className="mx-auto grid max-w-6xl gap-4">
            <SettingsTabs
              activeTab={activeTab}
              ariaLabel={t("settings.tabs.ariaLabel")}
              loadingLabel="Loading settings"
              tabs={tabs.map((tab) => ({
                ...tab,
                href: withLocale(`/settings?tab=${tab.id}`, locale)
              }))}
            />

            {activeTab === "team" ? (
              <>
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
                <Badge tone="neutral">{activeTeam.length}</Badge>
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
                <PendingForm
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
                </PendingForm>
              )}

              <p className="mt-3 text-[12px] leading-5 text-[var(--muted)]">
                {t("settings.ownerGuard")}
              </p>
            </section>

            <ol className="grid gap-2">
              {activeTeam.map((member) => {
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
                              <p className="mt-1 truncate text-[12px] text-[var(--muted)]">
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
                          <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">
                            {dateFormatter.format(new Date(member.created_at))}
                          </span>
                        </div>
                      </div>

                      {manageable ? (
                        <div className="grid gap-2 sm:grid-cols-[minmax(10rem,1fr)_auto_auto]">
                          <PendingForm
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
                          </PendingForm>
                          {!member.isCurrentUser ? (
                            <PendingForm
                              action={updateClinicTeamMemberStatus}
                              className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto]"
                            >
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
                              <label className="sr-only" htmlFor={`archive-reason-${member.id}`}>
                                {t("settings.archiveReason")}
                              </label>
                              <input
                                className={profileInputClass}
                                id={`archive-reason-${member.id}`}
                                maxLength={240}
                                name="archiveReason"
                                placeholder={t("settings.archiveReason")}
                              />
                              <PendingSubmitButton
                                className="w-full sm:w-auto"
                                variant="secondary"
                              >
                                {member.is_active
                                  ? t("settings.deactivate")
                                  : t("settings.activate")}
                              </PendingSubmitButton>
                            </PendingForm>
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
                        <ProfileEditorCard
                          action={updateClinicTeamMemberProfile}
                          className="mt-3 !border-0 !bg-transparent !p-0 !shadow-none"
                          description={<span>{member.email}</span>}
                          hiddenFields={
                            <>
                              <input name="lang" type="hidden" value={locale} />
                              <input
                                name="membershipId"
                                type="hidden"
                                value={member.id}
                              />
                            </>
                          }
                          imageLabel={t("profile.photo")}
                          imageUrl={member.profile.avatarUrl}
                          name={profileName}
                          submitLabel={t("profile.save")}
                          title={profileName}
                        >
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
                        </ProfileEditorCard>
                      </details>
                    ) : null}
                  </li>
                );
              })}
              {activeTeam.length === 0 ? (
                <li className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-6 text-[13px] text-[var(--muted)]">
                  {t("settings.emptyTeam")}
                </li>
              ) : null}
            </ol>
              </>
            ) : null}

            {activeTab === "archived" ? (
              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Archive
                        aria-hidden="true"
                        className="text-[var(--primary)]"
                        size={18}
                      />
                      <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                        {t("settings.archivedTitle")}
                      </h2>
                    </div>
                    <p className="mt-2 max-w-3xl text-[12.5px] leading-5 text-[var(--muted)]">
                      {t("settings.archivedDescription")}
                    </p>
                  </div>
                  <Badge tone="neutral">{archivedTeam.length}</Badge>
                </div>

                <ol className="mt-4 grid gap-2">
                  {archivedTeam.map((member) => {
                    const profileName =
                      member.profile.displayName ||
                      member.profile.fullName ||
                      member.email;
                    const canRestore =
                      canManageTeam &&
                      canManageStaffMember(actorRole, member.role as StaffRole);
                    const memberActivity = activity
                      .filter(
                        (event) =>
                          event.entityId === member.id ||
                          event.actorId === member.user_id
                      )
                      .slice(0, 3);

                    return (
                      <li
                        className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                        key={member.id}
                      >
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div className="flex min-w-0 items-start gap-3">
                            <ProfileAvatar
                              className="h-11 w-11"
                              imageUrl={member.profile.avatarUrl}
                              name={profileName}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="break-words text-[14px] font-semibold text-[var(--ink)]">
                                  {profileName}
                                </p>
                                <Badge tone="neutral">
                                  {roleLabel(t, member.role as StaffRole)}
                                </Badge>
                              </div>
                              <p className="mt-1 truncate text-[12.5px] text-[var(--muted)]">
                                {member.email}
                              </p>
                              <p className="mt-2 text-[12px] leading-5 text-[var(--muted)]">
                                {member.archive_reason ?? t("settings.noArchiveReason")}
                              </p>
                              {member.archived_at ? (
                                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">
                                  {dateFormatter.format(new Date(member.archived_at))}
                                </p>
                              ) : null}
                              {memberActivity.length > 0 ? (
                                <ol className="mt-3 grid gap-1.5">
                                  {memberActivity.map((event) => (
                                    <li
                                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-[11.5px] text-[var(--muted)]"
                                      key={event.id}
                                    >
                                      <span className="font-mono uppercase tracking-[0.04em] text-[var(--ink)]">
                                        {event.action}
                                      </span>{" "}
                                      · {dateFormatter.format(new Date(event.createdAt))}
                                    </li>
                                  ))}
                                </ol>
                              ) : null}
                            </div>
                          </div>
                          {canRestore ? (
                            <PendingForm action={updateClinicTeamMemberStatus}>
                              <input name="lang" type="hidden" value={locale} />
                              <input
                                name="membershipId"
                                type="hidden"
                                value={member.id}
                              />
                              <input name="isActive" type="hidden" value="true" />
                              <PendingSubmitButton
                                icon={<RotateCcw aria-hidden="true" size={16} />}
                                variant="secondary"
                              >
                                {t("settings.reinstate")}
                              </PendingSubmitButton>
                            </PendingForm>
                          ) : (
                            <span className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--line)] px-3 text-sm text-[var(--muted)]">
                              {t("settings.readOnly")}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {archivedTeam.length === 0 ? (
                    <li className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-[13px] text-[var(--muted)]">
                      {t("settings.emptyArchived")}
                    </li>
                  ) : null}
                </ol>
              </section>
            ) : null}

            {activeTab === "activity" ? (
              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Activity
                    aria-hidden="true"
                    className="text-[var(--primary)]"
                    size={18}
                  />
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    {t("settings.activityTitle")}
                  </h2>
                </div>
                <ol className="mt-4 grid gap-2">
                  {activity.map((event) => (
                    <li
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                      key={event.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-mono text-[12px] uppercase tracking-[0.04em] text-[var(--ink)]">
                            {event.action}
                          </p>
                          <p className="mt-1 text-[12px] text-[var(--muted)]">
                            {event.actorEmail ?? event.actorId ?? "system"} ·{" "}
                            {event.entityType}
                          </p>
                        </div>
                        <time className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">
                          {dateFormatter.format(new Date(event.createdAt))}
                        </time>
                      </div>
                    </li>
                  ))}
                  {activity.length === 0 ? (
                    <li className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-[13px] text-[var(--muted)]">
                      {t("settings.emptyActivity")}
                    </li>
                  ) : null}
                </ol>
              </section>
            ) : null}

            {activeTab === "availability" ? (
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CalendarClock
                          aria-hidden="true"
                          className="text-[var(--primary)]"
                          size={18}
                        />
                        <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                          Availability
                        </h2>
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-[var(--muted)]">
                        Rules feed the calendar and AI appointment drafts. Times display in {staffContext.clinic.timezone}.
                      </p>
                    </div>
                    <Badge tone={canManageAvailability ? "teal" : "neutral"}>
                      {canManageAvailability ? "Editable" : "Read-only"}
                    </Badge>
                  </div>

                  {canManageAvailability ? (
                    <PendingForm
                      action={saveAvailabilityRule}
                      className="mt-4 grid gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]"
                    >
                      <input name="lang" type="hidden" value={locale} />
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Staff
                        </span>
                        <select
                          name="staffId"
                          required
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        >
                          {calendarStaff.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Day
                        </span>
                        <select
                          name="weekday"
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        >
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (day, index) => (
                              <option key={day} value={index}>
                                {day}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Start
                        </span>
                        <input
                          name="startTime"
                          type="time"
                          defaultValue="09:00"
                          required
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          End
                        </span>
                        <input
                          name="endTime"
                          type="time"
                          defaultValue="17:00"
                          required
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        />
                      </label>
                      <PendingSubmitButton className="self-end" size="sm">
                        Add
                      </PendingSubmitButton>
                    </PendingForm>
                  ) : null}

                  <ol className="mt-4 grid gap-2">
                    {availabilityRules.length > 0 ? (
                      availabilityRules.map((rule) => {
                        const staffMember = calendarStaff.find(
                          (member) => member.id === rule.staffId
                        );
                        return (
                          <li
                            key={rule.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--ink)]">
                                {staffMember?.label ?? "Staff"} ·{" "}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][rule.weekday]}
                              </p>
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--muted)]">
                                {rule.startTime}–{rule.endTime}
                              </p>
                            </div>
                            {canManageAvailability ? (
                              <PendingForm action={deleteAvailabilityRule}>
                                <input name="lang" type="hidden" value={locale} />
                                <input name="ruleId" type="hidden" value={rule.id} />
                                <PendingSubmitButton variant="ghost" size="sm">
                                  Remove
                                </PendingSubmitButton>
                              </PendingForm>
                            ) : null}
                          </li>
                        );
                      })
                    ) : (
                      <li className="rounded-[var(--radius)] border border-dashed border-[var(--line)] p-6 text-sm text-[var(--muted)]">
                        No availability rules yet. Add working hours before asking AI to suggest appointment times.
                      </li>
                    )}
                  </ol>
                </div>

                <aside className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    Time off
                  </h2>
                  {canManageAvailability ? (
                    <PendingForm action={addTimeOff} className="mt-3 grid gap-3">
                      <input name="lang" type="hidden" value={locale} />
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Staff
                        </span>
                        <select
                          name="staffId"
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        >
                          {calendarStaff.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Starts
                        </span>
                        <input
                          name="startsAt"
                          type="datetime-local"
                          required
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                          Ends
                        </span>
                        <input
                          name="endsAt"
                          type="datetime-local"
                          required
                          className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                        />
                      </label>
                      <input
                        name="reason"
                        placeholder="Reason"
                        className="h-10 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"
                      />
                      <PendingSubmitButton size="sm">Block time</PendingSubmitButton>
                    </PendingForm>
                  ) : null}
                  <ol className="mt-4 grid gap-2">
                    {timeOff.length > 0 ? (
                      timeOff.map((block) => {
                        const staffMember = calendarStaff.find(
                          (member) => member.id === block.staffId
                        );
                        return (
                          <li
                            key={block.id}
                            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                          >
                            <p className="text-sm font-semibold text-[var(--ink)]">
                              {staffMember?.label ?? "Staff"}
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">
                              {dateTimeFormatter.format(new Date(block.startsAt))} →{" "}
                              {dateTimeFormatter.format(new Date(block.endsAt))}
                            </p>
                            {block.reason ? (
                              <p className="mt-1 text-[12px] text-[var(--muted)]">
                                {block.reason}
                              </p>
                            ) : null}
                          </li>
                        );
                      })
                    ) : (
                      <li className="rounded-[var(--radius)] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">
                        No time off in the next 30 days.
                      </li>
                    )}
                  </ol>
                </aside>
              </section>
            ) : null}

            {activeTab === "clinic" ? (
              <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2
                    aria-hidden="true"
                    className="text-[var(--primary)]"
                    size={18}
                  />
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">
                    {t("settings.clinicTitle")}
                  </h2>
                </div>
                <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ["settings.clinicName", staffContext.clinic.name],
                    ["settings.clinicSlug", staffContext.clinic.slug],
                    ["settings.clinicLocale", staffContext.clinic.locale],
                    ["settings.clinicTimezone", staffContext.clinic.timezone]
                  ].map(([labelKey, value]) => (
                    <div
                      className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                      key={labelKey}
                    >
                      <dt className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
                        {t(labelKey as CopyKey)}
                      </dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-[var(--ink)]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
