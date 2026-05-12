import {
  Bell,
  BellRing,
  CalendarClock,
  Clock,
  FileText,
  Inbox,
  ListChecks,
  PawPrint,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CopyKey } from "@petcura/shared";
import type { InboxStream } from "@/lib/inbox/queries";

/**
 * Source-of-truth for the persistent sidebar. Adding a new top-level feature
 * means appending a single object here — the AppSidebar reads this config and
 * renders nav rows, sub-items, and count badges through a uniform path.
 *
 * Counts are NOT computed inside this module. Counts are sourced server-side
 * (see `getInboxStreamCounts`) and threaded into the sidebar via the
 * `countSource` key — the AppSidebar resolves a count by looking up
 * `countSource` against a `NavCounts` map. Items without a `countSource`
 * render no badge.
 */

export type NavCountSource =
  | "inboxTotal"
  | "myOpen"
  | "unassigned"
  | "urgent"
  | "today"
  | "resolved"
  | "remindersTotal";

export type NavBadgeTone = "neutral" | "primary" | "amber" | "red";

export type NavRequirement = "staff" | "super_admin";

export type NavItem = {
  /** Stable id used as key and for active-state matching. */
  id: string;
  /** i18n key — resolved by createTranslator(locale). */
  labelKey: CopyKey;
  /**
   * Destination href. Use a `?stream=` query for inbox sub-items; the
   * existing search-params flow on /inbox is the consumer.
   * The pseudo href `#cmdk` is special-cased to open the command palette.
   */
  href: string;
  /** Optional lucide icon — usually only top-level rows show icons. */
  icon?: LucideIcon;
  /** Right-aligned keyboard hint (e.g. "⌘K"). Purely visual. */
  keyboardHint?: string;
  countSource?: NavCountSource;
  badgeTone?: NavBadgeTone;
  /** Gate visibility by role. Resolved at render time by the AppSidebar. */
  requires?: NavRequirement;
  /** Optional sub-items, rendered indented under the parent row. */
  children?: NavItem[];
};

export type NavCounts = Partial<Record<NavCountSource, number>>;

/**
 * Sub-items for the Inbox parent. The order is intentional — staff first,
 * then triage tiers, then "All open", then "Resolved" as the cool-down lane.
 */
const INBOX_CHILDREN: NavItem[] = [
  {
    id: "stream-mine",
    labelKey: "inbox.streams.mine",
    href: "/inbox?stream=mine",
    countSource: "myOpen"
  },
  {
    id: "stream-unassigned",
    labelKey: "inbox.streams.unassigned",
    href: "/inbox?stream=unassigned",
    countSource: "unassigned"
  },
  {
    id: "stream-urgent",
    labelKey: "inbox.streams.urgent",
    href: "/inbox?stream=urgent",
    countSource: "urgent",
    badgeTone: "red"
  },
  {
    id: "stream-today",
    labelKey: "inbox.streams.today",
    href: "/inbox?stream=today",
    countSource: "today",
    badgeTone: "amber"
  },
  {
    id: "stream-all",
    labelKey: "inbox.streams.all",
    href: "/inbox",
    countSource: "inboxTotal"
  },
  {
    id: "stream-resolved",
    labelKey: "inbox.streams.resolved",
    href: "/inbox?stream=resolved",
    countSource: "resolved"
  }
];

export const SIDEBAR_NAV: NavItem[] = [
  {
    id: "search",
    labelKey: "menu.search",
    href: "#cmdk",
    icon: Search,
    keyboardHint: "⌘K"
  },
  {
    id: "inbox",
    labelKey: "nav.inbox",
    href: "/inbox",
    icon: Inbox,
    countSource: "inboxTotal",
    children: INBOX_CHILDREN
  },
  {
    id: "reminders",
    labelKey: "nav.reminders",
    href: "/reminders",
    icon: Bell,
    countSource: "remindersTotal"
  },
  {
    id: "directory",
    labelKey: "nav.directory",
    href: "/directory",
    icon: Users
  },
  {
    id: "reports",
    labelKey: "nav.reports",
    href: "/reports",
    icon: FileText
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    href: "/settings",
    icon: Settings
  },
  {
    id: "profile",
    labelKey: "nav.profile",
    href: "/profile",
    icon: User
  },
  {
    // Admin lives at the bottom of the nav and is gated to super-admins.
    // AppSidebar resolves this `requires` gate at render time via the
    // `isSuperAdmin` prop threaded down from AppShell.
    id: "admin",
    labelKey: "nav.admin",
    href: "/admin",
    icon: ShieldCheck,
    requires: "super_admin"
  }
];

/**
 * Maps `?stream=` (or "all" when absent) onto the corresponding child id so
 * the sidebar can render the sage-soft active pill. Kept here because the
 * sidebar config is the source of truth for which streams exist.
 */
export function activeStreamId(stream: InboxStream): string {
  switch (stream) {
    case "mine":
      return "stream-mine";
    case "unassigned":
      return "stream-unassigned";
    case "urgent":
      return "stream-urgent";
    case "today":
      return "stream-today";
    case "resolved":
      return "stream-resolved";
    case "all":
    default:
      return "stream-all";
  }
}

// Re-export icons that AppSidebar uses inline (for the bottom identity card,
// pending-state spinners, etc.) so consumers import from one module.
export {
  Bell,
  BellRing,
  CalendarClock,
  Clock,
  Inbox,
  ListChecks,
  PawPrint,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  AlertTriangle,
  CheckCircle2
};
