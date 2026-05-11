"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  reloadFallbackMs?: number;
};

export function RealtimeRefresh({
  channelName,
  targets,
  debounceMs = 600,
  pollMs,
  reloadFallbackMs = 0
}: RealtimeRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [refreshCount, setRefreshCount] = useState(0);
  const targetKey = JSON.stringify(targets);

  useEffect(() => {
    const supabase = createClient();
    let reloadFallback: ReturnType<typeof setTimeout> | null = null;
    const cancelReloadFallback = () => {
      if (!reloadFallback) return;
      clearTimeout(reloadFallback);
      reloadFallback = null;
    };
    const { cancel, schedule } = createDebouncedRefresh(() => {
      if (document.visibilityState !== "visible") return;
      setRefreshCount((count) => count + 1);
      startTransition(() => router.refresh());
      cancelReloadFallback();
      if (reloadFallbackMs > 0) {
        reloadFallback = setTimeout(() => {
          reloadFallback = null;
          if (document.visibilityState === "visible") {
            window.location.reload();
          }
        }, reloadFallbackMs);
      }
    }, debounceMs);
    const parsedTargets = JSON.parse(targetKey) as RealtimeRefreshTarget[];
    const channel = supabase.channel(channelName);
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

    channel.subscribe();

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
    const syncPolling = () => {
      if (document.visibilityState === "visible") {
        startPolling();
        return;
      }

      stopPolling();
    };

    syncPolling();
    document.addEventListener("visibilitychange", syncPolling);

    return () => {
      cancel();
      cancelReloadFallback();
      stopPolling();
      document.removeEventListener("visibilitychange", syncPolling);
      void supabase.removeChannel(channel);
    };
  }, [
    channelName,
    debounceMs,
    pollMs,
    reloadFallbackMs,
    router,
    startTransition,
    targetKey
  ]);

  return (
    <span
      data-realtime-channel={channelName}
      data-realtime-refresh-count={refreshCount}
      hidden
    />
  );
}
