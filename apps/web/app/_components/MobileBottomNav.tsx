"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, FileText, Inbox as InboxIcon, Users } from "lucide-react";
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
  const inboxActive =
    pathname.startsWith("/inbox") || pathname.startsWith("/requests");
  // /customers and /pets redirect to /directory, but during the redirect
  // hop pathname briefly matches the legacy path — treat them all as the
  // same "Directory" surface so the indicator doesn't flicker.
  const directoryHref = withLocale("/directory", locale);
  const directoryActive =
    pathname.startsWith("/directory") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/pets");
  const remindersHref = withLocale("/reminders", locale);
  const remindersActive = pathname.startsWith("/reminders");
  const reportsHref = withLocale("/reports", locale);
  const reportsActive = pathname.startsWith("/reports");

  const openMeSheet = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-me-sheet"));
  };

  // Tabs order: Inbox · Directory · Reminders · Reports · Me. Me lives at
  // the far right because it's the identity sheet, not a route.
  const TAB_COUNT = 5;
  const activeIndex = meSheetOpen
    ? 4
    : reportsActive
      ? 3
      : remindersActive
        ? 2
        : directoryActive
          ? 1
          : inboxActive
            ? 0
            : -1;

  const tabClass = (active: boolean) =>
    cn(
      "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 text-[10.5px] font-medium",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
      !prefersReducedMotion && "transition-colors duration-200",
      // Inactive label moved off --muted-2 (contrast ≈ 2.6:1, fails AA) onto
      // --muted; --muted-2 is reserved for decorative chrome per design rules.
      active
        ? "text-[var(--primary-strong)]"
        : "text-[var(--muted)] hover:text-[var(--ink)]"
    );

  // Shared label class: truncate at the parent flex width so ET strings like
  // "Meeldetuletused" (15ch, ~85px at 10.5px font) don't wrap a second line
  // and break the h-14 indicator math on 320–390px viewports.
  const labelClass = "block max-w-full truncate text-center";

  const iconAnim = (active: boolean) =>
    cn(
      "inline-flex items-center justify-center",
      !prefersReducedMotion &&
        "transition-transform duration-[280ms] [transition-timing-function:var(--ease-leitmotif)]",
      active ? "scale-110" : "scale-100"
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
      <span
        aria-hidden="true"
        data-bottom-nav-indicator
        className={cn(
          "pointer-events-none absolute bottom-1 left-2 right-2 top-1 z-0",
          activeIndex < 0 && "opacity-0"
        )}
        // Only emit transform + transition once we have a real active tab.
        // Off-nav routes (e.g. /settings, /profile) would otherwise leave a
        // stale translateX(0) that, on first re-activation, slides visibly
        // from the Inbox slot to wherever you actually landed.
        style={
          activeIndex < 0
            ? {
                // Width = (100% - (TAB_COUNT - 1) * gap) / TAB_COUNT. Gap is 4px (gap-1).
                width: `calc((100% - ${TAB_COUNT - 1} * 0.25rem) / ${TAB_COUNT})`
              }
            : {
                width: `calc((100% - ${TAB_COUNT - 1} * 0.25rem) / ${TAB_COUNT})`,
                transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
                transition: prefersReducedMotion
                  ? "none"
                  : "transform 320ms var(--ease-standard), opacity 200ms var(--ease-standard)"
              }
        }
      >
        <span className="block h-full w-full rounded-[10px] bg-[var(--primary-soft)]" />
      </span>
      <Link
        href={inboxHref}
        aria-current={inboxActive ? "page" : undefined}
        className={tabClass(inboxActive)}
      >
        <span className={iconAnim(inboxActive)}>
          <InboxIcon
            aria-hidden="true"
            size={18}
            strokeWidth={inboxActive ? 2.25 : 1.75}
          />
        </span>
        <span className={labelClass} title={t("nav.bottom.inbox")}>
          {t("nav.bottom.inbox")}
        </span>
      </Link>

      <Link
        href={directoryHref}
        aria-current={directoryActive ? "page" : undefined}
        data-bottom-nav-directory
        className={tabClass(directoryActive)}
      >
        <span className={iconAnim(directoryActive)}>
          <Users
            aria-hidden="true"
            size={18}
            strokeWidth={directoryActive ? 2.25 : 1.75}
          />
        </span>
        <span className={labelClass} title={t("nav.bottom.directory")}>
          {t("nav.bottom.directory")}
        </span>
      </Link>

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
        <span
          className={cn(
            "relative inline-flex h-[18px] w-[18px] items-center justify-center",
            !prefersReducedMotion &&
              "transition-transform duration-[280ms] [transition-timing-function:var(--ease-standard)]",
            remindersActive ? "scale-110" : "scale-100"
          )}
        >
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
        <span className={labelClass} title={t("nav.bottom.reminders")}>
          {t("nav.bottom.reminders")}
        </span>
      </Link>

      <Link
        href={reportsHref}
        aria-current={reportsActive ? "page" : undefined}
        data-bottom-nav-reports
        className={tabClass(reportsActive)}
      >
        <span className={iconAnim(reportsActive)}>
          <FileText
            aria-hidden="true"
            size={18}
            strokeWidth={reportsActive ? 2.25 : 1.75}
          />
        </span>
        <span className={labelClass} title={t("nav.bottom.reports")}>
          {t("nav.bottom.reports")}
        </span>
      </Link>

      <button
        type="button"
        onClick={openMeSheet}
        aria-label={meSheetOpen ? t("nav.bottom.closeUserMenu") : meAriaLabel}
        aria-haspopup="dialog"
        aria-expanded={meSheetOpen}
        data-bottom-nav-me
        className={tabClass(meSheetOpen)}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-[10px] font-semibold text-[var(--primary-strong)]",
            !prefersReducedMotion &&
              "transition-transform duration-[280ms] [transition-timing-function:var(--ease-standard)]",
            meSheetOpen ? "scale-110" : "scale-100"
          )}
        >
          {avatarUrl ? (
            <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
          ) : (
            meInitials || "?"
          )}
        </span>
        <span className={labelClass} title={t("nav.bottom.me")}>
          {t("nav.bottom.me")}
        </span>
      </button>
    </nav>
  );
}
