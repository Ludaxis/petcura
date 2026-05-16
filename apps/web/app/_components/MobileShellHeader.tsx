"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

type MobileShellHeaderProps = {
  /** Localized page title — "All · 35", "Lumi", "Admin". */
  title: string;
  /** aria-label for the trigger button ("Open menu"). */
  openMenuLabel: string;
};

/**
 * Compact header bar shown only below the `md` breakpoint (768px).
 *
 * The persistent sidebar is hidden on mobile; this bar surfaces:
 *   - the shadcn `<SidebarTrigger />` (top-left) so users can open the
 *     sidebar Sheet drawer.
 *   - the current page title (centered) so users know where they are.
 *
 * The bar disappears entirely on desktop because the sidebar rail handles
 * both jobs there. We render through `useSidebar` so the trigger pairs
 * with the SidebarProvider in AppShell. The trigger's icon is purely
 * decorative (lucide PanelLeft) — the accessible name comes from the
 * `aria-label` we pass through.
 */
export function MobileShellHeader({
  title,
  openMenuLabel
}: MobileShellHeaderProps) {
  // Subscribe just to confirm we're inside a SidebarProvider — also lets us
  // mirror open state into `aria-expanded` for screen readers without the
  // SidebarTrigger primitive needing to be patched.
  const { openMobile } = useSidebar();
  return (
    <header
      role="banner"
      className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-[var(--line)] bg-[var(--paper)] px-2 md:hidden"
      data-mobile-shell-header
    >
      <SidebarTrigger
        aria-label={openMenuLabel}
        aria-expanded={openMobile}
        className="h-9 w-9 rounded-[var(--radius)] text-[var(--ink-2)] hover:bg-[var(--soft)]"
      />
      <p
        title={title}
        className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-[var(--ink)]"
      >
        {title}
      </p>
      {/* Right spacer matches the trigger width so the title sits visually
          centered without measuring. */}
      <span aria-hidden="true" className="h-9 w-9" />
    </header>
  );
}
