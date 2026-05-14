"use client";

import { useEffect } from "react";

/**
 * Mounts once per page and registers Web Vitals reporters. Production-only
 * so dev work does not flood the beacon endpoint (and so Lighthouse runs
 * stay clean of our own telemetry chatter).
 *
 * Marketing layout renders this at the bottom of `<body>`. If/when other
 * route groups want Web Vitals reporting, they can mount the same
 * component — `registerWebVitals` is idempotent.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // Dynamically imported so the web-vitals package never ships in the
    // dev bundle and so the reporter loads after hydration is complete.
    let cancelled = false;
    void import("@/lib/web-vitals").then((mod) => {
      if (cancelled) return;
      mod.registerWebVitals();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
