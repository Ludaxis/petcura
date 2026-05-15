"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import { Spinner, cn } from "@petcura/ui";
import type { ReminderFilter } from "@/lib/reminders";

type ReminderTabsProps = {
  activeFilter: ReminderFilter;
  ariaLabel: string;
  loadingLabel: string;
  tabs: Array<{
    count: number;
    href: string;
    id: ReminderFilter;
    label: string;
  }>;
};

const FILTER_ICONS = {
  all: Bell,
  scheduled: Clock,
  sent: Send,
  acknowledged: CheckCircle2,
  missed: Clock,
  completed: CheckCircle2,
  cancelled: XCircle
} satisfies Record<ReminderFilter, typeof Bell>;

export function ReminderTabs({
  activeFilter,
  ariaLabel,
  loadingLabel,
  tabs
}: ReminderTabsProps) {
  const [pending, setPending] = useState<{
    from: ReminderFilter;
    to: ReminderFilter;
  } | null>(null);
  const pendingFilter = pending?.from === activeFilter ? pending.to : null;

  return (
    <nav
      aria-busy={pendingFilter ? true : undefined}
      aria-label={ariaLabel}
      className="mt-4 flex gap-2 overflow-x-auto pb-1"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeFilter;
        const pending = pendingFilter === tab.id && !active;
        const Icon = FILTER_ICONS[tab.id];

        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch={false}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition",
              pending && "opacity-80",
              active
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--paper)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--ink-2)] hover:bg-[var(--soft)]"
            )}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (
                active ||
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              setPending({ from: activeFilter, to: tab.id });
            }}
          >
            {pending ? (
              <Spinner size={14} label={loadingLabel} />
            ) : (
              <Icon aria-hidden="true" size={14} />
            )}
            {tab.label}
            <span
              className={active ? "text-[var(--paper)]" : "text-[var(--muted)]"}
            >
              {tab.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
