// Server component. Shared split-pane shell for /login and /o/login.
// Motion: CSS-only fade-up on mount via .pc-auth-mount; the right-hand
// BrandPane is `aria-hidden` decoration.

import type { ReactNode } from "react";
import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { LanguageSwitcher } from "@/components/language-switcher";
import { BrandPane, type BrandPaneQuote } from "./BrandPane";

type AuthShellProps = {
  variant: "clinic" | "owner";
  locale: SupportedLocale;
  /** Visible above the H1. Localized. */
  eyebrow: string;
  /** Brand pane quotes — already localized. */
  quotes: readonly BrandPaneQuote[];
  /** Path used by LanguageSwitcher to preserve params. */
  currentPath: string;
  /** Label for the language switcher (localized). */
  languageLabel: string;
  /** Footer copy (terms / privacy line). */
  footer?: ReactNode;
  children: ReactNode;
};

export function AuthShell({
  variant,
  locale,
  eyebrow,
  quotes,
  currentPath,
  languageLabel,
  footer,
  children
}: AuthShellProps) {
  return (
    <div
      data-auth-variant={variant}
      className={cn(
        "min-h-dvh bg-[var(--paper)] text-[var(--ink)]",
        "grid grid-rows-[auto_auto_1fr_auto] md:grid-cols-[1.25fr_1fr] md:grid-rows-[auto_1fr_auto]"
      )}
    >
      <header
        className={cn(
          "z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6",
          "md:col-span-2"
        )}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-[var(--paper)]"
          >
            <PawPrint size={19} weight="fill" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-[var(--ink)]">
            PetCura
          </span>
        </div>
        <LanguageSwitcher
          currentPath={currentPath}
          label={languageLabel}
          locale={locale}
        />
      </header>

      {/* mobile-only brand strip — sits above the form */}
      <div className="md:hidden">
        <BrandPane variant={variant} quotes={quotes} />
      </div>

      <main
        id="auth-main"
        className={cn(
          "flex items-start justify-center px-4 py-8 sm:px-6 sm:py-10",
          "md:col-start-1 md:row-start-2"
        )}
      >
        <section
          aria-labelledby="auth-heading"
          className={cn(
            "pc-auth-mount flex w-full max-w-[440px] flex-col gap-6",
            "rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6 md:border-0 md:p-0 md:shadow-none"
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {eyebrow}
          </p>
          {children}
        </section>
      </main>

      {/* desktop brand pane on the right */}
      <div className="hidden md:col-start-2 md:row-start-2 md:block">
        <BrandPane variant={variant} quotes={quotes} />
      </div>

      <footer
        className={cn(
          "border-t border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-xs text-[var(--muted)] sm:px-6",
          "md:col-span-2"
        )}
      >
        {footer ?? (
          <p>
            EU residency &middot;{" "}
            <a
              href="/privacy"
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Privacy
            </a>{" "}
            &middot;{" "}
            <a
              href="/terms"
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              Terms
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}
