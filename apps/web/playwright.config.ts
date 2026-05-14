import { defineConfig, devices } from "@playwright/test";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const e2eTestMatch = [
  "apps/web/tests/e2e/**/*.spec.ts",
  "apps/web/e2e/**/*.spec.ts",
  "tests/e2e/**/*.spec.ts"
];

const visualTestMatch = ["tests/visual/**/*.spec.ts"];

export default defineConfig({
  testDir: "../..",
  testMatch: [...e2eTestMatch, ...visualTestMatch],
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
        url: "http://127.0.0.1:3100",
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
      name: "visual",
      testMatch: visualTestMatch,
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
