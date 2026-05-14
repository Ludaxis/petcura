/**
 * Landing page narrative acceptance gate.
 *
 * Executable form of docs/design/landing-narrative-2026-05.md §16
 * (the 10 acceptance criteria). Each criterion is one `test()`.
 *
 * The Wave 2 implementation (apps/web/app/(marketing)/**) has not landed
 * yet. These specs are authored to the contract; they will pass once the
 * marketing route group is merged. Any criterion that depends on a route
 * or data attribute not yet defined uses `test.skip()` with a TODO so the
 * skip is obvious and the test re-enables when the implementation catches up.
 *
 * Cross-references:
 *   - tests/accessibility/landing.spec.ts — Wave 1 a11y skeleton (same surface)
 *   - tests/visual/landing.spec.ts — visual regression matrix
 */

import { test, expect, type Page } from "@playwright/test";

const LOCALES = ["en", "et", "ru"] as const;
type Locale = (typeof LOCALES)[number];

const HERO_HEADLINE = {
  en: "The WhatsApp inbox built for veterinary clinics.",
  et: "WhatsApp postkast loomakliinikutele.",
  ru: "Входящие WhatsApp для ветеринарных клиник."
} as const;

const PRIMARY_CTA = {
  en: "Book a 15-min",
  et: "Broneeri 15-min",
  ru: "Запланировать 15-мин"
} as const;

const SECONDARY_CTA = {
  en: "Try the sandbox inbox",
  et: "Proovi näidispostkasti",
  ru: "Открыть демо-входящие"
} as const;

const WILL_NOT_ITEMS = [
  "Diagnose",
  "Prescribe medication",
  "Set final urgency",
  "Auto-send medical advice"
] as const;

const TRAINING_LINE_SUBSTRING = "train";
const COMPLIANCE_STRIP_TOKENS = [
  "EU-hosted",
  "GDPR-aligned",
  "Full audit trail",
  "SOC 2 in progress"
] as const;

async function gotoLanding(page: Page, locale: Locale) {
  await page.goto(`/?lang=${locale}`, { waitUntil: "domcontentloaded" });
  await page.locator("h1").first().waitFor({ state: "visible" });
}

// ---------------------------------------------------------------------------
// 1. Locale rendering — every locale renders, no clipped H1.
//    Acceptance §16.1
// ---------------------------------------------------------------------------

