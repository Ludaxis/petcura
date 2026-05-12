"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { BoardDndProviderProps } from "./BoardDndTypes";
import { BoardSkeleton } from "./InboxStates";

/**
 * Lazy wrapper for `BoardDndProvider`. The board view pulls in
 * `@dnd-kit/core` + `@dnd-kit/sortable` (~73 KB combined) plus a handful
 * of Radix tooltip primitives for the drag affordances. Most staff land
 * on the default list view (`?view=list`), so we keep the dnd bundle out
 * of the inbox first-load JS and stream it in only when the user
 * actually picks `?view=board`.
 *
 * Why not `next/dynamic` here? When a server component renders a `next/
 * dynamic` boundary, Turbopack registers both the wrapper *and* the
 * target module as top-level client modules — they get attributed to
 * the route's first-load JS in the RSC manifest even though they don't
 * actually run at SSR. Doing the import inside a client useEffect (the
 * same pattern the LazyCommandPalette uses) keeps `./BoardDndProvider`
 * out of the route's clientModules entirely and into a route-disjoint
 * chunk that is fetched only when this wrapper renders.
 *
 * The BoardSkeleton fallback matches the SSR'd skeleton geometry so the
 * swap from skeleton to the real board doesn't shift layout.
 */
export function LazyBoardDndProvider(props: BoardDndProviderProps) {
  const [Component, setComponent] =
    useState<ComponentType<BoardDndProviderProps> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import("./BoardDndProvider").then((mod) => {
      if (cancelled) return;
      setComponent(() => mod.BoardDndProvider);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Component) return <BoardSkeleton />;
  return <Component {...props} />;
}
