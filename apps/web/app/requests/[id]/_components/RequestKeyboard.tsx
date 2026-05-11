"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody
} from "@/components/ui/dialog";
import {
  resolveInboxRequest,
  assignInboxRequestToMe
} from "@/app/inbox/_actions";
import { isEditableTarget } from "@/app/_components/useFocusTrap";

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

  // Dialog primitive handles focus trap, Escape, focus restoration. The
  // sheet itself only flips its open flag.
  const openSheet = useCallback(() => {
    setShowSheet(true);
  }, []);
  const closeSheet = useCallback(() => {
    setShowSheet(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Block global hotkeys when ANY modal dialog is open (e.g. the AI
      // draft Edit modal, the shortcut sheet, the command palette). Radix
      // Dialog tags its content with `data-state="open"` while the dialog
      // is visible; querying that lets us hand control back to the dialog
      // and its own keyboard wiring.
      if (typeof document !== "undefined") {
        const openDialog = document.querySelector(
          '[data-slot="dialog-content"][data-state="open"]'
        );
        if (openDialog) {
          // ? still toggles the shortcut sheet shut even when it's the open
          // dialog — the dialog primitive handles Tab/Escape automatically.
          if (showSheet && e.key === "?") {
            e.preventDefault();
            closeSheet();
          }
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
        // When the sheet is already open the guard above swallows this key
        // and routes it back through closeSheet(). This branch only fires
        // on opens.
        e.preventDefault();
        openSheet();
        return;
      }
      // Escape, when the sheet is open, is handled by the Dialog primitive
      // via its overlay/dismiss wiring.
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
      <Dialog
        open={showSheet}
        onOpenChange={(next) => {
          if (!next) closeSheet();
        }}
      >
        <DialogContent
          size="md"
          aria-label={labels.sheetTitle}
          closeLabel={labels.close}
        >
          <DialogHeader>
            <DialogTitle>{labels.sheetTitle}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ul className="flex flex-col gap-1.5">
              {shortcuts.map((s) => (
                <li
                  key={s.keys + s.description}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-2 py-1.5 text-[12.5px] text-[var(--ink)] hover:bg-[var(--soft)]"
                >
                  <span>{s.description}</span>
                  <kbd className="rounded border border-[var(--line)] bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--ink-2)]">
                    {s.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
