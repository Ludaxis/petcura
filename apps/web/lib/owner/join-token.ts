import "server-only";

/**
 * Typed adapter over the (not-yet-existing) `/o/join` token verification
 * endpoint. Codex will implement HMAC verify + atomic `owner_invites` consume
 * + rate limiting per `docs/contracts/owner-join-token.md`.
 *
 * Until then, this adapter ALWAYS returns `unknown_token`. The frontend route
 * handler interprets that as "redirect to /o/login with invite_expired toast"
 * — which is the safest behavior pre-Codex (no auth bypass).
 */

export type PetSpecies =
  | "dog"
  | "cat"
  | "rabbit"
  | "bird"
  | "reptile"
  | "other";

export type JoinTokenError =
  | "expired"
  | "consumed"
  | "invalid_signature"
  | "unknown_token"
  | "rate_limited";

export type JoinTokenVerifyResult =
  | {
      ok: true;
      clinicId: string;
      clinicName: string;
      phone: string;
      petId?: string;
      petName?: string;
      petSpecies?: PetSpecies;
    }
  | {
      ok: false;
      error: JoinTokenError;
      /** When `error === 'expired'` the endpoint may return a masked phone for OTP recovery. */
      maskedPhone?: string;
    };

export type VerifyJoinTokenArgs = {
  token: string;
  ipAddress: string | null;
};

// TODO(codex): replace with real verify + atomic consume.
export async function verifyAndConsumeJoinToken(
  args: VerifyJoinTokenArgs
): Promise<JoinTokenVerifyResult> {
  void args;
  return { ok: false, error: "unknown_token" };
}
