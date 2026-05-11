"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

/**
 * Selection state for the inbox bulk-action layer. Lives in a small client
 * context so:
 *
 *   - The leading checkbox per row can read+write `selected` without
 *     prop-drilling through the server-rendered list.
 *   - The floating action bar consumes the count and dispatches the
 *     server actions on a single render.
 *   - Cmd/Ctrl+A and Escape live in one place and stay in sync.
 *
 * Visible row ids are passed in from the page so "select all" only
 * checks rows the user actually sees under the active filter / stream.
 */
type InboxBulkContextValue = {
  selected: ReadonlySet<string>;
  selectionMode: boolean;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  setRange: (id: string) => void;
  clear: () => void;
  selectAll: () => void;
  longPressBegin: (id: string) => void;
  longPressCancel: () => void;
};

const InboxBulkContext = createContext<InboxBulkContextValue | null>(null);

export function useInboxBulk() {
  const ctx = useContext(InboxBulkContext);
  if (!ctx) {
    throw new Error(
      "useInboxBulk must be used inside <InboxBulkProvider>"
    );
  }
  return ctx;
}

/**
 * Provider — owns the visible row ids and the Set of selected ids.
 *
 * Note we keep `selected` as Set<string>; React equality is by reference so
 * every mutator clones the Set. This is fine for the inbox volumes we
 * care about (≤300 rows on a single page); switching to a normalized
 * record would not buy us any perf back.
 */
export function InboxBulkProvider({
  rowIds,
  children
}: {
  rowIds: string[];
  children: ReactNode;
}) {
  const [selectedState, setSelected] = useState<Set<string>>(() => new Set());
  // Last clicked id — anchor for Shift+Click range selection.
  const anchorRef = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleRowIds = useMemo(() => new Set(rowIds), [rowIds]);

  // Visible ids change when the user filters / opens a different stream. The
  // context exposes only visible selections so the action bar never references
  // rows the server didn't render.
  const selected = useMemo(() => {
    if (selectedState.size === 0) return selectedState;
    let mutated = false;
    const next = new Set<string>();
    for (const id of selectedState) {
      if (visibleRowIds.has(id)) next.add(id);
      else mutated = true;
    }
    return mutated ? next : selectedState;
  }, [selectedState, visibleRowIds]);

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected]
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    anchorRef.current = id;
  }, []);

  // Range toggle relative to the last-clicked anchor. If no anchor yet,
  // treat the click as a single toggle so users don't get a no-op.
  const setRange = useCallback(
    (id: string) => {
      const anchor = anchorRef.current;
      if (!anchor) {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        anchorRef.current = id;
        return;
      }
      const startIdx = rowIds.indexOf(anchor);
      const endIdx = rowIds.indexOf(id);
      if (startIdx < 0 || endIdx < 0) return;
      const [from, to] =
        startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      setSelected((prev) => {
        const next = new Set(prev);
        for (let i = from; i <= to; i += 1) {
          const rowId = rowIds[i];
          if (rowId) next.add(rowId);
        }
        return next;
      });
    },
    [rowIds]
  );

  const clear = useCallback(() => {
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
    anchorRef.current = null;
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(rowIds));
  }, [rowIds]);

  // Long-press to enter selection mode on touch. Triggers when the press
  // lasts >500ms without releasing or moving away. Cancel resets the
  // pending timer — used on touchmove/touchend/pointerleave.
  const longPressBegin = useCallback(
    (id: string) => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        setSelected((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        anchorRef.current = id;
        // Haptic hint if the runtime supports it; silent failure is OK.
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            (navigator as Navigator).vibrate?.(10);
          } catch {
            /* noop */
          }
        }
      }, 500);
    },
    []
  );

  const longPressCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    },
    []
  );

  const value = useMemo<InboxBulkContextValue>(
    () => ({
      selected,
      selectionMode: selected.size > 0,
      isSelected,
      toggle,
      setRange,
      clear,
      selectAll,
      longPressBegin,
      longPressCancel
    }),
    [
      selected,
      isSelected,
      toggle,
      setRange,
      clear,
      selectAll,
      longPressBegin,
      longPressCancel
    ]
  );

  return (
    <InboxBulkContext.Provider value={value}>
      {children}
    </InboxBulkContext.Provider>
  );
}
