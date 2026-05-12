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
import { isEditableTarget } from "@/app/_components/useFocusTrap";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Bail when any Radix Dialog (this sheet, the command palette, etc.)
      // owns the foreground. Radix owns its own Tab/Escape/click-outside; we
      // must not steal those keys at the document level. The own-sheet case
      // is allowed to fall through so `?` can toggle it closed.
      if (typeof document !== "undefined") {
        const openRadixDialog = document.querySelector(
          '[data-slot="dialog-content"][data-state="open"]'
        );
        if (openRadixDialog && !showSheet) {
          return;
        }
      }

      // Modal toggles always available
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowSheet((prev) => !prev);
        return;
      }
      if (showSheet) {
        // Sheet open — Radix owns its own keys (Tab, Escape, click-outside).
        // Don't fire row navigation or row actions while the overlay is in
        // front of them.
        return;
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
      <Dialog open={showSheet} onOpenChange={setShowSheet}>
        <DialogContent
          size="md"
          closeLabel={labels.close}
          // The sheet body is a list of shortcuts; the title is sufficient
          // labeling. Pass undefined explicitly so Radix doesn't log a
          // missing-description warning at dev time.
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>{labels.sheetTitle}</DialogTitle>
          </DialogHeader>
          <DialogBody>
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
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
