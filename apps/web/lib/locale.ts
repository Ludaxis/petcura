import { headers } from "next/headers";
import { normalizeLocale, type SupportedLocale } from "@petcura/shared";

export async function getRequestLocale(
  explicitLocale?: string | string[]
): Promise<SupportedLocale> {
  const headerStore = await headers();

  return normalizeLocale(
    explicitLocale ??
      headerStore.get("x-petcura-locale") ??
      headerStore.get("accept-language")
  );
}
