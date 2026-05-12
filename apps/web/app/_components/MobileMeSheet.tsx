"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  UserRound
} from "lucide-react";
import {
  type SupportedLocale,
  withLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import type { ThemePreference } from "./ThemeToggle";

export type MobileMeSheetLabels = {
  sheetTitle: string;
  signedInAs: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  language: string;
  profile: string;
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
  avatarUrl?: string | null | undefined;
  clinicName?: string | undefined;
  roleLabel: string;
  initials: string;
  locale: SupportedLocale;
  currentPath: string;
  initialTheme: ThemePreference;
  isSuperAdmin: boolean;
  labels: MobileMeSheetLabels;
  signOutAction: (formData: FormData) => void | Promise<void>;
};

export function MobileMeSheet({
  email,
  displayName,
  avatarUrl,
  clinicName,
  roleLabel,
  initials,
  locale,
  isSuperAdmin,
  labels,
  signOutAction
}: MobileMeSheetProps) {
  const [open, setOpen] = useState(false);

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
    const onOpen = () => handleOpenChange(true);
    window.addEventListener("petcura:open-me-sheet", onOpen as EventListener);
    return () =>
      window.removeEventListener(
        "petcura:open-me-sheet",
        onOpen as EventListener
      );
  }, [handleOpenChange]);

  const close = () => handleOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-me-sheet
        className={cn(
          "w-full gap-0 border-[var(--line)] bg-[var(--paper)] p-0 text-[var(--ink)] sm:max-w-[340px]",
          "md:hidden"
        )}
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <SheetTitle className="text-[15px] font-semibold text-[var(--ink)]">
            {labels.sheetTitle}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {labels.signedInAs} {email}
          </SheetDescription>
          <SheetClose
            aria-label={labels.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">
              ×
            </span>
          </SheetClose>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-start gap-3 border-b border-[var(--line)] px-4 py-4">
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
              <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                {displayName || email}
              </p>
              <p className="mt-0.5 truncate text-[11.5px] text-[var(--muted)]">
                {email}
              </p>
              {clinicName ? (
                <p className="mt-0.5 truncate text-[11.5px] text-[var(--muted)]">
                  {clinicName}
                </p>
              ) : null}
              <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--muted-2)]">
                {roleLabel} · {labels.signedInAs}
              </p>
            </div>
          </div>

          <ul className="flex flex-col py-1">
            <MobileLink
              href={withLocale("/profile", locale)}
              icon={<UserRound aria-hidden="true" size={16} />}
              label={labels.profile}
              onClick={close}
            />
            <MobileLink
              href={withLocale("/settings", locale)}
              icon={<Settings aria-hidden="true" size={16} />}
              label={labels.settings}
              onClick={close}
            />
            <MobileLink
              href={labels.helpHref}
              icon={<HelpCircle aria-hidden="true" size={16} />}
              label={labels.help}
              onClick={close}
            />
            {isSuperAdmin ? (
              <MobileLink
                href={withLocale("/admin", locale)}
                icon={<Shield aria-hidden="true" size={16} />}
                label={labels.admin}
                onClick={close}
              />
            ) : null}
          </ul>

          <form action={signOutAction} onSubmit={close} className="mt-auto border-t border-[var(--line)] py-1">
            <input name="lang" type="hidden" value={locale} />
            <button
              className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--red)] hover:bg-[var(--red-soft)]"
              type="submit"
            >
              <LogOut aria-hidden="true" size={16} />
              {labels.signOut}
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileLink({
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
    "flex min-h-[44px] w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)]";

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
