"use client";

import {
  useEffect,
  useState,
  type ComponentType
} from "react";
import type { InboxBulkLayerLabels } from "./InboxBulkLayer";

export type LazyInboxBulkLayerProps = {
  locale: string;
  rowIds: string[];
  labels: InboxBulkLayerLabels;
};

/**
 * Lazy wrapper for InboxBulkLayer. The bulk layer ships the Radix
 * Checkbox primitive (BubbleInput, CheckedChange, etc.) plus a portal
 * stack and a long-press / shift-click engine — none of which need to
 * be on the /inbox critical path. Selection only starts on:
 *
 *   - Shift+Click on a row
 *   - Long-press (>500 ms pointerdown) on a row
 *   - Cmd/Ctrl+A inside the inbox list
 *
 * We defer the chunk until the first user interaction that could
 * conceivably start a selection. To stay safe, we hook a one-shot
 * pointerdown / keydown listener at the window level; the first event
 * triggers the import. After mount, the real InboxBulkLayer owns the
 * gestures from then on.
 *
 * Pattern mirrors `LazyInboxShortcutSheet` — plain `import()` inside an
 * effect, not `next/dynamic`, so Turbopack does not attribute the chunk
 * to /inbox's first-load JS budget.
 */
export function LazyInboxBulkLayer(props: LazyInboxBulkLayerProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [Component, setComponent] =
    useState<ComponentType<LazyInboxBulkLayerProps> | null>(null);

  // First-input gate. We listen at the document level (passive, capture)
  // for any pointerdown / keydown — the first one flips `shouldLoad`.
  // After that the real layer handles everything; we never re-arm.
  useEffect(() => {
    if (shouldLoad) return;
    if (typeof window === "undefined") return;

    const trigger = () => {
      setShouldLoad(true);
    };

    // Capture so we win the race with the row Link's click handler.
    document.addEventListener("pointerdown", trigger, {
      capture: true,
      once: true,
      passive: true
    });
    document.addEventListener("keydown", trigger, {
      capture: true,
      once: true,
      passive: true
    });

    return () => {
      // `once: true` removes the listener on first fire; this cleanup
      // covers the unmount-before-fire path.
      document.removeEventListener("pointerdown", trigger, {
        capture: true
      });
      document.removeEventListener("keydown", trigger, {
        capture: true
      });
    };
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || Component) return;
    let cancelled = false;
    void import("./InboxBulkLayer").then((mod) => {
      if (cancelled) return;
      setComponent(() => mod.InboxBulkLayer);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, Component]);

  if (!Component) return null;
  return <Component {...props} />;
}
