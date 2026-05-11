"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import { LayoutGrid, List, Rows3, Rows4 } from "lucide-react";
import { cn } from "@petcura/ui";
import type { InboxView } from "@/lib/inbox/queries";

type Density = "comfortable" | "compact";

type Props = {
  view: InboxView;
  density: Density;
  labels: {
    list: string;
    board: string;
    comfortable: string;
    compact: string;
    viewGroup: string;
    densityGroup: string;
  };
};

const VIEW_ORDER: InboxView[] = ["list", "board"];
const DENSITY_ORDER: Density[] = ["comfortable", "compact"];

function nextInOrder<T>(order: T[], current: T, key: string): T {
  const i = order.indexOf(current);
  if (i < 0) return current;
  const direction =
    key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
  return order[(i + direction + order.length) % order.length] ?? current;
}

export function InboxToolbarControls({ view, density, labels }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const viewGroupRef = useRef<HTMLDivElement>(null);
  const densityGroupRef = useRef<HTMLDivElement>(null);

  const update = (next: { view?: InboxView; density?: Density }) => {
    const sp = new URLSearchParams(params.toString());
    if (next.view !== undefined) {
      if (next.view === "list") sp.delete("view");
      else sp.set("view", next.view);
    }
    if (next.density !== undefined) {
      if (next.density === "comfortable") sp.delete("density");
      else sp.set("density", next.density);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs.length > 0 ? `/inbox?${qs}` : "/inbox", { scroll: false });
    });
  };

  const onViewKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "ArrowUp" &&
      e.key !== "ArrowDown"
    )
      return;
    e.preventDefault();
    const next = nextInOrder(VIEW_ORDER, view, e.key);
    update({ view: next });
    requestAnimationFrame(() => {
      viewGroupRef.current
        ?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)
        ?.focus();
    });
  };

  const onDensityKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "ArrowUp" &&
      e.key !== "ArrowDown"
    )
      return;
    e.preventDefault();
    const next = nextInOrder(DENSITY_ORDER, density, e.key);
    update({ density: next });
    requestAnimationFrame(() => {
      densityGroupRef.current
        ?.querySelector<HTMLButtonElement>(`[data-density="${next}"]`)
        ?.focus();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div
        ref={viewGroupRef}
        role="radiogroup"
        aria-label={labels.viewGroup}
        onKeyDown={onViewKeyDown}
        className="inline-flex items-center gap-0.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5"
      >
        <button
          type="button"
          role="radio"
          aria-checked={view === "list"}
          tabIndex={view === "list" ? 0 : -1}
          aria-label={labels.list}
          title={labels.list}
          data-view="list"
          onClick={() => update({ view: "list" })}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-[11.5px] font-medium transition-colors",
            view === "list"
              ? "bg-[var(--ink)] text-[var(--paper)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <List aria-hidden="true" size={13} />
          {labels.list}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={view === "board"}
          tabIndex={view === "board" ? 0 : -1}
          aria-label={labels.board}
          title={labels.board}
          data-view="board"
          onClick={() => update({ view: "board" })}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2 text-[11.5px] font-medium transition-colors",
            view === "board"
              ? "bg-[var(--ink)] text-[var(--paper)]"
              : "text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <LayoutGrid aria-hidden="true" size={13} />
          {labels.board}
        </button>
      </div>

      <div
        ref={densityGroupRef}
        role="radiogroup"
        aria-label={labels.densityGroup}
        onKeyDown={onDensityKeyDown}
        className="hidden items-center gap-0.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5 sm:inline-flex"
      >
        <button
          type="button"
          role="radio"
          aria-checked={density === "comfortable"}
          tabIndex={density === "comfortable" ? 0 : -1}
          aria-label={labels.comfortable}
          title={labels.comfortable}
          data-density="comfortable"
          onClick={() => update({ density: "comfortable" })}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-[5px] border transition-colors",
            density === "comfortable"
              ? "border-[var(--primary)] bg-[var(--soft)] text-[var(--ink)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Rows3 aria-hidden="true" size={13} />
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={density === "compact"}
          tabIndex={density === "compact" ? 0 : -1}
          aria-label={labels.compact}
          title={labels.compact}
          data-density="compact"
          onClick={() => update({ density: "compact" })}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-[5px] border transition-colors",
            density === "compact"
              ? "border-[var(--primary)] bg-[var(--soft)] text-[var(--ink)]"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          )}
        >
          <Rows4 aria-hidden="true" size={13} />
        </button>
      </div>
    </div>
  );
}
