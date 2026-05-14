# PetCura Landing Overhaul — A11y + i18n Contract (2026-05)

**Owner:** accessibility-reviewer
**Consumers:** frontend-engineer (Wave 2), qa-engineer (Wave 2), design-system-guardian (Wave 1)
**Status:** Gate. Wave 2 implementation does not ship without all items in this contract verified.
**Target:** WCAG 2.2 AA on every overhauled marketing surface, full keyboard reach, full screen-reader landmarks, full `prefers-reduced-motion` static fallback, EN/ET/RU layout resilience.

---

## 0. Required tooling additions

Frontend must add the following dev dependencies in Wave 2 before tests can pass:

- `@axe-core/playwright` (latest, peer of `@playwright/test@1.x`) — for WCAG2AA scans inside Playwright specs
- `axe-core` (transitive of `@axe-core/playwright`, pin if version drift causes false positives)

Add an `npm run test:a11y` script in `apps/web/package.json` that runs `playwright test tests/accessibility/`. Wire it into `package.json` quality gates.

No new runtime dependencies are required for accessibility — every contract item below is satisfiable with semantic HTML, ARIA only where semantics fall short, Tailwind utilities already in the design token system, and the existing `:focus-visible` rule in `globals.css:212`.

---

## 1. WCAG 2.2 AA checklist per landing section

The current `apps/web/app/page.tsx` already establishes a strong baseline (one `<main>`, `aria-labelledby` per `<section>`, `aria-hidden` on every decorative icon, accessible `<figure aria-label>` on `ProductLoopMock`). Wave 2 must **preserve** every existing semantic choice when splitting the file into `apps/web/app/(marketing)/_sections/*`. Items below codify the line items that must hold per section.

Global rules (apply to every section):

- Contrast: body text ≥ 4.5:1 against its background token; large text (≥ 24px or ≥ 19px bold) ≥ 3:1; non-text UI (focus ring, icon-only chips) ≥ 3:1. Verify both light (`--background: paper`) and dark (`--background: ink`) themes.
- Focus order: matches visual reading order (top-left → bottom-right per locale, RTL not in scope).
- Keyboard reach: every interactive element reachable with `Tab` and operable with `Enter` / `Space`; no `tabindex` > 0; no `tabindex="-1"` on natively focusable elements.
- Landmarks: each section uses `<section aria-labelledby="...-heading">` with the matching `<h2 id="...-heading">`. Do not introduce nested `<main>` or stray `<header>` outside the page header / `<figure>` / `<article>`.
- Decorative icons: `aria-hidden="true"` on every `lucide-react` icon that sits next to text labelling the same concept. Today every icon in `page.tsx` is correctly decorated — Wave 2 must keep this when refactoring.
- Meaningful icons: any icon-only control (currently none, but the planned `ScrollStory` step dots and FAQ chevron qualify) needs `aria-label` in the active locale.
- Motion impact: any motion primitive used in the section must satisfy section 2 below. No exceptions.

### 1.1 Hero (`_sections/Hero.tsx`)
- `<h1>` is the **only** h1 on the page. Headline ships through `KineticHeadline` (see 2.2).
- Eyebrow chip uses `<span>`, not heading — current shape is correct.
- CTAs: primary + secondary `<Button asChild><Link>`. Both must have visible text labels in all three locales; `aria-label` only if the visible label is replaced by an icon at small viewports (avoid this — keep text).
- Trust chips: `<ul role="list">`. Bullets implemented as `<span aria-hidden="true">` — keep.
- `ProductLoopMock` `<figure>` retains `aria-label` describing the four-step loop. If frontend renames to `ProductLoopTimeline`, the `aria-label` must still describe the **outcome** narrative (WhatsApp → AI draft → staff approval → PMS export), not the animation.
- Focus order: skip-link → logo → primary nav → language switcher → sign-in → book-demo → eyebrow (non-focusable) → h1 (non-focusable) → primary CTA → secondary CTA → trust chips (non-focusable) → product loop (non-focusable unless interactive).
- Contrast: eyebrow text (`--muted` on `--paper`) measured at 4.5:1; if the new motion token system darkens `--paper`, re-measure.

