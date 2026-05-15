"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  getAnalyticsConsent,
  getServerAnalyticsConsent,
  persistAnalyticsConsent,
  subscribeToAnalyticsConsent
} from "./analytics-consent-store";
import { WebVitalsReporter } from "./WebVitalsReporter";

export function AnalyticsConsent() {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsent,
    getServerAnalyticsConsent
  );

  const choose = (nextConsent: "accepted" | "rejected") => {
    persistAnalyticsConsent(nextConsent);
  };

  return (
    <>
      {consent === "accepted" ? (
        <>
          <WebVitalsReporter />
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}

      {consent === null ? (
        <aside
          aria-label="Cookie notice"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 text-[var(--foreground)] shadow-[0_24px_80px_-44px_rgba(41,38,27,0.62)] sm:bottom-5 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-semibold">Privacy-first analytics</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                PetCura uses essential cookies to run the service. Optional
                analytics helps us improve clinic workflows and never includes
                owner messages or medical details.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                onClick={() => choose("rejected")}
                type="button"
              >
                Reject optional
              </button>
              <Link
                className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/cookies#cookie-settings"
              >
                Manage choices
              </Link>
              <button
                className="rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                onClick={() => choose("accepted")}
                type="button"
              >
                Accept analytics
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
