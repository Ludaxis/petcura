import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { createElement } from "react";

import { cn } from "./primitives";

/**
 * Eyebrow / MonoLabel — the small mono-uppercase caption that appears above
 * section headers, on AI draft cards, on side-block accordions, and on
 * shortcut-hint kbd labels.
 *
 * Replaces ~a dozen ad-hoc occurrences of:
 *
 *   font-mono text-[10.5px] uppercase tracking-[0.04-0.12em] text-[var(--muted)]
 *
 * with one primitive that exposes tone + size as props. Defaults match the
 * most common appearance (mono · 10.5px · 0.06em tracking · --muted).
 *
 * The component is polymorphic so it can render as a `<span>` (default) or
 * an element-equivalent — useful for slotting under `<summary>` or `<th>`
 * where the existing markup constrains the tag.
 */

type Tone = "muted" | "muted-2" | "primary" | "amber" | "red" | "ink";

type Size = "sm" | "md";

const toneClasses: Record<Tone, string> = {
  muted: "text-[var(--muted)]",
  "muted-2": "text-[var(--muted-2)]",
  primary: "text-[var(--primary)]",
  amber: "text-[var(--amber)]",
  red: "text-[var(--red)]",
  ink: "text-[var(--ink)]"
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[10px] tracking-[0.08em]",
  md: "text-[10.5px] tracking-[0.06em]"
};

type EyebrowProps<E extends ElementType> = {
  /** Underlying element. Defaults to `span`. */
  as?: E;
  tone?: Tone;
  size?: Size;
  /** When true, applies font-weight 600. Useful for section headers. */
  bold?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<E>,
  "as" | "tone" | "size" | "bold" | "className" | "children"
>;

export function Eyebrow<E extends ElementType = "span">({
  as,
  tone = "muted",
  size = "md",
  bold = false,
  className,
  children,
  ...rest
}: EyebrowProps<E>) {
  const Element: ElementType = as ?? "span";
  return createElement(
    Element,
    {
      className: cn(
        "font-mono uppercase",
        sizeClasses[size],
        toneClasses[tone],
        bold && "font-semibold",
        className
      ),
      ...rest
    },
    children
  );
}
