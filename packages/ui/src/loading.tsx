"use client";

import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode
} from "react";
import { useEffect, useState } from "react";
import { cn } from "./primitives";

/*
 * PetCura loading primitives.
 *
 * One sage shimmer language across admin, clinic, and owner surfaces. All
 * primitives degrade to a static --soft block when prefers-reduced-motion is
 * set (the `.pc-shimmer` utility in globals.css does the work).
 *
 * The two big rules:
 *
 *   1. Skeletons must mirror the geometry of the real content they replace —
 *      same row height, same gap, same column widths. Otherwise the swap from
 *      skeleton to content causes layout shift (CLS).
 *
 *   2. Every loading region needs `aria-busy="true"` and an accessible label.
 *      Screen reader users should hear "Loading inbox" or similar, not just
 *      silence.
 */

// ---------------------------------------------------------------------------
// Shimmer — base placeholder block
// ---------------------------------------------------------------------------

type ShimmerProps = {
  className?: string;
  /** Reduced animation speed (2.4s vs 1.6s); useful inside dense lists. */
  slow?: boolean;
  /** Render-as element (default `span`). */
  as?: ElementType;
  style?: CSSProperties;
  children?: ReactNode;
  /** aria-hidden by default; set false when this is the only content. */
  ariaHidden?: boolean;
};

export function Shimmer({
  className,
  slow,
  as: Component = "span",
  style,
  children,
  ariaHidden = true
}: ShimmerProps) {
  return (
    <Component
      aria-hidden={ariaHidden ? "true" : undefined}
      className={cn(
        "pc-shimmer block rounded-[var(--radius)]",
        slow && "pc-shimmer-slow",
        className
      )}
      style={style}
    >
      {children}
    </Component>
  );
}

// ---------------------------------------------------------------------------
// SkeletonText — multi-line shimmer paragraph
// ---------------------------------------------------------------------------

type SkeletonTextProps = {
  lines?: number;
  /** Custom widths per line (defaults to a natural cascade). */
  widths?: Array<string>;
  /** Tailwind height class per line; defaults to h-3. */
  lineClassName?: string;
  className?: string;
  gap?: "tight" | "default" | "loose";
};

const DEFAULT_WIDTHS = ["w-11/12", "w-10/12", "w-9/12", "w-8/12", "w-7/12"];

