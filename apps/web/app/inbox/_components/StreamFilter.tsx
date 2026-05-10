"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@petcura/ui";
import type { InboxStream } from "@/lib/inbox/queries";

type StreamFilterProps = {
  stream: InboxStream;
  counts: Record<InboxStream, number>;
  labels: Record<InboxStream, string>;
};

const ORDER: InboxStream[] = [
  "all",
  "urgent",
  "today",
  "week",
  "routine",
  "mine",
  "unassigned"
];

export function StreamFilter({ stream, counts, labels }: StreamFilterProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setStream = (next: InboxStream) => {
    const sp = new URLSearchParams(params.toString());
    if (next === "all") sp.delete("stream");
    else sp.set("stream", next);
    const query = sp.toString();
    startTransition(() => {
      router.push(query.length > 0 ? `/inbox?${query}` : "/inbox", {
        scroll: false
      });
    });
  };

  return (
    <div
      role="tablist"
      aria-label="Inbox streams"
      className="-mx-2 flex items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      data-pending={isPending ? "true" : undefined}
    >
      {ORDER.map((value) => {
        const active = stream === value;
        const count = counts[value] ?? 0;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            data-stream={value}
            onClick={() => setStream(value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition",
              active
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--ink-2)] hover:text-[var(--ink)]"
            )}
          >
            <span>{labels[value]}</span>
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] tabular-nums",
                active
                  ? "bg-[var(--primary)] text-[var(--paper)]"
                  : "bg-[var(--soft)] text-[var(--muted-2)]"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
