"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LazyRealtimeRefresh as RealtimeRefresh } from "@/app/_components/LazyRealtimeRefresh";
import { eqFilter, makeRealtimeChannelName } from "@/lib/realtime-refresh";
import { LazyCommandPalette } from "./LazyCommandPalette";
import type { CommandPalette } from "./CommandPalette";
import { InboxKeyboard } from "./InboxKeyboard";
import { InboxBulkProvider } from "./InboxBulkContext";
import type { InboxBulkLayerLabels } from "./InboxBulkLayer";
import { LazyInboxBulkLayer } from "./LazyInboxBulkLayer";
import { useInboxRealtime } from "./useInboxRealtime";
import type { InboxStream } from "@/lib/inbox/queries";

export type InboxClientShellProps = {
  clinicId: string;
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
  bulkLabels: InboxBulkLayerLabels;
  realtimeToastLabel: string; // "New request from {name}"
  /** Indexed by row id — used by useInboxRealtime to look up owner name
   *  for the toast when a new INSERT arrives that we already have a
   *  row for. New inserts beyond the rendered page fall back to a
   *  generic name. */
  ownerNameByRowId: Record<string, string>;
};

export function InboxClientShell({
  clinicId,
  rowIds,
  hrefForRow,
  threads,
  streams,
  locale,
  paletteLabels,
  keyboardLabels,
  shortcuts,
  bulkLabels,
  realtimeToastLabel,
  ownerNameByRowId
}: InboxClientShellProps) {
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

  // The CommandPalette listens to `petcura:open-cmdk` directly now (see
  // CommandPalette.tsx) so any open/close trigger — ⌘K or the Playwright
  // test hook below — is just a window dispatch. The bridge handler that
  // used to call paletteRef.current?.toggle() is gone.

  const currentRowId = rowIds[safeFocusedIndex] ?? null;

  const dispatchToggleCmdk = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("petcura:open-cmdk"));
  };

  // Realtime toast + favicon dot. Lives next to the RealtimeRefresh which
  // already drives the list re-render; this hook adds the in-app surfaces
  // (sage-soft toast in the lower right + favicon notification when the
  // tab is unfocused). The visible-tab guard avoids double-announcing
  // while RealtimeRefresh refreshes the page on focus.
  useInboxRealtime({
    clinicId,
    rowIds,
    ownerNameByRowId,
    toastLabelTemplate: realtimeToastLabel
  });

  return (
    <>
      <RealtimeRefresh
        channelName={makeRealtimeChannelName("inbox", clinicId)}
        targets={[
          { table: "requests", filter: eqFilter("clinic_id", clinicId) },
          { table: "messages", filter: eqFilter("clinic_id", clinicId) }
        ]}
        pollMs={15_000}
      />

      <InboxBulkProvider rowIds={rowIds}>
        <LazyInboxBulkLayer
          locale={locale}
          rowIds={rowIds}
          labels={bulkLabels}
        />
      </InboxBulkProvider>

      <InboxKeyboard
        rowIds={rowIds}
        hrefForRow={(id) => hrefForRow[id] ?? `/requests/${id}`}
        locale={locale}
        onOpenPalette={dispatchToggleCmdk}
        focusedIndex={safeFocusedIndex}
        onFocusedIndexChange={setFocusedIndex}
        shortcuts={shortcuts}
        labels={keyboardLabels}
      />
      <LazyCommandPalette
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
        onClick={dispatchToggleCmdk}
        className="sr-only"
      />
    </>
  );
}
