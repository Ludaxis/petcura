"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@petcura/ui";
import {
  createTranslator,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserMenu, type UserMenuLabels } from "./UserMenu";
import type { ThemePreference } from "./ThemeToggle";
import {
  SIDEBAR_NAV,
  type NavBadgeTone,
  type NavCounts,
  type NavItem,
  activeStreamId
} from "@/lib/nav/sidebar-nav";
import type { InboxStream } from "@/lib/inbox/queries";

export type AppSidebarLabels = {
  sectionInbox: string;
  searchLabel: string;
  searchHint: string;
  navAria: string;
  userMenu: UserMenuLabels;
};

export type AppSidebarProps = {
  locale: SupportedLocale;
  email: string;
  displayName?: string;
  roleLabel?: string;
  clinicName: string;
  clinicInitials: string;
  currentPath: string;
  initialTheme: ThemePreference;
  counts: NavCounts;
  inboxStream: InboxStream;
  signOutAction: (formData: FormData) => void | Promise<void>;
  labels: AppSidebarLabels;
};

const TONE_CLASSES: Record<NavBadgeTone, string> = {
  neutral: "bg-[var(--soft)] text-[var(--muted-2)]",
  primary: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]"
};

function CountBadge({
  value,
  tone,
  active
}: {
  value: number;
  tone?: NavBadgeTone | undefined;
  active?: boolean | undefined;
}) {
  const resolvedTone: NavBadgeTone = tone ?? "neutral";
  if (!value) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] tabular-nums",
        active
          ? "bg-[var(--primary)] text-[var(--paper)]"
          : TONE_CLASSES[resolvedTone]
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

/**
 * Resolves a NavItem's locale-aware href. Inbox sub-items use bare
 * `/inbox?stream=foo` — we layer the active `lang` query so a switch from
 * EN to ET doesn't drop the language preference on navigation.
 */
function localizedHref(href: string, locale: SupportedLocale) {
  if (href.startsWith("#")) return href;
  return withLocale(href, locale);
}

/**
 * "Active" matching:
 *   /inbox top-level → active when pathname is /inbox AND no stream filter.
 *   /inbox?stream=X  → matched against the resolved activeStreamId().
 *   Other routes    → simple pathname prefix match.
 */
function useActiveResolver(inboxStream: InboxStream) {
  const pathname = usePathname() ?? "/";
  const activeChildId = activeStreamId(inboxStream);

  return (item: NavItem, parent?: NavItem) => {
    if (item.id === "search") return false;
    // Inbox sub-items: compare against the active stream id from search params.
    if (parent?.id === "inbox") {
      return pathname.startsWith("/inbox") && item.id === activeChildId;
    }
    if (item.id === "inbox") {
      // Don't double-highlight: when a sub-stream is active, the child carries
      // the pill alone. The parent reads as "expanded section header" via the
      // muted children below it, no fill of its own.
      return false;
    }
    // Coming-soon stub routes and future top-level pages.
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };
}

/**
 * Bridge for the sidebar Search row. The /inbox CommandPalette listens for a
 * `petcura:open-cmdk` window event, so non-inbox routes can degrade
 * gracefully (the event is ignored when the palette isn't mounted).
 */
function openCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("petcura:open-cmdk"));
}

