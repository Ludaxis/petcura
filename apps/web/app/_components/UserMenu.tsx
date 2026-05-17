"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type ReactElement
} from "react";
import Link from "next/link";
import {
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Monitor,
  Moon,
  Sun,
  UserRound
} from "lucide-react";
import {
  localeOptions,
  withLocale,
  type SupportedLocale
} from "@petcura/shared";
import { cn } from "@petcura/ui";
import {
  applyThemePreference,
  persistThemePreference,
  type ThemePreference
} from "./ThemeToggle";
import { trapTabKey } from "./useFocusTrap";

export type UserMenuLabels = {
  ariaLabel: string;
  signedInAs: string;
  theme: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  language: string;
  profile: string;
  help: string;
  helpHref: string;
  signOut: string;
  back: string;
};

type UserMenuVariant = "floating" | "sidebar-card";

type UserMenuProps = {
  email: string;
  displayName?: string;
  clinicName?: string;
  locale: SupportedLocale;
  currentPath: string;
  initialTheme: ThemePreference;
  labels: UserMenuLabels;
  /** Server action for signing out. Takes a hidden `lang` field. */
  signOutAction: (formData: FormData) => void | Promise<void>;
  /**
   * "floating" (default, legacy) — fixed bottom-left avatar chip.
   * "sidebar-card" — used inside the AppSidebar identity card. The trigger
   * spans `cardSlot` and the popover anchors above the card.
   */
  variant?: UserMenuVariant;
  /** Custom trigger contents for `variant="sidebar-card"`. */
  cardSlot?: ReactElement;
};

type Panel = "root" | "theme" | "language";

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  icon: typeof Sun;
  labelKey: "themeLight" | "themeDark" | "themeSystem";
}> = [
  { value: "light", icon: Sun, labelKey: "themeLight" },
  { value: "dark", icon: Moon, labelKey: "themeDark" },
  { value: "system", icon: Monitor, labelKey: "themeSystem" }
];

