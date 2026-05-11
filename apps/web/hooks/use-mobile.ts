"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Tracks the viewport's narrow-mode breakpoint. Used by the shadcn Sidebar
 * to switch between persistent rail and Sheet behavior.
 *
 * Implementation notes:
 *   - We feed `useSyncExternalStore` so the initial render matches the
 *     subscription source without a redundant setState inside an effect
 *     (which the React 19 lint rule flags).
 *   - Server snapshot defaults to `false`; the rail is the right SSR shape
 *     for clinic desktops which are our primary surface.
 */
function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getClientSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}
