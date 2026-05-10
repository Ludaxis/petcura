import "server-only";

import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupportedLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

export type SuperAdminContext = {
  user: User;
  email: string;
};

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
