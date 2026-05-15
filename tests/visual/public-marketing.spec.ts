import { test } from "@playwright/test";

const routes = [
  { name: "landing", path: "/" },
  { name: "owners", path: "/owners" },
  { name: "demo", path: "/demo" },
  { name: "sandbox", path: "/sandbox" },
  { name: "trust", path: "/trust" }
] as const;

test.describe("Public marketing screenshots", () => {
  for (const route of routes) {
    test(`${route.name} desktop and mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1100 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        fullPage: true,
        path: `screenshots/public-${route.name}-desktop.png`
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        fullPage: true,
        path: `screenshots/public-${route.name}-mobile.png`
      });
    });
  }
});
