/**
 * Landing page accessibility + i18n gate.
 *
 * This spec is the executable form of
 * docs/design/a11y-i18n-contract-2026-05.md.
 *
 * Every test is currently `test.fixme()` because the Wave 2 implementation
 * has not landed yet. The fixmes exist to document the gate — Wave 2 must
 * remove each fixme as the corresponding contract item is implemented.
 *
 * Required dev dependency (frontend-engineer must add in Wave 2):
 *   npm i -D @axe-core/playwright
 *
 * Run:
 *   cd apps/web && npx playwright test tests/accessibility/landing.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";

// Wave 2: uncomment this import once @axe-core/playwright is installed.
// import AxeBuilder from "@axe-core/playwright";

const LOCALES = ["en", "et", "ru"] as const;
type Locale = (typeof LOCALES)[number];

const SECTIONS = [
  { id: "hero", heading: "h1" },
  { id: "logo-strip", heading: null },
  { id: "problem-heading", heading: "h2" },
  { id: "how-heading", heading: "h2" },
  { id: "usecases-heading", heading: "h2" },
  { id: "integrations-heading", heading: "h2" },
  { id: "safety-heading", heading: "h2" },
  { id: "security-heading", heading: "h2" },
  { id: "proof-heading", heading: "h2" },
  { id: "pricing-heading", heading: "h2" },
  { id: "faq-heading", heading: "h2" },
  { id: "final-cta-heading", heading: "h2" }
] as const;

async function gotoLanding(page: Page, locale: Locale) {
  await page.goto(`/?lang=${locale}`);
  await page.waitForLoadState("networkidle");
}

// ---------------------------------------------------------------------------
// 1. WCAG 2.2 AA scan — per locale
//    Contract: docs/design/a11y-i18n-contract-2026-05.md §1
// ---------------------------------------------------------------------------

for (const locale of LOCALES) {
  test.describe(`WCAG2AA scan — ${locale}`, () => {
    test.fixme(
      `axe scan returns zero violations (light theme) — ${locale}`,
      async ({ page }) => {
        // TODO(contract §1): wire @axe-core/playwright once installed.
        // const accessibilityScanResults = await new AxeBuilder({ page })
        //   .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        //   .analyze();
        // expect(accessibilityScanResults.violations).toEqual([]);
        await gotoLanding(page, locale);
        expect(true).toBe(false);
      }
    );

    test.fixme(
      `axe scan returns zero violations (dark theme) — ${locale}`,
      async ({ page }) => {
        // TODO(contract §6): emulate dark color scheme then re-scan.
        await page.emulateMedia({ colorScheme: "dark" });
        await gotoLanding(page, locale);
        expect(true).toBe(false);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// 2. Keyboard traversal — no traps, no skipped controls
//    Contract: §4
// ---------------------------------------------------------------------------

test.describe("Keyboard navigation", () => {
  test.fixme(
    "Tab traversal reaches every interactive control with no focus trap",
    async ({ page }) => {
      // TODO(contract §4): press Tab through the full page, assert that
      //   - the first focused element is the skip-to-content link
      //   - <main id="main-content"> receives focus when the skip link is activated
      //   - every Button / Link in the visual order receives :focus-visible
      //   - no element captures focus indefinitely
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );

  test.fixme(
    "Escape closes an expanded FAQ panel and returns focus to the trigger",
    async ({ page }) => {
      // TODO(contract §1.11): open FAQ item 1 with Enter, press Escape,
      //   assert aria-expanded='false' and document.activeElement is the trigger.
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );

  test.fixme(
    "skip-to-content link is the first focusable element and is visible on focus",
    async ({ page }) => {
      // TODO(contract §4): assert .sr-only focus:not-sr-only is in DOM as first focusable child.
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// 3. Reduced-motion contract
//    Contract: §2
// ---------------------------------------------------------------------------

test.describe("prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const locale of LOCALES) {
    test.fixme(
      `no animations fire and ScrollStory degrades to a static list — ${locale}`,
      async ({ page }) => {
        await gotoLanding(page, locale);
        // TODO(contract §2.3): assert ScrollStory renders as a stacked list
        //   (all steps visible at once, no aria-current="step", no aria-live region).
        // TODO(contract §2.7): assert .pc-loop-trail has transform: scaleY(1)
        //   and .pc-loop-step has opacity: 1 (no animation).
        // TODO(contract §2.2): assert KineticHeadline renders as a single
        //   static <h1> / <h2> text node, no per-word/per-line spans with opacity < 1.
        expect(true).toBe(false);
      }
    );
  }

  test.fixme(
    "scroll-scrubbed effects are no-ops when reduced motion is set",
    async ({ page }) => {
      // TODO(contract §2): scroll the page through the full height
      //   and assert no ScrollTrigger instances are registered
      //   (e.g. window.ScrollTrigger?.getAll().length === 0).
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// 4. Heading order audit
//    Contract: §5
// ---------------------------------------------------------------------------

test.describe("Heading hierarchy", () => {
  test.fixme(
    "page has exactly one h1 and one h2 per section, in DOM order",
    async ({ page }) => {
      await gotoLanding(page, "en");
      // TODO(contract §5):
      // const h1s = await page.locator("h1").count();
      // expect(h1s).toBe(1);
      // for each SECTIONS entry with heading === 'h2', assert the section
      // contains exactly one <h2 id={section.id}>.
      for (const section of SECTIONS) {
        if (section.heading) {
          // placeholder so the loop is observable
          expect(section.id).toBeTruthy();
        }
      }
      expect(true).toBe(false);
    }
  );

  test.fixme(
    "every <section> uses aria-labelledby pointing at its heading id",
    async ({ page }) => {
      // TODO(contract §1, §5): assert sections in apps/web/app/page.tsx still
      // carry aria-labelledby after Wave 2's split into _sections/*.
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );
});

// ---------------------------------------------------------------------------
// 5. Contrast — both themes
//    Contract: §6
// ---------------------------------------------------------------------------

test.describe("Color contrast", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test.fixme(
      `body and large text meet WCAG AA contrast — ${colorScheme}`,
      async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await gotoLanding(page, "en");
        // TODO(contract §6): run axe with only the "color-contrast" rule,
        // assert violations.length === 0 for both themes.
        expect(true).toBe(false);
      }
    );
  }

  test.fixme("focus ring meets 3:1 against every surface it lands on", async ({ page }) => {
    // TODO(contract §4): walk Tab through controls on --paper, --surface-soft,
    // and --primary-soft backgrounds; assert :focus-visible outline contrast >= 3.
    await gotoLanding(page, "en");
    expect(true).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. EN / ET / RU layout resilience
//    Contract: §3
// ---------------------------------------------------------------------------

for (const locale of LOCALES) {
  test.describe(`Layout resilience — ${locale}`, () => {
    test.fixme(
      `no clipped headlines or buttons at 320px viewport — ${locale}`,
      async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 });
        await gotoLanding(page, locale);
        // TODO(contract §3.1, §3.2): for every h1/h2/h3 and every <button>,
        // assert scrollWidth <= clientWidth (no horizontal overflow)
        // AND computed style has no text-overflow: ellipsis.
        expect(true).toBe(false);
      }
    );

    test.fixme(
      `KineticHeadline is word-by-word or line-by-line (never letter-by-letter) — ${locale}`,
      async ({ page }) => {
        await gotoLanding(page, locale);
        // TODO(contract §3.3): assert the hero <h1> contains either
        //   - a single text node, OR
        //   - <span> children whose textContent.length > 1 (i.e. words/lines).
        // Letter-by-letter would produce many single-character <span>s.
        expect(true).toBe(false);
      }
    );

    test.fixme(
      `<html lang> matches active locale — ${locale}`,
      async ({ page }) => {
        await gotoLanding(page, locale);
        // TODO(contract §5): const lang = await page.locator("html").getAttribute("lang");
        // expect(lang).toBe(locale);
        expect(true).toBe(false);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// 7. Decorative icons and accessible names
//    Contract: §1 (global rules)
// ---------------------------------------------------------------------------

test.describe("Icon semantics", () => {
  test.fixme(
    "every lucide icon adjacent to text is aria-hidden",
    async ({ page }) => {
      await gotoLanding(page, "en");
      // TODO(contract §1): for every <svg> inside the marketing tree
      // that sits next to text, assert aria-hidden="true".
      expect(true).toBe(false);
    }
  );

  test.fixme(
    "icon-only controls (if any) have aria-label in the active locale",
    async ({ page }) => {
      // TODO(contract §1, §1.11): if FAQ chevron or ScrollStory step dots
      // become focusable controls, assert they expose aria-label.
      await gotoLanding(page, "en");
      expect(true).toBe(false);
    }
  );
});
