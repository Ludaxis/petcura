"use client";

import Link from "next/link";
import { useState } from "react";
import { PawPrint, UserRound } from "lucide-react";
import { Button, Spinner, cn } from "@petcura/ui";

type DirectoryTab = "owners" | "pets";

type DirectoryTabsProps = {
  activeTab: DirectoryTab;
  tabs: Array<{
    id: DirectoryTab;
    href: string;
    label: string;
  }>;
  loadingLabel: string;
};

export function DirectoryTabs({
  activeTab,
  tabs,
  loadingLabel
}: DirectoryTabsProps) {
  const [pending, setPending] = useState<{
    from: DirectoryTab;
    to: DirectoryTab;
  } | null>(null);
  const pendingTab = pending?.from === activeTab ? pending.to : null;

  return (
    <div
      aria-busy={pendingTab ? true : undefined}
      className="flex rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-1"
    >
      {tabs.map((item) => {
        const active = item.id === activeTab;
        const pending = pendingTab === item.id && !active;
        const Icon = item.id === "owners" ? UserRound : PawPrint;

        return (
          <Button
            asChild
            key={item.id}
            variant={active ? "primary" : "ghost"}
            className={cn("min-w-[7.5rem]", pending && "opacity-80")}
          >
            <Link
              href={item.href}
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
                setPending({ from: activeTab, to: item.id });
              }}
            >
              {pending ? (
                <Spinner size={14} label={loadingLabel} />
              ) : (
                <Icon aria-hidden="true" size={15} />
              )}
              {item.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
