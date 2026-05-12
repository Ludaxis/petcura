"use client";

import { useOptimistic } from "react";
import type { ThreadMessage } from "@/app/requests/[id]/_components/Thread";

/**
 * Optimistic message append helpers for the request detail composer.
 *
 * The clinic-side composer round-trips through a server action which
 * redirects on completion (~1.4s in the field). During that window the
 * staff member sees nothing in the thread, which feels broken. This
 * helper bridges the gap with React 19's `useOptimistic`:
 *
 *   1. Composer calls `appendOptimistic(text)` inside a transition.
 *   2. The merged messages list immediately contains a sage-tinted,
 *      `_pending: true` bubble so the user has visual confirmation.
 *   3. When the transition ends — successful server redirect re-streams
 *      the canonical thread, or an `?action_error=` redirect re-renders
 *      the same page — `useOptimistic` discards the optimistic state and
 *      we fall back to the seed.
 *
 * Rollback path: there is no explicit revert call needed. Because the
 * server action ALWAYS redirects (success or error), the transition
 * always settles, and `useOptimistic` always returns to the seed. On
 * error, the parent shell announces via the existing `initialAnnouncement`
 * toast pipeline (driven by `?action_error=`), so the disappearing bubble
 * is paired with an aria-live failure message.
 */
export type OptimisticMessage = ThreadMessage & {
  /** Stable id for keys + a11y; never matches a real DB id. */
  _optimisticId: string;
  /** Marker the thread reads to render the sage-tinted "Sending…" bubble. */
  _pending: true;
};

export function isOptimisticMessage(
  msg: ThreadMessage | OptimisticMessage
): msg is OptimisticMessage {
  return (msg as Partial<OptimisticMessage>)._pending === true;
}

type OptimisticAction = {
  type: "append";
  body: string;
  optimisticId: string;
  createdAt: string;
};

function reducer(
  state: ReadonlyArray<ThreadMessage | OptimisticMessage>,
  action: OptimisticAction
): Array<ThreadMessage | OptimisticMessage> {
  if (action.type === "append") {
    const optimistic: OptimisticMessage = {
      id: action.optimisticId,
      _optimisticId: action.optimisticId,
      _pending: true,
      senderType: "staff",
      body: action.body,
      bodyTranslated: null,
      sourceLocale: null,
      createdAt: action.createdAt,
      deliveryStatus: null,
      deliveryProvider: null,
      deliveryUpdatedAt: null
    };
    return [...state, optimistic];
  }
  return [...state];
}

/**
 * React 19 hook backing the composer's optimistic append. Returns the
 * merged messages list and a typed `appendOptimistic(text)` callback that
 * MUST be invoked inside a `startTransition` / form action; otherwise
 * React will throw the "useOptimistic outside transition" error.
 */
export function useOptimisticMessages(
  seed: ReadonlyArray<ThreadMessage>
): readonly [
  ReadonlyArray<ThreadMessage | OptimisticMessage>,
  (body: string) => void
] {
  const [merged, dispatch] = useOptimistic<
    ReadonlyArray<ThreadMessage | OptimisticMessage>,
    OptimisticAction
  >(seed, reducer);

  const appendOptimistic = (body: string) => {
    const optimisticId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? `optimistic-${crypto.randomUUID()}`
        : `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({
      type: "append",
      body,
      optimisticId,
      createdAt: new Date().toISOString()
    });
  };

  return [merged, appendOptimistic] as const;
}