### 1.2 LogoStrip (`_sections/LogoStrip.tsx`)
- `<p>` heading is informational, not a landmark heading. Keep as is.
- Placeholder logos are visible text inside `<li>`. When real logos land, each must be an `<img alt="Clinic name">` or inline SVG with `<title>` — never empty alt while the logo is meaningful.
- Marquee (if introduced per plan): `<ul>` with `aria-label="Pilot clinics"`. Must pause on `:hover` and on `:focus-within`. Reduced-motion = no scroll, static grid (see 2.6).

### 1.3 Problem (`_sections/Problem.tsx`)
- `<h2 id="problem-heading">` already wired. Keep.
- Red-tinted icon badges are decorative (`aria-hidden="true"`) — semantic meaning lives in the adjacent text. The red colour itself must not be the only carrier of meaning; the surrounding copy must read as a problem statement without colour.

### 1.4 Walkthrough (`_sections/Walkthrough.tsx`)
- Each step `<article>` with `<h3>` (already correct). Step numbers (`1`, `2`, `3`) are decorative chips; the heading text must communicate the step independently.
- If Wave 2 swaps to a `ScrollStory` driven sequence: the static fallback is a vertical numbered list (1 → 2 → 3) with all three steps visible at once. Reduced-motion users see this list — never a single "current" step.

### 1.5 UseCases (`_sections/UseCases.tsx`)
- Three `<article><h3>` cards. No changes required.

### 1.6 Integrations (`_sections/Integrations.tsx`)
- `<ul>` of chips. Each chip's icon `aria-hidden="true"` (already correct). Label text is the accessible name.

### 1.7 AISafety (`_sections/AISafety.tsx`)
- Two `<article>` cards: "Will" (sage) and "Will not" (red). Colour is reinforcement; the heading text ("PetCura will" / "PetCura will not") and per-item icons (`CheckCircle2` / `CircleSlash`) carry meaning.
- The `CircleSlash` next to each "won't" item must remain `aria-hidden="true"` because the heading already establishes negation; otherwise screen readers will read "circle slash" four times.
- Training disclaimer (`<strong>` inside `<p>`): keep visually emphasised; do not rely on bold alone — the copy must already read as a binding statement.

### 1.8 Compliance (`_sections/Compliance.tsx`)
- Six badge `<li>` items. Icon decorative. Badge label is the accessible name. If a badge gains a tooltip in the overhaul, use `<button aria-describedby>` or native `<abbr title>`; never a hover-only `::after`.

### 1.9 Testimonial (`_sections/Testimonial.tsx`)
- `<figure><blockquote><p>…</p></blockquote><figcaption>` — already correct. Curly quotes are decorative; do not duplicate them into `aria-label`.
- Metric `<aside>` should be `<div role="group" aria-labelledby="proof-metric-label">` if the metric is to be announced together. Today's `<aside>` works; promote to `<div role="group">` if Wave 2 introduces multiple metrics.

### 1.10 Pricing (`_sections/Pricing.tsx`)
- `<article>` with `<h3>` for the tier title. The `Badge` reads "EU" — ensure its `tone="teal"` colour contrast holds in dark mode (`--primary-soft` on dark background; verify ≥ 3:1 as non-text UI).
- CTA `mailto:` link must have a text label that reads independently of context ("Request a pilot", not "Click here").

### 1.11 FAQ (`_sections/FAQ.tsx`)
- Currently `<details><summary>` — keyboard accessible by browser default. **Keep `<details>` over a custom disclosure** unless the design requires animated expand. If frontend swaps to a custom button-based accordion (per plan, to coordinate motion), it must:
  - `<button aria-expanded="true|false" aria-controls="faq-panel-N">`
  - `<div id="faq-panel-N" role="region" aria-labelledby="faq-button-N" hidden>`
  - Escape key closes the currently open panel and returns focus to its button.
  - Arrow Up / Down moves focus between question buttons (optional WAI-ARIA pattern; not required for AA but expected for AAA polish).
- The rotating "+" indicator must be `aria-hidden="true"` (already correct).

### 1.12 FinalCTA (`_sections/FinalCTA.tsx`)
- `<h2>` once. Primary + secondary `<Button>`. Same kinetic-headline rules as Hero.

### 1.13 TopNav + Footer
- TopNav: already has `aria-label="Primary"`. Add a **skip-to-content link** as the first focusable element on the page (`<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>`); `<main>` gains `id="main-content"`.
- Mobile nav: today's design hides nav under `lg:`. Wave 2 must either keep this (acceptable — primary actions surface in the sticky CTA) or add a disclosure menu with `aria-expanded` + focus trap inside the open panel + Escape-to-close.
- Language switcher: today's `<LanguageSwitcher>` must keep an accessible label per option ("English", "Eesti", "Русский") and indicate the current selection with `aria-current="true"`.
- Footer `<nav aria-label="Footer">` — already correct.

