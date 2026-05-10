"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  resolveInboxRequest,
  assignInboxRequestToMe
} from "@/app/inbox/_actions";
import { isEditableTarget, trapTabKey } from "@/app/_components/useFocusTrap";

type Shortcut = {
  keys: string;
  description: string;
};

type RequestKeyboardProps = {
  requestId: string;
  rowIds: string[];
  hrefForRow: (id: string) => string;
  locale: string;
  onOpenPalette: () => void;
  onFocusComposer: () => void;
  onToggleTranslation: () => void;
  onSendComposer: () => void;
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

/**
 * Global keyboard model for /requests/[id]. Mirrors the inbox pattern from
 * PR A — same isEditable guard, same focus-trapped shortcut sheet, same
 * roving tabindex on the list rail. Adds R (focus composer), T (toggle
 * translation on focused bubble), ⌘↵ (send composer).
 */
export function RequestKeyboard({
  requestId,
  rowIds,
  hrefForRow,
  locale,
  onOpenPalette,
  onFocusComposer,
  onToggleTranslation,
  onSendComposer,
  shortcuts,
  labels
}: RequestKeyboardProps) {
  const router = useRouter();
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1500);
  }, []);

  const openSheet = useCallback(() => {
    lastFocusedRef.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    setShowSheet(true);
  }, []);
  const closeSheet = useCallback(() => {
    setShowSheet(false);
    const target = lastFocusedRef.current;
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  }, []);

  useEffect(() => {
    if (!showSheet) return;
    const id = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [showSheet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showSheet && e.key === "Tab") {
        trapTabKey(e, sheetRef.current);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      // ⌘↵ when focus is in the composer is handled by the Composer itself
      // (so the form submits with FormData). Outside the composer, ⌘↵ tells
      // the shell to programmatically submit.
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!isEditableTarget(e.target)) {
          // No-op if focus isn't in a textarea/input; the composer owns its
          // own ⌘↵ in that case.
          return;
        }
        // Composer's own onKeyDown will run too — but `requestSubmit` is
        // idempotent at the form level only when called once per tick, so
        // delegate to the composer ref.
        const target = e.target as HTMLElement;
        if (target.matches("[data-composer-textarea]")) {
          e.preventDefault();
          onSendComposer();
        }
        return;
      }

      if (isEditableTarget(e.target)) return;

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
        }
        return;
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        onFocusComposer();
        return;
      }
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        onToggleTranslation();
        return;
      }

      if (rowIds.length > 0) {
        const idx = rowIds.indexOf(requestId);
        if (e.key === "j" || e.key === "ArrowDown") {
          if (idx >= 0 && idx < rowIds.length - 1) {
            e.preventDefault();
            const nextId = rowIds[idx + 1];
            if (nextId) router.push(hrefForRow(nextId));
          }
          return;
        }
        if (e.key === "k" || e.key === "ArrowUp") {
          if (idx > 0) {
            e.preventDefault();
            const prevId = rowIds[idx - 1];
            if (prevId) router.push(hrefForRow(prevId));
          }
          return;
        }
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        void (async () => {
          const result = await resolveInboxRequest(requestId, locale);
          if (result.ok) router.refresh();
          showToast(result.ok ? labels.resolved : labels.errorResolve);
        })();
        return;
      }
      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        void (async () => {
          const result = await assignInboxRequestToMe(requestId, locale);
          if (result.ok) router.refresh();
          showToast(result.ok ? labels.assigned : labels.errorAssign);
        })();
        return;
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [
    closeSheet,
    hrefForRow,
    labels.assigned,
    labels.errorAssign,
    labels.errorResolve,
    labels.resolved,
    locale,
    onFocusComposer,
    onOpenPalette,
    onSendComposer,
    onToggleTranslation,
    openSheet,
    requestId,
    router,
    rowIds,
    showSheet,
    showToast
  ]);

  return (
    <>
      {toast ? (
        <div
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