export function SkeletonText({
  lines = 3,
  widths,
  lineClassName,
  className,
  gap = "default"
}: SkeletonTextProps) {
  const gapClass =
    gap === "tight" ? "gap-1.5" : gap === "loose" ? "gap-3" : "gap-2";
  return (
    <div className={cn("flex flex-col", gapClass, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            "h-3 rounded",
            widths?.[i] ?? DEFAULT_WIDTHS[i % DEFAULT_WIDTHS.length],
            lineClassName
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonRow — clinic inbox row geometry
// ---------------------------------------------------------------------------

type SkeletonRowProps = {
  className?: string;
  /** Density mirrors InboxRow's compact/comfortable. */
  density?: "compact" | "comfortable";
};

export function SkeletonRow({
  className,
  density = "comfortable"
}: SkeletonRowProps) {
  return (
    <li
      className={cn(
        "grid grid-cols-[14px_minmax(110px,max-content)_minmax(0,1fr)_auto_56px_18px] items-center gap-3 border-b border-[var(--line)] px-4",
        density === "compact" ? "py-2.5 sm:py-3" : "py-3.5 sm:py-4",
        className
      )}
    >
      <Shimmer className="h-2.5 w-2.5 rounded-full" />
      <Shimmer className="h-3 w-24 rounded" />
      <Shimmer className="h-3 w-full max-w-[280px] rounded" />
      <Shimmer className="h-4 w-16 rounded-full" />
      <Shimmer className="h-3 w-12 rounded" />
      <span aria-hidden="true" />
    </li>
  );
}

// ---------------------------------------------------------------------------
// SkeletonList — N rows wrapped in an aria-busy list
// ---------------------------------------------------------------------------

type SkeletonListProps = {
  rows?: number;
  label?: string;
  density?: "compact" | "comfortable";
  className?: string;
};

export function SkeletonList({
  rows = 10,
  label = "Loading list",
  density = "comfortable",
  className
}: SkeletonListProps) {
  return (
    <ul
      aria-busy="true"
      aria-label={label}
      className={cn("flex flex-col", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} density={density} />
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — admin/owner card skeleton
// ---------------------------------------------------------------------------

type SkeletonCardProps = {
  className?: string;
  /** Number of body lines. */
  lines?: number;
  /** Show a footer bar (e.g. footer chart, action row). */
  footer?: boolean;
  /** Show an icon/avatar circle to the left of the header. */
  icon?: boolean;
};

export function SkeletonCard({
  className,
  lines = 3,
  footer = false,
  icon = false
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon ? <Shimmer className="h-10 w-10 rounded-full" /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Shimmer className="h-4 w-1/2 rounded" />
          <Shimmer className="h-3 w-1/3 rounded" />
        </div>
      </div>
      <SkeletonText lines={lines} gap="tight" />
      {footer ? <Shimmer className="mt-1 h-8 w-full rounded" /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonAvatar — circle placeholder
// ---------------------------------------------------------------------------

type SkeletonAvatarProps = {
  size?: number;
  className?: string;
};

export function SkeletonAvatar({ size = 32, className }: SkeletonAvatarProps) {
  return (
    <Shimmer
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

// ---------------------------------------------------------------------------
// Spinner — small in-button / inline indicator
// ---------------------------------------------------------------------------

type SpinnerProps = {
  size?: 12 | 14 | 16 | 20 | 24;
  className?: string;
  /** Accessible label. Falls back to "Loading" if omitted. */
  label?: string;
  /** Tone follows current text color (default) or use sage. */
  tone?: "current" | "primary" | "muted";
};

export function Spinner({
  size = 16,
  className,
  label,
  tone = "current"
}: SpinnerProps) {
  const stroke =
    tone === "primary"
      ? "var(--primary)"
      : tone === "muted"
        ? "var(--muted)"
        : "currentColor";
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        className="animate-spin motion-reduce:animate-none"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke={stroke}
          strokeWidth="3"
          opacity="0.25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------------------
// StreamingDots — three sage dots for "AI is thinking"
// ---------------------------------------------------------------------------

type StreamingDotsProps = {
  className?: string;
  label?: string;
};

export function StreamingDots({ className, label }: StreamingDotsProps) {
  return (
    <span
      role="status"
      aria-label={label ?? "Streaming"}
      className={cn("inline-flex items-center gap-1", className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)] motion-reduce:opacity-50"
          style={{
            animation: "pc-caret 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AiTypingCaret — blinking sage block for streaming text
// ---------------------------------------------------------------------------

export function AiTypingCaret({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("pc-caret", className)} />;
}

// ---------------------------------------------------------------------------
// TopProgressBar — thin sage bar bound to a transition's isPending
// ---------------------------------------------------------------------------

type TopProgressBarProps = {
  active: boolean;
  className?: string;
  label?: string;
};

export function TopProgressBar({
  active,
  className,
  label = "Updating"
}: TopProgressBarProps) {
  if (!active) return null;
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "pc-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]",
        className
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// DelayedFallback — suppresses flash on fast navigation (<120ms cached)
// ---------------------------------------------------------------------------

type DelayedFallbackProps = {
  delay?: number;
  children: ReactNode;
};

export function DelayedFallback({
  delay = 120,
  children
}: DelayedFallbackProps) {
  const [show, setShow] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const id = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);
  if (!show) return null;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// SrLoading — visually hidden screen-reader announcement
// ---------------------------------------------------------------------------

export function SrLoading({ section }: { section: string }) {
  return (
    <span className="sr-only" role="status">
      Loading {section}…
    </span>
  );
}

// ---------------------------------------------------------------------------
// Polymorphic shimmer pill — for inline placeholders (button labels, counts)
// ---------------------------------------------------------------------------

type ShimmerPillProps = ComponentPropsWithoutRef<"span"> & {
  width?: number | string;
  height?: number;
};

export function ShimmerPill({
  width = 32,
  height = 14,
  className,
  style,
  ...rest
}: ShimmerPillProps) {
  return (
    <Shimmer
      className={cn("rounded-full", className)}
      style={{ width, height, ...style }}
      {...(rest as object)}
    />
  );
}
