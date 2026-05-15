"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, Archive, Building2, Users } from "lucide-react";
import { Spinner, TopProgressBar, cn } from "@petcura/ui";

type SettingsTab = "team" | "archived" | "activity" | "clinic";

type SettingsTabsProps = {
  activeTab: SettingsTab;
  ariaLabel: string;
  loadingLabel: string;
  tabs: Array<{
    count?: number;
    href: string;
    id: SettingsTab;
    label: string;
  }>;
};

const TAB_ICONS = {
  team: Users,
  archived: Archive,
  activity: Activity,
  clinic: Building2
} satisfies Record<SettingsTab, typeof Users>;

export function SettingsTabs({
  activeTab,
  ariaLabel,
  loadingLabel,
  tabs
}: SettingsTabsProps) {
  const [pending, setPending] = useState<{
    from: SettingsTab;
    to: SettingsTab;
  } | null>(null);
  const pendingTab = pending?.from === activeTab ? pending.to : null;

  return (
    <>
      <TopProgressBar active={Boolean(pendingTab)} label={loadingLabel} />
      <nav
        aria-busy={pendingTab ? true : undefined}
        aria-label={ariaLabel}
        className="flex flex-wrap gap-2 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-2 shadow-sm"
      >
        {pendingTab ? (
          <span className="sr-only" role="status">
            {loadingLabel}
          </span>
        ) : null}
        {tabs.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = activeTab === tab.id;
          const isPending = pendingTab === tab.id && !isActive;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius)] px-3 text-sm font-semibold transition",
                isPending && "opacity-80",
                isActive
                  ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                  : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]"
              )}
              href={tab.href}
              key={tab.id}
              prefetch={false}
              onClick={(event) => {
                if (
                  isActive ||
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
              {isPending ? (
                <Spinner size={16} label={loadingLabel} />
              ) : (
                <Icon aria-hidden="true" size={16} />
              )}
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 font-mono text-[10.5px]">
                  {tab.count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
