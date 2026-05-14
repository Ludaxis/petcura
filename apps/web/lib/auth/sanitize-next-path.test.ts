import { describe, expect, it } from "vitest";
import {
  sanitizeOwnerNextRouterPath,
  sanitizeStaffNextPath
} from "./sanitize-next-path";

describe("sanitizeStaffNextPath", () => {
  it("returns a safe same-origin path unchanged", () => {
    expect(sanitizeStaffNextPath("/settings/billing")).toBe("/settings/billing");
    expect(sanitizeStaffNextPath("/inbox?q=mine&urgent=1")).toBe(
      "/inbox?q=mine&urgent=1"
    );
  });

  it("returns the default fallback for missing or non-string input", () => {
    expect(sanitizeStaffNextPath(null)).toBe("/inbox");
    expect(sanitizeStaffNextPath(undefined)).toBe("/inbox");
    expect(sanitizeStaffNextPath("")).toBe("/inbox");
  });

  it("respects a caller-supplied fallback", () => {
    expect(sanitizeStaffNextPath(null, "")).toBe("");
    expect(sanitizeStaffNextPath("//evil.example.com", "/")).toBe("/");
  });

  it("rejects open-redirect prefixes (// and backslash)", () => {
    expect(sanitizeStaffNextPath("//evil.example.com")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/\\evil.example.com")).toBe("/inbox");
    expect(sanitizeStaffNextPath("\\evil.example.com")).toBe("/inbox");
  });

  it("rejects absolute URLs", () => {
    expect(sanitizeStaffNextPath("https://evil.example.com")).toBe("/inbox");
    expect(sanitizeStaffNextPath("http://evil.example.com/inbox")).toBe(
      "/inbox"
    );
    expect(sanitizeStaffNextPath("javascript:alert(1)")).toBe("/inbox");
  });

  it("rejects paths that do not begin with /", () => {
    expect(sanitizeStaffNextPath("inbox")).toBe("/inbox");
    expect(sanitizeStaffNextPath(" /inbox")).toBe("/inbox");
  });

  it("rejects the auth-loop entrypoints", () => {
    expect(sanitizeStaffNextPath("/login")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/login?next=/foo")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/login/anything")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/auth/callback")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/onboarding/clinic")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/onboarding/staff")).toBe("/inbox");
  });

  it("rejects owner-side paths from the clinic surface", () => {
    expect(sanitizeStaffNextPath("/o")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/o/")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/o/chat")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/o/login")).toBe("/inbox");
    expect(sanitizeStaffNextPath("/o/join?token=abc")).toBe("/inbox");
  });

  it("preserves traversal-looking but still in-scope paths", () => {
    // Note: the router never executes these paths; redirect is host-relative.
    // Asserting current behavior so a future hardening is intentional.
    expect(sanitizeStaffNextPath("/inbox/../settings")).toBe(
      "/inbox/../settings"
    );
  });
});

describe("sanitizeOwnerNextRouterPath", () => {
  it("returns a safe /o-prefixed path unchanged", () => {
    expect(sanitizeOwnerNextRouterPath("/o")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/o/pets/abc")).toBe("/o/pets/abc");
    expect(sanitizeOwnerNextRouterPath("/o/chat?id=1")).toBe("/o/chat?id=1");
  });

  it("returns the default fallback for missing or non-string input", () => {
    expect(sanitizeOwnerNextRouterPath(null)).toBe("/o");
    expect(sanitizeOwnerNextRouterPath(undefined)).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("")).toBe("/o");
  });

  it("respects a caller-supplied fallback", () => {
    expect(sanitizeOwnerNextRouterPath(null, "")).toBe("");
  });

  it("rejects open-redirect prefixes", () => {
    expect(sanitizeOwnerNextRouterPath("//evil.example.com")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("\\evil.example.com")).toBe("/o");
  });

  it("rejects absolute URLs", () => {
    expect(sanitizeOwnerNextRouterPath("https://evil.example.com")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("javascript:alert(1)")).toBe("/o");
  });

  it("rejects non-/o clinic-side paths from the owner surface", () => {
    expect(sanitizeOwnerNextRouterPath("/inbox")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/settings")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/")).toBe("/o");
  });

  it("rejects /o-prefixed auth-loop entrypoints", () => {
    expect(sanitizeOwnerNextRouterPath("/o/login")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/o/login?phone=1")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/o/join")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/o/join?token=abc")).toBe("/o");
    expect(sanitizeOwnerNextRouterPath("/o/auth/callback")).toBe("/o");
  });
});
