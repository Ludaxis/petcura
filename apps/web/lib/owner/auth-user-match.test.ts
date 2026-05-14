import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  authUserMatchesEmail,
  authUserMatchesPhone,
  ownerAuthEmailForPhone
} from "./auth-user-match";

function user(overrides: Partial<User>): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-05-14T00:00:00.000Z",
    ...overrides
  };
}

describe("owner auth user matching", () => {
  it("matches phone users across formatting differences", () => {
    expect(
      authUserMatchesPhone(user({ phone: "+372 5804 6666" }), "+37258046666")
    ).toBe(true);
  });

  it("matches phone identities when Supabase Auth omits user.phone", () => {
    expect(
      authUserMatchesPhone(
        user({
          identities: [
            {
              id: "+37258046666",
              identity_id: "identity-1",
              provider: "phone",
              user_id: "user-1",
              identity_data: {
                phone: "+372 5804 6666"
              }
            }
          ]
        }),
        "+37258046666"
      )
    ).toBe(true);
  });

  it("derives a deterministic internal email for phone-only owner login", () => {
    expect(ownerAuthEmailForPhone("+372 5804 6666")).toBe(
      ownerAuthEmailForPhone("37258046666")
    );
    expect(ownerAuthEmailForPhone("+37258046666")).toMatch(
      /^owner-[a-f0-9]{32}@owner-auth\.petcura\.local$/
    );
  });

  it("matches synthetic owner emails case-insensitively", () => {
    const email = ownerAuthEmailForPhone("+37258046666");
    expect(authUserMatchesEmail(user({ email: email.toUpperCase() }), email)).toBe(
      true
    );
  });
});
