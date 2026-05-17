"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOwnerBrowserClient } from "@/lib/supabase/owner-client";

type Props = {
  requestId: string;
};

export function OwnerRequestRealtime({ requestId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createOwnerBrowserClient();
    const refresh = () => {
      router.refresh();
    };
    const channel = supabase.channel(`owner-request-${requestId}`);

    for (const table of [
      "messages",
      "requests",
      "appointments",
      "appointment_slot_offers"
    ]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `request_id=eq.${requestId}`
        },
        refresh
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, router]);

  return null;
}
