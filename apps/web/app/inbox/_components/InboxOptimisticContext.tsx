"use client";

import { useSyncExternalStore } from "react";

/**
 * Module-level optimistic-resolve store for the inbox list.
 *
 * Why module-level instead of React context: the inbox rows are rendered by
 * `InboxStreamContent` (an async server component) while the action call
 * sites — `InboxKeyboard`'s `E` shortcut and `CommandPalette`'s
 * "Resolve current" — live inside `InboxClientShell`. The two React trees
 * never share a provider, so we publish optimistic intent through a tiny
 * external store that any client component can subscribe to via
 * `useSyncExternalStore`.
 *
 * Lifecycle:
 *
 *   1. The keyboard or palette calls `markOptimisticallyResolved(id)` before
 *      awaiting `resolveInboxRequest`.
 *   2. Subscribed `InboxRow` components re-render with the row's id in the
 *      set: the status pill flips to `resolved` immediately, and at 200ms
 *      the row dims to 60% opacity with a soft sage glow (or snaps to dim
 *      immediately when `prefers-reduced-motion: reduce`).
 *   3. On success, the caller awaits the server action, then runs
 *      `router.refresh()`. After the refresh re-streams the canonical
 *      list, the caller calls `clearOptimisticallyResolved(id)` so the
 *      optimistic overlay drops back to the canonical state.
 *   4. On error, the caller calls `clearOptimisticallyResolved(id)` to
 *      roll back the optimistic flip. The existing aria-live mechanism in
 *      `InboxKeyboard` / `InboxBulkLayer` announces the failure.
 *
 * The store is intentionally a simple `Set<string>` snapshot. Snapshot
 * identity changes only when membership changes, so unrelated rows do not
 * re-render. The empty server snapshot keeps SSR deterministic.
 */
type Listener = () => void;

let currentSnapshot: ReadonlySet<string> = new Set();
const listeners = new Set<Listener>();
const EMPTY_SET: ReadonlySet<string> = new Set();

function emit(next: Set<string>) {
  currentSnapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ReadonlySet<string> {
  return currentSnapshot;
}

// SSR snapshot is a stable empty set — `useSyncExternalStore` requires the
// server snapshot to be referentially stable to avoid hydration mismatches.
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

/**
 * Add a row id to the optimistic-resolved set. Idempotent — re-marking the
 * same id is a no-op. Must be paired with a `clearOptimisticallyResolved`
 * call on either success (after refresh) or error (to roll back).
 */
export function markOptimisticallyResolved(id: string): void {
  if (currentSnapshot.has(id)) return;
  const next = new Set(currentSnapshot);
  next.add(id);
  emit(next);
}

/**
 * Remove a row id from the optimistic-resolved set. Idempotent — clearing
 * an id that is not in the set is a no-op.
 */
export function clearOptimisticallyResolved(id: string): void {
  if (!currentSnapshot.has(id)) return;
  const next = new Set(currentSnapshot);
  next.delete(id);
  emit(next);
}

/**
 * Hook for a single inbox row. Returns `true` while the row is in the
 * optimistic-resolved set. Subscribes via `useSyncExternalStore` so only
 * the affected row re-renders when membership flips.
 */
export function useIsOptimisticallyResolved(id: string): boolean {
  const set = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return set.has(id);
}