export function AppSidebar({
  locale,
  email,
  displayName,
  roleLabel,
  clinicName,
  clinicInitials,
  currentPath,
  initialTheme,
  counts,
  inboxStream,
  signOutAction,
  labels
}: AppSidebarProps) {
  const navRef = useRef<HTMLElement>(null);
  const isActive = useActiveResolver(inboxStream);
  const t = useMemo(() => createTranslator(locale), [locale]);

  const initials = useMemo(() => {
    const source = (displayName || email).trim();
    const parts = source.split(/[\s.@_-]+/).filter(Boolean).slice(0, 2);
    const joined = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
    return joined || "?";
  }, [displayName, email]);

  const friendlyName = useMemo(() => {
    if (displayName && displayName.trim()) return displayName.trim();
    const local = email.split("@")[0] ?? email;
    return local.replace(/[._-]+/g, " ");
  }, [displayName, email]);

  // Roving-tabindex: keep one focusable button at a time so arrow keys can
  // walk the nav without polluting the page tab order. We let users Tab once
  // to reach the nav, then Up/Down to move within it.
  const onNavKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const buttons = Array.from(
      navRef.current?.querySelectorAll<HTMLElement>(
        '[data-nav-button="true"]'
      ) ?? []
    );
    if (buttons.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = current ? buttons.indexOf(current) : -1;
    event.preventDefault();
    const dir = event.key === "ArrowDown" ? 1 : -1;
    const nextIdx =
      idx === -1
        ? 0
        : (idx + dir + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
  };

  const renderCount = (item: NavItem, active: boolean) => {
    if (!item.countSource) return null;
    const value = counts[item.countSource] ?? 0;
    return <CountBadge value={value} tone={item.badgeTone} active={active} />;
  };

  const renderTopLevel = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item);

    if (item.id === "search") {
      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            data-nav-button="true"
            onClick={openCommandPalette}
            tooltip={labels.searchLabel}
            aria-label={labels.searchLabel}
            className="text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
          >
            {Icon ? <Icon aria-hidden="true" /> : null}
            <span className="text-[13px]">{labels.searchLabel}</span>
            <kbd
              aria-hidden="true"
              className="ml-auto inline-flex h-5 items-center rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 font-mono text-[10px] text-[var(--muted)]"
            >
              {item.keyboardHint ?? labels.searchHint}
            </kbd>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    const childrenJsx = item.children?.length ? (
      <SidebarMenuSub>
        {item.children.map((child) => {
          const childActive = isActive(child, item);
          const childCount = child.countSource
            ? counts[child.countSource] ?? 0
            : 0;
          return (
            <SidebarMenuSubItem key={child.id}>
              <SidebarMenuSubButton
                asChild
                isActive={childActive}
                className={cn(
                  "text-[12.5px]",
                  childActive
                    ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                )}
              >
                <Link
                  data-nav-button="true"
                  href={localizedHref(child.href, locale)}
                  aria-current={childActive ? "page" : undefined}
                >
                  <span className="truncate">
                    {t(child.labelKey)}
                  </span>
                  {child.countSource ? (
                    <CountBadge
                      value={childCount}
                      tone={child.badgeTone}
                      active={childActive}
                    />
                  ) : null}
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
    ) : null;

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={t(item.labelKey)}
          className={cn(
            "font-medium",
            active
              ? "text-[var(--ink)]"
              : "text-[var(--ink-2)] hover:bg-[var(--soft)]"
          )}
        >
          <Link
            data-nav-button="true"
            href={localizedHref(item.href, locale)}
            aria-current={
              active && !item.children?.length ? "page" : undefined
            }
          >
            {Icon ? <Icon aria-hidden="true" /> : null}
            <span className="text-[13px]">
              {t(item.labelKey)}
            </span>
            {renderCount(item, active)}
          </Link>
        </SidebarMenuButton>
        {childrenJsx}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="none"
      className="w-[240px] border-r border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
    >
      <SidebarHeader className="gap-3 px-3 pb-2 pt-4">
        {/* Brand block */}
        <Link
          href={withLocale("/", locale)}
          className="flex items-center gap-2.5 rounded-[var(--radius)] px-1 py-1 transition hover:bg-[var(--soft)]"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          >
            <span className="text-[13px] font-semibold">P</span>
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13.5px] font-semibold text-[var(--ink)]">
              PetCura
            </span>
            <span
              className="truncate font-mono text-[10.5px] lowercase text-[var(--muted)]"
              title={clinicName}
            >
              {clinicName}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent
        ref={navRef as React.RefObject<HTMLDivElement>}
        onKeyDown={onNavKeyDown}
        aria-label={labels.navAria}
        className="px-2"
      >
        {/* Search row sits up top, outside the section eyebrow. */}
        <SidebarMenu className="px-1 pt-1">
          {renderTopLevel(SIDEBAR_NAV[0]!)}
        </SidebarMenu>

        <div className="px-3 pb-1 pt-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
            {labels.sectionInbox}
          </p>
        </div>

        <SidebarMenu className="px-1">
          {SIDEBAR_NAV.slice(1)
            .filter((item) => !item.requires || item.requires === "staff")
            .map(renderTopLevel)}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t border-[var(--line)] p-0">
        <Separator className="bg-[var(--line)]" />
        <div className="relative">
          {/*
            Identity card. The UserMenu owns the popover internals (theme,
            language, sign out) and renders its own trigger — we wrap it so
            the trigger spans the full identity card row. The unused
            free-floating fixed-position chip was removed from /inbox; the
            sidebar is now the single identity surface.
          */}
          <UserMenu
            email={email}
            displayName={friendlyName}
            clinicName={clinicName}
            locale={locale}
            currentPath={currentPath}
            initialTheme={initialTheme}
            labels={labels.userMenu}
            signOutAction={signOutAction}
            variant="sidebar-card"
            cardSlot={
              <div className="flex w-full items-center gap-2.5 px-3 py-3 text-left">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                >
                  <span className="text-[12px] font-semibold">{initials}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
                    {friendlyName}
                  </span>
                  <span className="truncate font-mono text-[10.5px] text-[var(--muted)]">
                    {roleLabel ? `${roleLabel} · ${clinicInitials}` : clinicInitials}
                  </span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  size={14}
                  className="shrink-0 text-[var(--muted-2)]"
                />
              </div>
            }
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
