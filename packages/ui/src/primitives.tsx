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
};

const buttonVariants = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] border-transparent",
  secondary:
    "bg-white text-[var(--foreground)] hover:bg-[var(--surface-soft)] border-[var(--line)]",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-soft)] border-transparent"
};

export function Button({
  asChild = false,
  className,
  children,
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius)] border px-3 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
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
  neutral: "bg-[var(--surface-soft)] text-[var(--muted)]",
  teal: "bg-[var(--primary-soft)] text-[var(--primary)]",
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

type PanelProps = ComponentPropsWithoutRef<"section">;

export function Panel({ className, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-sm",
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
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--surface-soft)] text-[var(--primary)]">
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
