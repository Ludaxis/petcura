"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resolveInboxRequest,
  assignInboxRequestToMe
} from "../_actions";

type Shortcut = {
  keys: string;
  description: string;
};

type InboxKeyboardProps = {
  rowIds: string[];
  hrefForRow: (id: string) => string;
  locale: string;
  onOpenPalette: () => void;
  focusedIndex: number;
  onFocusedIndexChange: (index: number) => void;
  shortcuts: Shortcut[];
  labels: {
    sheetTitle: string;
    close: string;
    resolved: string;
    assigned: string;
    errorResolve: string;
    errorAssign: string;
  };
};

function isEditable(target: EventTarget | null): boolean {
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

function trapTabKey(
  event: KeyboardEvent,
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
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

export function InboxKeyboard({
  rowIds,
  hrefForRow,
  locale,
  onOpenPalette,
  focusedIndex,
  onFocusedIndexChange,
  shortcuts,
  labels
}: InboxKeyboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Seed focused index from ?id= on mount and when the URL changes externally.
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (!idParam) return;
    const index = rowIds.indexOf(idParam);
    if (index >= 0 && index !== focusedIndex) {
      onFocusedIndexChange(index);
    }
    // We deliberately do not depend on focusedIndex to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, rowIds]);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const row = event.target.closest<HTMLElement>("[data-inbox-row]");
      const id = row?.dataset.rowId;
      if (!id) return;
      const index = rowIds.indexOf(id);
      if (index >= 0 && index !== focusedIndex) {
        onFocusedIndexChange(index);
      }
    };

    window.addEventListener("focusin", onFocusIn);
    return () => window.removeEventListener("focusin", onFocusIn);
  }, [focusedIndex, onFocusedIndexChange, rowIds]);

  // Sync ?id= back into URL when focusedIndex moves so deep-links stay valid.
  const writeIdToUrl = useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (id) sp.set("id", id);
      else sp.delete("id");
      const qs = sp.toString();
      router.replace(qs.length > 0 ? `/inbox?${qs}` : "/inbox", {
        scroll: false
      });
    },
    [router, searchParams]
  );

  const focusRow = useCallback(
    (index: number) => {
      const safe = Math.max(0, Math.min(index, rowIds.length - 1));
      const id = rowIds[safe] ?? null;
      onFocusedIndexChange(safe);
      if (!id) return;
      const el = document.querySelector<HTMLElement>(`[data-row-id="${id}"]`);
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ block: "nearest" });
      }
      writeIdToUrl(id);
    },
    [onFocusedIndexChange, rowIds, writeIdToUrl]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (liveRef.current) {
      // Reset then assign to retrigger SR announcement when the same text repeats.
      liveRef.current.textContent = "";
      liveRef.current.textContent = msg;
    }
    window.setTimeout(() => setToast(null), 1500);
  }, []);

  const refreshWithReloadFallback = useCallback(() => {
    router.refresh();
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        window.location.reload();
      }
    }, 1500);
  }, [router]);

  // Open/close the shortcut sheet with focus restoration.
  const openSheet = useCallback(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setShowSheet(true);
  }, []);
  const closeSheet = useCallback(() => {
    setShowSheet(false);
    const target = lastFocusedRef.current;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }, []);

  // Auto-focus the close button when the sheet opens.
  useEffect(() => {
    if (!showSheet) return;
    const id = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [showSheet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Trap Tab inside the sheet while it is open.
      if (showSheet && e.key === "Tab") {
        trapTabKey(e, sheetRef.current);
        return;
      }
      // Modal toggles always available
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (isEditable(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        if (showSheet) closeSheet();
        else openSheet();
        return;
      }
      if (e.key === "Escape") {
        if (showSheet) {
          e.preventDefault();
          closeSheet();
          return;
        }
      }

      if (rowIds.length === 0) return;
      const activeRow =
        document.activeElement instanceof HTMLElement
          ? document.activeElement.closest<HTMLElement>("[data-inbox-row]")
          : null;
      const activeRowId = activeRow?.dataset.rowId;
      const activeIndex = activeRowId ? rowIds.indexOf(activeRowId) : -1;
      const safeIndex =
        activeIndex >= 0 ? activeIndex : Math.min(focusedIndex, rowIds.length - 1);
      const currentId = rowIds[safeIndex];

      if (activeIndex >= 0 && activeIndex !== focusedIndex) {
        onFocusedIndexChange(activeIndex);
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        focusRow(safeIndex + 1);
        return;
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        focusRow(safeIndex - 1);
        return;
      }
      if (e.key === "Enter") {
        if (currentId) {
          e.preventDefault();
          router.push(hrefForRow(currentId));
        }
        return;
      }
      if (e.key === "e" || e.key === "E") {
        if (!currentId) return;
        e.preventDefault();
        void (async () => {
          const result = await resolveInboxRequest(currentId, locale);
          if (result.ok) refreshWithReloadFallback();
          showToast(result.ok ? labels.resolved : labels.errorResolve);
        })();
        return;
      }
      if (e.key === "a" || e.key === "A") {
        if (!currentId) return;
        e.preventDefault();
        void (async () => {
          const result = await assignInboxRequestToMe(currentId, locale);
          if (result.ok) refreshWithReloadFallback();
          showToast(result.ok ? labels.assigned : labels.errorAssign);
        })();
        return;
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [
    closeSheet,
    focusRow,
    focusedIndex,
    hrefForRow,
    labels.assigned,
    labels.errorAssign,
    labels.errorResolve,
    labels.resolved,
    locale,
    onFocusedIndexChange,
    onOpenPalette,
    openSheet,
    refreshWithReloadFallback,
    router,
    rowIds,
    showSheet,
    showToast
  ]);

  return (
    <>
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      {toast ? (
        <div
          // role="status" already implies aria-live="polite"; keep the visible
          // toast as the announcement source. The sr-only liveRef above is
          // populated only as a fallback (some SRs ignore role=status fades).
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.04em] text-[var(--ink)] shadow-md"
        >
          {toast}
        </div>
      ) : null}
      {showSheet ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.sheetTitle}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={closeSheet}
        >
          <div
            ref={sheetRef}
            className="w-full max-w-md rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {labels.sheetTitle}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeSheet}
                className="rounded-[var(--radius)] px-2 py-1 text-[12px] text-[var(--muted)] hover:bg-[var(--soft)]"
              >
                {labels.close}
              </button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {shortcuts.map((s) => (
                <li
                  key={s.keys + s.description}
                  className="flex items-center justify-between gap-3 rounded-[6px] px-2 py-1.5 text-[12.5px] text-[var(--ink)] hover:bg-[var(--soft)]"
                >
                  <span>{s.description}</span>
                  <kbd className="rounded border border-[var(--line)] bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--ink-2)]">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