export function UserMenu({
  email,
  displayName,
  clinicName,
  locale,
  currentPath,
  initialTheme,
  labels,
  signOutAction,
  variant = "floating",
  cardSlot
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("root");
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setPanel("root");
  }, []);

  // Bridge: MobileBottomNav "Me" tab dispatches `petcura:open-user-menu` so
  // we have a single UserMenu instance (the sidebar identity card) handle
  // both the desktop click and the mobile tap. Toggling instead of just
  // opening keeps tap-to-close on the same tab working.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => {
      setOpen((v) => !v);
      // Focus the trigger so the popover anchors and Esc restores focus
      // back to a stable element when the user dismisses it.
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    window.addEventListener("petcura:open-user-menu", onOpen as EventListener);
    return () =>
      window.removeEventListener(
        "petcura:open-user-menu",
        onOpen as EventListener
      );
  }, []);

  // Manage focus + Escape + click-outside while open.
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Defer initial focus to next frame so the panel exists.
    const raf = requestAnimationFrame(() => {
      const firstButton = popoverRef.current?.querySelector<HTMLElement>(
        '[role="menuitem"], button, a'
      );
      firstButton?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      } else if (e.key === "Tab" && popoverRef.current) {
        trapTabKey(e, popoverRef.current);
      } else if (e.key === "ArrowLeft" && panel !== "root") {
        e.preventDefault();
        setPanel("root");
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, panel, close]);

  // Restore focus to trigger when closing.
  useEffect(() => {
    if (open) return;
    const last = lastFocusedRef.current;
    if (last && document.contains(last)) {
      last.focus();
    }
  }, [open]);

  const handleThemeChange = (next: ThemePreference) => {
    setTheme(next);
    persistThemePreference(next);
    applyThemePreference(next);
    startTransition(() => {
      // Server components read the cookie via getThemePreference on next nav.
    });
    setPanel("root");
  };

  const initials = (() => {
    const source = displayName || email;
    return source
      .split(/[\s.@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";
  })();

  const isSidebar = variant === "sidebar-card";

  const trigger = isSidebar ? (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={labels.ariaLabel}
      onClick={() => setOpen((v) => !v)}
      // The sidebar identity card uses cardSlot for its visible body; the
      // <button> wraps it so the entire row is the popover trigger.
      className={cn(
        "block w-full text-left transition",
        "hover:bg-[var(--soft)]",
        open && "bg-[var(--soft)]"
      )}
    >
      {cardSlot}
    </button>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={labels.ariaLabel}
      onClick={() => setOpen((v) => !v)}
      className={cn(
        "group flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--paper)] shadow-md transition hover:bg-[var(--soft)]",
        "focus-visible:ring-0"
      )}
    >
      <span
        className="text-[12px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        {initials}
      </span>
    </button>
  );

  const popover = open ? (
    <div
      ref={popoverRef}
      role="menu"
      aria-label={labels.ariaLabel}
      className={cn(
        "w-[280px] overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--paper)] shadow-xl",
        isSidebar
          ? // Anchor above the identity card. left:0 keeps it flush with the
            // sidebar's left edge; the +8px adds a small visual gap.
            "absolute bottom-[calc(100%+8px)] left-2 origin-bottom-left z-50"
          : "absolute bottom-[52px] left-0 origin-bottom-left"
      )}
    >
            {/* Identity header */}
            <div className="border-b border-[var(--line)] px-4 py-3">
              <p
                className="truncate text-[12px] font-semibold text-[var(--ink-2)]"
                title={email}
              >
                {displayName || email}
              </p>
              {clinicName ? (
                <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                  {clinicName}
                </p>
              ) : null}
              <p
                className="mt-1 truncate text-[10px] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {labels.signedInAs}
              </p>
            </div>

            {panel === "root" ? (
              <ul className="flex flex-col py-1.5">
                <RowButton
                  icon={<ActiveThemeIcon theme={theme} />}
                  label={labels.theme}
                  meta={labels[`theme${capitalize(theme)}` as keyof UserMenuLabels] as string}
                  onClick={() => setPanel("theme")}
                />
                <RowButton
                  icon={<Globe size={16} aria-hidden="true" />}
                  label={labels.language}
                  meta={localeOptions.find((o) => o.value === locale)?.shortLabel}
                  onClick={() => setPanel("language")}
                />
                <RowLink
                  icon={<UserRound size={16} aria-hidden="true" />}
                  label={labels.profile}
                  href={withLocale("/profile", locale)}
                />
                <RowLink
                  icon={<HelpCircle size={16} aria-hidden="true" />}
                  label={labels.help}
                  href={labels.helpHref}
                />
                <li className="my-1 h-px bg-[var(--line)]" role="separator" />
                <SignOutForm
                  action={signOutAction}
                  locale={locale}
                  label={labels.signOut}
                  onSubmit={close}
                />
              </ul>
            ) : null}

            {panel === "theme" ? (
              <SubPanel
                backLabel={labels.back}
                onBack={() => setPanel("root")}
                title={labels.theme}
              >
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = theme === opt.value;
                  return (
                    <li key={opt.value} role="none">
                      <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => handleThemeChange(opt.value)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition hover:bg-[var(--soft)]",
                          selected
                            ? "text-[var(--primary-strong)]"
                            : "text-[var(--ink)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center",
                            selected
                              ? "text-[var(--primary)]"
                              : "text-[var(--muted)]"
                          )}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="flex-1">{labels[opt.labelKey]}</span>
                        {selected ? (
                          <span
                            aria-hidden="true"
                            className="text-[var(--primary)]"
                          >
                            ●
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </SubPanel>
            ) : null}

            {panel === "language" ? (
              <SubPanel
                backLabel={labels.back}
                onBack={() => setPanel("root")}
                title={labels.language}
              >
                {localeOptions.map((option) => {
                  const selected = option.value === locale;
                  const href = withLocale(currentPath, option.value);
                  return (
                    <li key={option.value} role="none">
                      <Link
                        href={href}
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={close}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition hover:bg-[var(--soft)]",
                          selected
                            ? "text-[var(--primary-strong)]"
                            : "text-[var(--ink)]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-7 items-center justify-center font-mono text-[10.5px] font-semibold",
                            selected
                              ? "text-[var(--primary)]"
                              : "text-[var(--muted)]"
                          )}
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {option.shortLabel}
                        </span>
                        <span className="flex-1">{option.label}</span>
                        {selected ? (
                          <span
                            aria-hidden="true"
                            className="text-[var(--primary)]"
                          >
                            ●
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </SubPanel>
            ) : null}
    </div>
  ) : null;

  if (isSidebar) {
    return (
      <div className="relative w-full">
        {trigger}
        {popover}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-16 z-40 sm:bottom-5 sm:left-20">
      <div className="pointer-events-auto relative">
        {trigger}
        {popover}
      </div>
    </div>
  );
}

function ActiveThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === "dark") return <Moon size={16} aria-hidden="true" />;
  if (theme === "system") return <Monitor size={16} aria-hidden="true" />;
  return <Sun size={16} aria-hidden="true" />;
}

function RowButton({
  icon,
  label,
  meta,
  onClick
}: {
  icon: ReactNode;
  label: string;
  meta?: string | undefined;
  onClick: () => void;
}) {
  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)]"
      >
        <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {meta ? (
          <span className="truncate text-[11px] text-[var(--muted)]">
            {meta}
          </span>
        ) : null}
        <ChevronRight
          size={14}
          aria-hidden="true"
          className="text-[var(--muted-2)]"
        />
      </button>
    </li>
  );
}

function RowLink({
  icon,
  label,
  href
}: {
  icon: ReactNode;
  label: string;
  href: string;
}) {
  const external = /^https?:/.test(href);
  if (external) {
    return (
      <li role="none">
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          role="menuitem"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)]"
        >
          <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
            {icon}
          </span>
          <span className="flex-1">{label}</span>
        </a>
      </li>
    );
  }
  return (
    <li role="none">
      <Link
        href={href}
        role="menuitem"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--ink)] transition hover:bg-[var(--soft)]"
      >
        <span className="flex h-5 w-5 items-center justify-center text-[var(--muted)]">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
      </Link>
    </li>
  );
}

function SignOutForm({
  action,
  locale,
  label,
  onSubmit
}: {
  action: (formData: FormData) => void | Promise<void>;
  locale: SupportedLocale;
  label: string;
  onSubmit: () => void;
}) {
  return (
    <li role="none">
      <form action={action} onSubmit={onSubmit}>
        <input type="hidden" name="lang" value={locale} />
        <button
          type="submit"
          role="menuitem"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[var(--red)] transition hover:bg-[var(--red-soft)]"
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <LogOut size={16} aria-hidden="true" />
          </span>
          <span className="flex-1">{label}</span>
        </button>
      </form>
    </li>
  );
}

function SubPanel({
  title,
  backLabel,
  onBack,
  children
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-2 py-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)]"
        >
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{ transform: "rotate(180deg)" }}
          />
        </button>
        <span
          className="text-[12px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {title}
        </span>
      </div>
      <ul className="flex flex-col py-1.5">{children}</ul>
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
