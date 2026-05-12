"use client";

import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, Spinner, cn } from "@petcura/ui";

/**
 * Submit button that mirrors the parent form's pending state via React 19's
 * `useFormStatus`. Drop-in replacement for plain `<Button type="submit">`
 * inside any `<form action={serverAction}>`: the icon swaps to a Spinner,
 * the label gets an ellipsis, the button gets a pulsing sage ring while
 * the action is in flight. Width stays stable via `min-w` to avoid jitter.
 *
 * Use this for any save/add/archive/role-change/status-toggle button that
 * currently sits there silently during a server action round-trip.
 */
type Props = {
  children: ReactNode;
  /** Icon rendered when idle. Replaced by the Spinner while pending. */
  icon?: ReactNode;
  /** Optional pending-label suffix. Defaults to "…". */
  pendingSuffix?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  /** Forwarded to <button name>. */
  name?: string;
  /** Forwarded to <button value> — used by multi-button forms. */
  value?: string;
  /** Explicit disabled state. Combined with the form's pending state. */
  disabled?: boolean;
};

export function PendingSubmitButton({
  children,
  icon,
  pendingSuffix = "…",
  variant = "primary",
  size = "md",
  className,
  name,
  value,
  disabled = false
}: Props) {
  const { pending } = useFormStatus();
  const isLocked = disabled || pending;
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={isLocked}
      aria-disabled={isLocked}
      {...(name ? { name } : {})}
      {...(value !== undefined ? { value } : {})}
      className={cn(
        "min-w-[96px]",
        pending &&
          "!opacity-100 ring-2 ring-offset-1 ring-[var(--primary-soft)] ring-offset-[var(--paper)] animate-pulse",
        className
      )}
    >
      {pending ? (
        <Spinner size={size === "sm" ? 12 : 16} label={String(children)} />
      ) : (
        icon ?? null
      )}
      <span>
        {children}
        {pending ? pendingSuffix : ""}
      </span>
    </Button>
  );
}
