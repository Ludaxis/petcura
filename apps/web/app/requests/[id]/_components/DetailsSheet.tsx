"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@petcura/ui";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

type DetailsSheetProps = {
  /** Localized "Details" trigger label and sheet title. */
  triggerLabel: string;
  /** Accessible name for the inner `<aside>` wrapper (matches the inline
   *  rail's aria-label so screen readers see the same region label
   *  regardless of viewport). */
  panelLabel: string;
  /** Localized label for the close X (SR-only). */
  closeLabel: string;
  /** Side-blocks content (Pet · Reminders · Events · Notes). Rendered as a
   *  child so the server component owns the data shape and i18n; this
   *  client shell only manages open/close. */
  children: ReactNode;
};

/**
 * Mobile/tablet/laptop escape hatch for the right rail on /requests/[id].
 *
 * The xl+ layout shows the side blocks as an inline 280px column. Below xl
 * (phones, tablets, laptops at common widths) the column is hidden by CSS,
 * so this Sheet surfaces the same content on demand. The trigger is hidden
 * on xl+ where the rail is already inline.
 *
 * - Slides in from the right on `sm+` (320px wide — same rail width).
 * - Full-bleed on `<sm` so phone users get the whole viewport for dense
 *   forms (note textarea, reminder buttons).
 * - Radix owns Tab trap, Escape close, click-outside, focus restoration,
 *   `aria-modal="true"`, and respects `prefers-reduced-motion` via the
 *   sheet's `data-open`/`data-closed` animation classes.
 * - Internal scroll inside `SheetContent` so long lists don't push past
 *   the sticky header.
 */
export function DetailsSheet({
  triggerLabel,
  panelLabel,
  closeLabel,
  children
}: DetailsSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          data-details-sheet
          className="xl:hidden"
        >
          {triggerLabel}
          <ChevronDown aria-hidden="true" size={12} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={[
          // Token surfaces — override the shadcn `bg-popover` default with
          // PetCura's `--paper` so the sheet matches the inline rail's
          // surface in both light and dark themes.
          "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]",
          // Width: full-bleed on phones, 320px (rail-equivalent) from sm up.
          "w-full sm:max-w-[320px]",
          // Layout: column with sticky header + scrolling body.
          "flex flex-col gap-0 p-0"
        ].join(" ")}
      >
        <SheetHeader
          className={[
            // Mirrors the dialog header so the title + close stay visible
            // while the body scrolls.
            "flex flex-row items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3"
          ].join(" ")}
        >
          <SheetTitle className="text-[15px] font-semibold text-[var(--ink)]">
            {triggerLabel}
          </SheetTitle>
          <SheetDescription className="sr-only">{panelLabel}</SheetDescription>
          <SheetClose asChild>
            <button
              type="button"
              aria-label={closeLabel}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <X aria-hidden="true" size={14} />
            </button>
          </SheetClose>
        </SheetHeader>
        <aside
          aria-label={panelLabel}
          data-side-panel="sheet"
          className="min-h-0 flex-1 overflow-y-auto bg-[var(--paper)]"
        >
          {children}
        </aside>
      </SheetContent>
    </Sheet>
  );
}
