"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CommandPalette, type CommandPaletteRef } from "./CommandPalette";
import { InboxKeyboard } from "./InboxKeyboard";
import type { InboxStream } from "@/lib/inbox/queries";

type InboxClientShellProps = {
  rowIds: string[];
  hrefForRow: Record<string, string>;
  threads: Array<{
    id: string;
    petName: string;
    ownerName: string;
    preview: string;
    href: string;
  }>;
  streams: Array<{ value: InboxStream; label: string }>;
  locale: string;
  paletteLabels: React.ComponentProps<typeof CommandPalette>["labels"];
  keyboardLabels: React.ComponentProps<typeof InboxKeyboard>["labels"];
  shortcuts: React.ComponentProps<typeof InboxKeyboard>["shortcuts"];
};

export function InboxClientShell({
  rowIds,
  hrefForRow,
  threads,
  streams,
  locale,
  paletteLabels,
  keyboardLabels,
  shortcuts
}: InboxClientShellProps) {
  const paletteRef = useRef<CommandPaletteRef>(null);
  const searchParams = useSearchParams();
  const [focusedIndex, setFocusedIndex] = useState(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const idx = rowIds.indexOf(idParam);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const safeFocusedIndex =
    rowIds.length === 0 ? 0 : Math.min(focusedIndex, rowIds.length - 1);

  // Roving tabindex: drive tabIndex / data-selected on every rendered row
  // from the lifted focusedIndex so Tab returns to the focused row.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = rowIds[safeFocusedIndex];
    document
      .querySelectorAll<HTMLElement>("[data-inbox-row]")
      .forEach((row) => {
        const active = row.dataset.rowId === id;
        row.tabIndex = active ? 0 : -1;
          if (active) row.dataset.selected = "true";
          else delete row.dataset.selected;
      });
  }, [rowIds, safeFocusedIndex]);

  const currentRowId = rowIds[safeFocusedIndex] ?? null;

  return (
    <>
      <InboxKeyboard
        rowIds={rowIds}
        hrefForRow={(id) => hrefForRow[id] ?? `/requests/${id}`}
        locale={locale}
        onOpenPalette={() => paletteRef.current?.toggle()}
        focusedIndex={safeFocusedIndex}
        onFocusedIndexChange={setFocusedIndex}
        shortcuts={shortcuts}
        labels={keyboardLabels}
      />
      <CommandPalette
        ref={paletteRef}
        threads={threads}
        streams={streams}
        currentRowId={currentRowId}
        locale={locale}
        labels={paletteLabels}
      />
      {/* Test hook for Playwright. Hidden from the a11y tree and not in the
          tab sequence. The real ⌘K affordance is the global keyboard handler
          in InboxKeyboard. */}
      <button
        type="button"
        data-testid="cmdk-trigger"
        aria-hidden="true"
        tabIndex={-1}
        onClick={() => paletteRef.current?.toggle()}
        className="sr-only"
      />
    </>
  );
}
