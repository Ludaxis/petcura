"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@petcura/ui";
import {
  resolveInboxRequest,
  assignInboxRequestToMe
} from "../_actions";
import {
  clearOptimisticallyResolved,
  markOptimisticallyResolved
} from "./InboxOptimisticContext";
import type { InboxStream } from "@/lib/inbox/queries";
import {
  applyThemePreference,
  persistThemePreference,
  type ThemePreference
} from "@/app/_components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type ThreadItem = {
  id: string;
  petName: string;
  ownerName: string;
  preview: string;
  href: string;
};

export type CommandPaletteRef = {
  open: () => void;
  close: () => void;
  toggle: () => void;
};

type CommandPaletteProps = {
  threads: ThreadItem[];
  streams: Array<{ value: InboxStream; label: string }>;
  currentRowId: string | null;
  locale: string;
  labels: {
    dialogLabel: string;
    placeholder: string;
    empty: string;
    threadsHeading: string;
    streamsHeading: string;
    actionsHeading: string;
    appearanceHeading: string;
    openThread: string;
    filterStreamPrefix: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    themeAnnounceLight: string;
    themeAnnounceDark: string;
    themeAnnounceSystem: string;
    resolveCurrent: string;
    assignCurrent: string;
    resolved: string;
    assigned: string;
  };
};

type Command = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  perform: () => void | Promise<void>;
};

