import { Mail, UserRound } from "lucide-react";
import {
  createTranslator,
  localeOptions,
  type CopyKey,
  type StaffRole
} from "@petcura/shared";
import { Badge, Button } from "@petcura/ui";
import {
  ProfileEditorCard,
  ProfileField,
  profileInputClass
} from "@/app/_components/profile/ProfileEditor";
import { AppShell } from "@/app/_components/AppShell";
import { updateMyProfile } from "@/app/profile/actions";
import { requireStaffContext } from "@/lib/auth/staff";
import { getRequestLocale } from "@/lib/locale";
import { getSignedProfileImageUrl } from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: Promise<{
    lang?: string | string[];
    profile_error?: string | string[];
    profile_status?: string | string[];
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

export default async function ProfilePage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const langParam = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const locale = await getRequestLocale(langParam);
  const t = createTranslator(locale);
  const staffContext = await requireStaffContext(locale, "/profile");
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("full_name, display_name, phone, job_title, avatar_url, locale")
    .eq("user_id", staffContext.user.id)
    .maybeSingle();
  const avatarUrl = await getSignedProfileImageUrl(profile?.avatar_url);
  const status = getSearchParam(sp.profile_status);
  const hasError = Boolean(getSearchParam(sp.profile_error));
  const role = staffContext.membership.role as StaffRole;
  const fullName =
    profile?.full_name ??
    staffContext.user.user_metadata?.full_name ??
    staffContext.user.email ??
    t("profile.unknownUser");
  const displayName = profile?.display_name ?? "";

  return (
    <AppShell
      locale={locale}
      currentPath="/profile"
      pageTitle={t("nav.headerTitle.profile")}
    >
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
                  <UserRound aria-hidden="true" size={16} />
                </span>
                <h1 className="text-[22px] font-semibold leading-tight text-[var(--ink)]">
                  {t("profile.title")}
                </h1>
                <Badge tone="teal">{t(roleCopyKeys[role])}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[var(--muted)]">
                {t("profile.description")}
              </p>
            </div>
            <Button asChild variant="secondary">
              <a href={`mailto:${staffContext.user.email ?? ""}`}>
                <Mail aria-hidden="true" size={15} />
                {staffContext.user.email}
              </a>
            </Button>
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
          <div className="mx-auto max-w-4xl">
            <ProfileEditorCard
              action={updateMyProfile}
              description={t("profile.staffDescription")}
              hiddenFields={<input name="lang" type="hidden" value={locale} />}
              imageLabel={t("profile.photo")}
              imageUrl={avatarUrl}
              name={displayName || fullName}
              submitLabel={t("profile.save")}
              title={t("profile.myProfile")}
            >
              <ProfileField htmlFor="profile-full-name" label={t("profile.fullName")}>
                <input
                  className={profileInputClass}
                  defaultValue={fullName}
                  id="profile-full-name"
                  name="fullName"
                  required
                />
              </ProfileField>
              <ProfileField
                htmlFor="profile-display-name"
                label={t("profile.displayName")}
              >
                <input
                  className={profileInputClass}
                  defaultValue={displayName}
                  id="profile-display-name"
                  name="displayName"
                />
              </ProfileField>
              <ProfileField htmlFor="profile-phone" label={t("profile.phone")}>
                <input
                  className={profileInputClass}
                  defaultValue={profile?.phone ?? ""}
                  id="profile-phone"
                  name="phone"
                  type="tel"
                />
              </ProfileField>
              <ProfileField htmlFor="profile-job-title" label={t("profile.jobTitle")}>
                <input
                  className={profileInputClass}
                  defaultValue={profile?.job_title ?? ""}
                  id="profile-job-title"
                  name="jobTitle"
                />
              </ProfileField>
              <ProfileField htmlFor="profile-locale" label={t("profile.language")}>
                <select
                  className={profileInputClass}
                  defaultValue={profile?.locale ?? locale}
                  id="profile-locale"
                  name="profileLocale"
                >
                  {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </ProfileField>
              <ProfileField htmlFor="profile-email" label={t("settings.email")}>
                <input
                  className={profileInputClass}
                  defaultValue={staffContext.user.email ?? ""}
                  disabled
                  id="profile-email"
                />
              </ProfileField>
            </ProfileEditorCard>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
