"use client";

import type { ReactNode } from "react";
import { Children, isValidElement, useId, useRef } from "react";

import { cn } from "./primitives";

/**
 * Segmented control — Direction-B styled radiogroup.
 *
 * Replaces four hand-rolled `role="radiogroup"` + `role="radio"` patterns
 * (inbox view toggle, density toggle, theme toggle) that all repeated the
 * same h-7 / --soft active / --muted inactive / arrow-key navigation logic.
 *
 *   <SegmentedControl value={view} onValueChange={setView} aria-label="View">
 *     <SegmentedControl.Item value="list" icon={<List/>} label="List" />
 *     <SegmentedControl.Item value="board" icon={<LayoutGrid/>} label="Board" />
 *   </SegmentedControl>
 *
 * Behaviour:
 *   - role="radiogroup" on the container, role="radio" on each segment.
 *   - Roving tabindex: only the active segment is tabbable; arrow keys
 *     (Left/Right/Up/Down) wrap to siblings, Home/End jump to ends.
 *   - aria-checked reflects the live value; aria-label & title carry the
 *     label string so icon-only segments stay accessible.
 *
 * The active segment paints `--ink` ink on the option's background, matching
 * the historical inbox toolbar visual. Themes that need a different active
 * tone can pass a `tone` prop (kept narrow for v1).
 */

type Size = "sm" | "md";

type Tone = "neutral" | "primary";

type SegmentedControlProps<T extends string> = {
  value: T;
  onValueChange: (next: T) => void;
  /** Accessible name for the group — required (radiogroup needs it). */
  "aria-label": string;
  /** Visual height. sm = 28px (default, matches existing toolbar). md = 36px. */
  size?: Size;
  /**
   * Active segment treatment. `neutral` = ink-on-paper inversion (matches
   * inbox toolbar). `primary` = sage-on-paper (matches command palette
   * theme switcher).
   */
  tone?: Tone;
  /** Stretches segments to fill the container (e.g. inside a UserMenu). */
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ItemProps<T extends string = string> = {
  value: T;
  /** Visible text label. Required for accessible name + tooltips. */
  label: string;
  icon?: ReactNode;
  /** When true, label is sr-only and only the icon is visible. */
  iconOnly?: boolean;
  className?: string;
};

const sizeClasses: Record<Size, { row: string; segment: string; gap: string }> =
  {
    sm: {
      row: "h-7",
      segment: "h-6 px-2 text-[11.5px]",
      gap: "gap-0.5"
    },
    md: {
      row: "h-9",
      segment: "h-8 px-3 text-[12.5px]",
      gap: "gap-0.5"
    }
  };

const toneActiveClasses: Record<Tone, string> = {
  neutral: "bg-[var(--ink)] text-[var(--paper)]",
  primary: "bg-[var(--primary)] text-[var(--paper)]"
};

const inactiveClasses =
  "bg-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]";

/**
 * Sentinel marker — Children-traversal uses `child.type === Item` to
 * identify segments. The function is exported as `SegmentedControl.Item`
 * and is the only valid child type.
 */
function Item<T extends string = string>(_props: ItemProps<T>): null {
  return null;
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  size = "sm",
  tone = "neutral",
  fullWidth,
  className,
  children,
  "aria-label": ariaLabel
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  // Materialize children into a typed list so we can run arrow-key
  // navigation against the actual segment values (rather than DOM queries).
  const items: Array<ItemProps<T>> = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type !== Item) return;
    items.push(child.props as ItemProps<T>);
  });

  const focusValue = (next: T) => {
    requestAnimationFrame(() => {
      groupRef.current
        ?.querySelector<HTMLButtonElement>(
          `[data-segment-value="${CSS.escape(String(next))}"]`
        )
        ?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (items.length === 0) return;
    const idx = items.findIndex((i) => i.value === value);
    if (idx < 0) return;
    let nextIdx = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIdx = (idx + 1) % items.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIdx = (idx - 1 + items.length) % items.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = items.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const nextItem = items[nextIdx];
    if (!nextItem) return;
    onValueChange(nextItem.value);
    focusValue(nextItem.value);
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      data-segmented-group={groupId}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5",
        sizeClasses[size].row,
        sizeClasses[size].gap,
        fullWidth && "w-full",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={String(item.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            aria-label={item.label}
            title={item.label}
            data-segment-value={String(item.value)}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-xs)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
              sizeClasses[size].segment,
              active ? toneActiveClasses[tone] : inactiveClasses,
              fullWidth && "flex-1",
              item.className
            )}
          >
            {item.icon}
            {item.iconOnly ? (
              <span className="sr-only">{item.label}</span>
            ) : (
              <span>{item.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

SegmentedControl.Item = Item;
