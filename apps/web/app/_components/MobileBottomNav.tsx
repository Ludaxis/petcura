"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Inbox as InboxIcon, Search } from "lucide-react";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";

type MobileBottomNavProps = {
  locale: SupportedLocale;
  meInitials: string;
  avatarUrl?: string | null | undefined;
  meAriaLabel: string;
  reminderCount: number;
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(reducedMotionQuery).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function MobileBottomNav({
  locale,
  meInitials,
  avatarUrl,
  meAriaLabel,
  reminderCount
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";
  const t = createTranslator(locale);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const [meSheetOpen, setMeSheetOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      if (typeof detail?.open === "boolean") {
        setMeSheetOpen(detail.open);
      }
    };
    window.addEventListener(
      "petcura:me-sheet-state",
      onState as EventListener
    );
    return () =>
      window.removeEventListener(
        "petcura:me-sheet-state",
        onState as EventListener
      );
  }, []);

  const inboxHref = withLocale("/inbox", locale);
  const inboxActive = pathname.startsWith("/inbox");
  const remindersHref = withLocale("/reminders", locale);
  const remindersActive = pathname.startsWith("/reminders");

  const openCommandPalette = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-cmdk"));
  };

  const openMeSheet = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-me-sheet"));
  };

  const tabClass = (active: boolean) =>
    cn(
      "relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 text-[10.5px] font-medium",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
      !prefersReducedMotion && "transition-colors",
      active
        ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
        : "text-[var(--muted-2)] hover:text-[var(--ink)]"
    );

  return (
    <nav
      role="navigation"
      aria-label={t("nav.bottom.label")}
      data-mobile-bottom-nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch gap-1 border-t border-[var(--line)] bg-[var(--paper)] px-2 pb-[max(env(safe-area-inset-bottom),0px)] pt-1",
        "md:hidden"
      )}
    >
      <Link
        href={inboxHref}
        aria-current={inboxActive ? "page" : undefined}
        className={tabClass(inboxActive)}
      >
        <InboxIcon
          aria-hidden="true"
          size={18}
          strokeWidth={inboxActive ? 2.25 : 1.75}
        />
        <span>{t("nav.bottom.inbox")}</span>
      </Link>

      <button
        type="button"
        onClick={openCommandPalette}
        aria-label={t("nav.bottom.search")}
        className={tabClass(false)}
      >
        <Search aria-hidden="true" size={18} strokeWidth={1.75} />
        <span>{t("nav.bottom.search")}</span>
      </button>

      <Link
        href={remindersHref}
        aria-current={remindersActive ? "page" : undefined}
        aria-label={
          reminderCount > 0
            ? `${t("nav.bottom.reminders")} (${reminderCount})`
            : t("nav.bottom.reminders")
        }
        data-bottom-nav-reminders
        className={tabClass(remindersActive)}
      >
        <span className="relative inline-flex h-[18px] w-[18px] items-center justify-center">
          <Bell
            aria-hidden="true"
            size={18}
            strokeWidth={remindersActive ? 2.25 : 1.75}
          />
          {reminderCount > 0 ? (
            <span
              aria-hidden="true"
              data-bottom-nav-reminders-dot
              className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[var(--primary)] ring-2 ring-[var(--paper)]"
            />
          ) : null}
        </span>
        <span>{t("nav.bottom.reminders")}</span>
      </Link>

      <button
        type="button"
        onClick={openMeSheet}
        aria-label={meAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={meSheetOpen}
        data-bottom-nav-me
        className={tabClass(meSheetOpen)}
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-[10px] font-semibold text-[var(--primary-strong)]"
        >
          {avatarUrl ? (
            <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
          ) : (
            meInitials || "?"
          )}
        </span>
        <span>{t("nav.bottom.me")}</span>
      </button>
    </nav>
  );
}
