import "server-only";

import { cookies } from "next/headers";

export const THEME_COOKIE = "petcura-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export async function getThemePreference(): Promise<ThemePreference> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isThemePreference(value) ? value : "system";
}

/**
 * Returns the theme to apply on the server before paint.
 *
 * For "system" we default to light because we cannot read
 * `prefers-color-scheme` on the server. The client-side bootstrap
 * script adjusts after hydration only when needed.
 */
export async function getResolvedThemeForSSR(): Promise<ResolvedTheme> {
  const pref = await getThemePreference();
  if (pref === "dark") return "dark";
  return "light";
}
