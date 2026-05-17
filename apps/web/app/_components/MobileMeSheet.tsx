"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Shield,
  Sun,
  UserRound,
  X
} from "lucide-react";
import { localeOptions, withLocale } from "@petcura/shared";
import { cn } from "@petcura/ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  applyThemePreference,
  persistThemePreference,
  type ThemePreference
} from "./ThemeToggle";

import type { MobileMeSheetProps } from "./MobileMeSheetTypes";

export type { MobileMeSheetLabels, MobileMeSheetProps } from "./MobileMeSheetTypes";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  icon: typeof Sun;
  labelKey: "themeLight" | "themeDark" | "themeSystem";
}> = [
  { value: "light", icon: Sun, labelKey: "themeLight" },
  { value: "dark", icon: Moon, labelKey: "themeDark" },
  { value: "system", icon: Monitor, labelKey: "themeSystem" }
];

export function MobileMeSheet({
  email,
  displayName,
  avatarUrl,
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

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("petcura:me-sheet-state", { detail: { open: next } })
      );
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      handleOpenChange(!open);
    };
    window.addEventListener("petcura:open-me-sheet", onOpen as EventListener);
    // LazyMobileMeSheet consumes the very first `petcura:open-me-sheet`
    // event itself (it has to, in order to know to fetch this chunk).
    // The wrapper stashes a flag and re-dispatches once we've mounted our
    // listener — using a queued microtask so the listener above is attached
    // before the event fires.
    const flag = window as unknown as { __pcMeSheetPending?: boolean };
    if (flag.__pcMeSheetPending) {
      flag.__pcMeSheetPending = false;
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent("petcura:open-me-sheet"));
      });
    }
    return () =>
      window.removeEventListener(
        "petcura:open-me-sheet",
        onOpen as EventListener
      );
  }, [open, handleOpenChange]);

  const close = () => handleOpenChange(false);

  const handleThemeChange = (next: ThemePreference) => {
    setTheme(next);
    persistThemePreference(next);
    applyThemePreference(next);
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
          "flex w-full flex-col gap-0 border-[var(--line)] bg-[var(--paper)] p-0 text-[var(--ink)] sm:max-w-[340px]",
          "md:hidden"
        )}
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <SheetTitle className="text-[15px] font-semibold text-[var(--ink)]">
            {labels.sheetTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {labels.signedInAs} {email}
          </SheetDescription>
          <SheetClose
            aria-label={labels.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <X aria-hidden="true" size={18} />
          </SheetClose>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-start gap-3 px-4 py-4">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-[12px] font-semibold text-[var(--primary-strong)]"
            >
              {avatarUrl ? (
                <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
              ) : (
                initials || "?"
              )}
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

          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--muted-2)]">
              {labels.theme}
            </p>
            <div
              role="radiogroup"
              aria-label={labels.theme}
              className="grid grid-cols-3 gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)] p-1"
            >
              {THEME_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                const selected = theme === option.value;
                const optionLabel = labels[option.labelKey];
                // Roving tabindex: only the selected radio (or the first
                // when none selected) participates in the tab sequence;
                // arrow keys move focus between siblings within the group.
                const focusable = selected || (!THEME_OPTIONS.some((o) => theme === o.value) && index === 0);
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={optionLabel}
                    tabIndex={focusable ? 0 : -1}
                    onClick={() => handleThemeChange(option.value)}
                    onKeyDown={(event) => {
                      const key = event.key;
                      if (
                        key !== "ArrowRight" &&
                        key !== "ArrowLeft" &&
                        key !== "ArrowDown" &&
                        key !== "ArrowUp"
                      ) {
                        return;
                      }
                      event.preventDefault();
                      const direction =
                        key === "ArrowRight" || key === "ArrowDown" ? 1 : -1;
                      const nextIndex =
                        (index + direction + THEME_OPTIONS.length) %
                        THEME_OPTIONS.length;
                      const next = THEME_OPTIONS[nextIndex];
                      if (!next) return;
                      handleThemeChange(next.value);
                      const group = event.currentTarget.parentElement;
                      const targets =
                        group?.querySelectorAll<HTMLButtonElement>("[role='radio']");
                      targets?.[nextIndex]?.focus();
                    }}
                    className={cn(
                      "inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-[6px] px-2 text-[11.5px] font-medium transition",
                      selected
                        ? "bg-[var(--paper)] text-[var(--ink)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--ink)]"
                    )}
                  >
                    <Icon aria-hidden="true" size={14} />
                    <span>{optionLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

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
                    onClick={close}
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

          <ul className="flex flex-col py-1">
            <SheetLink
              href={withLocale("/profile", locale)}
              icon={<UserRound aria-hidden="true" size={16} />}
              label={labels.profile}
              onClick={close}
            />
            <SheetLink
              href={withLocale("/settings", locale)}
              icon={<Settings aria-hidden="true" size={16} />}
              label={labels.settings}
              onClick={close}
            />
            <SheetLink
              href={labels.helpHref}
              icon={<LifeBuoy aria-hidden="true" size={16} />}
              label={labels.help}
              onClick={close}
            />
            {isSuperAdmin ? (
              <SheetLink
                href={withLocale("/admin", locale)}
                icon={<Shield aria-hidden="true" size={16} />}
                label={labels.admin}
                onClick={close}
              />
            ) : null}
          </ul>

          <div className="h-px bg-[var(--line)]" role="separator" />

          <form action={signOutAction} onSubmit={close} className="px-0 py-1">
            <input name="lang" type="hidden" value={locale} />
            <button
              type="submit"
              data-me-sheet-signout
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--red)] transition hover:bg-[var(--red-soft)] focus-visible:bg-[var(--red-soft)] focus-visible:outline-none"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <LogOut aria-hidden="true" size={16} />
              </span>
              <span className="flex-1">{labels.signOut}</span>
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SheetLink({
  href,
  icon,
  label,
  onClick
}: {
  href: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const external = /^mailto:|^https?:/i.test(href);
  const className =
    "flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)] focus-visible:bg-[var(--soft)] focus-visible:outline-none";

  if (external) {
    return (
      <li>
        <a className={className} href={href} onClick={onClick}>
          <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
            {icon}
          </span>
          <span className="flex-1">{label}</span>
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link className={className} href={href} onClick={onClick}>
        <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
      </Link>
    </li>
  );
}
