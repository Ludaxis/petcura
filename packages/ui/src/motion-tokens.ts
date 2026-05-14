/**
 * PetCura motion tokens — single source of truth for durations, easings,
 * rise distances, and stagger windows shared between CSS and JS.
 *
 * Mirror of the `--motion-*` and `--ease-*` custom properties registered in
 * `apps/web/app/globals.css`. Authored once here, consumed three ways:
 *
 *   1. Tailwind / CSS:  `transition-duration: var(--motion-base)`
 *   2. inline style:     `style={{ transitionDuration: motionTokens.duration.base }}`
 *   3. motion/react:     `transition={{ duration: motionTokens.durationSeconds.base, ease: motionTokens.ease.standard }}`
 *
 * Rules of the road (enforced by review, not by the type system):
 *
 *  - Animate transform + opacity ONLY. Width/height/background-color trigger
 *    layout/paint and break our 60fps budget on the Moto G4.
 *  - `storytell` (1200ms) is landing-only. Never use inside the clinic inbox
 *    or owner app — they stay calm and operational.
 *  - The `leitmotif` ease is the brand signature. Reserve it for the single
 *    progress / route-morph indicator (see `pc-loop-trail`), not generic
 *    hover transitions.
 *  - Under `prefers-reduced-motion: reduce`, every consumer of these tokens
 *    must produce a first-class static layout — not a degraded one. See
 *    `docs/design/motion-system-2026-05.md` for the per-primitive contract.
 */

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

/**
 * Durations in milliseconds, expressed as CSS strings ("80ms"). Use for
 * inline `style` props and CSS variable fallbacks.
 */
export const duration = {
  instant: "80ms",
  fast: "160ms",
  base: "240ms",
  slow: "400ms",
  extraSlow: "640ms",
  /** Landing-only. Reserved for scroll-driven storytelling beats. */
  storytell: "1200ms"
} as const;

/**
 * Same durations as raw milliseconds — handy when you need arithmetic
 * (e.g. computing a stagger window or React `setTimeout`).
 */
export const durationMs = {
  instant: 80,
  fast: 160,
  base: 240,
  slow: 400,
  extraSlow: 640,
  storytell: 1200
} as const;

/**
 * Same durations in seconds — motion/react's `transition.duration` accepts
 * seconds, not milliseconds.
 */
export const durationSeconds = {
  instant: 0.08,
  fast: 0.16,
  base: 0.24,
  slow: 0.4,
  extraSlow: 0.64,
  storytell: 1.2
} as const;

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

/**
 * CSS easing strings. Use directly in `transition-timing-function` or
 * `animation-timing-function`.
 */
export const ease = {
  /** Material 3 emphasized — default for almost everything in the app. */
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  /** Accelerate-only — for outgoing elements (modals closing, toasts leaving). */
  exit: "cubic-bezier(0.3, 0, 1, 1)",
  /** Decelerate-only — for incoming elements (reveals, panel opens). */
  enter: "cubic-bezier(0, 0, 0, 1)",
  /**
   * Signature brand curve. Reverse-engineered from `pc-loop-trail` (the May
   * 13 hero vertical progress) so the marketing scroll story and any
   * app-wide route-morph progress indicator share the same gait.
   */
  leitmotif: "cubic-bezier(0.4, 0, 0.2, 1)"
} as const;

/**
 * Same easings as `[x1, y1, x2, y2]` cubic-bezier arrays — motion/react and
 * `Element.animate()`'s WAAPI both prefer this shape.
 */
export const easeArray = {
  standard: [0.2, 0, 0, 1] as const,
  exit: [0.3, 0, 1, 1] as const,
  enter: [0, 0, 0, 1] as const,
  leitmotif: [0.4, 0, 0.2, 1] as const
} as const;

// ---------------------------------------------------------------------------
// Rise distances
// ---------------------------------------------------------------------------

/**
 * Vertical translate distances applied by the `Reveal` primitive. The
 * baseline `md` matches what `pc-row-in` already uses for directory rows
 * (4px is too subtle for hero-section reveals; 16px is the sweet spot).
 */
export const rise = {
  sm: "8px",
  md: "16px",
  lg: "24px"
} as const;

export const riseMs = {
  sm: 8,
  md: 16,
  lg: 24
} as const;

// ---------------------------------------------------------------------------
// Stagger windows
// ---------------------------------------------------------------------------

/**
 * Per-item delay used when revealing N siblings in sequence (e.g. feature
 * grid cards, FAQ rows). Cap total cascade at ~600ms regardless of N to
 * avoid the existing `pc-row-in` problem of long lists crawling in.
 */
export const stagger = {
  tight: "40ms",
  base: "80ms",
  loose: "120ms"
} as const;

export const staggerMs = {
  tight: 40,
  base: 80,
  loose: 120
} as const;

export const staggerSeconds = {
  tight: 0.04,
  base: 0.08,
  loose: 0.12
} as const;

// ---------------------------------------------------------------------------
// Layer policy (documentation-only constant — exported so tooling/lints can
// later assert the allowlist).
// ---------------------------------------------------------------------------

/**
 * The only CSS properties our motion primitives are allowed to animate.
 * Anything else (width, height, top, left, background-color, color, etc.)
 * is a perf bug — wrap in transform/opacity instead.
 */
export const ANIMATABLE_PROPERTIES = ["transform", "opacity"] as const;

// ---------------------------------------------------------------------------
// Unified default export
// ---------------------------------------------------------------------------

export const motionTokens = {
  duration,
  durationMs,
  durationSeconds,
  ease,
  easeArray,
  rise,
  riseMs,
  stagger,
  staggerMs,
  staggerSeconds,
  animatableProperties: ANIMATABLE_PROPERTIES
} as const;

export type MotionTokens = typeof motionTokens;
export type MotionDurationKey = keyof typeof duration;
export type MotionEaseKey = keyof typeof ease;
export type MotionRiseKey = keyof typeof rise;
export type MotionStaggerKey = keyof typeof stagger;
