"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { MobileMeSheetProps } from "./MobileMeSheetTypes";

/**
 * Mobile "me" sheet (avatar tap on the bottom-nav) opens lazily. The real
 * implementation imports the Radix Sheet primitive plus a stack of theme /
 * locale controls, none of which need to ship on the desktop critical path
 * (the sheet is `md:hidden` and the open trigger is the mobile bottom-nav
 * Me tab).
 *
 * The trigger is the existing `petcura:open-me-sheet` window event already
 * dispatched from MobileBottomNav. The wrapper listens for it; on first
 * dispatch we fetch the chunk and mount the real component, which then
 * listens for subsequent events itself.
 *
 * Pattern mirrors LazyCommandPalette — a plain `import()` inside a client
 * useEffect (instead of `next/dynamic`) keeps the heavy Sheet primitive
 * out of the route's first-load JS, even though we cross a server-to-
 * client boundary here.
 */

export function LazyMobileMeSheet(props: MobileMeSheetProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [Component, setComponent] =
    useState<ComponentType<MobileMeSheetProps> | null>(null);

  // Listen for the open event ourselves. Once we hear it, we set shouldLoad
  // and stash a flag so the real sheet can auto-open as soon as it mounts.
  useEffect(() => {
    if (shouldLoad) return;
    if (typeof window === "undefined") return;
    const onOpen = () => {
      (window as unknown as { __pcMeSheetPending?: boolean }).__pcMeSheetPending =
        true;
      setShouldLoad(true);
    };
    window.addEventListener("petcura:open-me-sheet", onOpen as EventListener);
    return () =>
      window.removeEventListener(
        "petcura:open-me-sheet",
        onOpen as EventListener
      );
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || Component) return;
    let cancelled = false;
    void import("./MobileMeSheet").then((mod) => {
      if (cancelled) return;
      // The real MobileMeSheet checks `__pcMeSheetPending` on mount and
      // opens itself if it was set, so we don't need to re-dispatch the
      // event from here.
      setComponent(() => mod.MobileMeSheet);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, Component]);

  if (!Component) return null;
  return <Component {...props} />;
}
