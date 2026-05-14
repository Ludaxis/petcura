import { NextResponse } from "next/server";

/**
 * Web Vitals beacon endpoint.
 *
 * Accepts a single Core Web Vitals sample (LCP/INP/CLS/FCP/TTFB) from
 * `apps/web/lib/web-vitals.ts` via `navigator.sendBeacon()` (or a `fetch`
 * fallback with `keepalive: true`). The route is intentionally lightweight:
 * it logs the sample and returns 204.
 *
 * Why Node runtime: per the platform guidance we prefer Fluid Compute /
 * Node.js. A future Sentry/PostHog wire-up will need the Node SDK surface,
 * so we lock it in now rather than start on edge and migrate.
 *
 * Follow-up (out of scope here): forward the validated sample to PostHog EU
 * and/or Sentry performance. This PR only stands up the endpoint.
 */
export const runtime = "nodejs";

type Rating = "good" | "needs-improvement" | "poor";

type VitalsPayload = {
  id: string;
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: Rating;
  delta: number;
  navigationType: string;
  attribution?: Record<string, unknown>;
};

const METRIC_NAMES: ReadonlySet<VitalsPayload["name"]> = new Set([
  "LCP",
  "INP",
  "CLS",
  "FCP",
  "TTFB"
]);

const RATINGS: ReadonlySet<Rating> = new Set([
  "good",
  "needs-improvement",
  "poor"
]);

function isVitalsPayload(value: unknown): value is VitalsPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    METRIC_NAMES.has(v.name as VitalsPayload["name"]) &&
    typeof v.value === "number" &&
    Number.isFinite(v.value) &&
    typeof v.rating === "string" &&
    RATINGS.has(v.rating as Rating) &&
    typeof v.delta === "number" &&
    Number.isFinite(v.delta) &&
    typeof v.navigationType === "string" &&
    (v.attribution === undefined ||
      (typeof v.attribution === "object" && v.attribution !== null))
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    // sendBeacon submits as `application/json` when we pass a Blob with
    // that type; the fetch fallback sets the header explicitly.
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (!isVitalsPayload(payload)) {
    return new NextResponse(null, { status: 204 });
  }

  // Stand-in for the future PostHog/Sentry hand-off. Kept as a structured
  // log so it is grep-able in Vercel logs while the real sink is wired up.
  console.log(
    JSON.stringify({
      kind: "web-vitals",
      name: payload.name,
      value: payload.value,
      rating: payload.rating,
      id: payload.id,
      navigationType: payload.navigationType
    })
  );

  return new NextResponse(null, { status: 204 });
}
