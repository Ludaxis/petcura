"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode
} from "react";
import { Pencil, X } from "lucide-react";
import { cn } from "@petcura/ui";

/**
 * Wraps a directory row so the visible summary (`row`) can expand downward
 * into the inline edit form (`form`). The Edit affordance lives next to the
 * row's chevron column; clicking it stops propagation so the cover-all
 * `<Link>` underneath does not navigate. Escape collapses the panel and
 * returns focus to the trigger button.
 *
 * The expand animation uses the standard "grid-template-rows 0fr -> 1fr"
 * trick so the panel can size to its content without `auto` height; users
 * with `prefers-reduced-motion: reduce` get an instant open via CSS.
 */
type InlineEditRowProps = {
  /** Visible row content; rendered every time. */
  row: ReactNode;
  /**
   * Inline edit form. Receives a `requestClose` callback so the form's
   * own Cancel button can collapse the panel and re-focus the trigger.
   */
  form: (helpers: { requestClose: () => void }) => ReactNode;
  /** Accessible label for the trigger button (e.g. "Edit Anna Tamm"). */
  editLabel: string;
  /** Translated "Edit" label rendered next to the pencil glyph on >= md. */
  editText: string;
  /** Accessible label for the expanded region (e.g. "Edit owner profile"). */
  regionLabel: string;
};

export function InlineEditRow({
  row,
  form,
  editLabel,
  editText,
  regionLabel
}: InlineEditRowProps) {
  const [editing, setEditing] = useState(false);
  // Tracks the prior `editing` value so the focus effect knows whether to
  // jump to the first input (just opened) or the trigger button (just
  // closed). Stored in a ref so we don't read `.current` during render.
  const wasEditingRef = useRef(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setEditing(false);
  }, []);

  // Focus management:
  // - just opened -> first non-hidden input in the panel (keyboard users
  //   land on the Name field rather than the photo upload control).
  // - just closed -> trigger button (so keyboard users return to it).
  useEffect(() => {
    const wasEditing = wasEditingRef.current;
    wasEditingRef.current = editing;
    if (editing && !wasEditing) {
      const panel = panelRef.current;
      const first = panel?.querySelector<HTMLElement>(
        "input:not([type='hidden']):not([type='file']):not([disabled]), select:not([disabled]), textarea:not([disabled])"
      );
      first?.focus();
    } else if (!editing && wasEditing) {
      triggerRef.current?.focus();
    }
  }, [editing]);

  const onEditClick = (event: MouseEvent<HTMLButtonElement>) => {
    // The row has a cover-all `<Link>` underneath. Without this, clicking
    // Edit would also navigate to the detail panel.
    event.stopPropagation();
    event.preventDefault();
    setEditing((prev) => !prev);
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  };

  return (
    <div
      data-inline-edit-host
      data-editing={editing ? "true" : undefined}
      className={cn(
        // Default rhythm: simple bottom-bordered list row, so a stack of
        // rows looks like a list rather than a strip of cards.
        "border-b border-[var(--line)] bg-[var(--paper)] transition-shadow",
        // When expanded, lift the row into a soft card so the embedded
        // form has visual containment without nesting card-in-card.
        editing &&
          "rounded-[var(--radius-lg)] border border-[var(--line)] shadow-[0_0_0_1px_var(--primary-soft)]"
      )}
    >
      <div className="relative">
        {row}
        {/* Edit trigger. Positioned to overlap the chevron column so the
            row still reads as "click-anywhere-to-open". z-10 lifts it above
            the cover-all <Link>. */}
        <button
          ref={triggerRef}
          type="button"
          onClick={onEditClick}
          aria-expanded={editing}
          aria-controls={panelId}
          aria-label={editLabel}
          className={cn(
            "absolute right-9 top-1/2 z-10 inline-flex h-7 -translate-y-1/2 items-center gap-1 rounded-[var(--radius)]",
            "border border-[var(--line)] bg-[var(--paper)] px-2 text-[11.5px] font-medium text-[var(--ink)]",
            "transition hover:bg-[var(--soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
            editing && "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          )}
        >
          {editing ? (
            <X aria-hidden="true" size={13} />
          ) : (
            <Pencil aria-hidden="true" size={13} />
          )}
          <span className="hidden md:inline">{editText}</span>
        </button>
      </div>

      {/* Animated expand container. `grid-template-rows: 0fr -> 1fr` lets
          the inner panel measure its natural height while still animating;
          `prefers-reduced-motion` users get a snap-open via the CSS file. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          editing ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        aria-hidden={!editing}
      >
        <div className="overflow-hidden">
          <div
            ref={panelRef}
            id={panelId}
            role="region"
            aria-label={regionLabel}
            onKeyDown={onPanelKeyDown}
            className={cn(
              "border-t border-[var(--line)] bg-[var(--surface-soft)] p-3 sm:p-4",
              !editing && "pointer-events-none"
            )}
            // Keep the panel out of the tab order while collapsed so
            // keyboard users don't fall into invisible inputs.
            inert={!editing}
          >
            {editing ? form({ requestClose: close }) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
