import "server-only";
import type { ReactNode } from "react";
import {
  createTranslator,
  getClinicPermissions,
  type CopyKey,
  type StaffRole,
  type SupportedLocale
} from "@petcura/shared";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  getInboxStreamCounts,
  type InboxStream
} from "@/lib/inbox/queries";
import { requireStaffContext } from "@/lib/auth/staff";
import { isSuperAdminEmail } from "@/lib/auth/super-admin";
import { getThemePreference } from "@/lib/theme";
import { signOutStaff } from "@/app/inbox/actions";
import { getOpenReminderCount } from "@/lib/reminders";
import { getSignedProfileImageUrl } from "@/lib/profile-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSidebar } from "./AppSidebar";
import { MobileShellHeader } from "./MobileShellHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { LazyMobileMeSheet } from "./LazyMobileMeSheet";
import type { NavCounts } from "@/lib/nav/sidebar-nav";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the typed NavCounts map by fanning out the two server queries
 * the sidebar badges depend on. Returned as a Promise the sidebar unwraps
 * via `use()` inside a Suspense boundary — that lets the rest of the
 * shell paint while these queries settle (saves ~100–250 ms of wasted
 * first-paint on cold nav).
 *
 * Reminder count for the mobile bottom-nav badge still needs to resolve
 * synchronously, so AppShell awaits the reminder query in parallel; only
 * the sidebar reads through the streamed promise.
 */
async function loadNavCounts(
  supabase: SupabaseClient,
  clinicId: string,
  membershipId: string,
  remindersTotal: number
): Promise<NavCounts> {
  const rawCounts = await getInboxStreamCounts(
    supabase,
    clinicId,
    membershipId
  );
  return {
    inboxTotal: rawCounts.all,
    myOpen: rawCounts.mine,
    unassigned: rawCounts.unassigned,
    urgent: rawCounts.urgent,
    today: rawCounts.today,
    resolved: rawCounts.resolved,
    remindersTotal
  };
}

/**
 * AppShell — server wrapper that injects the persistent PetCura sidebar shell
 * and a main pane for `children`. Use on every authenticated route. Public
 * pages (/, /login, /intake, /design) keep their own chrome.
 *
 * Responsibilities:
 *   - Resolve staff auth once per request (every gated route calls this
 *     already, so the second call is RLS-cached and cheap).
 *   - Server-render the inbox counts so the sidebar appears with badges on
 *     first paint; no client fetching.
 *   - Provide the SidebarProvider that the shadcn primitives expect.
 */
export type AppShellProps = {
  children: ReactNode;
  locale: SupportedLocale;
  /** The active inbox stream (only relevant on /inbox; defaults to "all"). */
  inboxStream?: InboxStream;
  /** Path used by the UserMenu language switcher to preserve location. */
  currentPath: string;
  /**
   * The page title shown in the mobile header bar (visible below `md`).
   * Examples: "All · 35" on /inbox, "Lumi" on /requests/[id], "Admin" on
   * /admin. The persistent sidebar is hidden on mobile, so this is how
   * users know where they are. Defaults to the localized inbox label so
   * callers that don't pass it stay readable.
   */
  pageTitle?: string;
};

const roleCopyKeys: Record<StaffRole, CopyKey> = {
  owner: "role.owner",
  admin: "role.admin",
  vet: "role.vet",
  tech: "role.tech",
  reception: "role.reception",
  viewer: "role.viewer"
};

function clinicInitialsFrom(name: string) {
  // "Tartu Loomakliinik" → "TL" — small mono-label for the identity card.
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
  return (
    initials ||
    Array.from(name.trim()).slice(0, 2).join("").toLocaleUpperCase("en-US")
  );
}

function userInitialsFrom(email: string) {
  // Mirrors the sidebar identity-card derivation so the bottom-nav "Me"
  // avatar matches what the user already sees in the rail.
  const source = email.trim();
  const parts = source.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2);
  const joined = parts
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase("en-US") ?? "")
    .join("");
  return joined || "?";
}

