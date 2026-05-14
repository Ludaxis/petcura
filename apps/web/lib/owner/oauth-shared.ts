import type { Provider, User } from "@supabase/supabase-js";
import type { SupportedLocale } from "@petcura/shared";

export const ownerOAuthProviders = ["google"] as const;

export type OwnerOAuthProvider = Extract<Provider, "google">;

type OAuthIdentity = NonNullable<User["identities"]>[number] & {
  identity_id?: string;
};

export function parseOwnerOAuthProvider(
  value: FormDataEntryValue | string | null | undefined
): OwnerOAuthProvider | null {
  return value === "google"
    ? (value as OwnerOAuthProvider)
    : null;
}

export function getOwnerOAuthIdentityType(_provider: OwnerOAuthProvider) {
  return "oauth_google";
}

export function getOwnerOAuthScopes(_provider: OwnerOAuthProvider) {
  return "openid email profile";
}

export function sanitizeOwnerNextPath(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/o"
) {
  if (typeof value !== "string") return fallback;
  return value.startsWith("/o") && !value.startsWith("//") ? value : fallback;
}

export function normalizeOwnerOAuthEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.includes("@") ? normalized : null;
}

export function hasVerifiedOwnerOAuthEmail(
  user: {
    confirmed_at?: string | null;
    email?: string | null;
    email_confirmed_at?: string | null;
  }
) {
  return Boolean(
    normalizeOwnerOAuthEmail(user.email) &&
      (user.email_confirmed_at || user.confirmed_at)
  );
}

export function getOwnerOAuthIdentityValue(
  user: Pick<User, "id" | "identities">,
  provider: OwnerOAuthProvider
) {
  const identity = user.identities?.find(
    (candidate) => candidate.provider === provider
  ) as OAuthIdentity | undefined;
  const providerSubject = identity?.identity_id ?? identity?.id;

  return `${provider}:${providerSubject ?? user.id}`;
}

export function ownerOAuthLoginErrorPath(
  locale: SupportedLocale,
  nextPath: string,
  error: string
) {
  const params = new URLSearchParams({
    lang: locale,
    next: sanitizeOwnerNextPath(nextPath),
    error
  });

  return `/o/login?${params.toString()}`;
}
