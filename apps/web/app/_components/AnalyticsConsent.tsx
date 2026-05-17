"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { createTranslator, type SupportedLocale } from "@petcura/shared";
import {
  getAnalyticsConsent,
  getServerAnalyticsConsent,
  persistAnalyticsConsent,
  subscribeToAnalyticsConsent
} from "./analytics-consent-store";
import { WebVitalsReporter } from "./WebVitalsReporter";

export function AnalyticsConsent({ locale }: { locale: SupportedLocale }) {
  const t = createTranslator(locale);
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
          aria-label={t("consent.ariaLabel")}
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4 text-[var(--foreground)] shadow-[0_24px_80px_-44px_rgba(41,38,27,0.62)] sm:bottom-5 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-semibold">{t("consent.heading")}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                {t("consent.body")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                onClick={() => choose("rejected")}
                type="button"
              >
                {t("consent.reject")}
              </button>
              <Link
                className="rounded-[var(--radius)] border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                href="/cookies#cookie-settings"
              >
                {t("consent.manage")}
              </Link>
              <button
                className="rounded-[var(--radius)] border border-transparent bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                onClick={() => choose("accepted")}
                type="button"
              >
                {t("consent.accept")}
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
