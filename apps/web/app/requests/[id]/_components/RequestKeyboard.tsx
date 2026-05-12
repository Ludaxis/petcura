"use client";

import {
  useCallback,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  resolveInboxRequest,
  assignInboxRequestToMe
} from "@/app/inbox/_actions";
import { isEditableTarget } from "@/app/_components/useFocusTrap";
import { LazyInboxShortcutSheet } from "@/app/inbox/_components/LazyInboxShortcutSheet";

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

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1500);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Block global hotkeys when another modal owns the foreground (the AI
      // Edit modal, CreateReminderDialog, the command palette, etc.). Radix
      // owns Tab/Escape/click-outside on every Dialog primitive, so the only
      // signal we need is an open `data-slot="dialog-content"[data-state="open"]`.
      // The own-sheet case is allowed to fall through so `?` can toggle it
      // closed.
      if (typeof document !== "undefined") {
        const openRadixDialog = document.querySelector(
          '[data-slot="dialog-content"][data-state="open"]'
        );
        if (openRadixDialog && !showSheet) {
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      // ⌘↵ contract:
      // - composer textarea: let the textarea's own onKeyDown win (no-op here)
      // - other editables (e.g. modal textarea): no-op (modal owns ⌘↵)
      // - non-editable: shortcut sheet promises "send reply" → submit composer
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const target = e.target as HTMLElement | null;
        if (isEditableTarget(target)) {
          // Composer or modal — owners handle their own ⌘↵.
          return;
        }
        e.preventDefault();
        onSendComposer();
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowSheet((prev) => !prev);
        return;
      }
      // Escape is handled by Radix Dialog when the sheet is open. When it's
      // closed, Escape is a no-op at this level (other surfaces may handle).
      if (showSheet) {
        // Sheet is open — Radix owns its own keys (Tab trap, Escape close,
        // click-outside). Don't fire row navigation or row actions while the
        // shortcut overlay is in front of them.
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
      <LazyInboxShortcutSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        shortcuts={shortcuts}
        labels={{ sheetTitle: labels.sheetTitle, close: labels.close }}
      />
    </>
  );
}
