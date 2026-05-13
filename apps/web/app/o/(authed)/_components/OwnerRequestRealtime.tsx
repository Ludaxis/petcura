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
    const channel = supabase
      .channel(`owner-request-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [requestId, router]);

  return null;
}
