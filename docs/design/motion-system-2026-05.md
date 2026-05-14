# PetCura Motion System — 2026-05

Status: Proposed (Wave 1, `design-system-guardian`).
Owner: Claude (`packages/ui/**`, motion primitives, marketing surface).
Reviewers: Codex (perf/budget), product-designer (narrative fit), accessibility-reviewer (reduced-motion contracts).
Companion files:
- `packages/ui/src/motion-tokens.ts` — typed export, single source of truth.
- `apps/web/app/globals.css` — `@layer motion-tokens` block + reduced-motion zeroing.
- `docs/contracts/motion-policy.md` — short, contract-grade restatement of the split (to follow).

## 1. Goal

Codify a calm, healthcare-grade motion language that:

- **Sells trust** on the landing surface (AI-safety, EU residency, audit trail) through purpose-driven motion, not flash.
- **Stays out of the way** in the clinic inbox and owner app — dense operational surfaces where motion must inform, never delight.
- **Survives reduced-motion** as a first-class presentation, not a degraded fallback.
- **Hits the perf budget**: ≤ 90 kB gzipped landing JS, 60fps on a throttled Moto G4, LCP < 1.5s.

## 2. Marketing vs. App split

Motion discipline is no longer a single rule across the codebase. It splits on the route boundary.

| Surface | Allowed motion libraries | Allowed techniques | Hard limits |
| --- | --- | --- | --- |
| `apps/web/app/(marketing)/**` — landing, future marketing pages | `motion@^12` (Framer Motion), `gsap@^3` (ScrollTrigger plugin only) | View Transitions, CSS keyframes, motion/react variants, ScrollTrigger for hero + walkthrough only | `gsap` plugins outside `ScrollTrigger` are banned. `motion/react` and `gsap` must be dynamic-imported below the fold. Hero stays pure CSS to protect LCP. |
| `apps/web/app/o/**` — owner intake / public app | None (CSS only) | View Transitions, CSS keyframes, `prefers-reduced-motion` blocks | No JS animation libraries. No scroll triggers. |
| `apps/web/app/(app)/**`, `apps/web/features/**` — clinic inbox, request detail, settings, etc. | None (CSS only) | View Transitions for route/row morphs, CSS keyframes for skeletons/progress, `pc-row-in` cascade | No JS animation libraries. No scroll-driven effects. No `motion/react`. |
| `packages/ui/**` | None (CSS only) | CSS keyframes, transition tokens, View Transition assignments | Primitives must be usable from both marketing and app contexts, so they cannot import `motion/react` or `gsap` directly. |

**Enforcement.** A future ESLint rule (`no-restricted-imports`) will block `motion/react` and `gsap` outside `apps/web/app/(marketing)/**`. Until that lands, PR review is the gate; agents must call out any cross-boundary import.

**Why this split.** The clinic surface is a high-volume queue used 8 hours a day under fluorescent lights. Even tasteful scroll-driven motion is hostile there. The marketing surface is a 90-second trust pitch where well-aimed motion is the cheapest way to communicate "the agent works", "the audit trail is real", "the EU residency is enforced".

## 3. Tokens (mirrors `motion-tokens.ts`)

### Durations

| Token | Value | When |
| --- | --- | --- |
| `--motion-instant` | 80ms | Tap response, pill press, focus ring fade |
| `--motion-fast` | 160ms | Hover state, button color change |
| `--motion-base` | 240ms | Default — modal open, popover, View Transition (already used at 220ms) |
| `--motion-slow` | 400ms | Section reveal, drawer slide-in |
| `--motion-extra-slow` | 640ms | KineticHeadline word/line cascade total |
| `--motion-storytell` | 1200ms | **Landing only.** Scroll-driven beat, hero badge sequence |

### Easings

| Token | Curve | When |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Material 3 emphasized. Default for everything. |
| `--ease-enter` | `cubic-bezier(0, 0, 0, 1)` | Decelerate-only. Incoming elements. |
| `--ease-exit` | `cubic-bezier(0.3, 0, 1, 1)` | Accelerate-only. Outgoing elements. |
| `--ease-leitmotif` | `cubic-bezier(0.4, 0, 0.2, 1)` | **Brand signature.** See §4. |

### Rise distances (for `Reveal`)

| Token | Value | When |
| --- | --- | --- |
| `--motion-rise-sm` | 8px | In-card content, secondary copy |
| `--motion-rise-md` | 16px | Default section reveal |
| `--motion-rise-lg` | 24px | Hero, big-statement reveals |

### Stagger

| Token | Value | When |
| --- | --- | --- |
| `--motion-stagger-tight` | 40ms | Inline list (FAQ rows, status pills) |
| `--motion-stagger-base` | 80ms | Default — feature grid, walkthrough cards |
| `--motion-stagger-loose` | 120ms | Hero badge cascade, deliberate beats |

