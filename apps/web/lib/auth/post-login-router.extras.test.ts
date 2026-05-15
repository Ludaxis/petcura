/**
 * Extra coverage on top of post-login-router.test.ts.
 *
 * The original suite covers the 12 main branches per merged plan §3.1.
 * These tests add:
 *   - precedence ordering (next > lastVisited > default for staff while
 *     onboarding is disabled)
 *   - unsafe `next` rejection on the owner branch
 *   - lastVisited cookie precedence on the owner branch (intentionally
 *     ignored today — owner cookie is not consulted; assert that and
 *     break-loud if the implementation changes)
 *   - role normalization edge cases that the router boundary should honor
 *   - reason string is one of the documented values for every branch
 */

import { describe, expect, it } from "vitest";
import {
  normalizeRoutingRole,
  resolvePostLoginDestination,
  roleDefaultDestination,
  type RouterInput
} from "./post-login-router";

function staff(overrides: Partial<RouterInput["actor"]> = {}): RouterInput["actor"] {
  return {
    kind: "clinic_staff",
    userId: "user-1",
    clinicId: "clinic-1",
    role: "vet",
    firstRun: false,
    ...overrides
  } as RouterInput["actor"];
}

function owner(overrides: Partial<RouterInput["actor"]> = {}): RouterInput["actor"] {
  return {
    kind: "owner",
    userId: "user-1",
    firstRun: false,
    hasUnreadStaffReply: false,
    hasActiveRequest: false,
    ...overrides
  } as RouterInput["actor"];
}

describe("post-login-router precedence (staff)", () => {
  it("staff first-run does not beat a safe next param while onboarding is disabled", () => {
    const r = resolvePostLoginDestination({
      actor: staff({ firstRun: true, role: "admin" }),
      nextParam: "/settings/billing",
      lastVisitedCookie: "/inbox"
    });
    expect(r.destination).toBe("/settings/billing");
    expect(r.reason).toBe("next_param");
  });

  it("staff first-run falls through to last visited when next is absent", () => {
    const r = resolvePostLoginDestination({
      actor: staff({ firstRun: true, role: "vet" }),
      nextParam: null,
      lastVisitedCookie: "/inbox?q=mine"
    });
    expect(r.destination).toBe("/inbox?q=mine");
    expect(r.reason).toBe("last_visited");
  });

  it("safe next beats last-visited cookie", () => {
    const r = resolvePostLoginDestination({
      actor: staff({ role: "reception" }),
      nextParam: "/inbox?q=urgent",
      lastVisitedCookie: "/inbox/r/abc"
    });
    expect(r.destination).toBe("/inbox?q=urgent");
    expect(r.reason).toBe("next_param");
  });

  it("unsafe next falls through to last-visited cookie", () => {
    const r = resolvePostLoginDestination({
      actor: staff({ role: "reception" }),
      nextParam: "//evil.example.com",
      lastVisitedCookie: "/inbox/r/abc"
    });
    expect(r.destination).toBe("/inbox/r/abc");
    expect(r.reason).toBe("last_visited");
  });

  it("returns role default for admin when no signals", () => {
    expect(
      resolvePostLoginDestination({
        actor: staff({ role: "admin" }),
        nextParam: null,
        lastVisitedCookie: null
      }).destination
    ).toBe(roleDefaultDestination("admin"));
  });
});

