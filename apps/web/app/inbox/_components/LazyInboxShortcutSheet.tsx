"use client";

import { useEffect, useState, type ComponentType } from "react";

type Shortcut = {
  keys: string;
  description: string;
};

export type LazyInboxShortcutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
  labels: {
    sheetTitle: string;
    close: string;
  };
};

/**
 * Lazy wrapper for InboxShortcutSheet. Keeps the Radix Dialog primitives
 * (DismissableLayer, FocusScope, RemoveScroll, Portal) out of /inbox
 * first-load JS — they only need to ship when the user actually opens
 * the "?" shortcut overlay.
 *
 * We use a manual `import()` inside useEffect (the same pattern the
 * LazyCommandPalette uses) instead of `next/dynamic`. With Turbopack +
 * App Router, `next/dynamic` only defers runtime execution; the target
 * module still ends up registered as a top-level client module in the
 * RSC manifest and is attributed to the route's first-load JS bundle
 * budget. A plain `import()` inside an effect keeps the target out of
 * the route's clientModules list entirely.
 *
 * The eager keyboard handler in InboxKeyboard / RequestKeyboard still
 * owns the "?" press; pressing it flips `open` to true, which mounts
 * this wrapper, which resolves the dynamic chunk, which renders the
 * Dialog open. The chunk also begins loading once the wrapper mounts at
 * `open=false` is not required — we delay the import until first open.
 */
export function LazyInboxShortcutSheet(props: LazyInboxShortcutSheetProps) {
  const [Component, setComponent] =
    useState<ComponentType<LazyInboxShortcutSheetProps> | null>(null);

  useEffect(() => {
    if (!props.open || Component) return;
    let cancelled = false;
    void import("./InboxShortcutSheet").then((mod) => {
      if (cancelled) return;
      setComponent(() => mod.InboxShortcutSheet);
    });
    return () => {
      cancelled = true;
    };
  }, [props.open, Component]);

  if (!Component) return null;
  return <Component {...props} />;
}