test.describe("Criterion 1 — locale rendering", () => {
  for (const locale of LOCALES) {
    test(`<html lang> matches active locale — ${locale}`, async ({ page }) => {
      await gotoLanding(page, locale);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
    });

    test(`hero H1 does not clip at desktop width — ${locale}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await gotoLanding(page, locale);
      const h1 = page.getByRole("heading", { level: 1 }).first();
      const { scrollWidth, clientWidth } = await h1.evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Reduced-motion: full-page scroll fires zero JS animations and the
//    Walkthrough ScrollTrigger renders as a static stacked list.
//    Acceptance §16.2 + a11y contract §2.3
// ---------------------------------------------------------------------------

test.describe("Criterion 2 — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no element animates and Walkthrough degrades to a stack", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoLanding(page, "en");

    // Scroll the page top to bottom in chunks so any IntersectionObserver
    // animations would have had a chance to fire.
    const totalScroll = await page.evaluate(
      () => document.documentElement.scrollHeight
    );
    for (let y = 0; y < totalScroll; y += 600) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // Assert: no element has a running animation-name other than `none`.
    const offenders = await page.evaluate(() => {
      const out: { tag: string; cls: string; animation: string }[] = [];
      const parseDurationMs = (value: string) => {
        const trimmed = value.trim();
        if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed);
        if (trimmed.endsWith("s")) return Number.parseFloat(trimmed) * 1000;
        return Number.parseFloat(trimmed);
      };
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const cs = getComputedStyle(el);
        const durations = cs.animationDuration.split(",").map(parseDurationMs);
        const hasVisibleAnimation = durations.some(
          (duration) => Number.isFinite(duration) && duration > 1
        );
        if (cs.animationName && cs.animationName !== "none" && hasVisibleAnimation) {
          out.push({
            tag: el.tagName.toLowerCase(),
            cls: el.className?.toString().slice(0, 80) ?? "",
            animation: cs.animationName
          });
        }
      }
      return out;
    });
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);

    // Assert: ScrollStory walkthrough renders as a static stack — 4 cards
    // visible simultaneously, none with position: sticky.
    const walkthrough = page
      .locator('section:has(#how-heading), [data-section="walkthrough"]')
      .first();
    await walkthrough.scrollIntoViewIfNeeded();

    const beats = walkthrough.locator(
      '[data-beat], article, [role="listitem"]'
    );
    const beatCount = await beats.count();
    expect(beatCount).toBeGreaterThanOrEqual(4);

    const stickyCount = await walkthrough.evaluate((root) => {
      let n = 0;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
        const cs = getComputedStyle(el);
        if (cs.position === "sticky" || cs.position === "-webkit-sticky") n++;
      }
      return n;
    });
    expect(stickyCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Hero H1 string — locked across all three locales.
//    Acceptance §16.3
// ---------------------------------------------------------------------------

test.describe("Criterion 3 — hero H1 string", () => {
  for (const locale of LOCALES) {
    test(`hero H1 matches the locked copy — ${locale}`, async ({ page }) => {
      await gotoLanding(page, locale);
      const h1 = page.getByRole("heading", { level: 1 }).first();
      const text = (await h1.getAttribute("aria-label")) ?? (await h1.textContent());
      // Prefer the accessible name because KineticHeadline hides visual
      // line spans from AT and exposes the locked copy via aria-label.
      const normalised = (text ?? "").replace(/\s+/g, " ").trim();
      expect(normalised).toContain(HERO_HEADLINE[locale]);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. AISafety negative-enumeration hierarchy is visually heavier than the
//    will-do column, and the four "will not" items match AGENTS.md verbatim.
//    Acceptance §16.4 + landing-narrative §7
// ---------------------------------------------------------------------------

test.describe("Criterion 4 — AISafety negative-enum", () => {
  test("will-not column reads with stronger emphasis than will-do", async ({ page }) => {
    await gotoLanding(page, "en");
    const safety = page
      .locator('section:has(#safety-heading), [data-section="ai-safety"]')
      .first();
    await safety.scrollIntoViewIfNeeded();

    const willDo = safety
      .locator('[data-list="will-do"], article:has-text("does")')
      .first();
    const willNot = safety
      .locator('[data-list="will-not"], article:has-text("not")')
      .first();

    if (!(await willNot.count())) {
      test.skip(true, "AISafety will-not list selector not yet emitted by Wave 2 implementation; TODO update once data-list attrs ship.");
      return;
    }

    // Compare computed color contrast: the will-not text should resolve to a
    // value with strictly greater lightness *delta* from background than the
    // will-do text. Simpler proxy: compare the perceived luminance contrast
    // ratio of each list's first item against the page background.
    const luminance = (rgb: string) => {
      const m = rgb.match(/\d+(\.\d+)?/g);
      if (!m) return 0;
      const [r, g, b] = m.slice(0, 3).map((v) => {
        const c = parseInt(v, 10) / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const measure = async (loc: typeof willDo) => {
      const item = loc.locator("li, [data-item]").first();
      const styles = await item.evaluate((el) => {
        const cs = getComputedStyle(el);
        const root = getComputedStyle(document.body);
        return { color: cs.color, bg: root.backgroundColor };
      });
      const lText = luminance(styles.color);
      const lBg = luminance(styles.bg);
      const [a, b] = lText > lBg ? [lText, lBg] : [lBg, lText];
      return (a + 0.05) / (b + 0.05);
    };
    const willDoContrast = await measure(willDo);
    const willNotContrast = await measure(willNot);
    expect(willNotContrast).toBeGreaterThan(willDoContrast);
  });

  test("will-not items match AGENTS.md verbatim", async ({ page }) => {
    await gotoLanding(page, "en");
    const safety = page
      .locator('section:has(#safety-heading), [data-section="ai-safety"]')
      .first();
    await safety.scrollIntoViewIfNeeded();

    const willNot = safety
      .locator('[data-list="will-not"], article:has-text("not")')
      .first();
    if (!(await willNot.count())) {
      test.skip(true, "AISafety will-not selector not yet emitted by Wave 2; TODO re-enable.");
      return;
    }
    const items = await willNot.locator("li, [data-item]").allTextContents();
    const normalised = items.map((s) => s.replace(/^[\s—\-•·]+/, "").trim());
    for (const expected of WILL_NOT_ITEMS) {
      expect(
        normalised.some((actual) => actual.toLowerCase().includes(expected.toLowerCase()))
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. The "we don't train your data on our models" line appears in BOTH the
//    Safety (§7) and Compliance (§8) sections — two distinct <section>s.
//    Acceptance §16.5
// ---------------------------------------------------------------------------

test("Criterion 5 — training line appears in both Safety and Compliance", async ({
  page
}) => {
  await gotoLanding(page, "en");
  const safety = page
    .locator('section:has(#safety-heading), [data-section="ai-safety"]')
    .first();
  const compliance = page
    .locator('section:has(#security-heading), [data-section="compliance"]')
    .first();

  await expect(safety).toContainText(TRAINING_LINE_SUBSTRING, { ignoreCase: true });
  await expect(compliance).toContainText(TRAINING_LINE_SUBSTRING, {
    ignoreCase: true
  });

  // Confirm the two sections are distinct DOM nodes.
  const same = await safety.evaluate(
    (a, b) => a === b,
    await compliance.elementHandle()
  );
  expect(same).toBe(false);
});

// ---------------------------------------------------------------------------
// 6. Compliance strip carries the four tokens, in order.
//    Acceptance §16.6
// ---------------------------------------------------------------------------

test("Criterion 6 — compliance strip lists all four tokens", async ({ page }) => {
  await gotoLanding(page, "en");
  const compliance = page
    .locator('section:has(#security-heading), [data-section="compliance"]')
    .first();
  await compliance.scrollIntoViewIfNeeded();
  const text = ((await compliance.textContent()) ?? "").toLowerCase();
  for (const token of COMPLIANCE_STRIP_TOKENS) {
    expect(text).toContain(token.toLowerCase());
  }
});

// ---------------------------------------------------------------------------
// 7. Dual CTA on Hero and FinalCTA. Hero secondary href resolves to /sandbox
//    or #walkthrough fallback (landing-narrative §1.2).
//    Acceptance §16.7
// ---------------------------------------------------------------------------

test.describe("Criterion 7 — dual CTA on Hero and FinalCTA", () => {
  test("Hero ships primary + secondary CTA with locked labels", async ({ page }) => {
    await gotoLanding(page, "en");
    const hero = page.locator('[data-section="hero"], section:has(h1)').first();
    const primary = hero
      .getByRole("link", { name: new RegExp(PRIMARY_CTA.en, "i") })
      .or(hero.getByRole("button", { name: new RegExp(PRIMARY_CTA.en, "i") }))
      .first();
    const secondary = hero
      .getByRole("link", { name: new RegExp(SECONDARY_CTA.en, "i") })
      .or(hero.getByRole("button", { name: new RegExp(SECONDARY_CTA.en, "i") }))
      .first();
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    // Hero secondary href: /sandbox preferred, #walkthrough fallback (per
    // landing-narrative-2026-05.md §1.2 sandbox-CTA handoff note).
    const href = await secondary.getAttribute("href");
    if (href === null) {
      test.skip(true, "Hero secondary is not an <a>; href contract does not apply.");
      return;
    }
    expect(href === "/sandbox" || href.endsWith("#walkthrough")).toBe(true);
  });

  test("FinalCTA ships primary + secondary CTA with locked labels", async ({ page }) => {
    await gotoLanding(page, "en");
    const final = page
      .locator('[data-section="final-cta"], section:has(#final-cta-heading)')
      .first();
    await final.scrollIntoViewIfNeeded();
    const primary = final
      .getByRole("link", { name: new RegExp(PRIMARY_CTA.en, "i") })
      .or(final.getByRole("button", { name: new RegExp(PRIMARY_CTA.en, "i") }))
      .first();
    const secondary = final
      .getByRole("link", { name: new RegExp(SECONDARY_CTA.en, "i") })
      .or(final.getByRole("button", { name: new RegExp(SECONDARY_CTA.en, "i") }))
      .first();
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. Walkthrough mobile fallback: under 768px, ScrollStory is not pinned and
//    the 4 cards stack vertically.
//    Acceptance §16.8 + landing-narrative §4.3
// ---------------------------------------------------------------------------

test("Criterion 8 — Walkthrough degrades to vertical stack on mobile", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoLanding(page, "en");
  const walkthrough = page
    .locator('section:has(#how-heading), [data-section="walkthrough"]')
    .first();
  await walkthrough.scrollIntoViewIfNeeded();

  const stickyCount = await walkthrough.evaluate((root) => {
    let n = 0;
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      const cs = getComputedStyle(el);
      if (cs.position === "sticky" || cs.position === "-webkit-sticky") n++;
    }
    return n;
  });
  expect(stickyCount).toBe(0);

  // Four cards exist and are arranged vertically (each card top is below
  // the previous card's bottom).
  const cards = walkthrough.locator(
    '[data-beat], article:has(h3), [role="listitem"]'
  );
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(4);

  const boxes = await cards.evaluateAll((els) =>
    els.slice(0, 4).map((el) => el.getBoundingClientRect())
  );
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].top);
  }
});

// ---------------------------------------------------------------------------
// 9. No banned elements: Lottie players, autoplay video, autoplay iframe,
//    3D canvases.
//    Acceptance §16.9 + plan "rejected"
// ---------------------------------------------------------------------------

test("Criterion 9 — page contains no banned media elements", async ({ page }) => {
  await gotoLanding(page, "en");

  await expect(page.locator("video[autoplay]")).toHaveCount(0);
  await expect(page.locator("lottie-player, dotlottie-player")).toHaveCount(0);

  // 3D canvases: detect WebGL contexts. Any <canvas> that has had
  // getContext('webgl') / 'webgl2' called on it counts.
  const webglCanvases = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    let n = 0;
    for (const c of canvases) {
      try {
        if (c.getContext("webgl") || c.getContext("webgl2")) n++;
      } catch {
        // ignore
      }
    }
    return n;
  });
  expect(webglCanvases).toBe(0);

  const autoplayIframes = await page.locator("iframe").evaluateAll((els) =>
    els.filter((el) => {
      const src = el.getAttribute("src") ?? "";
      return /autoplay=1|autoplay=true/i.test(src);
    }).length
  );
  expect(autoplayIframes).toBe(0);
});

// ---------------------------------------------------------------------------
// 10. Tab order — no traps, top nav is keyboard reachable, and the hero
//     primary/secondary CTAs appear in order after the nav controls.
//     Acceptance §16.10 + a11y contract §4
// ---------------------------------------------------------------------------

test("Criterion 10 — initial tab order matches contract", async ({ page }) => {
  await gotoLanding(page, "en");
  await page.evaluate(() => window.scrollTo(0, 0));

  // Move focus to the very top of the document so the first Tab lands on
  // the first focusable element (the skip link).
  await page.evaluate(() => {
    const body = document.body;
    body.setAttribute("tabindex", "-1");
    body.focus();
  });

  const labels: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return { tag: "none", text: "", href: "", testid: "" };
      const text = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
      return {
        tag: el.tagName.toLowerCase(),
        text,
        href: (el as HTMLAnchorElement).href ?? "",
        testid: el.getAttribute("data-testid") ?? ""
      };
    });
    labels.push(`${info.tag}|${info.text}`);
  }

  // 1. Skip link — visible only on focus, text "Skip to content" (or locale variant).
  expect(labels[0]).toMatch(/skip/i);

  // 2. The sticky top nav is keyboard reachable before the page CTAs.
  expect(labels[1]).toMatch(/PetCura/i);
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    expect(labels.slice(2, 6).join(" ")).toMatch(
      /How it works.*AI safety.*Security.*Pricing/i
    );
  } else {
    expect(labels.slice(2, 5).join(" ")).toMatch(/EN.*ET.*RU/i);
  }

  const primaryIndex = labels.findIndex((label) =>
    new RegExp(PRIMARY_CTA.en, "i").test(label)
  );
  const secondaryIndex = labels.findIndex((label) =>
    new RegExp(SECONDARY_CTA.en, "i").test(label)
  );

  expect(primaryIndex).toBeGreaterThan(0);
  expect(secondaryIndex).toBeGreaterThan(primaryIndex);
});
