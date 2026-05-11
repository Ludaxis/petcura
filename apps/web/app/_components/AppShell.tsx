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
import { getThemePreference } from "@/lib/theme";
import { signOutStaff } from "@/app/inbox/actions";
import { AppSidebar } from "./AppSidebar";
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

export async function AppShell({
  children,
  locale,
  inboxStream = "all",
  currentPath
}: AppShellProps) {
  const staffContext = await requireStaffContext(locale, currentPath);
  const themePreference = await getThemePreference();
  const t = createTranslator(locale);

  const rawCounts = await getInboxStreamCounts(
    staffContext.supabase,
    staffContext.clinic.id,
    staffContext.membership.id
  );

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
    // Reminders aren't wired to a real source yet — Slice C delivers them.
    // The badge slot is reserved so the contract stays stable.
    remindersTotal: 0
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
      <main className="flex min-h-svh w-full flex-1 flex-col bg-[var(--paper)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-[var(--paper)] focus:px-3 focus:py-2 focus:text-[var(--ink)] focus:shadow"
        >
          {t("nav.skipToContent")}
        </a>
        <div id="main-content" className="flex flex-1 flex-col">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
