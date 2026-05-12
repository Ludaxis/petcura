"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, LogOut, Monitor, Moon, Settings, Shield, Sun } from "lucide-react";
import {
  localeOptions,
  type SupportedLocale,
  withLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  applyThemePreference,
  persistThemePreference,
  type ThemePreference
} from "./ThemeToggle";

export type MobileMeSheetLabels = {
  sheetTitle: string;
  signedInAs: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  language: string;
  settings: string;
  admin: string;
  help: string;
  helpHref: string;
  signOut: string;
  close: string;
};

type MobileMeSheetProps = {
  email: string;
  displayName?: string | undefined;
  clinicName?: string | undefined;
  roleLabel: string;
  initials: string;
  locale: SupportedLocale;
  currentPath: string;
  initialTheme: ThemePreference;
  isSuperAdmin: boolean;
  labels: MobileMeSheetLabels;
  /** Server action for signing out. Posts a hidden `lang` field. */
  signOutAction: (formData: FormData) => void | Promise<void>;
};

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  icon: typeof Sun;
  labelKey: "themeLight" | "themeDark" | "themeSystem";
}> = [
  { value: "light", icon: Sun, labelKey: "themeLight" },
  { value: "dark", icon: Moon, labelKey: "themeDark" },
  { value: "system", icon: Monitor, labelKey: "themeSystem" }
];

/**
 * Account sheet surfaced from the mobile bottom nav's "Me" tab.
 *
 * Inspired by the Claude mobile pattern: a flat list with theme +
 * language as inline segmented controls (no submenus). The sheet listens
 * for `petcura:open-me-sheet` from MobileBottomNav and broadcasts its own
 * open state back through `petcura:me-sheet-state` so the tab's
 * `aria-expanded` mirrors reality even when the sheet is dismissed via
 * Esc or outside-click.
 *
 * Radix Dialog (Sheet) primitive handles focus trap, Escape, click-outside
 * and `aria-modal="true"`. The sheet animations respect
 * `prefers-reduced-motion` via shadcn's `data-open`/`data-closed` classes.
 *
 * Only rendered on mobile (`md:hidden`).
 */
export function MobileMeSheet({
  email,
  displayName,
  clinicName,
  roleLabel,
  initials,
  locale,
  currentPath,
  initialTheme,
  isSuperAdmin,
  labels,
  signOutAction
}: MobileMeSheetProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);

  // Broadcast every open-state transition so the bottom-nav Me tab can
  // mirror `aria-expanded` even on Esc / outside-click closures.
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("petcura:me-sheet-state", { detail: { open: next } })
      );
    }
  }, []);

  // Bridge: MobileBottomNav dispatches `petcura:open-me-sheet`. Toggle so
  // a second tap on the Me tab dismisses the sheet.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      handleOpenChange(!open);
    };
    window.addEventListener("petcura:open-me-sheet", onOpen as EventListener);
    return () =>
      window.removeEventListener(
        "petcura:open-me-sheet",
        onOpen as EventListener
      );
  }, [open, handleOpenChange]);

  const handleThemeChange = (next: ThemePreference) => {
    setTheme(next);
    persistThemePreference(next);
    applyThemePreference(next);
    // Mirror the legacy UserMenu: persist via cookie + API so SSR reflects
    // the new theme on the next nav. We don't await — visual change is
    // instant via applyThemePreference and the cookie write is best-effort.
    if (typeof window !== "undefined") {
      void fetch("/api/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: next })
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-me-sheet
        className={cn(
          "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]",
          "w-full sm:max-w-[320px]",
          "flex flex-col gap-0 p-0 md:hidden"
        )}
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <SheetTitle className="text-[15px] font-semibold text-[var(--ink)]">
            {labels.sheetTitle}
          </SheetTitle>
          <SheetClose
            aria-label={labels.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">
              ×
            </span>
          </SheetClose>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {/* Identity row */}
          <div className="flex items-start gap-3 px-4 py-4">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[12px] font-semibold text-[var(--primary-strong)]"
            >
              {initials || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-semibold text-[var(--ink)]"
                title={displayName ?? email}
              >
                {displayName || email}
              </p>
              <p
                className="mt-0.5 truncate text-[11.5px] text-[var(--muted)]"
                title={email}
              >
                {email}
              </p>
              {clinicName ? (
                <p className="mt-0.5 truncate text-[11.5px] text-[var(--muted)]">
                  {clinicName}
                </p>
              ) : null}
              <p
                className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted-2)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {roleLabel} · {labels.signedInAs}
              </p>
            </div>
          </div>

          <div className="h-px bg-[var(--line)]" role="separator" />

          {/* Theme row */}
          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]">
              {labels.theme}
            </p>
            <div
              role="radiogroup"
              aria-label={labels.theme}
              className="grid grid-cols-3 gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-1"
            >
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = theme === opt.value;
                const optLabel = labels[opt.labelKey];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={optLabel}
                    onClick={() => handleThemeChange(opt.value)}
                    className={cn(
                      "inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-medium transition",
                      selected
                        ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    <Icon aria-hidden="true" size={14} />
                    <span>{optLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language row */}
          <div className="px-4 pb-3">
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]">
              {labels.language}
            </p>
            <nav
              aria-label={labels.language}
              className="grid grid-cols-3 gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-1"
            >
              {localeOptions.map((option) => {
                const selected = option.value === locale;
                const href = withLocale(currentPath, option.value);
                return (
                  <Link
                    key={option.value}
                    href={href}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => handleOpenChange(false)}
                    className={cn(
                      "inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-semibold transition",
                      selected
                        ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    <span
                      className="font-mono text-[10.5px]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {option.shortLabel}
                    </span>
                    <span>{option.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="h-px bg-[var(--line)]" role="separator" />

          {/* Settings / Help / Admin rows */}
          <ul className="flex flex-col py-1">
            <li>
              <Link
                href={withLocale("/settings", locale)}
                onClick={() => handleOpenChange(false)}
                className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none"
              >
                <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
                  <Settings size={16} aria-hidden="true" />
                </span>
                <span className="flex-1">{labels.settings}</span>
              </Link>
            </li>
            <li>
              <a
                href={labels.helpHref}
                onClick={() => handleOpenChange(false)}
                className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none"
              >
                <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
                  <LifeBuoy size={16} aria-hidden="true" />
                </span>
                <span className="flex-1">{labels.help}</span>
              </a>
            </li>
            {isSuperAdmin ? (
              <li>
                <Link
                  href={withLocale("/admin", locale)}
                  onClick={() => handleOpenChange(false)}
                  data-me-sheet-admin
                  className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none"
                >
                  <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
                    <Shield size={16} aria-hidden="true" />
                  </span>
                  <span className="flex-1">{labels.admin}</span>
                </Link>
              </li>
            ) : null}
          </ul>

          <div className="h-px bg-[var(--line)]" role="separator" />

          {/* Sign out row */}
          <form
            action={signOutAction}
            onSubmit={() => handleOpenChange(false)}
            className="px-0 py-1"
          >
            <input type="hidden" name="lang" value={locale} />
            <button
              type="submit"
              data-me-sheet-signout
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--red)] transition hover:bg-[var(--red-soft)] focus-visible:bg-[var(--red-soft)] focus-visible:outline-none"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <LogOut size={16} aria-hidden="true" />
              </span>
              <span className="flex-1">{labels.signOut}</span>
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
