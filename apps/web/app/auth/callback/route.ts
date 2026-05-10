import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@petcura/shared";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const locale = normalizeLocale(requestUrl.searchParams.get("lang"));
  const rawNextPath = requestUrl.searchParams.get("next") ?? "/inbox";
  const nextPath =
    rawNextPath.startsWith("/") && !rawNextPath.startsWith("//")
      ? rawNextPath
      : "/inbox";
  const redirectUrl = new URL(nextPath, requestUrl.origin);

  redirectUrl.searchParams.set("lang", locale);

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(redirectUrl);
}
