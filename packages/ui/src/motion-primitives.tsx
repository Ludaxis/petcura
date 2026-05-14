"use client";

/**
 * PetCura motion primitives — marketing-surface only.
 *
 * Hard rules (see docs/design/motion-system-2026-05.md):
 *
 *   - These primitives consume `motion/react` (Framer Motion v12). They are
 *     allowed ONLY inside `apps/web/app/(marketing)/**`. Importing from the
 *     clinic inbox or owner app is a policy violation — the calm/operational
 *     surfaces stay CSS-only.
 *
 *   - Animate transform + opacity only. No width/height/background-color.
 *
 *   - `prefers-reduced-motion: reduce` is a first-class layout. Every
 *     primitive renders content at the final visible state on first paint
 *     with zero IntersectionObserver / motion library involvement when
 *     reduce is set.
 *
 *   - KineticHeadline is line-grouped only. Letter-by-letter splits break
 *     Cyrillic kerning and are banned at the type level.
 */

import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  createContext,
  useContext,
  useMemo
} from "react";
import {
  AnimatePresence,
  type Transition,
  motion,
  useReducedMotion
} from "motion/react";

import {
  durationSeconds,
  easeArray,
  staggerSeconds,
  type MotionRiseKey,
  type MotionStaggerKey
} from "./motion-tokens";

// ---------------------------------------------------------------------------
// Shared context — lets <MotionSection> coordinate child <Reveal> staggers
// without prop-drilling.
// ---------------------------------------------------------------------------

type MotionSectionContextValue = {
  /** Stagger window per child reveal index, in seconds. */
  stagger: number;
};

const MotionSectionContext = createContext<MotionSectionContextValue | null>(
  null
);

// ---------------------------------------------------------------------------
// <Reveal>
// ---------------------------------------------------------------------------

type RevealAs = "div" | "span" | "li" | "p" | "article" | "section";

