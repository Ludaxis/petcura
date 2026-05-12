/**
 * /inbox first-load JS bundle budget check.
 *
 * Runs after `next build`. Computes the first-load JS for every App Router
 * route by summing the unique set of static chunks the browser must fetch
 * before the route can hydrate. Fails the build if `/inbox` exceeds the
 * BUDGET_KB threshold.
 *
 * Run via Node directly with `--experimental-strip-types` so we don't have
 * to add `tsx` (Node 24+ strips TS types natively). See the `check:bundle`
 * npm script.
 *
 * Manifest sources (Next.js 16 + Turbopack):
 *   - `.next/build-manifest.json` -> `rootMainFiles` + `polyfillFiles` are
 *     the framework-level chunks every route loads.
 *   - `.next/server/app/<route>/page_client-reference-manifest.js` -> a JS
 *     module that assigns `globalThis.__RSC_MANIFEST[<route>]`. Each entry
 *     in `clientModules` carries a `chunks` array of static chunk paths
 *     the route needs. Older Next versions exposed
 *     `app-build-manifest.json` with a precomputed list per route, but
 *     Turbopack in Next 16 no longer emits that file, so we derive the
 *     set from the per-route reference manifest instead.
 *   - `.next/app-path-routes-manifest.json` -> maps `<route>/page` keys
 *     to the public route name we report (e.g. `/inbox`).
 *
 * First-load JS = bytes(union(rootMainFiles, polyfillFiles, route chunks)).
 * Using raw byte size matches Next's historical "First Load JS" column;
 * it's the uncompressed parsed cost the browser pays on cold load.
 */

import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const BUDGET_KB = 220;
const TARGET_ROUTE = "/inbox";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, "..");
const nextDir = path.join(webRoot, ".next");
const staticDir = path.join(nextDir, "static");

type BuildManifest = {
  polyfillFiles?: string[];
  rootMainFiles?: string[];
};

type RscManifest = {
  clientModules?: Record<string, { chunks?: string[] }>;
};

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Resolve a manifest-relative asset path to an on-disk file. */
function resolveAsset(asset: string): string {
  // Manifest paths look like `static/chunks/foo.js` or `/_next/static/chunks/foo.js`.
  const trimmed = asset.replace(/^\/?_next\//, "").replace(/^\//, "");
  return path.join(nextDir, trimmed);
}

function sizeOf(asset: string): number {
  try {
    return statSync(resolveAsset(asset)).size;
  } catch {
    return 0;
  }
}

/** Load `__RSC_MANIFEST[<key>]` from a per-route client-reference-manifest.js. */
function loadRscManifest(routeKey: string, file: string): RscManifest | null {
  const source = readFileSync(file, "utf8");
  const context: { globalThis: { __RSC_MANIFEST?: Record<string, RscManifest> } } = {
    globalThis: {},
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context.globalThis.__RSC_MANIFEST?.[routeKey] ?? null;
}

function collectRouteChunks(routeKey: string, manifestFile: string): Set<string> {
  const chunks = new Set<string>();
  const rsc = loadRscManifest(routeKey, manifestFile);
  if (!rsc?.clientModules) return chunks;
  for (const mod of Object.values(rsc.clientModules)) {
    for (const chunk of mod.chunks ?? []) {
      if (chunk.endsWith(".js")) chunks.add(chunk);
    }
  }
  return chunks;
}

function fmtKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function main() {
  // Sanity: build output must exist.
  try {
    statSync(staticDir);
  } catch {
    console.error(`error: ${staticDir} not found. Run \`next build\` first.`);
    process.exit(2);
  }

  const buildManifest = loadJson<BuildManifest>(path.join(nextDir, "build-manifest.json"));
  const appRoutes = loadJson<Record<string, string>>(
    path.join(nextDir, "app-path-routes-manifest.json"),
  );

  const baseChunks = new Set<string>([
    ...(buildManifest.rootMainFiles ?? []),
    ...(buildManifest.polyfillFiles ?? []),
  ]);

  type RouteSize = { route: string; bytes: number; chunkCount: number };
  const sizes: RouteSize[] = [];

  for (const [manifestKey, publicRoute] of Object.entries(appRoutes)) {
    // Only `page` segments produce a client bundle; route handlers (`/route`) don't.
    if (!manifestKey.endsWith("/page")) continue;
    const manifestFile = path.join(
      nextDir,
      "server",
      "app",
      manifestKey.replace(/^\//, "") + "_client-reference-manifest.js",
    );
    let routeChunks: Set<string>;
    try {
      routeChunks = collectRouteChunks(manifestKey, manifestFile);
    } catch {
      continue;
    }
    const all = new Set<string>([...baseChunks, ...routeChunks]);
    let bytes = 0;
    for (const chunk of all) bytes += sizeOf(chunk);
    sizes.push({ route: publicRoute, bytes, chunkCount: all.size });
  }

  sizes.sort((a, b) => b.bytes - a.bytes);

  const target = sizes.find((s) => s.route === TARGET_ROUTE);
  if (!target) {
    console.error(`error: route ${TARGET_ROUTE} not found in build output.`);
    process.exit(2);
  }

  const budgetBytes = BUDGET_KB * 1024;
  const pass = target.bytes <= budgetBytes;

  console.log("First-load JS by route (top 3):");
  for (const { route, bytes, chunkCount } of sizes.slice(0, 3)) {
    console.log(`  ${route.padEnd(20)} ${fmtKb(bytes).padStart(10)}  (${chunkCount} chunks)`);
  }
  console.log("");

  const status = pass ? "PASS" : "FAIL";
  console.log(
    `${status} ${TARGET_ROUTE}: ${fmtKb(target.bytes)} / ${BUDGET_KB} KB budget` +
      ` (${target.chunkCount} chunks)`,
  );

  if (!pass) {
    const over = target.bytes - budgetBytes;
    console.log(`  over budget by ${fmtKb(over)}`);
    process.exit(1);
  }
  process.exit(0);
}

main();
