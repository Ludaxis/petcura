"use client";

/**
 * Shared focus-trap helpers, extracted from InboxKeyboard's PR A pattern so
 * the request detail Edit modal and shortcut sheet can reuse the exact same
 * Tab cycling / focus restoration behavior.
 */
export function trapTabKey(
  event: KeyboardEvent | React.KeyboardEvent,
  container: HTMLElement | null
) {
  if (!container) return;
  const focusable = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) return;
  const first = focusable.item(0);
  const last = focusable.item(focusable.length - 1);
  if (!first || !last) return;
  const active =
    typeof document !== "undefined"
      ? (document.activeElement as HTMLElement | null)
      : null;
  const shiftKey = "shiftKey" in event ? event.shiftKey : false;
  if (shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Editable-target detection. PR A uses this so global shortcuts don't fire
 * while the user is typing in a textarea / cmdk input / contentEditable.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  const role = target.getAttribute("role");
  if (role === "textbox" || role === "searchbox" || role === "combobox") {
    return true;
  }
  if (
    target.closest(
      '[data-cmdk-input], [contenteditable="true"], [role="textbox"], [role="searchbox"], [role="combobox"]'
    )
  ) {
    return true;
  }
  return false;
}
