"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  shortcuts: Shortcut[];
  labels: {
    sheetTitle: string;
    close: string;
    resolved: string;
    assigned: string;
  };
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  // Don't trigger inside our command palette
  if (target.closest("[data-cmdk-input]")) return true;
  return false;
}

export function InboxKeyboard({
  rowIds,
  hrefForRow,
  locale,
  onOpenPalette,
  shortcuts,
  labels
}: InboxKeyboardProps) {
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showSheet, setShowSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const liveRef = useRef<HTMLDivElement>(null);

  const focusRow = useCallback((index: number) => {
    const safe = Math.max(0, Math.min(index, rowIds.length - 1));
    setFocusedIndex(safe);
    const id = rowIds[safe];
    if (!id) return;
    const el = document.querySelector<HTMLElement>(`[data-row-id="${id}"]`);
    if (el) {
      el.focus({ preventScroll: false });
      el.scrollIntoView({ block: "nearest" });
    }
  }, [rowIds]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (liveRef.current) {
      liveRef.current.textContent = msg;
    }
    window.setTimeout(() => setToast(null), 1500);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Modal toggles always available
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (isEditable(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowSheet((s) => !s);
        return;
      }
      if (e.key === "Escape") {
        if (showSheet) {
          setShowSheet(false);
          return;
        }
      }

      if (rowIds.length === 0) return;
      const safeIndex = Math.min(focusedIndex, rowIds.length - 1);
      const currentId = rowIds[safeIndex];

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
        startTransition(async () => {
          const result = await resolveInboxRequest(currentId, locale);
          if (result.ok) {
            showToast(labels.resolved);
          }
        });
        return;
      }
      if (e.key === "a" || e.key === "A") {
        if (!currentId) return;
        e.preventDefault();
        startTransition(async () => {
          const result = await assignInboxRequestToMe(currentId, locale);
          if (result.ok) {
            showToast(labels.assigned);
          }
        });
        return;
      }
      if (e.key === "r" || e.key === "R") {
        // Reply focus is composer in PR B; stub: navigate into thread.
        if (currentId) {
          e.preventDefault();
          router.push(hrefForRow(currentId));
        }
        return;
      }
      if (e.key === "t" || e.key === "T") {
        // Translate stub for PR A — surfaces in palette but no-op here.
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    focusRow,
    focusedIndex,
    hrefForRow,
    labels.assigned,
    labels.resolved,
    locale,
    onOpenPalette,
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
          onClick={() => setShowSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {labels.sheetTitle}
              </h2>
              <button
                type="button"
                onClick={() => setShowSheet(false)}
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
