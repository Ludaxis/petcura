"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@petcura/ui";
import {
  bulkAssignInboxRequestsToMe,
  bulkResolveInboxRequests
} from "../_actions";
import { useInboxBulk } from "./InboxBulkContext";

export type InboxBulkLayerLabels = {
  selected: string; // "{count} selected"
  resolve: string;
  assign: string;
  cancel: string;
  resolveDone: string; // "Resolved {count}"
  assignDone: string;
  error: string;
  rowToggleLabel: string;
};

type Props = {
  locale: string;
  rowIds: string[];
  labels: InboxBulkLayerLabels;
};

/**
 * Bulk-select overlay layer for the /inbox list view.
 *
 * Renders two surfaces:
 *
 *   1. Per-row leading checkboxes (one portal mount per `[data-row-id]`).
 *      Hover/focus inside the row reveals the checkbox; once anything is
 *      selected, every checkbox becomes sticky-visible. Clicking the
 *      checkbox toggles selection without navigating into the request
 *      (preventDefault + stopPropagation on pointerdown/click stop the
 *      anchor's navigation; the row itself stays focusable for J/K).
 *
 *   2. A floating action bar that appears at the bottom of the main pane
 *      while selection.count > 0. Lives just above the mobile bottom-nav
 *      via `bottom-[calc(4rem+0.5rem)] md:bottom-4`.
 *
 * Keyboard:
 *   - Shift+Click toggles a range without navigating (the row's Link is
 *     suppressed for shift-modified clicks via this layer's capture).
 *   - Cmd/Ctrl+A inside the list selects all visible rows.
 *   - Escape clears the selection.
 *
 * Touch:
 *   - Long-press (>500ms) on a row enters selection mode and selects
 *     that row. Once selection is active, taps toggle (handled in the
 *     same capture-phase pointer listener).
 */
