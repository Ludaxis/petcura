"use client";

/* eslint-disable @next/next/no-img-element -- Profile avatars use short-lived signed Supabase Storage URLs. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Inbox as InboxIcon, Search } from "lucide-react";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";

type MobileBottomNavProps = {
  locale: SupportedLocale;
  /** Initials shown inside the "Me" avatar circle. Server-derived so the
   *  first paint is identical to the sidebar identity card. */
  meInitials: string;
  avatarUrl?: string | null | undefined;
  /** aria-label for the Me tab — falls back to a generic account label.
   *  Reuses the existing menu.ariaLabel so the AT story matches the
   *  sidebar identity card popover. */
  meAriaLabel: string;
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

/**
 * Persistent mobile bottom navigation — three tabs only.
 *
 *   Inbox  · routes to /inbox
 *   Search · dispatches the petcura:open-cmdk window event used by the
 *            sidebar Search row and ⌘K on desktop; the CommandPalette
 *            mounts on /inbox so this is the primary mobile entry point
 *   Me     · dispatches petcura:open-me-sheet so the mobile account sheet
 *            opens without forcing users through the sidebar drawer.
 *
 * Visible only below `md` (≥768px the persistent sidebar handles all of
 * this). Inset is paired with `pb-16` on the main content surface so rows
 * are never covered by the nav bar.
 *
 * Decision: we KEEP the SidebarTrigger in the mobile header. The bottom
 * nav covers the three highest-traffic destinations (Inbox/Search/Me) but
 * the sidebar drawer still owns Reminders / Reports / Settings / Admin.
 * Removing the trigger would orphan those routes on mobile and break the
 * existing sidebar-mobile spec (which depends on the trigger being present
 * on /reports, where the bottom nav isn't enough on its own).
 */
export function MobileBottomNav({
  locale,
  meInitials,
  avatarUrl,
  meAriaLabel
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";
  const t = createTranslator(locale);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  const inboxHref = withLocale("/inbox", locale);
  const inboxActive = pathname.startsWith("/inbox");

  const openCommandPalette = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-cmdk"));
  };

  const openUserMenu = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-me-sheet"));
  };

  // Shared tab classes. Pill background renders only on active so taps
  // feel discrete; transition is suppressed under reduced-motion to avoid
  // the colour fade entirely.
  const tabClass = (active: boolean) =>
    cn(
      "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[10px] px-2 text-[10.5px] font-medium",
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

      <button
        type="button"
        onClick={openUserMenu}
        aria-label={meAriaLabel}
        className={tabClass(false)}
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
