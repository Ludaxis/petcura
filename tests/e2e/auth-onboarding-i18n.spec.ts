/**
 * EN/ET/RU parity + Russian layout resilience for auth + onboarding.
 *
 * Contract: docs/design/auth-onboarding-merged-plan-2026-05.md §12.5,
 *           docs/design/a11y-i18n-contract-2026-05.md §3.
 *
 * Russian text is the longest — this suite verifies it does not overflow
 * the viewport, does not get visibly clipped by overflow:hidden, and that
 * every key the app reads is present in all three locales.
 */

import { test, expect } from "@playwright/test";

const LOCALES = ["en", "et", "ru"] as const;

const PUBLIC_PAGES = [
  { name: "cold-login", url: "/login" },
  {
    name: "invite-login",
    url:
      "/login?invite=1&email=jana%40clinic.ee&clinic=Tartu+Loomakliinik"
  },
  { name: "owner-login", url: "/o/login" }
] as const;

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1280, height: 800 }
] as const;

// ---------------------------------------------------------------------------
// 1. No horizontal overflow at the body / main level
// ---------------------------------------------------------------------------

for (const page of PUBLIC_PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`no horizontal scroll — ${page.name} @ ${viewport.name} (ru)`, async ({
      page: pw
    }) => {
      await pw.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });
      const url = page.url.includes("?")
        ? `${page.url}&lang=ru`
        : `${page.url}?lang=ru`;
      await pw.goto(url);
      const dims = await pw.evaluate(() => ({
        bodyScrollW: document.body.scrollWidth,
        bodyClientW: document.body.clientWidth,
        htmlScrollW: document.documentElement.scrollWidth,
        htmlClientW: document.documentElement.clientWidth
      }));
      expect(
        dims.bodyScrollW,
        `body horizontal scroll on ${url} @ ${viewport.name}: ${JSON.stringify(dims)}`
      ).toBeLessThanOrEqual(dims.bodyClientW + 1);
    });
  }
}

// ---------------------------------------------------------------------------
// 2. High-risk strings (buttons, error banners, OTP labels) do not get
//    visibly clipped by overflow:hidden + text-overflow:ellipsis.
// ---------------------------------------------------------------------------

for (const page of PUBLIC_PAGES) {
  test(`primary CTA button does not truncate copy (ru, mobile) — ${page.name}`, async ({
    page: pw
  }) => {
    await pw.setViewportSize({ width: 375, height: 812 });
    const url = page.url.includes("?")
      ? `${page.url}&lang=ru`
      : `${page.url}?lang=ru`;
    await pw.goto(url);
    const result = await pw.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>("button[type=submit]")
      );
      return buttons.map((b) => {
        const cs = getComputedStyle(b);
        return {
          text: b.textContent?.trim() ?? "",
          scrollW: b.scrollWidth,
          clientW: b.clientWidth,
          overflow: cs.overflow,
          textOverflow: cs.textOverflow,
          whitespace: cs.whiteSpace
        };
      });
    });
    for (const b of result) {
      if (b.textOverflow === "ellipsis" && b.overflow !== "visible") {
        // Allow only if scrollWidth fits clientWidth.
        expect(
          b.scrollW,
          `Button "${b.text}" is clipped by ellipsis (scrollW=${b.scrollW} clientW=${b.clientW})`
        ).toBeLessThanOrEqual(b.clientW + 1);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// 3. Key parity in the shared dictionary (load module directly)
// ---------------------------------------------------------------------------

test("every i18n key exists in en, et, and ru (no missing keys)", async () => {
  // Dynamic import so the test doesn't depend on Playwright resolving
  // package aliases.
  const { uiCopy } = (await import(
    "../../packages/shared/src/i18n.ts"
  )) as typeof import("../../packages/shared/src/i18n.ts");
  const enKeys = new Set(Object.keys(uiCopy.en));
  const etKeys = new Set(Object.keys(uiCopy.et));
  const ruKeys = new Set(Object.keys(uiCopy.ru));
  const missingInEt = [...enKeys].filter((k) => !etKeys.has(k));
  const missingInRu = [...enKeys].filter((k) => !ruKeys.has(k));
  const extraInEt = [...etKeys].filter((k) => !enKeys.has(k));
  const extraInRu = [...ruKeys].filter((k) => !enKeys.has(k));
  expect(
    { missingInEt, missingInRu, extraInEt, extraInRu },
    JSON.stringify({ missingInEt, missingInRu, extraInEt, extraInRu }, null, 2)
  ).toEqual({
    missingInEt: [],
    missingInRu: [],
    extraInEt: [],
    extraInRu: []
  });
});

test("every owner i18n key exists in en, et, and ru", async () => {
  const ownerI18n = (await import(
    "../../apps/web/lib/owner/i18n.ts"
  )) as Record<string, unknown>;
  // The module exports a translator factory backed by `dictionaries`. Probe
  // by translating a known key — if the factory is missing a locale entry
  // it returns the key itself.
  const createOwnerTranslator = ownerI18n.createOwnerTranslator as (
    locale: "en" | "et" | "ru"
  ) => (key: string) => string;

  // Sample keys this redesign added.
  const keys = [
    "login.title",
    "login.subtitle",
    "login.phone.label",
    "login.phone.placeholder",
    "login.phone.continue",
    "login.otp.title",
    "login.otp.verify",
    "login.otp.back",
    "login.otp.resendNow",
    "login.otp.cellLabel",
    "login.otp.tryChannel.sms",
    "login.otp.tryChannel.whatsapp",
    "login.otp.subtitleWhatsApp",
    "login.otp.subtitleSms",
    "login.otp.resendIn",
    "join.eyebrow",
    "join.subheadingWithPet",
    "join.subheadingNoPet",
    "join.cta.continue",
    "join.cta.continueNoPet",
    "join.notMe",
    "join.terms",
    "join.body"
  ];
  const missing: Record<string, string[]> = { en: [], et: [], ru: [] };
  for (const locale of ["en", "et", "ru"] as const) {
    const t = createOwnerTranslator(locale);
    for (const k of keys) {
      const v = t(k);
      // The translator returns the raw key when missing — assert it returns
      // something different from the key (i.e., an actual translation).
      if (!v || v === k) missing[locale].push(k);
    }
  }
  expect(missing, JSON.stringify(missing, null, 2)).toEqual({
    en: [],
    et: [],
    ru: []
  });
});