export function InboxBulkLayer({ locale, rowIds, labels }: Props) {
  const router = useRouter();
  const {
    selected,
    selectionMode,
    isSelected,
    toggle,
    setRange,
    clear,
    selectAll,
    longPressBegin,
    longPressCancel
  } = useInboxBulk();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // `mounted` gates the portals so we don't try to portal during SSR.
  // useSyncExternalStore handles the "client only" flip without
  // tripping the react-hooks/set-state-in-effect rule.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true, // client snapshot
    () => false // server snapshot
  );

  // Media query reads bypass component state to keep the effect free
  // of setState calls. The CSS `motion-reduce:` modifier is the
  // canonical way; we keep a hook-style read for any imperative
  // animations (none after the recent rewrite).
  const prefersReducedMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotionSnapshot,
    () => false
  );

  // Track which row ids have already been resolved to a DOM node. We
  // re-poll on selection mode toggles and on rowIds change so portals
  // mount when the list re-renders after a router.refresh().
  const [rowNodes, setRowNodes] = useState<Map<string, HTMLElement>>(
    () => new Map()
  );

  // Resolve `[data-row-id]` nodes for the current rowIds. We do this on
  // every selection change AND on rowIds change because rows can be
  // replaced (e.g., after a router.refresh) and the previous nodes get
  // garbage-collected. `requestAnimationFrame` lets the DOM settle after
  // a Next refresh before we re-snapshot.
  useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      const next = new Map<string, HTMLElement>();
      for (const id of rowIds) {
        const node = document.querySelector<HTMLElement>(
          `[data-inbox-row][data-row-id="${cssEscape(id)}"]`
        );
        if (node) next.set(id, node);
      }
      setRowNodes(next);
    };
    const raf = requestAnimationFrame(sync);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [rowIds, selectionMode]);

  // Global key handler: Cmd/Ctrl+A inside the list selects everything
  // visible; Escape clears.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && selected.size > 0) {
        event.preventDefault();
        clear();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
        // Only respond if the focused element is inside the inbox list.
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.closest("[data-inbox-row]")) return;
        event.preventDefault();
        selectAll();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [clear, selectAll, selected.size]);

  // Capture-phase click handler on every row: intercept shift-click +
  // active-selection clicks so the leading anchor doesn't navigate. The
  // checkbox portal handles its own clicks via stopPropagation, so this
  // path is only for clicks on the row body itself.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onClickCapture = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      // Already handled by a checkbox click — let it through.
      if (target.closest("[data-inbox-bulk-checkbox]")) return;
      const row = target.closest<HTMLElement>("[data-inbox-row]");
      const id = row?.dataset.rowId;
      if (!id) return;

      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        setRange(id);
        return;
      }
      if (selectionMode) {
        // While anything is selected, plain clicks toggle that row
        // instead of navigating; matches Gmail/macOS-Mail muscle memory.
        event.preventDefault();
        event.stopPropagation();
        toggle(id);
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () =>
      document.removeEventListener("click", onClickCapture, true);
  }, [selectionMode, setRange, toggle]);

  // Long-press handler — pointer events cover both touch and mouse.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("[data-inbox-bulk-checkbox]")) return;
      const row = target.closest<HTMLElement>("[data-inbox-row]");
      const id = row?.dataset.rowId;
      if (!id) return;
      longPressBegin(id);
    };
    const onPointerEndOrMove = () => longPressCancel();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerEndOrMove);
    document.addEventListener("pointercancel", onPointerEndOrMove);
    document.addEventListener("pointermove", onPointerEndOrMove);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerEndOrMove);
      document.removeEventListener("pointercancel", onPointerEndOrMove);
      document.removeEventListener("pointermove", onPointerEndOrMove);
    };
  }, [longPressBegin, longPressCancel]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const runResolve = useCallback(() => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkResolveInboxRequests(ids, locale);
      if (result.ok) {
        showToast(labels.resolveDone.replace("{count}", String(result.affected)));
        clear();
        router.refresh();
      } else {
        showToast(labels.error);
      }
    });
  }, [clear, labels.error, labels.resolveDone, locale, router, selected, showToast]);

  const runAssign = useCallback(() => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startTransition(async () => {
      const result = await bulkAssignInboxRequestsToMe(ids, locale);
      if (result.ok) {
        showToast(labels.assignDone.replace("{count}", String(result.affected)));
        clear();
        router.refresh();
      } else {
        showToast(labels.error);
      }
    });
  }, [clear, labels.assignDone, labels.error, locale, router, selected, showToast]);

  if (!mounted) return null;

  return (
    <>
      {/* Per-row leading checkbox portals. We mount inside the row so the
          checkbox inherits the row's hover state via CSS group-hover, but
          stop pointer propagation so toggling never navigates. */}
      {Array.from(rowNodes.entries()).map(([id, node]) =>
        createPortal(
          <RowCheckbox
            key={id}
            id={id}
            checked={isSelected(id)}
            sticky={selectionMode}
            label={labels.rowToggleLabel}
            onToggle={() => toggle(id)}
          />,
          node
        )
      )}

      {/* Floating action bar. Renders only while at least one row is
          selected. Anchored above the mobile bottom-nav with a token-
          driven offset; on desktop sits 16px above the bottom edge. */}
      {selected.size > 0 ? (
        <div
          role="region"
          aria-label={labels.selected.replace("{count}", String(selected.size))}
          aria-busy={isPending}
          data-inbox-bulk-bar
          className={cn(
            "fixed inset-x-0 z-40 mx-auto flex w-full max-w-2xl items-center gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 shadow-xl",
            "bottom-[calc(env(safe-area-inset-bottom)+4rem+0.5rem)] md:bottom-4 md:max-w-3xl",
            "px-3 sm:px-4",
            !prefersReducedMotion && "animate-in slide-in-from-bottom-4"
          )}
        >
          <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-[var(--primary-strong)]">
            {labels.selected.replace("{count}", String(selected.size))}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={runAssign}
              disabled={isPending}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--soft)] disabled:opacity-60"
            >
              {labels.assign}
            </button>
            <button
              type="button"
              onClick={runResolve}
              disabled={isPending}
              className="rounded-[8px] bg-[var(--primary-soft)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--primary-strong)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--paper)] disabled:opacity-60"
            >
              {labels.resolve}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={isPending}
              className="rounded-[8px] px-2 py-1.5 text-[12.5px] text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] disabled:opacity-60"
            >
              {labels.cancel}
            </button>
          </div>
        </div>
      ) : null}

      {/* Live toast for bulk results. role="status" carries the polite
          live announcement; the visual element doubles as a toast. */}
      {toast ? (
        <div
          role="status"
          className={cn(
            "fixed bottom-[calc(env(safe-area-inset-bottom)+4rem+0.5rem)] right-4 z-50 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3.5 py-1.5 text-[11.5px] font-medium text-[var(--ink)] shadow-md md:bottom-4",
            !prefersReducedMotion && "animate-in fade-in"
          )}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}

/** Per-row checkbox portal. Visible on hover/focus inside the row OR
 *  permanently while any selection is active. */
function RowCheckbox({
  id,
  checked,
  sticky,
  label,
  onToggle
}: {
  id: string;
  checked: boolean;
  sticky: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <span
      data-inbox-bulk-checkbox
      className={cn(
        "pointer-events-auto absolute left-2 top-1/2 z-[1] -translate-y-1/2",
        // Hidden by default; reveal on row hover/focus or once anything is
        // selected. `group` is the row Link's className root.
        sticky
          ? "opacity-100"
          : "opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      )}
      // Stop the wrapping `<Link>` from receiving the click and navigating
      // to the request. We deliberately don't call onToggle here — the
      // <Checkbox> below fires `onCheckedChange` which already drives the
      // selection, calling it from both surfaces would cancel out via the
      // pair of toggles.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => onToggle()}
        aria-label={label}
        // Make the hit area easier on touch without making the dot
        // tiny visually — the inner box stays 16px.
        className="h-4 w-4"
        // Distinct marker so test selectors / DOM queries can
        // disambiguate the checkbox from the parent row; the row's
        // own data-row-id is queried with the [data-inbox-row] guard
        // so we deliberately avoid reusing the same attribute here.
        data-bulk-checkbox-for={id}
      />
    </span>
  );
}

// useSyncExternalStore subscribers ------------------------------------------
// noop subscribe for the "is client" gate — we only need the snapshots to
// flip after hydration. React calls the subscribe fn but never needs to
// trigger re-renders.
function subscribeNoop() {
  return () => undefined;
}

function subscribePrefersReducedMotion(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getPrefersReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Conservative CSS.escape polyfill for environments that don't expose it. */
function cssEscape(value: string) {
  if (typeof window !== "undefined" && typeof window.CSS?.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}
