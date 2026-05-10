"use client";

import { useRef } from "react";
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
  const currentRowId = rowIds[0] ?? null;

  return (
    <>
      <InboxKeyboard
        rowIds={rowIds}
        hrefForRow={(id) => hrefForRow[id] ?? `/requests/${id}`}
        locale={locale}
        onOpenPalette={() => paletteRef.current?.toggle()}
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
      <button
        type="button"
        data-testid="cmdk-trigger"
        aria-label="Open command palette"
        onClick={() => paletteRef.current?.toggle()}
        className="sr-only"
      >
        Open command palette
      </button>
    </>
  );
}
