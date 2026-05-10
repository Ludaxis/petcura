"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

function getAuthErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "login_error";
  }

  const authError = error as {
    code?: string;
    message?: string;
    status?: number;
  };
  const message = authError.message?.toLowerCase() ?? "";

  if (
    authError.status === 429 ||
    authError.code === "over_email_send_rate_limit" ||
    message.includes("rate limit")
  ) {
    return "rate_limited";
  }

  if (
    authError.code === "email_address_not_authorized" ||
    message.includes("not authorized")
  ) {
    return "email_not_authorized";
  }

  return "login_error";
}

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
    loginRedirect(locale, nextPath, { error: getAuthErrorCode(error) });
  }

  loginRedirect(locale, nextPath, { sent: "1" });
}
