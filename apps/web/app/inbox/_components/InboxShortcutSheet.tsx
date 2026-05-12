"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type Shortcut = {
  keys: string;
  description: string;
};

export type InboxShortcutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
  labels: {
    sheetTitle: string;
    close: string;
  };
};

/**
 * The "?" shortcut overlay. Extracted out of InboxKeyboard so the Radix
 * Dialog primitives (and the inbox's only direct use of them) can be
 * code-split — staff seldom open this sheet, and never on first paint.
 * The handler in InboxKeyboard stays eager so the "?" press itself is
 * always responsive; lazy-mounting only the Dialog content adds a single
 * frame of latency on first open.
 */
export function InboxShortcutSheet({
  open,
  onOpenChange,
  shortcuts,
  labels
}: InboxShortcutSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        closeLabel={labels.close}
        // The sheet body is a list of shortcuts; the title is sufficient
        // labeling. Pass undefined explicitly so Radix doesn't log a
        // missing-description warning at dev time.
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{labels.sheetTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <ul className="flex flex-col gap-1.5">
            {shortcuts.map((s) => (
              <li
                key={s.keys + s.description}
                className="flex items-center justify-between gap-3 rounded-[6px] px-2 py-1.5 text-[12.5px] text-[var(--ink)] hover:bg-[var(--soft)]"
              >
                <span>{s.description}</span>
                <kbd className="rounded border border-[var(--line)] bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--ink-2)]">
                  {s.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
