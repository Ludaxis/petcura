/**
 * Visual regression for the auth + onboarding redesign.
 *
 * Mirrors the pattern in tests/visual/landing.spec.ts. Captures every new
 * public auth surface at 375×812 (mobile) and 1280×800 (desktop) in en
 * and ru locales (ru is the worst-case expansion).
 *
 * First run: seed snapshots with
 *   npx playwright test tests/visual/auth-onboarding.spec.ts --update-snapshots
 *
 * Subsequent runs assert against the seeded baseline.
 *
 * Authed surfaces (/onboarding/clinic, /onboarding/staff, /o?welcome=1,
 * /o/join/confirm) are `test.fixme` until a Playwright auth fixture exists.
 */

import { test, expect, type Page } from "@playwright/test";

const LOCALES = ["en", "ru"] as const;
type Locale = (typeof LOCALES)[number];

const DEVICES = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 }
] as const;

const SURFACES = [
  { name: "cold-login", url: "/login" },
  {
    name: "invite-login",
    url:
      "/login?invite=1&email=jana%40clinic.ee&clinic=Tartu+Loomakliinik"
  },
  { name: "owner-login", url: "/o/login" }
] as const;

async function settle(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400); // allow .pc-auth-mount 240ms fade + buffer
}

for (const surface of SURFACES) {
  for (const locale of LOCALES) {
    for (const device of DEVICES) {
      test(`visual — ${surface.name} / ${locale} / ${device.name}`, async ({
        page
      }) => {
        await page.setViewportSize({
          width: device.width,
          height: device.height
        });
        await page.emulateMedia({
          reducedMotion: "reduce" // freeze animated brand pane
        });
        const url = surface.url.includes("?")
          ? `${surface.url}&lang=${locale}`
          : `${surface.url}?lang=${locale}`;
        await page.goto(url);
        await settle(page);
        await expect(page).toHaveScreenshot(
          [
            "auth-onboarding",
            surface.name,
            locale,
            `${device.name}.png`
          ],
          {
            fullPage: true,
            maxDiffPixelRatio: 0.01,
            animations: "disabled",
            caret: "hide",
            mask: [page.locator("[data-language-switcher]")]
          }
        );
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Authed surfaces — fixme until auth fixture lands
// ---------------------------------------------------------------------------

const AUTHED_SURFACES = [
  { name: "onboarding-clinic", url: "/onboarding/clinic" },
  { name: "onboarding-staff", url: "/onboarding/staff" },
  { name: "owner-welcome", url: "/o?welcome=1" },
  { name: "owner-join-confirm", url: "/o/join/confirm" }
] as const;

for (const surface of AUTHED_SURFACES) {
  for (const locale of LOCALES) {
    for (const device of DEVICES) {
      test.fixme(
        `visual (authed) — ${surface.name} / ${locale} / ${device.name}`,
        async () => {
          // Re-enable once a Playwright auth fixture can install a session
          // cookie for a fresh staff/owner actor.
        }
      );
    }
  }
}