Cascade total cap: 600ms. For lists of N > 8, clamp the per-item delay via `min(N, 8)` so a 30-row directory doesn't crawl in (mirrors the existing `pc-row-in` cap at 20 rows × 28ms).

### Layer policy (non-negotiable)

Animate **transform + opacity only**. Width/height/background-color/color animate via layout/paint and break the frame budget. If you need to "grow" a card on hover, scale it (`transform: scale(1.005)`), don't change `padding`.

## 4. Brand leitmotif

The May 13 hero ships `pc-loop-trail` (globals.css line ~461) — a vertical 2px sage line that travels top-to-bottom over a 14s window, signalling the WhatsApp → AI → staff → PMS cycle. Its `cubic-bezier(0.4, 0, 0.2, 1)` curve is now promoted to `--ease-leitmotif` and becomes the brand's signature gait.

**Where it appears (and only here):**

- `pc-loop-trail` itself (unchanged).
- `TopProgressBar` (`packages/ui/src/loading.tsx`) — the route-change indicator. Will be migrated from `1.2s ease-in-out` to `var(--motion-storytell) var(--ease-leitmotif)` in a follow-up so the bar's gait matches the hero.
- View Transition root crossfade — currently uses `cubic-bezier(0.2, 0.7, 0.2, 1)`; will be re-pointed to `--ease-leitmotif` so route morphs share the gait.
- Future: any new "the agent is working" affordance app-wide.

**Where it does NOT appear:** hover states, button presses, popovers, toasts. The leitmotif is the brand voice; it must stay rare or it becomes noise.

## 5. Reduced-motion contract

`prefers-reduced-motion: reduce` is treated as a **first-class layout**, not a degradation. Every primitive ships its reduce-mode state simultaneously with its motion state; design and copy review both.

| Primitive | Motion state | Reduce state |
| --- | --- | --- |
| `Reveal` | Opacity 0 → 1 + translateY(rise) → 0 over `--motion-base`. | Static. No transform, no opacity transition. Content is visible on mount. The rise tokens collapse to `0px` automatically via the CSS zeroing block. |
| `KineticHeadline` | Line-by-line opacity + 8px rise, 80ms per line, `--ease-enter`. | Full headline rendered statically on mount. No per-line wrapper visibility hacks. Cyrillic/Estonian widths must lay out identically. |
| `ScrollStory` | GSAP ScrollTrigger pins a hero panel and cross-fades four beats as the user scrolls ~200vh. | Renders as a stacked list of four numbered cards, no pinning, no scroll listener, no GSAP loaded. The list is the canonical content; the scroll experience is the marketing layer. |
| `MotionSection` | Wraps a section in a `motion.section` with `whileInView` opacity 0 → 1 + `--motion-rise-md`. | Renders as `<section>` with no IntersectionObserver attached. Content visible on first paint. |
| `Marquee` | Infinite horizontal scroll of logos at `--motion-extra-slow` × N. | Static row, no duplication, horizontally scrollable via native overflow if it overflows. |

