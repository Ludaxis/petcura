"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@petcura/ui";
import type { InboxStream } from "@/lib/inbox/queries";

type StreamFilterProps = {
  stream: InboxStream;
  counts: Record<InboxStream, number>;
  labels: Record<InboxStream, string>;
  groupLabel: string;
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

export function StreamFilter({
  stream,
  counts,
  labels,
  groupLabel
}: StreamFilterProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const groupRef = useRef<HTMLDivElement>(null);

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

  // Per WAI-ARIA radiogroup pattern: Left/Right and Up/Down move and select.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown"
    ) {
      return;
    }
    event.preventDefault();
    const currentIndex = Math.max(0, ORDER.indexOf(stream));
    const direction =
      event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    const next =
      ORDER[(currentIndex + direction + ORDER.length) % ORDER.length] ??
      stream;
    setStream(next);
    requestAnimationFrame(() => {
      groupRef.current
        ?.querySelector<HTMLButtonElement>(`[data-stream="${next}"]`)
        ?.focus();
    });
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={groupLabel}
      onKeyDown={onKeyDown}
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
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-stream={value}
            onClick={() => setStream(value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
              active
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)] hover:border-[var(--ink-2)] hover:text-[var(--ink)]"
            )}
          >
            {active ? (
              <Check
                aria-hidden="true"
                size={11}
                className="-ml-0.5 text-[var(--primary)]"
              />
            ) : null}
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