export const CommandPalette = forwardRef<CommandPaletteRef, CommandPaletteProps>(
  function CommandPalette(
    {
      threads,
      streams,
      currentRowId,
      locale,
      labels
    }: CommandPaletteProps,
    ref
  ) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const liveRef = useRef<HTMLDivElement>(null);
    const [, startTransition] = useTransition();

    const openPalette = useCallback(() => {
      // Radix Dialog handles focus restoration (returns focus to whatever
      // had it before the dialog opened) and the focus trap.
      setOpen(true);
      setQuery("");
      setActive(0);
    }, []);
    const closePalette = useCallback(() => {
      setOpen(false);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        open: openPalette,
        close: closePalette,
        toggle: () => {
          if (open) {
            closePalette();
          } else {
            openPalette();
          }
        }
      }),
      [open, openPalette, closePalette]
    );

    // Window-event bridge so the lazy wrapper can mount us on first ⌘K /
    // sidebar Search click, then we open ourselves on subsequent events.
    // The `petcura:open-cmdk` event already fires from AppSidebar and the
    // inbox keyboard layer; consuming it here removes the need for a ref.
    const openRef = useRef(open);
    openRef.current = open;
    useEffect(() => {
      const onOpen = () => {
        if (openRef.current) {
          closePalette();
        } else {
          openPalette();
        }
      };
      window.addEventListener("petcura:open-cmdk", onOpen as EventListener);
      // Auto-open on first mount if the wrapper just lazy-loaded us in
      // response to the initial event (the wrapper sets a flag on window).
      if (
        typeof window !== "undefined" &&
        (window as unknown as { __pcCmdkPending?: boolean }).__pcCmdkPending
      ) {
        (window as unknown as { __pcCmdkPending?: boolean }).__pcCmdkPending =
          false;
        openPalette();
      }
      return () =>
        window.removeEventListener(
          "petcura:open-cmdk",
          onOpen as EventListener
        );
    }, [openPalette, closePalette]);

    const setStream = useCallback(
      (value: InboxStream) => {
        const sp = new URLSearchParams(window.location.search);
        if (value === "all") sp.delete("stream");
        else sp.set("stream", value);
        const qs = sp.toString();
        router.push(qs.length > 0 ? `/inbox?${qs}` : "/inbox", {
          scroll: false
        });
      },
      [router]
    );

    const announceTheme = useCallback(
      (pref: ThemePreference) => {
        if (!liveRef.current) return;
        const msg =
          pref === "dark"
            ? labels.themeAnnounceDark
            : pref === "light"
              ? labels.themeAnnounceLight
              : labels.themeAnnounceSystem;
        // Reset then assign so SR re-announces if same theme picked twice.
        liveRef.current.textContent = "";
        liveRef.current.textContent = msg;
      },
      [labels]
    );

    const setTheme = useCallback(
      (pref: ThemePreference) => {
        persistThemePreference(pref);
        applyThemePreference(pref);
        announceTheme(pref);
        void fetch("/api/theme", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ theme: pref })
        });
      },
      [announceTheme]
    );

    const commands: Command[] = useMemo(() => {
      const list: Command[] = [];

      for (const t of threads) {
        list.push({
          id: `thread-${t.id}`,
          group: labels.threadsHeading,
          label: `${t.petName} · ${t.ownerName}`,
          hint: t.preview,
          perform: () => router.push(t.href)
        });
      }

      for (const s of streams) {
        list.push({
          id: `stream-${s.value}`,
          group: labels.streamsHeading,
          label: `${labels.filterStreamPrefix} ${s.label}`,
          perform: () => setStream(s.value)
        });
      }

      if (currentRowId) {
        const resolveTargetId = currentRowId;
        list.push({
          id: "action-resolve",
          group: labels.actionsHeading,
          label: labels.resolveCurrent,
          hint: "E",
          perform: () => {
            // Mirror the InboxKeyboard `E` shortcut: optimistic pill flip
            // + 200ms row dim, then rollback on error / clear-on-success
            // after the canonical refresh.
            markOptimisticallyResolved(resolveTargetId);
            startTransition(async () => {
              const result = await resolveInboxRequest(
                resolveTargetId,
                locale
              );
              if (result.ok) {
                router.refresh();
                clearOptimisticallyResolved(resolveTargetId);
              } else {
                clearOptimisticallyResolved(resolveTargetId);
              }
            });
          }
        });
        list.push({
          id: "action-assign",
          group: labels.actionsHeading,
          label: labels.assignCurrent,
          hint: "A",
          perform: () =>
            startTransition(async () => {
              const result = await assignInboxRequestToMe(currentRowId, locale);
              if (result.ok) router.refresh();
            })
        });
      }

      list.push({
        id: "theme-light",
        group: labels.appearanceHeading,
        label: labels.themeLight,
        perform: () => setTheme("light")
      });
      list.push({
        id: "theme-dark",
        group: labels.appearanceHeading,
        label: labels.themeDark,
        perform: () => setTheme("dark")
      });
      list.push({
        id: "theme-system",
        group: labels.appearanceHeading,
        label: labels.themeSystem,
        perform: () => setTheme("system")
      });

      return list;
    }, [
      threads,
      streams,
      currentRowId,
      labels,
      locale,
      router,
      setStream,
      setTheme
    ]);

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (q.length === 0) return commands;
      return commands.filter((c) => {
        const hay = `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase();
        return hay.includes(q);
      });
    }, [commands, query]);

    // Clamp the active index instead of resetting in an effect.
    const clampedActive = Math.min(active, Math.max(filtered.length - 1, 0));

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          size="lg"
          // The palette is anchored near the top of the viewport (it's a
          // command surface, not a centered dialog). Override the centering
          // by pinning to a top offset and clearing the y-translate.
          className="top-[12vh] translate-y-0 sm:top-[18vh]"
          aria-label={labels.dialogLabel}
          // The search input is both the heading and the filter; we don't
          // render a separate <DialogTitle> visually. Provide an SR-only
          // title for a11y and skip the description warning.
          aria-describedby={undefined}
          showCloseButton={false}
          onOpenAutoFocus={(e) => {
            // Radix would focus the first focusable child; we want the
            // search input specifically (the close X is suppressed above,
            // but be explicit).
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogHeader className="border-b border-[var(--line)] px-3 py-2.5 pr-3">
            <DialogTitle className="sr-only">
              {labels.dialogLabel}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Search
                aria-hidden="true"
                size={14}
                className="text-[var(--muted)]"
              />
              <input
                ref={inputRef}
                data-cmdk-input
                type="text"
                role="combobox"
                aria-controls="cmdk-list"
                aria-expanded="true"
                aria-activedescendant={
                  filtered[clampedActive]
                    ? `cmdk-item-${filtered[clampedActive].id}`
                    : undefined
                }
                placeholder={labels.placeholder}
                className="flex-1 bg-transparent text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)]"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={(e) => {
                  // Escape is owned by Radix Dialog; let it bubble.
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) =>
                      Math.min(a + 1, Math.max(0, filtered.length - 1))
                    );
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const cmd = filtered[clampedActive];
                    if (cmd) {
                      closePalette();
                      void cmd.perform();
                    }
                    return;
                  }
                }}
              />
              <kbd className="rounded border border-[var(--line)] bg-[var(--soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--muted-2)]">
                esc
              </kbd>
            </div>
          </DialogHeader>

          <div
            ref={liveRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />

          <ul
            id="cmdk-list"
            role="listbox"
            className="max-h-[60vh] overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-8 text-center text-[12.5px] text-[var(--muted)]">
                {labels.empty}
              </li>
            ) : null}
            {filtered.map((cmd, i) => (
              <li
                key={cmd.id}
                id={`cmdk-item-${cmd.id}`}
                role="option"
                aria-selected={i === clampedActive}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  closePalette();
                  void cmd.perform();
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2",
                  i === clampedActive && "bg-[var(--primary-soft)]"
                )}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--muted-2)]">
                  {cmd.group}
                </span>
                <span className="flex-1 truncate text-[13px] text-[var(--ink)]">
                  {cmd.label}
                </span>
                {cmd.hint ? (
                  <span className="font-mono text-[10.5px] text-[var(--muted-2)]">
                    {cmd.hint}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    );
  }
);
