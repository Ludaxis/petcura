"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PetCura Dialog primitive — a thin wrapper over Radix Dialog.
 *
 * Replaces five hand-rolled dialog shells that all repeated the same
 *   - fixed inset-0 z-50 bg-black/30 scrim
 *   - rounded-[12px] border bg-paper shadow-xl panel
 *   - Escape / click-outside / focus trap / focus restoration
 * Wiring. Now that those concerns live here, call sites pass an `open`,
 * an `onOpenChange`, and one of the three sizes — everything else (a11y
 * focus management, scroll lock, Radix portal) is inherited.
 *
 * Usage:
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent size="md" aria-label="…">
 *       <DialogHeader>
 *         <DialogTitle>…</DialogTitle>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *       <DialogFooter>…</DialogFooter>
 *     </DialogContent>
 *   </Dialog>
 *
 * Sizes (matches the historical call sites the brief lists):
 *   sm = 440px   (CreateReminderDialog)
 *   md = 560px   (AiDraftCard edit modal, shortcut sheet)
 *   lg = 720px   (CommandPalette)
 */

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        // The scrim. Token-agnostic black/30 — same value the hand-rolled
        // shells used. Click-outside is a Radix default (closes on overlay
        // pointerdown unless onInteractOutside is captured).
        "fixed inset-0 z-50 bg-black/30 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

const sizeStyles = {
  sm: "max-w-[440px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]"
} as const;

type DialogSize = keyof typeof sizeStyles;

type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
> & {
  size?: DialogSize;
  /** When false, omits the auto X close button in the corner. Default true. */
  showCloseButton?: boolean;
  /** Localized label for the auto close button. Default "Close". */
  closeLabel?: string;
};

function DialogContent({
  className,
  children,
  size = "md",
  showCloseButton = true,
  closeLabel = "Close",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-size={size}
        className={cn(
          // Mirrors the hand-rolled shell: rounded-lg (12px), --line border,
          // --paper surface, shadow-xl. Centered with safe-area-aware padding
          // so the panel never touches the viewport edge on mobile.
          "fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-0 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-xl outline-none",
          // Bound the panel to viewport - 2rem so it scrolls internally on
          // small heights instead of pushing past the safe area.
          "max-h-[calc(100dvh-2rem)] overflow-hidden",
          // Width sizing per size prop. The wrapping fixed-position container
          // sits at 50%/50%; we cap the width at the size token and let the
          // viewport-relative `w-[calc(100vw-2rem)]` clamp it on narrow widths.
          "w-[calc(100vw-2rem)]",
          sizeStyles[size],
          // Entrance / exit motion — matches Sheet's vocabulary so the two
          // overlay surfaces feel like one family.
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label={closeLabel}
            data-slot="dialog-close-x"
            className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          >
            <X aria-hidden="true" size={14} />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1 border-b border-[var(--line)] px-4 py-3",
        // Leave room for the auto-rendered close X (which is absolutely
        // positioned at top-right inside DialogContent).
        "pr-12",
        className
      )}
      {...props}
    />
  );
}

function DialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        // Scrolls internally if the body overflows. Padding matches the
        // historical shell layout.
        "min-h-0 overflow-y-auto px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] px-4 py-3",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-[15px] font-semibold text-[var(--ink)]", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-[12.5px] text-[var(--muted)]", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription
};
