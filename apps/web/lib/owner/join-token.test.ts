/**
 * Contract test for the join-token verification adapter.
 *
 * Pre-Codex the adapter must ALWAYS fail closed (`unknown_token`) so the
 * /o/join route handler redirects to /o/login with an `invite_expired` toast
 * rather than risk issuing a session against an unverified token.
 *
 * When Codex wires the real HMAC verify + atomic owner_invites consume,
 * the test below should be updated to cover happy + each typed error
 * (expired / consumed / invalid_signature / rate_limited). The third test
 * is the sentinel: it asserts `ok:false` and will start failing the moment
 * the stub returns ok:true, forcing the Developer to update the suite.
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  verifyAndConsumeJoinToken,
  type JoinTokenError
} from "./join-token";

const KNOWN_ERROR_CODES: ReadonlyArray<JoinTokenError> = [
  "expired",
  "consumed",
  "invalid_signature",
  "unknown_token",
  "rate_limited"
];

describe("verifyAndConsumeJoinToken (pre-Codex stub)", () => {
  it("returns `unknown_token` for any non-empty token (safe default)", async () => {
    const result = await verifyAndConsumeJoinToken({
      token: "anything",
      ipAddress: "127.0.0.1"
    });
    expect(result).toEqual({ ok: false, error: "unknown_token" });
  });

  it("returns `unknown_token` even when token is empty (safe default)", async () => {
    const result = await verifyAndConsumeJoinToken({
      token: "",
      ipAddress: null
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("unknown_token");
    }
  });

  it("never returns ok:true while the stub is in place", async () => {
    // Sentinel: when Codex lands the real adapter and a valid token can
    // succeed, this assertion must fail so the suite is updated.
    const result = await verifyAndConsumeJoinToken({
      token: "valid-hmac-payload",
      ipAddress: "203.0.113.1"
    });
    expect(result.ok).toBe(false);
  });

  it("uses only the documented error codes when ok:false", async () => {
    const result = await verifyAndConsumeJoinToken({
      token: "x",
      ipAddress: null
    });
    if (!result.ok) {
      expect(KNOWN_ERROR_CODES).toContain(result.error);
    }
  });
});
