import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

const buttonVariants = {
  primary:
    "bg-[var(--primary)] text-[var(--paper)] hover:bg-[var(--primary-strong)] border-transparent",
  secondary:
    "bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--soft)] border-[var(--line)]",
  ghost:
    "bg-transparent text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)] border-transparent"
};

const buttonSizes = {
  sm: "h-7 px-2.5 text-[11.5px] rounded-[5px]",
  md: "h-10 px-3 text-sm rounded-[var(--radius)]"
};

export function Button({
  asChild = false,
  className,
  children,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 border font-medium transition disabled:pointer-events-none disabled:opacity-50",
    buttonSizes[size],
    buttonVariants[variant],
    className
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className)
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "teal" | "amber" | "red";
};

const badgeTones = {
  neutral: "bg-[var(--soft)] text-[var(--muted)]",
  teal: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  amber: "bg-[var(--amber-soft)] text-[var(--amber)]",
  red: "bg-[var(--red-soft)] text-[var(--red)]"
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        badgeTones[tone]
      )}
    >
      {children}
    </span>
  );
}

type StatusPillStatus =
  | "new"
  | "waiting-staff"
  | "waiting-owner"
  | "resolved"
  | "urgent";

type StatusPillProps = {
  status: StatusPillStatus;
  children?: ReactNode;
  /**
   * Accessible label for screen readers. Should be a localized string of the
   * shape "status: waiting on staff" — the visual mono-pill on its own is
   * decorative.
   */
  "aria-label"?: string;
};

const statusPillTones: Record<StatusPillStatus, string> = {
  new: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  "waiting-staff": "bg-[var(--amber-soft)] text-[var(--amber)]",
  "waiting-owner": "bg-[var(--soft)] text-[var(--muted)]",
  resolved: "bg-[var(--green-soft)] text-[var(--primary-strong)]",
  urgent: "bg-[var(--red-soft)] text-[var(--red)]"
};

const statusPillLabels: Record<StatusPillStatus, string> = {
  new: "new",
  "waiting-staff": "waiting · staff",
  "waiting-owner": "waiting · owner",
  resolved: "resolved",
  urgent: "urgent"
};

export function StatusPill({
  status,
  children,
  "aria-label": ariaLabel
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-[3px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.02em]",
        statusPillTones[status]
      )}
      style={{ fontFamily: "var(--font-mono)" }}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      <span aria-hidden={ariaLabel ? "true" : undefined}>
        {children ?? statusPillLabels[status]}
      </span>
    </span>
  );
}

type UrgencyDotProps = {
  level: "urgent" | "today" | "week" | "routine";
  label?: string;
  /**
   * Accessible label for screen readers. Localized "urgency: urgent" string.
   * Falls back to `label` and then to the raw level for backwards compat.
   */
  "aria-label"?: string;
};

const urgencyDotColors: Record<UrgencyDotProps["level"], string> = {
  urgent: "var(--red)",
  today: "var(--amber)",
  week: "var(--muted)",
  routine: "var(--muted-2)"
};

export function UrgencyDot({
  level,
  label,
  "aria-label": ariaLabel
}: UrgencyDotProps) {
  const resolvedLabel = ariaLabel ?? label ?? level;
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: urgencyDotColors[level] }}
      role="img"
      aria-label={resolvedLabel}
      title={resolvedLabel}
    />
  );
}

type PanelProps = ComponentPropsWithoutRef<"section">;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] shadow-sm",
        className
      )}
      {...props}
    />
  );
}

type MetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--soft)] text-[var(--primary)]">
          {icon}
        </span>
        <span className="text-sm text-[var(--muted)]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}