type RevealProps = {
  children: ReactNode;
  as?: RevealAs;
  rise?: MotionRiseKey;
  /** Per-element delay in ms. Composes with an enclosing MotionSection stagger. */
  delay?: number;
  /** Used when stacked inside MotionSection.Group-style flows to compute stagger. */
  index?: number;
  /** Stagger preset (only honored when index is set). */
  stagger?: MotionStaggerKey;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const RISE_PX: Record<MotionRiseKey, number> = {
  sm: 8,
  md: 16,
  lg: 24
};

/**
 * Fade + rise reveal triggered on first viewport entry. Renders content at
 * the final visible state when `prefers-reduced-motion: reduce`.
 */
export function Reveal({
  children,
  as = "div",
  rise = "md",
  delay = 0,
  index,
  stagger,
  once = true,
  className,
  style
}: RevealProps) {
  const reduce = useReducedMotion();
  const sectionCtx = useContext(MotionSectionContext);
  const Component = motion[as] as typeof motion.div;

  const totalDelaySeconds = useMemo(() => {
    if (typeof index === "number") {
      const window = stagger
        ? staggerSeconds[stagger]
        : sectionCtx?.stagger ?? staggerSeconds.base;
      // Cap cascade at 600ms regardless of N (matches pc-row-in policy).
      const clampedIndex = Math.min(index, 7);
      return clampedIndex * window + delay / 1000;
    }
    return delay / 1000;
  }, [delay, index, sectionCtx, stagger]);

  if (reduce) {
    const StaticComponent = as as ElementType;
    return (
      <StaticComponent
        className={className}
        data-reveal="static"
        style={style}
      >
        {children}
      </StaticComponent>
    );
  }

  const transition: Transition = {
    duration: durationSeconds.slow,
    ease: easeArray.enter,
    delay: totalDelaySeconds
  };

  return (
    <Component
      className={className}
      data-reveal="motion"
      initial={{ opacity: 0, y: RISE_PX[rise] }}
      style={style as never}
      transition={transition}
      viewport={{ once, margin: "0px 0px -10% 0px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </Component>
  );
}

// ---------------------------------------------------------------------------
// <KineticHeadline>
// ---------------------------------------------------------------------------

type KineticHeadlineProps = {
  /**
   * Pre-split lines of the headline. Splitting happens upstream so the
   * caller controls Cyrillic line breaks intentionally. Each entry becomes
   * one animated `<span>` group; letter-by-letter splitting is banned.
   */
  lines: string[];
  as?: "h1" | "h2";
  /** Optional starting delay in ms before the first line reveals. */
  delay?: number;
  className?: string;
  id?: string;
};

/**
 * Line-grouped kinetic headline. Each visual line animates in as a block.
 * Reduced-motion users get the entire headline as plain static text in DOM
 * order — screen readers still receive a single H1/H2 announcement, never
 * a stream of per-word fragments.
 */
export function KineticHeadline({
  lines,
  as = "h1",
  delay = 0,
  className,
  id
}: KineticHeadlineProps) {
  const reduce = useReducedMotion();
  const HeadingTag = as as ElementType;

  // Collapse to a single accessible string so screen readers don't hear
  // line breaks. Visual line breaks are achieved via explicit <span> blocks.
  const flatText = lines.join(" ");

  if (reduce) {
    return (
      <HeadingTag
        className={className}
        id={id}
        style={{ textWrap: "balance" }}
      >
        {flatText}
      </HeadingTag>
    );
  }

  return (
    <HeadingTag
      aria-label={flatText}
      className={className}
      id={id}
      style={{ textWrap: "balance" }}
    >
      {lines.map((line, lineIndex) => (
        <motion.span
          aria-hidden="true"
          className="block"
          initial={{ opacity: 0, y: 12 }}
          key={`${lineIndex}-${line}`}
          transition={{
            duration: durationSeconds.slow,
            ease: easeArray.leitmotif,
            delay: delay / 1000 + lineIndex * staggerSeconds.base
          }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -5% 0px" }}
        >
          {line}
        </motion.span>
      ))}
    </HeadingTag>
  );
}

// ---------------------------------------------------------------------------
// <MotionSection>
// ---------------------------------------------------------------------------

type MotionSectionProps = ComponentPropsWithoutRef<"section"> & {
  stagger?: MotionStaggerKey;
};

/**
 * Semantic <section> wrapper that provides a stagger window to child
 * <Reveal>s. Does not animate the section itself — the section is part
 * of the document outline and must be present in screen-reader order
 * regardless of viewport. Use the child <Reveal>s for visible motion.
 */
export function MotionSection({
  children,
  stagger = "base",
  ...sectionProps
}: MotionSectionProps) {
  const value = useMemo<MotionSectionContextValue>(
    () => ({ stagger: staggerSeconds[stagger] }),
    [stagger]
  );

  return (
    <section {...sectionProps}>
      <MotionSectionContext.Provider value={value}>
        {children}
      </MotionSectionContext.Provider>
    </section>
  );
}

// ---------------------------------------------------------------------------
// <Marquee>
// ---------------------------------------------------------------------------
//
// TODO(marketing): The landing logo strip MUST use a static grid per the
// landing narrative §2.3 — auto-scrolling marquees are a 2026 conversion
// leak and are explicitly rejected. This primitive ships only for
// non-landing use (loading skeletons, future status surfaces) and pauses
// under reduced motion. Do not import this from anything under
// `apps/web/app/(marketing)/_sections/`.

type MarqueeProps = {
  children: ReactNode;
  speed?: "slow" | "extraSlow";
  className?: string;
  ariaLabel?: string;
};

const MARQUEE_DURATION_S: Record<NonNullable<MarqueeProps["speed"]>, number> = {
  slow: 24,
  extraSlow: 36
};

/**
 * Horizontal infinite scroll. Reduced-motion = static row. Marketing must
 * not use this; logo strips render as a static grid (see narrative §2.3).
 */
export function Marquee({
  children,
  speed = "extraSlow",
  className,
  ariaLabel
}: MarqueeProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div aria-label={ariaLabel} className={className}>
        <div className="flex items-center gap-8 overflow-x-auto">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      aria-label={ariaLabel}
      className={className}
      data-marquee=""
      style={{ overflow: "hidden" }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        className="flex w-max items-center gap-8"
        transition={{
          duration: MARQUEE_DURATION_S[speed],
          ease: "linear",
          repeat: Infinity
        }}
      >
        {children}
        <span aria-hidden="true" className="contents">
          {children}
        </span>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Re-exports so callers don't need to reach into motion/react directly.
// ---------------------------------------------------------------------------

export { AnimatePresence, useReducedMotion };
export type { RevealProps, KineticHeadlineProps, MotionSectionProps };

// Helper used by ScrollStory's mobile/reduce fallback path so it can read
// the same contract without duplicating media-query logic. Exported from
// motion-primitives so the ScrollStory file stays as small as possible.
export function isCoarseOrSmallViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 767px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

