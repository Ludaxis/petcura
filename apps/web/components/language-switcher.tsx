import Link from "next/link";
import { Languages } from "lucide-react";
import {
  localeOptions,
  type SupportedLocale,
  withLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";

type LanguageSwitcherProps = {
  currentPath: string;
  label: string;
  locale: SupportedLocale;
};

export function LanguageSwitcher({
  currentPath,
  label,
  locale
}: LanguageSwitcherProps) {
  return (
    <nav
      aria-label={label}
      className="flex items-center gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-white p-1"
    >
      <span className="flex h-8 w-8 items-center justify-center text-[var(--muted)]">
        <Languages aria-hidden="true" size={15} />
      </span>
      {localeOptions.map((option) => (
        <Link
          aria-current={option.value === locale ? "page" : undefined}
          className={cn(
            "flex h-8 min-w-9 items-center justify-center rounded-[var(--radius)] px-2 text-xs font-semibold transition",
            option.value === locale
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          )}
          href={withLocale(currentPath, option.value)}
          key={option.value}
          title={option.label}
        >
          {option.shortLabel}
        </Link>
      ))}
    </nav>
  );
}
