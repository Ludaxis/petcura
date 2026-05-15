import { describe, expect, it } from "vitest";
import {
  resolvePostLoginDestination,
  roleDefaultDestination,
  type RouterInput
} from "./post-login-router";

function staffInput(overrides: Partial<RouterInput["actor"]> = {}, rest: Partial<Omit<RouterInput, "actor">> = {}): RouterInput {
  return {
    actor: {
      kind: "clinic_staff",
      userId: "user-1",
      clinicId: "clinic-1",
      role: "vet",
      firstRun: false,
      ...overrides
    } as RouterInput["actor"],
    nextParam: null,
    lastVisitedCookie: null,
    ...rest
  };
}

function ownerInput(overrides: Partial<RouterInput["actor"]> = {}, rest: Partial<Omit<RouterInput, "actor">> = {}): RouterInput {
  return {
    actor: {
      kind: "owner",
      userId: "user-1",
      firstRun: false,
      hasUnreadStaffReply: false,
      hasActiveRequest: false,
      ...overrides
    } as RouterInput["actor"],
    nextParam: null,
    lastVisitedCookie: null,
    ...rest
  };
}

describe("resolvePostLoginDestination — clinic staff", () => {
  it("does not block first-run admins on disabled onboarding", () => {
    const r = resolvePostLoginDestination(
      staffInput({ firstRun: true, role: "admin" }, { nextParam: "/inbox" })
    );
    expect(r).toEqual({
      destination: "/inbox",
      reason: "next_param"
    });
  });

  it("falls through to defaults for first-run staff while onboarding is disabled", () => {
    const r = resolvePostLoginDestination(
      staffInput({ firstRun: true, role: "reception" })
    );
    expect(r.destination).toBe(roleDefaultDestination("reception"));
    expect(r.reason).toBe("role_default");
  });

  it("honors a safe next param for returning staff", () => {
    const r = resolvePostLoginDestination(
      staffInput({}, { nextParam: "/settings/billing" })
    );
    expect(r).toEqual({
      destination: "/settings/billing",
      reason: "next_param"
    });
  });

  it("rejects an unsafe next param and falls through", () => {
    const r = resolvePostLoginDestination(
      staffInput({}, { nextParam: "//evil.example.com" })
    );
    expect(r.reason).toBe("role_default");
    expect(r.destination).toBe(roleDefaultDestination("vet"));
  });

  it("rejects a cross-actor next param targeting /o", () => {
    const r = resolvePostLoginDestination(
      staffInput({}, { nextParam: "/o" })
    );
    expect(r.reason).toBe("role_default");
  });

  it("rejects an auth-loop next param", () => {
    const r = resolvePostLoginDestination(
      staffInput({}, { nextParam: "/login?foo=1" })
    );
    expect(r.reason).toBe("role_default");
  });

  it("falls back to last-visited cookie when no next param", () => {
    const r = resolvePostLoginDestination(
      staffInput({}, { lastVisitedCookie: "/inbox/r/abc" })
    );
    expect(r).toEqual({
      destination: "/inbox/r/abc",
      reason: "last_visited"
    });
  });

  it("falls back to role default when no signals", () => {
    expect(
      resolvePostLoginDestination(staffInput({ role: "reception" })).destination
    ).toBe("/inbox?q=unassigned&today=1");
    expect(
      resolvePostLoginDestination(staffInput({ role: "vet" })).destination
    ).toBe("/inbox?q=mine&urgent=1");
    expect(
      resolvePostLoginDestination(staffInput({ role: "admin" })).destination
    ).toBe("/settings");
  });
});

describe("resolvePostLoginDestination — owner", () => {
  it("routes a first-run owner to /o?welcome=1", () => {
    const r = resolvePostLoginDestination(ownerInput({ firstRun: true }));
    expect(r).toEqual({
      destination: "/o?welcome=1",
      reason: "owner_first_run"
    });
  });

  it("honors a safe owner next param", () => {
    const r = resolvePostLoginDestination(
      ownerInput({}, { nextParam: "/o/pets/abc" })
    );
    expect(r).toEqual({
      destination: "/o/pets/abc",
      reason: "next_param"
    });
  });

  it("rejects a clinic-side next param", () => {
    const r = resolvePostLoginDestination(
      ownerInput({}, { nextParam: "/inbox" })
    );
    expect(r.reason).toBe("owner_default");
    expect(r.destination).toBe("/o");
  });

  it("routes owners with unread staff reply to /o/chat", () => {
    const r = resolvePostLoginDestination(
      ownerInput({ hasUnreadStaffReply: true })
    );
    expect(r).toEqual({ destination: "/o/chat", reason: "unread_reply" });
  });

  it("routes owners with active request to /o", () => {
    const r = resolvePostLoginDestination(
      ownerInput({ hasActiveRequest: true })
    );
    expect(r.reason).toBe("active_request");
  });

  it("falls back to /o for idle returning owners", () => {
    const r = resolvePostLoginDestination(ownerInput());
    expect(r).toEqual({ destination: "/o", reason: "owner_default" });
  });
});
