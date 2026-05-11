import nextVitals from "eslint-config-next/core-web-vitals";

/**
 * Forbid hardcoded theme colors that break dark mode.
 *
 * After the Direction-B brand migration, every UI surface flows colors through
 * CSS variables (`var(--paper)`, `var(--ink)`, etc.) so a single cookie flip
 * re-themes the entire app. `bg-white`, `text-black`, `#fff`, etc. baked into
 * components bypass the token system and render as bright panels on the dark
 * surface (and vice versa). This rule catches them at PR time so we stop
 * shipping the same class of bug repeatedly.
 *
 * Exemptions:
 *   - `apps/web/app/design/**`           — token swatches need hex literals
 *   - `apps/web/components/ui/**`        — shadcn-generated; we patch the
 *                                          theme via @theme inline mappings
 *                                          rather than editing each file
 *   - `apps/web/public/prototypes/**`    — already ignored above
 *   - `*.test.ts` / `*.spec.ts`          — Playwright selectors can mention
 *                                          color tokens in assertions
 *
 * If you legitimately need a literal in a new place (e.g., an email template
 * where CSS variables don't resolve), add the file to the exemption list with
 * a one-line comment explaining why.
 */
// Forbids `bg-white` / `bg-black` (no slash) — those are surface fills that
// break dark mode. Allows `bg-(white|black)/<alpha>` because those are scrims
// and overlays where the color is intentionally theme-agnostic. Also allows
// `text-(white|black)`, `border-(white|black)`, etc. on the assumption that
// foreground/border-on-solid is paired with a token-driven background.
const noHardcodedThemeColors = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Literal[value=/\\bbg-(white|black)(?!\\/)\\b/]",
        message:
          "Don't hardcode bg-white / bg-black as a surface fill — use theme tokens (bg-[var(--paper)], bg-[var(--soft)]) so dark mode works. (bg-black/<alpha> for scrims is fine.)"
      },
      {
        selector:
          "TemplateElement[value.raw=/\\bbg-(white|black)(?!\\/)\\b/]",
        message:
          "Don't hardcode bg-white / bg-black inside a template literal — use theme tokens."
      },
      {
        selector:
          "Literal[value=/#([fF]{3}|[fF]{6}|0{3}|0{6})(?![0-9a-fA-F])/]",
        message:
          "Don't hardcode #fff / #ffffff / #000 / #000000 — flow through CSS variables (--paper, --ink) so dark mode works."
      }
    ]
  }
};

export default [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "playwright-report/**",
      "test-results/**",
      // Static handoff prototypes — vanilla React-via-Babel-standalone, not
      // production source. Linted patterns differ; served as-is from /public.
      "apps/web/public/prototypes/**"
    ]
  },
  ...nextVitals,
  {
    files: ["apps/web/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    ignores: [
      // /design renders token swatches with literal hex values by design.
      "apps/web/app/design/**",
      // shadcn-generated components are theme-bridged via @theme inline in
      // globals.css. We patch behavior (e.g., the data-active fix) but accept
      // any color literals shadcn ships with — re-theming flows through tokens.
      "apps/web/components/ui/**",
      // Test specs may reference color values in selectors / DOM assertions.
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/e2e/**"
    ],
    ...noHardcodedThemeColors
  }
];
