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
};

export function RealtimeRefresh({
  channelName,
  targets,
  debounceMs = 600,
  pollMs
}: RealtimeRefreshProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [refreshCount, setRefreshCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("initializing");
  const targetKey = JSON.stringify(targets);

  useEffect(() => {
    const supabase = createClient();
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const { cancel, schedule } = createDebouncedRefresh(() => {
      if (document.visibilityState !== "visible") return;
      setRefreshCount((count) => count + 1);
      startTransition(() => router.refresh());
    }, debounceMs);
    const parsedTargets = JSON.parse(targetKey) as RealtimeRefreshTarget[];

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
        schedule();
        startPolling();
        return;
      }

      stopPolling();
    };

    async function subscribe() {
      const { data } = await supabase.auth.getSession();
      if (disposed) return;
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }

      channel = supabase.channel(channelName);
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

      channel.subscribe((status) => {
        setSubscriptionStatus(status);
      });
    }

    void subscribe();
    syncPolling();
    document.addEventListener("visibilitychange", syncPolling);

    return () => {
      disposed = true;
      cancel();
      stopPolling();
      document.removeEventListener("visibilitychange", syncPolling);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, pollMs, router, startTransition, targetKey]);

  return (
    <span
      data-realtime-channel={channelName}
      data-realtime-refresh-count={refreshCount}
      data-realtime-status={subscriptionStatus}
      hidden
    />
  );
}
