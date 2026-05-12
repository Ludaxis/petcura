import type { SupportedLocale } from "@petcura/shared";
import type { VaccineUrgency } from "./types";

const ONE_DAY = 24 * 60 * 60 * 1000;

export function petAgeLabel(
  birthDate: string | null,
  locale: SupportedLocale,
  now: Date = new Date()
): string | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return null;
  const months =
    (now.getFullYear() - born.getFullYear()) * 12 +
    (now.getMonth() - born.getMonth());
  if (months < 12) {
    return formatMonths(months, locale);
  }
  const years = Math.floor(months / 12);
  return formatYears(years, locale);
}

function formatYears(n: number, locale: SupportedLocale) {
  if (locale === "et") return `${n} a`;
  if (locale === "ru") {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} год`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
      return `${n} года`;
    return `${n} лет`;
  }
  return n === 1 ? `1 yr` : `${n} yr`;
}

function formatMonths(n: number, locale: SupportedLocale) {
  if (locale === "et") return `${n} kuud`;
  if (locale === "ru") return `${n} мес`;
  return `${n} mo`;
}

export function vaccineUrgency(
  nextDueAt: string | null,
  now: Date = new Date()
): VaccineUrgency {
  if (!nextDueAt) return "no_due";
  const due = new Date(nextDueAt).getTime();
  const delta = due - now.getTime();
  if (delta < 0) return "overdue";
  if (delta <= 30 * ONE_DAY) return "due_soon";
  return "ok";
}

export function aggregateVaccineUrgency(
  urgencies: VaccineUrgency[]
): VaccineUrgency {
  if (urgencies.includes("overdue")) return "overdue";
  if (urgencies.includes("due_soon")) return "due_soon";
  if (urgencies.length === 0 || urgencies.every((u) => u === "no_due"))
    return "no_due";
  return "ok";
}

export function formatDate(
  iso: string,
  locale: SupportedLocale,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
): string {
  const map: Record<SupportedLocale, string> = {
    en: "en-GB",
    et: "et-EE",
    ru: "ru-RU"
  };
  return new Intl.DateTimeFormat(map[locale], opts).format(new Date(iso));
}

export function formatRelative(
  iso: string,
  locale: SupportedLocale,
  now: Date = new Date()
): string {
  const target = new Date(iso).getTime();
  const diff = target - now.getTime();
  const absDays = Math.round(Math.abs(diff) / ONE_DAY);
  const rtf = new Intl.RelativeTimeFormat(
    locale === "et" ? "et" : locale === "ru" ? "ru" : "en",
    { numeric: "auto" }
  );
  if (absDays === 0) {
    const hours = Math.round(Math.abs(diff) / (60 * 60 * 1000));
    return rtf.format(diff < 0 ? -hours : hours, "hour");
  }
  return rtf.format(diff < 0 ? -absDays : absDays, "day");
}

export function formatPrice(
  priceCents: number | null,
  currency: string,
  locale: SupportedLocale
): string | null {
  if (priceCents === null) return null;
  const map: Record<SupportedLocale, string> = {
    en: "en-GB",
    et: "et-EE",
    ru: "ru-RU"
  };
  return new Intl.NumberFormat(map[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(priceCents / 100);
}
