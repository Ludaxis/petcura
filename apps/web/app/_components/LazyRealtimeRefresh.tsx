"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { RealtimeRefresh as RealtimeRefreshComponent } from "./RealtimeRefresh";

/**
 * Lazy wrapper for `RealtimeRefresh`. The underlying component imports
 * `@supabase/ssr` → `@supabase/realtime-js`, which drags ~500 KB of Buffer
 * polyfill + websocket plumbing into whichever route mounts it. Pulling
 * those out of the route's first-load JS and into a post-hydration chunk
 * is the single biggest bundle win on /inbox, /requests/[id], and
 * /reminders.
 *
 * The realtime channel + debounced router.refresh aren't on the critical
 * path for first paint — the page already SSR'd the latest list. Coming
 * online 100–300 ms after hydration is invisible to the user.
 *
 * `loading: () => null` keeps the wrapper invisible (no skeleton — the
 * RealtimeRefresh itself only renders a hidden marker + a top progress
 * bar that fires on refresh). `ssr: false` matches what was already
 * effectively true for the inner component, which only does work in
 * useEffect.
 */
const InnerRealtimeRefresh = dynamic(
  () =>
    import("./RealtimeRefresh").then((mod) => ({
      default: mod.RealtimeRefresh
    })),
  { ssr: false, loading: () => null }
);

export function LazyRealtimeRefresh(
  props: ComponentProps<typeof RealtimeRefreshComponent>
) {
  return <InnerRealtimeRefresh {...props} />;
}
