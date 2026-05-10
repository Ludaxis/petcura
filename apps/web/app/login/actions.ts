"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

function loginRedirect(
  locale: SupportedLocale,
  nextPath: string,
  params: Record<string, string>
) {
  const searchParams = new URLSearchParams({
    lang: locale,
    next: nextPath,
    ...params
  });

  redirect(`/login?${searchParams.toString()}`);
}

export async function signInWithMagicLink(formData: FormData) {
  const locale = normalizeLocale(formData.get("lang"));
  const nextPath = String(formData.get("next") ?? "/inbox");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    loginRedirect(locale, nextPath, { error: "invalid_email" });
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const callbackUrl = new URL("/auth/callback", origin);

  callbackUrl.searchParams.set("next", nextPath);
  callbackUrl.searchParams.set("lang", locale);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString()
    }
  });

  if (error) {
    loginRedirect(locale, nextPath, { error: "login_error" });
  }

  loginRedirect(locale, nextPath, { sent: "1" });
}
