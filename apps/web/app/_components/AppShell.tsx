import "server-only";
import type { ReactNode } from "react";
import {
  createTranslator,
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
import { AppSidebar } from "./AppSidebar";
import { MobileShellHeader } from "./MobileShellHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import type { NavCounts } from "@/lib/nav/sidebar-nav";

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

function clinicInitialsFrom(name: string) {
  // "Tartu Loomakliinik" → "TL" — small mono-label for the identity card.
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return initials || name.slice(0, 2).toUpperCase();
}

function userInitialsFrom(email: string) {
  // Mirrors the sidebar identity-card derivation so the bottom-nav "Me"
  // avatar matches what the user already sees in the rail.
  const source = email.trim();
  const parts = source.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2);
  const joined = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
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

  const [rawCounts, openReminderCount] = await Promise.all([
    getInboxStreamCounts(
      staffContext.supabase,
      staffContext.clinic.id,
      staffContext.membership.id
    ),
    getOpenReminderCount(staffContext.supabase, staffContext.clinic.id)
  ]);

  // Map server counts onto the NavCountSource keys the sidebar uses. The
  // sidebar only ever reads through these named slots; it stays decoupled
  // from the raw StreamCounts shape.
  const counts: NavCounts = {
    inboxTotal: rawCounts.all,
    myOpen: rawCounts.mine,
    unassigned: rawCounts.unassigned,
    urgent: rawCounts.urgent,
    today: rawCounts.today,
    resolved: rawCounts.resolved,
    remindersTotal: openReminderCount
  };

  // staff_role enum values render verbatim in the identity card subtitle.
  // The nullish fallback keeps the row meaningful if a future role lands
  // before this surface learns to translate it.
  const roleLabel: string = staffContext.membership.role ?? "staff";

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar
        locale={locale}
        email={staffContext.user.email ?? ""}
        clinicName={staffContext.clinic.name}
        clinicInitials={clinicInitialsFrom(staffContext.clinic.name)}
        roleLabel={roleLabel}
        currentPath={currentPath}
        initialTheme={themePreference}
        counts={counts}
        inboxStream={inboxStream}
        isSuperAdmin={isSuperAdmin}
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
      <main className="flex h-svh w-full flex-1 flex-col overflow-hidden bg-[var(--paper)]">
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
          meInitials={userInitialsFrom(staffContext.user.email ?? "")}
          meAriaLabel={t("menu.ariaLabel")}
        />
      </main>
    </SidebarProvider>
  );
}
