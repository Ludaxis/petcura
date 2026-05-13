"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@petcura/ui";

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type Props = {
  tabs: Tab[];
  initial?: string;
  ariaLabel: string;
};

export function PetTabs({ tabs, initial, ariaLabel }: Props) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);

  return (
    <div>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1 overflow-x-auto border-b border-[var(--line)] pb-px"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cn(
                "relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
                selected
                  ? "text-[var(--ink)] after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          className="pt-5"
        >
          {tab.id === active ? tab.content : null}
        </div>
      ))}
    </div>
  );
}
