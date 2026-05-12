"use client";

import { useState, type ReactNode } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@petcura/ui";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

type RequestEditSheetProps = {
  /** Localized "Edit" trigger label and sheet title. */
  triggerLabel: string;
  /** Sheet title — "Update request" / "Uuenda pöördumist" / "Обновить запрос". */
  sheetTitle: string;
  /** Localized SR-only label for the close button. */
  closeLabel: string;
  /** Tailwind classes appended to the trigger Button — used by the parent
   *  to hide the trigger on `lg+` where the inline forms are visible. */
  className?: string;
  /** The three operational forms (status / urgency / assignee) rendered
   *  with `stack` layout so they fill the sheet vertically. */
  children: ReactNode;
};

/**
 * Mobile/tablet escape hatch for the status / urgency / assignee forms.
 *
 * On `lg+` the same forms render inline in the detail header's sticky
 * action row. Below `lg`, the header collapses to read-only status /
 * urgency / category chips and the user opens this sheet via the Edit
 * trigger to mutate the request.
 *
 * - Slides in from the right (Radix Dialog).
 * - Width: full-bleed on phones, 360px on `sm+` so each select has room.
 * - Radix owns Tab trap, Escape close, click-outside, focus restoration,
 *   `aria-modal="true"` and respects `prefers-reduced-motion` via the
 *   shadcn `data-open` / `data-closed` animation classes.
 */
export function RequestEditSheet({
  triggerLabel,
  sheetTitle,
  closeLabel,
  className,
  children
}: RequestEditSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          data-request-edit-sheet
          className={className}
        >
          <Pencil aria-hidden="true" size={12} />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-request-edit-sheet-content
        className={[
          "border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]",
          "w-full sm:max-w-[360px]",
          "flex flex-col gap-0 p-0"
        ].join(" ")}
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
          <SheetTitle className="text-[15px] font-semibold text-[var(--ink)]">
            {sheetTitle}
          </SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              aria-label={closeLabel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            >
              <X aria-hidden="true" size={14} />
            </button>
          </SheetClose>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
