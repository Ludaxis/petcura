"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PetCura checkbox. Built on Radix Checkbox so it inherits keyboard focus,
 * the indeterminate state, and a11y semantics for free; styled to flow
 * through the same token system the rest of the inbox uses so dark mode
 * works without per-class overrides.
 *
 * Used by the inbox bulk-select row leading checkbox (Slice C).
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[var(--line)] bg-[var(--paper)] text-[var(--primary)] transition-colors",
        "hover:border-[var(--primary)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--paper)]",
        "data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--paper)]",
        "data-[state=indeterminate]:border-[var(--primary)] data-[state=indeterminate]:bg-[var(--primary-soft)] data-[state=indeterminate]:text-[var(--primary-strong)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
      >
        <Check
          aria-hidden="true"
          className="h-3 w-3"
          strokeWidth={3}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
