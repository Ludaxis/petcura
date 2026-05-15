import { defineConfig, devices } from "@playwright/test";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const localE2eTestMatch = ["apps/web/e2e/**/*.spec.ts", "tests/e2e/*.spec.ts"];
const appLiveTestMatch = ["apps/web/tests/e2e/**/*.spec.ts"];
const e2eTestMatch = [...appLiveTestMatch, ...localE2eTestMatch];
const dbTestMatch = ["tests/e2e/db/**/*.spec.ts"];
const liveTestMatch = ["tests/e2e/live/**/*.spec.ts", ...appLiveTestMatch];
const accessibilityTestMatch = ["tests/accessibility/**/*.spec.ts"];
const visualTestMatch = ["tests/visual/**/*.spec.ts"];
const localPort = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const localBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${localPort}`;

export default defineConfig({
  testDir: "../..",
  testMatch: [
    ...e2eTestMatch,
    ...dbTestMatch,
    ...liveTestMatch,
    ...accessibilityTestMatch,
    ...visualTestMatch
  ],
  testIgnore: [
    "**/.claude/**",
    "**/.next/**",
    "**/node_modules/**",
    "**/test-results/**"
  ],
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  workers: 1,
  use: {
    baseURL: localBaseURL,
    trace: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${localPort}`,
        url: localBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      },
  projects: [
    {
      name: "chromium",
      testMatch: e2eTestMatch,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chrome",
      testMatch: e2eTestMatch,
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "smoke",
      testMatch: [...e2eTestMatch, ...liveTestMatch],
      grep: /@smoke/,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "db",
      testMatch: dbTestMatch,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "live",
      testMatch: liveTestMatch,
      use: {
        ...devices["Desktop Chrome"],
        baseURL:
          process.env.PLAYWRIGHT_LIVE_BASE_URL ??
          process.env.PLAYWRIGHT_BASE_URL ??
          "https://staging.petcura.app"
      }
    },
    {
      name: "accessibility",
      testMatch: accessibilityTestMatch,
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "visual",
      testMatch: visualTestMatch,
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