describe("post-login-router precedence (owner)", () => {
  it("first-run owner beats every other signal", () => {
    const r = resolvePostLoginDestination({
      actor: owner({
        firstRun: true,
        hasUnreadStaffReply: true,
        hasActiveRequest: true
      }),
      nextParam: "/o/pets/abc",
      lastVisitedCookie: "/o/chat"
    });
    expect(r.destination).toBe("/o?welcome=1");
    expect(r.reason).toBe("owner_first_run");
  });

  it("safe owner next beats unread + active flags", () => {
    const r = resolvePostLoginDestination({
      actor: owner({ hasUnreadStaffReply: true, hasActiveRequest: true }),
      nextParam: "/o/pets/abc",
      lastVisitedCookie: null
    });
    expect(r.destination).toBe("/o/pets/abc");
    expect(r.reason).toBe("next_param");
  });

  it("unsafe owner next is dropped, falls through to unread reply", () => {
    const r = resolvePostLoginDestination({
      actor: owner({ hasUnreadStaffReply: true }),
      nextParam: "//evil.example.com",
      lastVisitedCookie: null
    });
    expect(r.destination).toBe("/o/chat");
    expect(r.reason).toBe("unread_reply");
  });

  it(
    "owner last-visited cookie is currently NOT consulted — " +
      "asserting so a future change is intentional",
    () => {
      const r = resolvePostLoginDestination({
        actor: owner(),
        nextParam: null,
        lastVisitedCookie: "/o/chat"
      });
      // If/when owner cookie support lands, expected becomes /o/chat and
      // this assertion must be updated.
      expect(r.destination).toBe("/o");
      expect(r.reason).toBe("owner_default");
    }
  );

  it("hasUnreadStaffReply contract is read from input (currently false-stub at adapter)", () => {
    // The adapter that produces the input may stub `hasUnreadStaffReply` to
    // false. This test asserts the *router* honors a true input today, so
    // when Codex wires the real reader and starts returning true, the
    // routing branch fires automatically.
    const r = resolvePostLoginDestination({
      actor: owner({ hasUnreadStaffReply: true }),
      nextParam: null,
      lastVisitedCookie: null
    });
    expect(r.destination).toBe("/o/chat");
    expect(r.reason).toBe("unread_reply");
  });
});

describe("normalizeRoutingRole", () => {
  it("collapses owner and admin to admin", () => {
    expect(normalizeRoutingRole("owner")).toBe("admin");
    expect(normalizeRoutingRole("admin")).toBe("admin");
  });

  it("maps vet to vet", () => {
    expect(normalizeRoutingRole("vet")).toBe("vet");
  });

  it("collapses tech / viewer / reception to reception", () => {
    expect(normalizeRoutingRole("reception")).toBe("reception");
    expect(normalizeRoutingRole("tech")).toBe("reception");
    expect(normalizeRoutingRole("viewer")).toBe("reception");
  });
});

describe("router reason taxonomy", () => {
  const allowed = new Set([
    "clinic_first_run",
    "staff_first_run",
    "next_param",
    "last_visited",
    "role_default",
    "owner_first_run",
    "unread_reply",
    "active_request",
    "owner_default"
  ]);

  it.each([
    {
      label: "first-run admin",
      input: {
        actor: staff({ firstRun: true, role: "admin" }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "first-run vet",
      input: {
        actor: staff({ firstRun: true, role: "vet" }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "returning admin with next",
      input: {
        actor: staff({ role: "admin" }),
        nextParam: "/settings",
        lastVisitedCookie: null
      }
    },
    {
      label: "returning vet with cookie",
      input: {
        actor: staff({ role: "vet" }),
        nextParam: null,
        lastVisitedCookie: "/inbox/r/x"
      }
    },
    {
      label: "returning reception default",
      input: {
        actor: staff({ role: "reception" }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "first-run owner",
      input: {
        actor: owner({ firstRun: true }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "owner unread",
      input: {
        actor: owner({ hasUnreadStaffReply: true }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "owner active",
      input: {
        actor: owner({ hasActiveRequest: true }),
        nextParam: null,
        lastVisitedCookie: null
      }
    },
    {
      label: "owner default",
      input: {
        actor: owner(),
        nextParam: null,
        lastVisitedCookie: null
      }
    }
  ])("$label returns a documented reason", ({ input }) => {
    const r = resolvePostLoginDestination(input);
    expect(allowed.has(r.reason)).toBe(true);
  });
});
