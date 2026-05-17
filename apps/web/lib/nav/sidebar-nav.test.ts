import { describe, expect, it } from "vitest";
import {
  SIDEBAR_NAV,
  activeStreamId,
  canShowNavItem,
  type NavItem
} from "./sidebar-nav";

const walk = (items: NavItem[]): NavItem[] =>
  items.flatMap((item) => [item, ...(item.children ? walk(item.children) : [])]);

describe("sidebar-nav", () => {
  it("exposes every top-level surface needed by the sidebar shell", () => {
    const ids = SIDEBAR_NAV.map((item) => item.id);
    // Admin is present in config but gated at render time to super-admins.
    // Profile is intentionally absent from the main nav — it lives on the
    // identity card (UserMenu + MobileMeSheet) to avoid duplicating an
    // entry the user is already standing on at the bottom of the rail.
    // Search is intentionally absent until there is a real global search
    // surface; the inbox command palette remains keyboard-only.
    expect(ids).toEqual([
      "inbox",
      "directory",
      "calendar",
      "reminders",
      "reports",
      "settings",
      "admin"
    ]);
    expect(SIDEBAR_NAV.find((item) => item.id === "admin")?.requires).toBe(
      "super_admin"
    );
  });

  it("Inbox children cover every visible stream", () => {
    const inbox = SIDEBAR_NAV.find((i) => i.id === "inbox");
    expect(inbox?.children?.map((c) => c.id)).toEqual([
      "stream-mine",
      "stream-unassigned",
      "stream-urgent",
      "stream-today",
      "stream-all",
      "stream-resolved"
    ]);
  });

  it("links Directory to the unified directory surface", () => {
    const directory = SIDEBAR_NAV.find((item) => item.id === "directory");
    expect(directory?.href).toBe("/directory");
    expect(directory?.labelKey).toBe("nav.directory");
  });

  it("gates staff surfaces by clinic permissions", () => {
    const directory = SIDEBAR_NAV.find((item) => item.id === "directory")!;
    const calendar = SIDEBAR_NAV.find((item) => item.id === "calendar")!;
    const reports = SIDEBAR_NAV.find((item) => item.id === "reports")!;
    const settings = SIDEBAR_NAV.find((item) => item.id === "settings")!;
    const admin = SIDEBAR_NAV.find((item) => item.id === "admin")!;

    expect(
      canShowNavItem(directory, {
        isSuperAdmin: false,
        permissions: ["customers:view"]
      })
    ).toBe(true);
    expect(
      canShowNavItem(directory, {
        isSuperAdmin: false,
        permissions: ["requests:view"]
      })
    ).toBe(false);
    expect(
      canShowNavItem(reports, {
        isSuperAdmin: false,
        permissions: ["reports:view"]
      })
    ).toBe(true);
    expect(
      canShowNavItem(reports, {
        isSuperAdmin: false,
        permissions: ["requests:view"]
      })
    ).toBe(false);
    expect(
      canShowNavItem(calendar, {
        isSuperAdmin: false,
        permissions: ["appointments:view"]
      })
    ).toBe(true);
    expect(
      canShowNavItem(calendar, {
        isSuperAdmin: false,
        permissions: ["requests:view"]
      })
    ).toBe(false);
    expect(
      canShowNavItem(settings, {
        isSuperAdmin: false,
        permissions: ["settings:view"]
      })
    ).toBe(true);
    expect(
      canShowNavItem(admin, {
        isSuperAdmin: false,
        permissions: ["settings:view"]
      })
    ).toBe(false);
    expect(
      canShowNavItem(admin, {
        isSuperAdmin: true,
        permissions: []
      })
    ).toBe(true);
  });

  it("activeStreamId maps every InboxStream value to a child id", () => {
    expect(activeStreamId("mine")).toBe("stream-mine");
    expect(activeStreamId("unassigned")).toBe("stream-unassigned");
    expect(activeStreamId("urgent")).toBe("stream-urgent");
    expect(activeStreamId("today")).toBe("stream-today");
    expect(activeStreamId("resolved")).toBe("stream-resolved");
    expect(activeStreamId("all")).toBe("stream-all");
    // "week" and "routine" still exist in the type for the request detail
    // breadcrumb chip — they fall through to "all" because they don't have
    // a sidebar surface yet.
    expect(activeStreamId("week")).toBe("stream-all");
    expect(activeStreamId("routine")).toBe("stream-all");
  });

  it("every nav item references a defined translation key (no empty strings)", () => {
    for (const item of walk(SIDEBAR_NAV)) {
      expect(item.labelKey).toBeTruthy();
      expect(item.id).toBeTruthy();
    }
  });
});