export async function AppShell({
  children,
  locale,
  inboxStream = "all",
  currentPath,
  pageTitle
}: AppShellProps) {
  const staffContext = await requireStaffContext(locale, currentPath);
  const themePreference = await getThemePreference();
  const t = createTranslator(locale);
  const isSuperAdmin = isSuperAdminEmail(staffContext.user.email);
  const admin = createAdminClient();

  // Only the reminder count and profile lookup are awaited synchronously
  // — they feed the mobile bottom-nav badge and identity card, both of
  // which paint in the first frame. The sidebar's badge counts stream in
  // via `countsPromise` below, so we don't block the shell on them.
  const [openReminderCount, profileResult] = await Promise.all([
    getOpenReminderCount(staffContext.supabase, staffContext.clinic.id),
    admin
      .from("user_profiles")
      .select("full_name, display_name, avatar_url")
      .eq("user_id", staffContext.user.id)
      .maybeSingle()
  ]);
  const profile = profileResult.data;
  const avatarUrl = await getSignedProfileImageUrl(profile?.avatar_url);
  const userDisplayName = profile?.display_name ?? profile?.full_name ?? undefined;

  // Kick off the inbox stream counts WITHOUT awaiting. The sidebar reads
  // this promise through `use()` inside a Suspense boundary, so the shell
  // paints immediately with shimmer pills in place of badges and the real
  // numbers stream in once Postgres responds.
  const countsPromise = loadNavCounts(
    staffContext.supabase,
    staffContext.clinic.id,
    staffContext.membership.id,
    openReminderCount
  );

  const role = staffContext.membership.role as StaffRole;
  const roleLabel: string = roleCopyKeys[role] ? t(roleCopyKeys[role]) : role;
  const permissions = getClinicPermissions(role);

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        locale={locale}
        email={staffContext.user.email ?? ""}
        displayName={userDisplayName}
        avatarUrl={avatarUrl}
        clinicName={staffContext.clinic.name}
        clinicInitials={clinicInitialsFrom(staffContext.clinic.name)}
        roleLabel={roleLabel}
        currentPath={currentPath}
        initialTheme={themePreference}
        countsPromise={countsPromise}
        inboxStream={inboxStream}
        isSuperAdmin={isSuperAdmin}
        permissions={permissions}
        signOutAction={signOutStaff}
        labels={{
          sectionInbox: t("nav.section.inbox"),
          searchLabel: t("menu.search"),
          searchHint: "⌘K",
          navAria: t("nav.sidebarLabel"),
          userMenu: {
            ariaLabel: t("menu.ariaLabel"),
            signedInAs: t("menu.signedInAs"),
            theme: t("menu.theme"),
            themeLight: t("menu.themeLight"),
            themeDark: t("menu.themeDark"),
            themeSystem: t("menu.themeSystem"),
            language: t("menu.language"),
            profile: t("menu.profile"),
            help: t("menu.help"),
            helpHref: "mailto:support@petcura.app",
            signOut: t("auth.logout")
          }
        }}
      />
      {/*
        Main pane lives to the right of the fixed 240px sidebar. SidebarInset
        from shadcn would also work but we want a plain semantic <main> so
        existing inbox/requests styles continue to read it as the
        document root.
      */}
      {/*
        Main is viewport-locked (h-svh + overflow-hidden) so the page itself
        never scrolls. The inner panes own their own scroll — sidebar fixed,
        list scrolls in its container, detail scrolls in its container. This
        matches the Claude/Linear UX and prevents the "dead space below
        content" bug when the page is scrolled.
      */}
      <main
        data-app-shell
        className="flex h-dvh max-h-dvh min-h-0 w-full flex-1 flex-col overflow-hidden bg-[var(--paper)]"
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--paper)] focus:px-3 focus:py-2 focus:text-[var(--ink)] focus:shadow"
        >
          {t("nav.skipToContent")}
        </a>
        {/*
          Mobile header bar — visible only below `md`. Carries the sidebar
          trigger (which opens shadcn's Sheet drawer) and the current page
          title so users know where they are without the rail visible.
        */}
        <MobileShellHeader
          title={pageTitle ?? t("nav.headerTitle.inbox")}
          openMenuLabel={t("nav.openMenu")}
        />
        {/*
          Pad the bottom on mobile so content never sits under the
          persistent MobileBottomNav. The `md:pb-0` reset prevents the
          inset bleeding into the desktop layout, where the rail sidebar
          replaces the bottom nav entirely.
        */}
        <div
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-hidden pb-16 md:pb-0"
        >
          {children}
        </div>
        <MobileBottomNav
          locale={locale}
          meInitials={userInitialsFrom(
            userDisplayName ?? staffContext.user.email ?? ""
          )}
          avatarUrl={avatarUrl}
          meAriaLabel={t("menu.ariaLabel")}
          reminderCount={openReminderCount}
        />
        <LazyMobileMeSheet
          email={staffContext.user.email ?? ""}
          displayName={userDisplayName}
          avatarUrl={avatarUrl}
          clinicName={staffContext.clinic.name}
          roleLabel={roleLabel}
          initials={userInitialsFrom(
            userDisplayName ?? staffContext.user.email ?? ""
          )}
          locale={locale}
          currentPath={currentPath}
          initialTheme={themePreference}
          isSuperAdmin={isSuperAdmin}
          signOutAction={signOutStaff}
          labels={{
            sheetTitle: t("menu.sheetTitle"),
            signedInAs: t("menu.signedInAs"),
            theme: t("menu.theme"),
            themeLight: t("menu.themeLight"),
            themeDark: t("menu.themeDark"),
            themeSystem: t("menu.themeSystem"),
            language: t("menu.language"),
            profile: t("menu.profile"),
            settings: t("menu.settings"),
            admin: t("menu.admin"),
            help: t("menu.help"),
            helpHref: "mailto:support@petcura.app",
            signOut: t("auth.logout"),
            close: t("inbox.kbdSheet.close")
          }}
        />
      </main>
    </SidebarProvider>
  );
}
