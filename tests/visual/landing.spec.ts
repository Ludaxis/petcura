/**
 * Landing page visual regression matrix.
 *
 * Executable form of:
 *   - docs/design/landing-narrative-2026-05.md §16 (acceptance criteria — visual)
 *   - docs/design/a11y-i18n-contract-2026-05.md §3.6 (matrix dimensions)
 *
 * Matrix dimensions (full):
 *   locale (en/et/ru) × theme (light/dark) × device (desktop/mobile) × motion (reduce/no-preference)
 *   = 3 × 2 × 2 × 2 = 24 captures per section
 *   × 12 sections                                         = 288 snapshots
 *
 * To keep CI manageable, the default matrix is the EN-only slice:
 *   1 × 2 × 2 × 2 = 8 captures per section × 12 sections = 96 snapshots
 *
 * The full 3-locale matrix is gated behind `--grep @full-matrix`:
 *   npx playwright test tests/visual/landing.spec.ts --grep @full-matrix
 *
 * Reduced-motion + no-preference are both first-class targets per
 * a11y-i18n-contract-2026-05.md §2.
 *
 * Pattern copied from:
 *   - apps/web/e2e/dark-mode-crawl.spec.ts (full-page crawl with emulateMedia)
 *   - apps/web/e2e/mobile-redesign-screens.spec.ts (mobile viewport, wait-for-settle)
 */

import { test, expect, type Page, type Locator } from "@playwright/test";

// ---------------------------------------------------------------------------
// Matrix dimensions
// ---------------------------------------------------------------------------

const DEFAULT_LOCALES = ["en"] as const;
const FULL_LOCALES = ["en", "et", "ru"] as const;
type Locale = (typeof FULL_LOCALES)[number];

const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

const DEVICES = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 }
] as const;
type Device = (typeof DEVICES)[number];

const MOTIONS = ["no-preference", "reduce"] as const;
type Motion = (typeof MOTIONS)[number];

// Sections in document order. Each entry's `id` is the section's DOM id or the
// id of the labelling heading. Per a11y contract §1, every <section> uses
// aria-labelledby pointing at a heading with one of these ids.
const SECTIONS = [
  { key: "hero", selector: '[data-section="hero"], section:has(h1)' },
  { key: "logo-strip", selector: '[data-section="logo-strip"], section:has(#logos-heading)' },
  { key: "problem", selector: '[data-section="problem"], section:has(#problem-heading)' },
  { key: "walkthrough", selector: '[data-section="walkthrough"], section:has(#how-heading)' },
  { key: "use-cases", selector: '[data-section="use-cases"], section:has(#usecases-heading)' },
  { key: "integrations", selector: '[data-section="integrations"], section:has(#integrations-heading)' },
  { key: "ai-safety", selector: '[data-section="ai-safety"], section:has(#safety-heading)' },
  { key: "compliance", selector: '[data-section="compliance"], section:has(#security-heading)' },
  { key: "testimonial", selector: '[data-section="testimonial"], section:has(#proof-heading)' },
  { key: "pricing", selector: '[data-section="pricing"], section:has(#pricing-heading)' },
  { key: "faq", selector: '[data-section="faq"], section:has(#faq-heading)' },
  { key: "final-cta", selector: '[data-section="final-cta"], section:has(#final-cta-heading)' }
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoLanding(page: Page, locale: Locale) {
  await page.goto(`/?lang=${locale}`, { waitUntil: "domcontentloaded" });
  // Wait for hero kinetic headline to settle. Implementation marks the
  // settled state with data-entered="true" on the KineticHeadline root. If
  // that attribute never appears (reduced-motion or non-kinetic build) the
  // 1.2s buffer covers the longest reveal duration spec'd in
  // landing-narrative-2026-05.md §1.3 (≤ 320ms reveal + safety margin).
  const hero = page.locator("h1").first();
  await hero.waitFor({ state: "visible" });
  await page
    .waitForFunction(
      () => {
        const h = document.querySelector("h1");
        return !!h && h.getAttribute("data-entered") === "true";
      },
      undefined,
      { timeout: 1500 }
    )
    .catch(() => {
      // Falls through; static fallback or reduced-motion path has no
      // data-entered attribute. The 1.2s timeout above is the upper bound.
    });
  await page.waitForTimeout(200);
}

async function settleSection(section: Locator) {
  await section.scrollIntoViewIfNeeded();
  // The Reveal primitive sets data-state="entered" once the
  // IntersectionObserver fires. Under reduced motion or static fallback,
  // sections render at final state on first paint — the catch covers both.
  await section
    .locator('[data-state="entered"]')
    .first()
    .waitFor({ state: "attached", timeout: 1500 })
    .catch(() => {
      /* static fallback path */
    });
  // Small buffer for any settle frames (Reveal stagger ≤ 80ms × ~5 children
  // per landing-narrative-2026-05.md §3.3, §5.3, §6.3).
  await section.page().waitForTimeout(250);
}

function maskDynamic(page: Page): Locator[] {
  // Hide elements known to differ between runs: the language switcher's
  // active-state highlight, any timestamps, the mobile sticky CTA bar's
  // slide-in state, and the ProductLoopMock animation frames.
  return [
    page.locator("[data-language-switcher]"),
    page.locator("[data-timestamp]"),
    page.locator("[data-mobile-cta-bar]"),
    page.locator(".pc-loop-trail, .pc-loop-step, .pc-typing-dot"),
    page.locator('[data-section="hero"] figure[aria-label]')
  ];
}

async function applyMatrixState(
  page: Page,
  device: Device,
  theme: Theme,
  motion: Motion
) {
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.emulateMedia({
    colorScheme: theme,
    reducedMotion: motion === "reduce" ? "reduce" : "no-preference"
  });
}

// ---------------------------------------------------------------------------
// Matrix runner
// ---------------------------------------------------------------------------

function runMatrix(locales: ReadonlyArray<Locale>, tag: string) {
  for (const locale of locales) {
    for (const theme of THEMES) {
      for (const device of DEVICES) {
        for (const motion of MOTIONS) {
          const matrixId = `${locale}/${theme}/${device.name}/${motion}`;
          test.describe.parallel(`landing visual ${tag} — ${matrixId}`, () => {
            test.beforeEach(async ({ page }) => {
              await applyMatrixState(page, device, theme, motion);
              await gotoLanding(page, locale);
            });

            for (const section of SECTIONS) {
              test(`${section.key} ${tag}`, async ({ page }) => {
                const locator = page.locator(section.selector).first();
                await locator.waitFor({ state: "visible" });
                await settleSection(locator);

                await expect(locator).toHaveScreenshot(
                  [
                    "landing",
                    locale,
                    theme,
                    device.name,
                    motion,
                    `${section.key}.png`
                  ],
                  {
                    mask: maskDynamic(page),
                    maxDiffPixelRatio: 0.01,
                    animations: "disabled",
                    caret: "hide"
                  }
                );
              });
            }
          });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Default: EN-only slice (96 snapshots). Always runs.
// ---------------------------------------------------------------------------

runMatrix(DEFAULT_LOCALES, "@default");

// ---------------------------------------------------------------------------
// Full matrix: EN + ET + RU (288 snapshots). Gate with --grep @full-matrix.
// ---------------------------------------------------------------------------

test.describe("@full-matrix", () => {
  runMatrix(FULL_LOCALES, "@full-matrix");
});
