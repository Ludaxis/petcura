import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isThemePreference, THEME_COOKIE } from "@/lib/theme";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const theme = (payload as { theme?: unknown } | null)?.theme;

  if (!isThemePreference(theme)) {
    return NextResponse.json({ error: "invalid_theme" }, { status: 400 });
  }

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    httpOnly: false
  });

  return new NextResponse(null, { status: 204 });
}