---

## 2. Reduced-motion contract per motion primitive

**Hard rule.** The static (reduced-motion) presentation is the **first-class** experience. Every motion primitive must render fully understandable content with zero animation. The existing block in `apps/web/app/globals.css:217-226` zeros animation duration globally — Wave 2 must extend this with primitive-specific guarantees below, **and** must make `gsap` / `ScrollTrigger` a no-op when reduced motion is set.

Detection contract (frontend implementation hint, not optional):

```ts
// Wave 2 must export this from packages/ui/src/motion-tokens.ts or equivalent.
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

Every motion primitive's client component must:

1. Read `prefersReducedMotion()` on mount and listen for `change` on the `MediaQueryList`.
2. When `true`, skip motion library setup entirely — do not register a `ScrollTrigger`, do not call `motion.div`'s `whileInView`. Render the static markup.
3. Match the CSS contract: even if a `ScrollTrigger` somehow registers, `@media (prefers-reduced-motion: reduce)` zeroes its visible effect (opacity/transform reset to final state).

### 2.1 `Reveal` (fade/translate on enter viewport)
- Default: `opacity: 0 → 1`, `translateY: 12px → 0` over ~400ms.
- Reduced motion: render at final state immediately. No fade. No translate. CSS fallback: `[data-reveal] { opacity: 1 !important; transform: none !important; }` inside the reduced-motion block.

### 2.2 `KineticHeadline` (hero + final CTA)
- Default: **word-by-word** or **line-by-line** stagger only. **Letter-by-letter is forbidden** (see 3.3).
- Reduced motion: the headline renders as a single block of static text with `text-wrap: balance`. No stagger, no opacity transition. The headline must be the page `<h1>` (hero) or `<h2>` (final CTA) and must be in the DOM as plain text so screen readers receive it once — not word-by-word.

### 2.3 `ScrollStory` (hero → walkthrough → AI safety scroll-scrubbed sequence)
- Default: scroll-scrubbed transitions between three to four narrative steps; one step "active" at a time on desktop; current step is `aria-current="step"` and an `aria-live="polite"` status announces "Step N of M: {title}".
- Reduced motion **and** viewport < 768px: render as a static, vertically stacked numbered list. All steps visible simultaneously. No `ScrollTrigger.create` call fires. No `aria-current`. No `aria-live` (nothing changes). Each step is a `<section>` with its own `<h3>`.
- Mobile (< 768px) is treated as equivalent to reduced motion for this primitive — the plan explicitly designates both as first-class targets.

### 2.4 `ProductLoopTimeline` (refactor of `ProductLoopMock`)
- Default: the four steps animate in sequence with the sage trail (current `pc-loop-trail` keyframe) progressing top-to-bottom. Loop is decorative; the `<figure aria-label>` already narrates the outcome.
- Reduced motion: the trail renders at full height (final state). The four steps render with full opacity simultaneously. `pc-typing-dot` animation halts (already covered by global block, but the dots must remain visually present as static circles, not invisible).
- The `<figure aria-label>` text must remain accurate when the motion is paused.

### 2.5 `MotionSection` (wrapper that drives section-level reveals)
- Default: fade + translate on enter viewport; coordinates child `Reveal` staggers.
- Reduced motion: passthrough — render children at final state, no `IntersectionObserver`-driven changes.

### 2.6 `Marquee` (logo strip, possibly testimonial scroller)
- Default: infinite horizontal scroll, pause on `:hover` and `:focus-within`, duplicate content marked `aria-hidden="true"` so screen readers receive each logo once.
- Reduced motion: animation halted; content shifts to a static grid (CSS grid fallback). Items wrap normally. No duplicate content rendered — only the original `<ul>` of items.

### 2.7 Global CSS contract (extend `globals.css:217-226`)

The current block only zeroes `animation-duration` and `transition-duration`. Wave 2 must extend the reduced-motion block to neutralise transform/opacity overrides that motion libraries inject as inline styles:

```css
@media (prefers-reduced-motion: reduce) {
  /* keep existing zeroing */
  [data-motion],
  [data-reveal],
  .pc-loop-step,
  .pc-typing-dot {
    animation: none !important;
    transition: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
  /* pc-loop-trail fills its container at rest instead of growing */
  .pc-loop-trail {
    transform: scaleY(1) !important;
  }
}
```

`gsap`/`ScrollTrigger` no-op: the JS-side guard in section 2's detection contract is the source of truth. CSS is the safety net. If a `ScrollTrigger` registers despite the guard, the `!important` rules above pin all transforms to their resting state.

---

## 3. EN/ET/RU resilience rules

RU expands roughly 25% over EN; ET expands roughly 10–15%. Designs that look perfect in EN routinely clip in RU. The current `page.tsx` uses `max-w-xl` / `max-w-2xl` on copy blocks — these are content-width caps and are safe. Buttons size to content. The risks below are all introduced by the **planned** motion + kinetic typography work.

### 3.1 Headlines design for RU width
- The hero `<h1>` and every section `<h2>` must be visually verified against the **RU** label first. EN and ET get extra whitespace at the end of the line; never the other way around.
- Use `text-wrap: balance` on all headline elements.
- Never use `text-overflow: ellipsis` on headline or body copy. Truncation hides meaning. If a container can't fit the RU string, the container is wrong — not the string.

### 3.2 No fixed-width text containers below 320px
- Smallest supported viewport is 320px (iPhone SE 1st gen ≈ smallest realistic target). No CTA, chip, badge, or card may set `width: Npx` where `N` is smaller than the RU rendered text width at 16px base font.
- Use padding-based sizing (`px-3 py-1.5` style) — current `page.tsx` is already padding-based throughout. Wave 2 must preserve this when adding motion wrappers; `motion.div` must not introduce inline `width` values.

### 3.3 No letter-by-letter kinetic animation
- Cyrillic glyph kerning breaks when each character becomes its own positioned span. Specifically, `й`, `ё`, `ы`, and combining marks render with horizontal gaps that destroy the headline rhythm.
- `KineticHeadline` reveals only **word-by-word** (`split(" ")`) or **line-by-line** (`<span>` per logical line). Letter-by-letter is forbidden for all three locales — it is not "fine in EN, broken in RU" — it must be banned consistently so visual QA is single-codepath.

### 3.4 Buttons: padding-based sizing
- Buttons inherit shadcn defaults already in `packages/ui/src/primitives.tsx`. Confirm none of the new marketing-only Button variants set `min-width` in pixels; use `min-w-fit` if a floor is required, never `min-w-[120px]`.
- Two-line buttons are acceptable on mobile if the RU CTA wraps; design the button height to accommodate two lines without overflow.

### 3.5 `text-wrap: balance` for headlines; never `ellipsis` for copy
- Apply `text-wrap: balance` (Tailwind `text-balance` if configured, otherwise inline `style={{textWrap:'balance'}}`) to `<h1>`, `<h2>`, `<h3>`.
- Apply `text-wrap: pretty` (or leave default) for `<p>` blocks.
- `overflow: hidden` + `text-overflow: ellipsis` is permitted **only** on the language switcher's `shortLabel` ("EN" / "ET" / "RU" — these are already 2 chars and won't truncate) and on PMS clinic-name display elsewhere in the app. It is **forbidden** on the landing.

### 3.6 Verification matrix
QA must capture every section at three locales × two themes × two viewports × motion/reduced-motion = 24 captures per section. The matrix lives in `tests/visual/landing.spec.ts` (qa-engineer's deliverable). This contract requires the qa matrix to include reduced-motion explicitly; the existing `tests/e2e/dark-mode-crawl.spec.ts` pattern is the template.

---

## 4. Focus management

- Extend the existing `:focus-visible` rule (`globals.css:212-215`). Outline must remain ≥ 3:1 against any background it lands on; today's `rgba(74,107,63,0.32)` ring may not meet 3:1 against `--surface-soft` in dark mode — re-measure and bump alpha if needed.
- Add a **skip-to-content** link as the very first child of `<body>` (or the marketing layout). It must be visually hidden until focused (`sr-only focus:not-sr-only`), then visible at the top of the viewport with a solid background.
- `<main>` gains `id="main-content"`. The skip link targets it.
- No focus traps anywhere on the landing. Specifically: a mobile nav disclosure may set `aria-modal="true"` and trap focus inside the panel while open, but the panel must close on Escape and on outside-click, returning focus to the toggle button.
- FAQ accordions: Escape closes the currently expanded panel and returns focus to its trigger.
- The language switcher dropdown (if it grows into a menu): Escape closes; Arrow Up/Down moves; Enter selects; focus returns to the toggle.

---

## 5. Screen reader contract

- Landmarks: exactly one `<header>`, one `<main>`, one `<footer>` per page. Each `<section>` uses `aria-labelledby` pointing at its `<h2>`. Existing implementation is correct — Wave 2 must not regress this when extracting sections.
- Heading order: `h1` exactly once (hero). `h2` once per section. `h3` per subblock inside a section. No `h4` is expected on the landing; if introduced, must be nested under an `h3` of the same section.
- `aria-live`: only the `ScrollStory` step counter needs `aria-live="polite"`. Nothing else on the landing changes content dynamically. Do not add `aria-live` to motion wrappers — the motion is decorative.
- `aria-busy`: do not use. The landing is static content.
- Form fields: the landing has no forms. Mailto CTAs are plain `<a href="mailto:">` — no ARIA needed.
- `lang` attribute: the `<html lang>` must match the active locale (`en` / `et` / `ru`). Verify in the Next.js root layout — out of scope for this contract but flagged for frontend-engineer.

---

## 6. Colour contrast targets

All values measured at the page-rendered token computed values; tokens may change in Wave 1's motion-token additions — re-measure if `--paper` / `--ink` shift.

### Light theme (`--background: --paper`)
- `--foreground` on `--paper`: must be ≥ 4.5:1 (body text), ≥ 3:1 (large text).
- `--muted` on `--paper`: ≥ 4.5:1 (this is the body copy default in `page.tsx` — currently borderline; verify and bump `--muted` darker if measurement fails).
- `--primary-strong` on `--paper`: ≥ 4.5:1 (used for kickers and links).
- `--primary` on `--paper`: ≥ 3:1 (used for icons and decorative bullets — non-text rule).
- `--red` on `--paper`: ≥ 4.5:1 (problem section).
- `--primary-soft` on `--paper`: ≥ 3:1 as non-text UI surface (compliance and AI-safety badges).
- Focus ring on every background it lands on: ≥ 3:1.

### Dark theme (`--background: --ink`)
- `--foreground` on `--ink`: ≥ 4.5:1.
- `--muted` on `--ink`: ≥ 4.5:1 — historically the weakest pair; QA's dark-mode crawl already exercises this. If any section fails, fix the token, not the markup.
- `--primary-soft` on `--ink`: ≥ 3:1 as surface. Sage-on-dark sometimes drops below 3:1; the design-system-guardian must validate the post-overhaul token table.

### "Sage on paper" / "ink on paper" / "paper on ink"
The three branded combinations:
1. **Sage on paper** (`--primary` / `--primary-strong` on `--paper`): kickers, hero accents, sage trail. Sage-strong required for text; sage standard acceptable for non-text iconography.
2. **Ink on paper** (`--foreground` on `--paper`): body and headline default. Must be ≥ 7:1 (AAA) where possible; the existing token pairing comfortably exceeds 4.5:1.
3. **Paper on ink** (dark mode): `--foreground` (= remapped to off-white) on `--ink`. Must hold ≥ 4.5:1; verify after any token shift.

---

## 7. Verification gates (the gate Wave 2 must satisfy)

A landing surface is accepted only when:

- `tests/accessibility/landing.spec.ts` passes (all currently-`test.fixme` tests are un-fixmed and green).
- Lighthouse Accessibility = 100 on `/`, `/?lang=et`, `/?lang=ru`, light and dark themes.
- Manual reduced-motion smoke: macOS "Reduce motion" on + scroll-through of `/` → zero JS animations fire AND every section is fully legible AND `ScrollStory` is a static stepped list.
- Manual screen-reader smoke (VoiceOver): hero, AI safety, compliance, FAQ — landmarks announced, no decorative icon names read out, headings in order.
- Manual EN/ET/RU smoke via `?lang=` — no clipped text, no broken layouts, no `…` truncation on any landing copy at 320px / 768px / 1280px.
- Keyboard-only walkthrough from URL load → skip link → hero CTA → FAQ open/close → footer link → mailto — no focus loss, no trap, no invisible-focus state.

Failure of any item blocks merge.
