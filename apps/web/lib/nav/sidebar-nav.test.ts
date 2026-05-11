import { describe, expect, it } from "vitest";
import {
  SIDEBAR_NAV,
  activeStreamId,
  type NavItem
} from "./sidebar-nav";

const walk = (items: NavItem[]): NavItem[] =>
  items.flatMap((item) => [item, ...(item.children ? walk(item.children) : [])]);

describe("sidebar-nav", () => {
  it("exposes every top-level surface needed by the sidebar shell", () => {
    const ids = SIDEBAR_NAV.map((item) => item.id);
    // Admin is present in config but gated at render time to super-admins.
    expect(ids).toEqual([
      "search",
      "inbox",
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
