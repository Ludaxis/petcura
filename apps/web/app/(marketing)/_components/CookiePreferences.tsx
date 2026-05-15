"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@petcura/ui";
import {
  getAnalyticsConsent,
  getServerAnalyticsConsent,
  persistAnalyticsConsent,
  subscribeToAnalyticsConsent
} from "@/app/_components/analytics-consent-store";

const options = [
  {
    value: "accepted",
    label: "Accept analytics",
    body: "Allow privacy-focused analytics, Vercel Web Analytics, Speed Insights, and Core Web Vitals reporting."
  },
  {
    value: "rejected",
    label: "Reject optional analytics",
    body: "Keep essential cookies only. PetCura will not load optional analytics components."
  }
] as const;

export function CookiePreferences() {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerAnalyticsConsent
  );

  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-sm font-semibold text-[var(--foreground)]">
        Analytics preference
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Your current choice is{" "}
        <strong>
          {consent === "accepted"
            ? "analytics accepted"
            : consent === "rejected"
              ? "optional analytics rejected"
              : "not set"}
        </strong>
        .
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = consent === option.value;

          return (
            <button
              className={cn(
                "rounded-[var(--radius)] border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                  : "border-[var(--line)] bg-[var(--surface-soft)] hover:border-[var(--primary-soft)]"
              )}
              key={option.value}
              onClick={() => persistAnalyticsConsent(option.value)}
              type="button"
            >
              <span className="block text-sm font-semibold text-[var(--foreground)]">
                {option.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                {option.body}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