**Test gate.** `tests/visual/landing.spec.ts` must capture every section in both `motion` and `reduce` matrices (Playwright's `prefers-reduced-motion` emulation). A passing reduce snapshot is a release gate, not a stretch goal.

**Anti-pattern to avoid.** Do not write `motion-reduce:opacity-0` anywhere. Reduced-motion users still need to see content — they just don't want it to move. The bug pattern of "hide animated content when motion is off" is the single most common a11y regression in this category.

## 6. Performance budgets

- **Landing JS gzipped**: ≤ 90 kB. CI assertion in `vercel:performance-optimizer` brief.
- **Frame budget**: 60fps target on Moto G4 throttled (4× CPU, Fast 3G). Long-task warnings on > 50ms.
- **GSAP tree-shaking**: Only `gsap/ScrollTrigger` is allowed. The marketing entry must `import { gsap } from "gsap"; import { ScrollTrigger } from "gsap/ScrollTrigger"` and call `gsap.registerPlugin(ScrollTrigger)`. No `Flip`, `MotionPath`, `Draggable`, `MorphSVG`, etc.
- **Dynamic import boundary**: `motion/react` and `gsap` load via `next/dynamic` with `ssr: false` and trigger only after the hero is mounted. Hero itself is pure CSS / RSC.
- **`next.config.ts`**: `optimizePackageImports: ["motion", "lucide-react"]`.
- **`will-change`** is used sparingly and removed on animation end — existing `pc-loop-step` / `pc-walk-step` already follow this; new primitives must too.

## 7. API surface — motion primitives (to be implemented in Wave 2)

Specified here so the implementing engineer has no design ambiguity. Do **not** implement in this PR.

### `Reveal`

```ts
type RevealProps = {
  children: React.ReactNode;
  /** Vertical rise distance. Default "md". */
  rise?: "sm" | "md" | "lg";
  /** Duration token. Default "base". */
  duration?: "fast" | "base" | "slow";
  /** Stagger window when used inside a `Reveal.Group`. */
  index?: number;
  /** Render-as element. Default "div". */
  as?: keyof JSX.IntrinsicElements;
  className?: string;
};
```

- **Use for**: any section/card/headline that should fade-rise in on first viewport entry.
- **Anti-pattern**: nesting `Reveal` inside `Reveal` (cascade ambiguity). Use `Reveal.Group` instead.
- **Implementation hint**: marketing version uses `motion.div` with `whileInView`. App version (if ever needed) uses an `IntersectionObserver` + CSS class toggle. The component file decides based on its route; primitives must not branch on `process.env`.

### `KineticHeadline`

```ts
type KineticHeadlineProps = {
  text: string;
  /** Split granularity. "letter" is banned. */
  split: "line" | "word";
  level?: "h1" | "h2";
  className?: string;
};
```

- **Use for**: hero headline, final CTA headline. **Two slots only** on the landing.
- **Hard rule**: `split: "letter"` is rejected at the type level. Cyrillic and Estonian widths break letter-by-letter splits.
- **Anti-pattern**: dropping kinetic headlines into body copy. The eye reads body via paragraphs, not beats.

### `ScrollStory`

```ts
type ScrollStoryProps = {
  beats: Array<{ id: string; title: string; body: React.ReactNode; visual: React.ReactNode }>;
  /** Total scroll distance in viewports. Default 2. */
  scrollSpan?: 1.5 | 2 | 2.5;
};
```

- **Use for**: the "watch the agent work" hero-adjacent walkthrough (WhatsApp → AI draft → staff review → PMS export). **One instance per page maximum.**
- **Reduce mode**: renders the `beats` array as a numbered ordered list with `visual` inline. The stacked-list rendering is the canonical content.
- **Mobile** (< 768px): renders identically to reduce mode. Pinning on mobile is hostile to touch scrolling and breaks the address-bar collapse.
- **Anti-pattern**: chaining multiple `ScrollStory` sections. Use one storytelling moment per page.

### `MotionSection`

```ts
type MotionSectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Reveal rise distance. Default "md". */
  rise?: "sm" | "md" | "lg";
  /** Override the default `--motion-base` reveal duration. */
  duration?: "base" | "slow";
};
```

- **Use for**: top-level landing sections that should reveal as the user scrolls past their top edge.
- **Anti-pattern**: wrapping every section blindly — it produces a uniform "everything fades in" feel that erases hierarchy. Reserve for hero, AI-safety, compliance, and final CTA.

### `Marquee`

```ts
type MarqueeProps = {
  children: React.ReactNode;
  /** Speed token. Default "extraSlow". */
  speed?: "slow" | "extraSlow";
  /** Pause on hover. Default true. */
  pauseOnHover?: boolean;
  /** Reverse direction. Default false. */
  reverse?: boolean;
};
```

- **Use for**: logo strip ("integrates with Provet, ezyVet, IDEXX, …") and optional testimonial belt.
- **Anti-pattern**: marquees of text — destroys readability under EN/ET/RU.
- **Reduce mode**: static row, no looping.

## 8. Migration / housekeeping

- **No existing tokens were renamed.** The new tokens live alongside the May 13 set; old keyframes (`pc-loop-pulse`, `pc-walk-step-*`, `pc-row-in`, `pc-shimmer`, `pc-caret`, `pc-progress`, `pc-typing-dot`, `pc-loop-trail`) keep their existing inline `cubic-bezier(0.2, 0.7, 0.2, 1)` and `cubic-bezier(0.4, 0, 0.2, 1)` values. A follow-up PR may re-point them to `var(--ease-standard)` / `var(--ease-leitmotif)` after visual diff confirms parity.
- **No conflicts** with existing tokens. The motion namespace (`--motion-*`, `--ease-*`) does not collide with the color/space/radius/font namespaces.
- **Tailwind**: the new tokens are reachable from arbitrary-value classes (`duration-[var(--motion-base)]`, `ease-[var(--ease-standard)]`). A future Tailwind theme extension can expose them as `duration-base` / `ease-leitmotif`; deferred until the primitives land.

## 9. Open questions for review

1. Should `--ease-leitmotif` also govern hover transitions on the marketing CTA buttons, or stay reserved for progress-class indicators? Default in this spec: **reserved.**
2. Should `Reveal` accept an explicit `delayMs` prop, or only `index` + a stagger token? Default in this spec: **`index` only**, to prevent ad-hoc timing.
3. Do we want a `--motion-bounce` token for the owner intake confirmation tick? Default in this spec: **no** — bounce reads as toy/consumer; reassuring needs are met by `--ease-standard` + `--motion-base`.
