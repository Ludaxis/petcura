import { describe, expect, it } from "vitest";
import { resolveStaffMagicLinkOrigin } from "./staff-auth-origin";

describe("resolveStaffMagicLinkOrigin", () => {
  it("uses the canonical app URL instead of the marketing request origin", () => {
    expect(
      resolveStaffMagicLinkOrigin({
        appUrl: "https://app.petcura.app",
        requestOrigin: "https://petcura.app"
      })
    ).toBe("https://app.petcura.app");
  });

  it("keeps localhost development callbacks on localhost", () => {
    expect(
      resolveStaffMagicLinkOrigin({
        appUrl: "https://app.petcura.app",
        requestOrigin: "http://localhost:3000"
      })
    ).toBe("http://localhost:3000");
  });

  it("normalizes 127.0.0.1 to localhost for Supabase redirect allow lists", () => {
    expect(
      resolveStaffMagicLinkOrigin({
        appUrl: "https://app.petcura.app",
        requestOrigin: "http://127.0.0.1:3000"
      })
    ).toBe("http://localhost:3000");
  });

  it("falls back to the request origin when the app URL is invalid", () => {
    expect(
      resolveStaffMagicLinkOrigin({
        appUrl: "not a url",
        requestOrigin: "https://preview.petcura.app"
      })
    ).toBe("https://preview.petcura.app");
  });
});
