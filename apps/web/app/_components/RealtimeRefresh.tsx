"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TopProgressBar } from "@petcura/ui";
import { createClient } from "@/lib/supabase/client";
import {
  createDebouncedRefresh,
  type RealtimeRefreshTarget
} from "@/lib/realtime-refresh";

type RealtimeRefreshProps = {
  channelName: string;
  targets: RealtimeRefreshTarget[];
  debounceMs?: number;
  pollMs?: number;
  /**
   * When true (default), renders a 2px sage top progress bar while the
   * debounced `router.refresh()` is in flight. Set to false on detail panes
   * where another RealtimeRefresh on the same page already owns the bar.
   */
  showProgress?: boolean;
};

export function RealtimeRefresh({
  channelName,
  targets,
  debounceMs = 600,
  pollMs,
  showProgress = true
}: RealtimeRefreshProps) {
  const router = useRouter();
  const [refreshCount, setRefreshCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("idle");
  // useTransition makes `isPending` true while React replays the server
  // render after router.refresh(). We expose that as a thin sage progress bar
  // so the realtime path has a visible signal (otherwise live updates feel
  // ghostly — content swaps without any indication something happened).
  const [isRefreshing, startRefreshTransition] = useTransition();
  const targetKey = JSON.stringify(targets);

  useEffect(() => {
    const supabase = createClient();
    const { cancel, schedule } = createDebouncedRefresh(() => {
      setRefreshCount((count) => count + 1);
      startRefreshTransition(() => {
        router.refresh();
      });
    }, debounceMs);
    const parsedTargets = JSON.parse(targetKey) as RealtimeRefreshTarget[];
    const channel = supabase.channel(channelName);
    let disposed = false;
    const onPostgresChanges = channel.on.bind(channel) as (
      event: "postgres_changes",
      filter: {
        event: "*" | "INSERT" | "UPDATE" | "DELETE";
        schema: "public";
        table: string;
        filter?: string;
      },
      callback: () => void
    ) => typeof channel;

    for (const target of parsedTargets) {
      const postgresFilter: {
        event: "*" | "INSERT" | "UPDATE" | "DELETE";
        schema: "public";
        table: string;
        filter?: string;
      } = {
        event: target.event ?? "*",
        schema: target.schema ?? "public",
        table: target.table
      };

      if (target.filter) {
        postgresFilter.filter = target.filter;
      }

      onPostgresChanges("postgres_changes", postgresFilter, schedule);
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (disposed) return;
      const accessToken = data.session?.access_token;
      if (accessToken) {
        supabase.realtime.setAuth(accessToken);
      }

      channel.subscribe((status) => {
        setSubscriptionStatus(status);
      });
    });

    let interval: ReturnType<typeof setInterval> | null = null;
    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };
    const startPolling = () => {
      if (!pollMs || pollMs <= 0 || interval) return;
      interval = setInterval(() => {
        schedule();
      }, pollMs);
    };
    startPolling();

    return () => {
      disposed = true;
      cancel();
      stopPolling();
      void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, pollMs, router, targetKey]);

  return (
    <>
      {showProgress ? (
        <TopProgressBar active={isRefreshing} label="Updating" />
      ) : null}
      <span
        data-realtime-channel={channelName}
        data-realtime-refresh-count={refreshCount}
        data-realtime-status={subscriptionStatus}
        data-realtime-pending={isRefreshing ? "true" : "false"}
        hidden
      />
    </>
  );
}
