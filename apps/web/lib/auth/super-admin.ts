import "server-only";

import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupportedLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

export type SuperAdminContext = {
  user: User;
  email: string;
};

/**
 * Soft result used by /admin so authenticated visitors without super-admin
 * privilege see a permissions-specific 403 view instead of the generic
 * notFound() that `requireSuperAdminContext` throws. Unauthenticated
 * visitors still redirect to /login as before.
 */
export type SuperAdminResult =
  | { kind: "authorized"; context: SuperAdminContext }
  | { kind: "forbidden"; user: User };

function getConfiguredSuperAdminEmails() {
  const configured =
    process.env.PETCURA_SUPER_ADMIN_EMAILS ??
    process.env.PETCURA_BOOTSTRAP_STAFF_EMAILS ??
    "";

  return configured
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function loginPath(locale: SupportedLocale, nextPath: string) {
  const params = new URLSearchParams({
    lang: locale,
    next: nextPath
  });

  return `/login?${params.toString()}`;
}

export function isSuperAdminEmail(email: string | undefined | null) {
  if (!email) {
    return false;
  }

  return getConfiguredSuperAdminEmails().includes(email.toLowerCase());
}

export async function requireSuperAdminContext(
  locale: SupportedLocale,
  nextPath = "/admin"
): Promise<SuperAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(loginPath(locale, nextPath));
  }

  const email = user.email?.toLowerCase();

  if (!isSuperAdminEmail(email)) {
    notFound();
  }

  return {
    user,
    email: email!
  };
}

/**
 * Soft variant of {@link requireSuperAdminContext}. Redirects unauthenticated
 * visitors to /login (unchanged), but for authenticated visitors who lack
 * super-admin privilege it returns `{ kind: "forbidden", user }` instead of
 * throwing notFound(). The caller (currently /admin) renders a permissions-
 * specific 403 card so users can tell "this page is locked to me" apart from
 * "this page does not exist".
 */
export async function getSuperAdminResult(
  locale: SupportedLocale,
  nextPath = "/admin"
): Promise<SuperAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(loginPath(locale, nextPath));
  }

  const email = user.email?.toLowerCase();
  if (!isSuperAdminEmail(email)) {
    return { kind: "forbidden", user };
  }

  return {
    kind: "authorized",
    context: {
      user,
      email: email!
    }
  };
}
