"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, Inbox as InboxIcon } from "lucide-react";
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
  const remindersHref = withLocale("/reminders", locale);
  const remindersActive = pathname.startsWith("/reminders");

  const openMeSheet = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-me-sheet"));
  };

  const TAB_COUNT = 3;
  const activeIndex = meSheetOpen
    ? 2
    : remindersActive
      ? 1
      : inboxActive
        ? 0
        : -1;

  const tabClass = (active: boolean) =>
    cn(
      "relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 text-[10.5px] font-medium",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
      !prefersReducedMotion && "transition-colors duration-200",
      active
        ? "text-[var(--primary-strong)]"
        : "text-[var(--muted-2)] hover:text-[var(--ink)]"
    );

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
        style={{
          // Width = (100% - (TAB_COUNT - 1) * gap) / TAB_COUNT. Gap is 4px (gap-1).
          width: `calc((100% - ${TAB_COUNT - 1} * 0.25rem) / ${TAB_COUNT})`,
          transform: `translateX(calc(${Math.max(activeIndex, 0)} * (100% + 0.25rem)))`,
          transition: prefersReducedMotion
            ? "none"
            : "transform 320ms var(--ease-leitmotif), opacity 200ms var(--ease-standard)"
        }}
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
        <span>{t("nav.bottom.inbox")}</span>
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
              "transition-transform duration-[280ms] [transition-timing-function:var(--ease-leitmotif)]",
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
          className={cn(
            "flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-soft)] text-[10px] font-semibold text-[var(--primary-strong)]",
            !prefersReducedMotion &&
              "transition-transform duration-[280ms] [transition-timing-function:var(--ease-leitmotif)]",
            meSheetOpen ? "scale-110" : "scale-100"
          )}
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
