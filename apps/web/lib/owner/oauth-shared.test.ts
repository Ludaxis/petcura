import { describe, expect, it } from "vitest";
import {
  getOwnerOAuthIdentityType,
  getOwnerOAuthIdentityValue,
  hasVerifiedOwnerOAuthEmail,
  normalizeOwnerOAuthEmail,
  parseOwnerOAuthProvider,
  sanitizeOwnerNextPath
} from "./oauth-shared";

describe("owner OAuth helpers", () => {
  it("accepts only Google and Apple providers", () => {
    expect(parseOwnerOAuthProvider("google")).toBe("google");
    expect(parseOwnerOAuthProvider("apple")).toBe("apple");
    expect(parseOwnerOAuthProvider("github")).toBeNull();
    expect(parseOwnerOAuthProvider(null)).toBeNull();
  });

  it("maps providers to identity types allowed by the database", () => {
    expect(getOwnerOAuthIdentityType("google")).toBe("oauth_google");
    expect(getOwnerOAuthIdentityType("apple")).toBe("oauth_apple");
  });

  it("keeps owner redirects inside the owner app", () => {
    expect(sanitizeOwnerNextPath("/o/chat")).toBe("/o/chat");
    expect(sanitizeOwnerNextPath("/inbox")).toBe("/o");
    expect(sanitizeOwnerNextPath("https://evil.test/o")).toBe("/o");
    expect(sanitizeOwnerNextPath("//evil.test/o")).toBe("/o");
  });

  it("normalizes and verifies OAuth emails", () => {
    expect(normalizeOwnerOAuthEmail("  Reza@Example.COM ")).toBe(
      "reza@example.com"
    );
    expect(normalizeOwnerOAuthEmail("not-an-email")).toBeNull();
    expect(
      hasVerifiedOwnerOAuthEmail({
        email: "owner@example.test",
        email_confirmed_at: "2026-05-14T09:00:00Z",
        confirmed_at: null
      })
    ).toBe(true);
    expect(
      hasVerifiedOwnerOAuthEmail({
        email: "owner@example.test",
        email_confirmed_at: null,
        confirmed_at: null
      })
    ).toBe(false);
  });

  it("uses provider subject when Supabase exposes it", () => {
    expect(
      getOwnerOAuthIdentityValue(
        {
          id: "auth-user",
          identities: [
            {
              id: "identity-row",
              identity_id: "google-subject",
              provider: "google"
            }
          ]
        } as never,
        "google"
      )
    ).toBe("google:google-subject");
  });
});
