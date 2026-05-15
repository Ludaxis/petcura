"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Building2, Inbox, Users } from "lucide-react";
import { Button, Spinner, TopProgressBar, cn } from "@petcura/ui";

type AdminTab = "leads" | "clinics" | "staff" | "activity";

type AdminTabsProps = {
  activeTab: AdminTab;
  ariaLabel: string;
  loadingLabel: string;
  tabs: Array<{
    count: number;
    href: string;
    id: AdminTab;
    label: string;
  }>;
};

const TAB_ICONS = {
  leads: Inbox,
  clinics: Building2,
  staff: Users,
  activity: Activity
} satisfies Record<AdminTab, typeof Inbox>;

export function AdminTabs({
  activeTab,
  ariaLabel,
  loadingLabel,
  tabs
}: AdminTabsProps) {
  const [pending, setPending] = useState<{
    from: AdminTab;
    to: AdminTab;
  } | null>(null);
  const pendingTab = pending?.from === activeTab ? pending.to : null;

  return (
    <>
      <TopProgressBar active={Boolean(pendingTab)} label={loadingLabel} />
      <nav
        aria-busy={pendingTab ? true : undefined}
        aria-label={ariaLabel}
        className="flex flex-wrap gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-1"
      >
        {pendingTab ? (
          <span className="sr-only" role="status">
            {loadingLabel}
          </span>
        ) : null}
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const pending = pendingTab === tab.id && !active;
          const Icon = TAB_ICONS[tab.id];

          return (
            <Button
              asChild
              className={cn(
                "min-w-[8rem]",
                active && "shadow-sm",
                pending && "opacity-80"
              )}
              key={tab.id}
              size="sm"
              variant={active ? "primary" : "ghost"}
            >
              <Link
                href={tab.href}
                prefetch={false}
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
                  setPending({ from: activeTab, to: tab.id });
                }}
              >
                {pending ? (
                  <Spinner size={14} label={loadingLabel} />
                ) : (
                  <Icon aria-hidden="true" size={15} />
                )}
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    active
                      ? "bg-white/20 text-[var(--paper)]"
                      : "bg-[var(--soft)] text-[var(--muted)]"
                  )}
                >
                  {tab.count}
                </span>
              </Link>
            </Button>
          );
        })}
      </nav>
    </>
  );
}
