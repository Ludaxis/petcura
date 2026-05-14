/**
 * Client-side Web Vitals reporter.
 *
 * Registers callbacks for the five Core Web Vitals (LCP, INP, CLS, FCP,
 * TTFB) and posts each sample to `/_vitals` using `navigator.sendBeacon()`,
 * falling back to `fetch` with `keepalive: true` so the request survives
 * page unloads. The reporter is a no-op outside the browser and outside
 * production builds — see `WebVitalsReporter` for the gating.
 *
 * Spec references:
 * - docs/design/motion-system-2026-05.md §6 Performance budgets
 * - docs/performance/budget-2026-05.md
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

const ENDPOINT = "/_vitals";

function send(metric: Metric) {
  // Serialise only the fields the route handler validates. `attribution`
  // is included when web-vitals enriches the sample (it does for the
  // `attribution` build), but we don't depend on it.
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    attribution: (metric as Metric & { attribution?: unknown }).attribution
  });

  // sendBeacon is the right tool: it is queued by the browser and not
  // cancelled by the unload of the document.
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    } catch {
      // Fall through to fetch.
    }
  }

  // Fallback for browsers that block sendBeacon (e.g. some private modes)
  // or when the Blob constructor is unavailable. `keepalive` mirrors
  // sendBeacon's lifetime behaviour.
  void fetch(ENDPOINT, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true
  }).catch(() => {
    // Reporting is best-effort. We must never throw into the page.
  });
}

/**
 * Register web-vitals callbacks. Safe to call multiple times — the
 * web-vitals library de-duplicates listeners internally per metric.
 */
export function registerWebVitals(): void {
  if (typeof window === "undefined") return;
  onLCP(send);
  onINP(send);
  onCLS(send);
  onFCP(send);
  onTTFB(send);
}
