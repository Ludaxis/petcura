"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  FileText,
  Inbox,
  PanelLeft,
  Search,
  Settings,
  ShieldCheck
} from "lucide-react";
import { cn } from "@petcura/ui";
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
  SidebarMenuSubItem,
  SidebarProvider
} from "@/components/ui/sidebar";

/**
 * Design-only showcase of the live AppShell pieces.
 *
 * This module renders the SAME shadcn sidebar primitives (Sidebar, SidebarMenu,
 * SidebarMenuButton, SidebarMenuSubButton) that AppSidebar uses, with the SAME
 * `cn` class strings that AppSidebar applies on top. The goal: if a future PR
 * regresses any of the four shell bugs the user just flagged
 *   - double active highlight on parent + child
 *   - every item painting as if hovered
 *   - sidebar surface blending with main pane
 *   - mobile open state not visible
 * one of the tiles in this section will show the broken state immediately on
 * `/design`. No iframes, no auth, no fixtures — just the live primitives.
 *
 * The page already mirrors classes from the live AppSidebar; if you change
 * AppSidebar's row classes, mirror them here too so the showcase stays honest.
 */

// ---------------------------------------------------------------------------
// Static nav rows — labels are hard-coded English (the /design page ships
// English-only per the existing comment in page.tsx, so no translator).
// ---------------------------------------------------------------------------

type ShowcaseChild = {
  id: string;
  label: string;
  count?: number;
  tone?: "neutral" | "red" | "amber";
};

const INBOX_CHILDREN: ShowcaseChild[] = [
  { id: "stream-mine", label: "Mine", count: 7 },
  { id: "stream-unassigned", label: "Unassigned", count: 4 },
  { id: "stream-urgent", label: "Urgent", count: 2, tone: "red" },
  { id: "stream-today", label: "Today", count: 9, tone: "amber" },
  { id: "stream-all", label: "All", count: 35 },
  { id: "stream-resolved", label: "Resolved", count: 18 }
];

type TopRow = {
  id: string;
  label: string;
  icon: typeof Inbox;
  count?: number;
  children?: ShowcaseChild[];
  superAdminOnly?: boolean;
};

const TOP_ROWS: TopRow[] = [
  { id: "inbox", label: "Inbox", icon: Inbox, count: 35, children: INBOX_CHILDREN },
  { id: "reminders", label: "Reminders", icon: Bell, count: 0 },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "admin", label: "Admin", icon: ShieldCheck, superAdminOnly: true }
];

const TONE_BADGE: Record<NonNullable<ShowcaseChild["tone"]>, string> = {
  neutral: "bg-[var(--soft)] text-[var(--muted-2)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]"
};

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function CountBadge({
  value,
  tone,
  active
}: {
  value: number;
  tone?: ShowcaseChild["tone"];
  active?: boolean;
}) {
  if (!value) return null;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-auto inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] tabular-nums",
        active
          ? "bg-[var(--primary)] text-[var(--paper)]"
          : TONE_BADGE[tone ?? "neutral"]
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

/**
 * Renders one full sidebar mirroring AppSidebar's structure. State flags let
 * callers script which row is active and whether to fake a hover on a
 * specific sub-row id (so the showcase can demonstrate "this is what hover
 * SHOULD look like — idle rows must not match this color").
 */
