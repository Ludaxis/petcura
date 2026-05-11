"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [refreshCount, setRefreshCount] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("idle");
  const targetKey = JSON.stringify(targets);

  useEffect(() => {
    const supabase = createClient();
    const { cancel, schedule } = createDebouncedRefresh(() => {
      setRefreshCount((count) => count + 1);
      router.refresh();
      const href = searchKey ? `${pathname}?${searchKey}` : pathname;
      router.replace(href, { scroll: false });
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
  }, [channelName, debounceMs, pathname, pollMs, router, searchKey, targetKey]);

  return (
    <span
      data-realtime-channel={channelName}
      data-realtime-refresh-count={refreshCount}
      data-realtime-status={subscriptionStatus}
      hidden
    />
  );
}