function ShowcaseSidebar({
  activeChildId,
  hoverChildId,
  showSuperAdmin = false
}: {
  /** Which inbox sub-stream gets the sage-soft active pill. */
  activeChildId?: string;
  /** Force one sub-row to render its hover treatment via data-hover="true". */
  hoverChildId?: string;
  /** Whether the admin row (super-admin-gated in AppSidebar) is visible. */
  showSuperAdmin?: boolean;
}) {
  const rows = TOP_ROWS.filter((r) => !r.superAdminOnly || showSuperAdmin);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="none"
      className="!w-[240px] border-r border-[var(--line)] bg-[var(--soft)] text-[var(--ink)]"
    >
      <SidebarHeader className="gap-3 px-3 pb-2 pt-4">
        <div className="flex items-center gap-2.5 rounded-[var(--radius)] px-1 py-1">
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
            <span className="truncate font-mono text-[10.5px] lowercase text-[var(--muted)]">
              tartu loomakliinik
            </span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent aria-label="Primary navigation" className="px-2">
        {/* Search row */}
        <SidebarMenu className="px-1 pt-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
              aria-label="Search"
              onClick={(e) => e.preventDefault()}
            >
              <Search aria-hidden="true" />
              <span className="text-[13px]">Search</span>
              <kbd
                aria-hidden="true"
                className="ml-auto inline-flex h-5 items-center rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 font-mono text-[10px] text-[var(--muted)]"
              >
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-3 pb-1 pt-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
            Inbox
          </p>
        </div>

        <SidebarMenu className="px-1">
          {rows.map((row) => {
            const Icon = row.icon;
            // Parent never gets the active pill — only the deepest match wins.
            // This mirrors useActiveResolver() in AppSidebar where the inbox
            // parent intentionally returns false when a sub-stream is active.
            const parentActive = false;
            return (
              <SidebarMenuItem key={row.id}>
                <SidebarMenuButton
                  isActive={parentActive}
                  className={cn(
                    "font-medium text-[var(--ink-2)] hover:bg-[var(--soft)]"
                  )}
                  onClick={(e) => e.preventDefault()}
                >
                  <Icon aria-hidden="true" />
                  <span className="text-[13px]">{row.label}</span>
                  {row.count ? (
                    <CountBadge value={row.count} active={parentActive} />
                  ) : null}
                </SidebarMenuButton>
                {row.children?.length ? (
                  <SidebarMenuSub>
                    {row.children.map((child) => {
                      const childActive = child.id === activeChildId;
                      const forceHover = child.id === hoverChildId;
                      return (
                        <SidebarMenuSubItem key={child.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={childActive}
                            // data-hover is a synthetic flag — Tailwind's
                            // `hover:` selectors won't match it, so the only
                            // way to "paint hover" without a real cursor is
                            // to apply the hover classes unconditionally for
                            // this one row.
                            data-hover={forceHover || undefined}
                            className={cn(
                              "text-[12.5px]",
                              childActive
                                ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                                : forceHover
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-[var(--muted)] hover:text-[var(--ink)]"
                            )}
                          >
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              aria-current={childActive ? "page" : undefined}
                            >
                              <span className="truncate">{child.label}</span>
                              {typeof child.count === "number" ? (
                                <CountBadge
                                  value={child.count}
                                  tone={child.tone}
                                  active={childActive}
                                />
                              ) : null}
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="gap-0 border-t border-[var(--line)] p-0">
        <div className="flex w-full items-center gap-2.5 px-3 py-3 text-left">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          >
            <span className="text-[12px] font-semibold">MK</span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">
              Mari Kask
            </span>
            <span className="truncate font-mono text-[10.5px] text-[var(--muted)]">
              admin · TL
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            size={14}
            className="shrink-0 text-[var(--muted-2)]"
          />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Tile wrapper that hosts ONE sidebar instance behind its own SidebarProvider.
 * We isolate each provider so the four showcase sidebars don't fight over the
 * collapse cookie — and we suppress propagation on the showcase region so the
 * provider's ⌘B handler (registered via window.addEventListener inside the
 * SidebarProvider) can't reach down into a real authenticated route mounted
 * in the future. /design is a public route with no AppShell, so today there's
 * nothing for ⌘B to confuse, but the guard is cheap.
 */
function Tile({
  label,
  caption,
  width,
  height,
  dark,
  children,
  surface = "paper"
}: {
  label: string;
  caption?: ReactNode;
  width: number;
  height: number;
  dark?: boolean;
  children: ReactNode;
  /** What the frame's outer background should match. */
  surface?: "paper" | "soft";
}) {
  // Constrain the figure to `width` on the cross-axis. The inner sidebar
  // primitives use `min-h-svh w-full` which can drag a column-flex parent
  // wider than the inner frame; pinning width on the figure itself keeps
  // the tile honest at the spec dimension.
  const figureStyle: CSSProperties = { width, maxWidth: width };
  const frame: CSSProperties = {
    width,
    height,
    background:
      surface === "soft" ? "var(--soft)" : "var(--paper)"
  };
  return (
    <figure
      className={cn("flex shrink-0 flex-col gap-2", dark && "dark")}
      style={figureStyle}
    >
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted)]">
          {label}
        </span>
        <span className="font-mono text-[10px] text-[var(--muted-2)]">
          {width}×{height}
        </span>
      </figcaption>
      <div
        className="relative overflow-hidden rounded-lg border border-[var(--line)] shadow-sm"
        style={frame}
      >
        {children}
      </div>
      {caption ? (
        <p className="text-[12px] leading-[1.45] text-[var(--ink-2)]">
          {caption}
        </p>
      ) : null}
    </figure>
  );
}

function ProviderShell({ children }: { children: ReactNode }) {
  return (
    // Stop the showcase from leaking ⌘B / arrow-key behaviors into the host
    // page. The SidebarProvider's window-level keydown still fires for ⌘B —
    // that's harmless on /design (no real shell mounted) but we keep the
    // capture-phase guard so a future host wrapping /design in AppShell won't
    // see double-toggle.
    <div
      onKeyDownCapture={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "b"
        ) {
          event.stopPropagation();
        }
      }}
      className="h-full w-full"
    >
      <SidebarProvider defaultOpen className="!min-h-0 h-full">
        {children}
      </SidebarProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A. Three sidebar states
// ---------------------------------------------------------------------------

export function SidebarStatesRow() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      <div className="flex items-stretch gap-6">
        <Tile
          label="Sidebar · idle"
          width={280}
          height={720}
          surface="soft"
          caption={
            <>
              /inbox active. The parent <strong>Inbox</strong> row stays neutral
              (no fill) — only the deepest match (<strong>All</strong>) carries
              the sage-soft pill. If both parent and child get fills, the
              double-active bug is back.
            </>
          }
        >
          <ProviderShell>
            <ShowcaseSidebar activeChildId="stream-all" />
          </ProviderShell>
        </Tile>

        <Tile
          label="Sidebar · with hover hint"
          width={280}
          height={720}
          surface="soft"
          caption={
            <>
              The <strong>Mine</strong> row is forced into its hover treatment.
              All idle rows above and below must NOT match this color — if they
              do, every-row-painted-as-hovered is back.
            </>
          }
        >
          <ProviderShell>
            <ShowcaseSidebar
              activeChildId="stream-all"
              hoverChildId="stream-mine"
            />
          </ProviderShell>
        </Tile>

        <Tile
          label="Sidebar · all routes mapped"
          width={280}
          height={720}
          surface="soft"
          caption={
            <>
              Super-admin viewer — the <strong>Admin</strong> row is visible at
              the bottom of the rail. Staff-only viewers never see this row;
              the gate lives in <code>SIDEBAR_NAV[].requires</code>.
            </>
          }
        >
          <ProviderShell>
            <ShowcaseSidebar
              activeChildId="stream-all"
              showSuperAdmin
            />
          </ProviderShell>
        </Tile>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B. AppShell skeleton — sidebar + main in one frame
// ---------------------------------------------------------------------------

export function ShellSkeleton() {
  // 1200×600 — the brief calls for 1320 but we keep the tile inside the page's
  // lg:px-14 padding at a 1320 viewport (1320 - 112 = 1208). The skeleton's
  // job is to demonstrate the two-surface contrast; the exact width is not
  // load-bearing, and overflow at the spec viewport is a no-go per the QA bar.
  return (
    <Tile
      label="AppShell · sidebar + main"
      width={1200}
      height={600}
      caption={
        <>
          Skeleton: sidebar (left, <code>--soft</code> surface) ·
          main (right, <code>--paper</code> surface). The surface tones MUST
          differ so the rail reads as anchored when content scrolls. If both
          panes share the same background, the rail dissolves into the page.
        </>
      }
    >
      <ProviderShell>
        <div className="flex h-full w-full">
          <ShowcaseSidebar activeChildId="stream-all" />
          <main className="flex h-full min-w-0 flex-1 flex-col bg-[var(--paper)] p-6">
            <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-4">
              <h3 className="text-base font-semibold text-[var(--ink)]">
                All · 35
              </h3>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">
                main pane · --paper
              </span>
            </div>
            <div className="mt-4 grid flex-1 grid-cols-1 gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[13px] text-[var(--ink-2)]"
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
                  <span className="font-medium text-[var(--ink)]">
                    Owner thread placeholder #{i + 1}
                  </span>
                  <span className="ml-auto font-mono text-[10.5px] text-[var(--muted)]">
                    12 : 0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </ProviderShell>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// C. Mobile shell — closed and open
// ---------------------------------------------------------------------------

function MobileHeaderStub({ title }: { title: string }) {
  // Static recreation of MobileShellHeader. We can't render the real one
  // because it requires SidebarProvider context AND would attach a real
  // SidebarTrigger that opens the Sheet portal (which lifts out of this
  // tile). The structure/classes mirror MobileShellHeader.tsx exactly.
  return (
    <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-[var(--line)] bg-[var(--paper)] px-2">
      <button
        type="button"
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--ink-2)] hover:bg-[var(--soft)]"
        onClick={(e) => e.preventDefault()}
      >
        <PanelLeft size={18} aria-hidden="true" />
      </button>
      <p className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-[var(--ink)]">
        {title}
      </p>
      <span aria-hidden="true" className="h-9 w-9" />
    </div>
  );
}

export function MobileShellPair() {
  return (
    <div className="flex flex-wrap items-stretch gap-6">
      <Tile
        label="Mobile · closed"
        width={390}
        height={620}
        caption="Persistent rail is hidden below md. The MobileShellHeader carries the trigger and current page title."
      >
        <div className="flex h-full w-full flex-col bg-[var(--paper)]">
          <MobileHeaderStub title="All · 35" />
          <div className="flex-1 space-y-2 p-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 text-[12.5px] text-[var(--ink-2)]"
              >
                <p className="font-medium text-[var(--ink)]">Liis · Lumi</p>
                <p className="truncate text-[var(--muted)]">
                  Tere! Lumi sügeleb …
                </p>
              </div>
            ))}
          </div>
        </div>
      </Tile>

      <Tile
        label="Mobile · open (sheet)"
        width={390}
        height={620}
        caption={
          <>
            Sheet drawer slides in over the content with a scrim. The real
            implementation uses Radix Sheet via shadcn — visual approximation
            here since the portal lifts out of the tile.
          </>
        }
      >
        <div className="relative flex h-full w-full flex-col bg-[var(--paper)]">
          <MobileHeaderStub title="All · 35" />
          <div className="flex-1 space-y-2 p-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3 text-[12.5px] text-[var(--ink-2)]"
              >
                <p className="font-medium text-[var(--ink)]">Liis · Lumi</p>
                <p className="truncate text-[var(--muted)]">
                  Tere! Lumi sügeleb …
                </p>
              </div>
            ))}
          </div>
          {/* Scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/40"
          />
          {/* Sheet pane */}
          <div className="absolute inset-y-0 left-0 w-[288px] border-r border-[var(--line)] bg-[var(--soft)] shadow-xl">
            <ProviderShell>
              <ShowcaseSidebar activeChildId="stream-all" />
            </ProviderShell>
          </div>
        </div>
      </Tile>
    </div>
  );
}

// ---------------------------------------------------------------------------
// D. Active-state matrix
// ---------------------------------------------------------------------------

/**
 * Static chips that mirror the class output of SidebarMenuSubButton in each
 * state. The contract: these chips render with the exact classes AppSidebar
 * applies — so a regression to those classes shows up here AND in the live
 * sidebar identically. Keep these strings in sync with AppSidebar.tsx.
 */
function SubButtonChip({
  state
}: {
  state: "idle" | "hover" | "active" | "focus";
}) {
  const base =
    "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-[12.5px]";
  const stateClass =
    state === "active"
      ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
      : state === "hover"
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : state === "focus"
          ? "text-[var(--muted)] ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--soft)]"
          : "text-[var(--muted)]";
  return (
    <div className="rounded-md bg-[var(--soft)] p-2">
      <div className={cn(base, stateClass)}>
        <span className="truncate">Mine</span>
        <span
          aria-hidden="true"
          className={cn(
            "ml-auto inline-flex h-[18px] min-w-[22px] items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] tabular-nums",
            state === "active"
              ? "bg-[var(--primary)] text-[var(--paper)]"
              : "bg-[var(--soft)] text-[var(--muted-2)]"
          )}
        >
          7
        </span>
      </div>
    </div>
  );
}

export function ActiveStateMatrix() {
  const rows: Array<{
    label: string;
    desc: string;
    state: "idle" | "hover" | "active" | "focus";
  }> = [
    { label: "Idle", desc: "No fill, --muted ink", state: "idle" },
    {
      label: "Hover",
      desc: "sidebar-accent fill (primary-soft in light)",
      state: "hover"
    },
    {
      label: "Active (current page)",
      desc: "primary-soft fill, primary-strong ink, sage badge",
      state: "active"
    },
    {
      label: "Focused (keyboard)",
      desc: "primary ring · sidebar-ring",
      state: "focus"
    }
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)]">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-[var(--soft)] text-[var(--muted)]">
            <th className="border-b border-[var(--line)] px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em]">
              State
            </th>
            <th className="border-b border-[var(--line)] px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em]">
              Light
            </th>
            <th className="border-b border-[var(--line)] border-l px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em]">
              Dark
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="bg-[var(--paper)]">
              <td className="border-b border-[var(--line)] align-top px-4 py-4">
                <p className="font-semibold text-[var(--ink)]">{row.label}</p>
                <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
                  {row.desc}
                </p>
              </td>
              <td className="border-b border-[var(--line)] px-4 py-4 align-middle">
                <div className="w-[220px]">
                  <SubButtonChip state={row.state} />
                </div>
              </td>
              <td className="border-b border-[var(--line)] border-l px-4 py-4 align-middle">
                <div className="dark w-[220px] rounded-md bg-[#1c1a16] p-1">
                  <SubButtonChip state={row.state} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// E. Nav config snippet
// ---------------------------------------------------------------------------

const NAV_SNIPPET = `// apps/web/lib/nav/sidebar-nav.ts
export const SIDEBAR_NAV: NavItem[] = [
  {
    id: "inbox",
    labelKey: "nav.inbox",
    href: "/inbox",
    icon: Inbox,
    countSource: "inboxTotal",
    children: INBOX_CHILDREN
  },
  {
    id: "reminders",
    labelKey: "nav.reminders",
    href: "/reminders",
    icon: Bell,
    countSource: "remindersTotal"
  },
  {
    id: "admin",
    labelKey: "nav.admin",
    href: "/admin",
    icon: ShieldCheck,
    requires: "super_admin"  // ← gated to super-admins
  }
];`;

export function NavConfigSnippet() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <p className="text-[13px] leading-[1.5] text-[var(--ink-2)]">
        Adding a new top-level feature is one line in{" "}
        <Link
          href="https://github.com"
          className="font-mono text-[12px] text-[var(--primary-strong)] underline-offset-2 hover:underline"
        >
          apps/web/lib/nav/sidebar-nav.ts
        </Link>
        :
      </p>
      <pre
        className="overflow-x-auto rounded-md p-4 font-mono text-[11.5px] leading-[1.6] text-[var(--ink)]"
        style={{ background: "var(--primary-soft)" }}
      >
        {NAV_SNIPPET}
      </pre>
      <p className="text-[12px] leading-[1.5] text-[var(--muted)]">
        Counts are NEVER computed inside this module — they&apos;re resolved
        server-side and threaded through the typed{" "}
        <code className="font-mono text-[11px]">NavCounts</code> map.
      </p>
    </div>
  );
}
