"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@petcura/ui";

export type ThemePreference = "light" | "dark" | "system";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type ThemeToggleProps = {
  initial: ThemePreference;
  labels: {
    light: string;
    dark: string;
    system: string;
    label: string;
    announceLight: string;
    announceDark: string;
    announceSystem: string;
  };
  variant?: "chip" | "menu";
};

function readCookie(): ThemePreference | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|; )petcura-theme=(light|dark|system)/
  );
  return (match?.[1] as ThemePreference | undefined) ?? null;
}

export function persistThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  document.cookie = `petcura-theme=${pref}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function applyThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  let resolved: "light" | "dark" = "light";
  if (pref === "dark") resolved = "dark";
  else if (pref === "system") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  if (resolved === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function ThemeToggle({
  initial,
  labels,
  variant = "chip"
}: ThemeToggleProps) {
  // Lazy initializer reads the cookie on first client render so the toggle
  // reflects the persisted choice without a state-mirror effect.
  const [pref, setPref] = useState<ThemePreference>(
    () => (typeof document === "undefined" ? initial : readCookie() ?? initial)
  );
  const [, startTransition] = useTransition();
  const groupRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const prefRef = useRef(pref);

  useEffect(() => {
    groupRef.current?.setAttribute("data-theme-toggle-ready", "true");
  }, []);

  useEffect(() => {
    prefRef.current = pref;
  }, [pref]);

  // Subscribe to OS color-scheme changes only when tracking system.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemePreference("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setTheme = (next: ThemePreference) => {
    if (prefRef.current === next) return;
    prefRef.current = next;
    setPref(next);
    persistThemePreference(next);
    applyThemePreference(next);
    if (liveRef.current) {
      // Reset then assign so SR re-announces if the same option is picked twice.
      liveRef.current.textContent = "";
      liveRef.current.textContent =
        next === "dark"
          ? labels.announceDark
          : next === "light"
            ? labels.announceLight
            : labels.announceSystem;
    }
    startTransition(() => {
      void fetch("/api/theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ theme: next })
      });
    });
  };

  const options: Array<{ value: ThemePreference; icon: typeof Sun; label: string }> = [
    { value: "light", icon: Sun, label: labels.light },
    { value: "dark", icon: Moon, label: labels.dark },
    { value: "system", icon: Monitor, label: labels.system }
  ];

  return (
    <>
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={labels.label}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-0.5",
          variant === "menu" && "w-full"
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const active = pref === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onPointerDown={() => setTheme(option.value)}
            onClick={() => setTheme(option.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              setTheme(option.value);
            }}
            className={cn(
                "inline-flex h-7 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 text-[11.5px] font-medium transition",
                active
                  ? "bg-[var(--primary)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]",
                variant === "menu" && "flex-1"
              )}
            >
              <Icon aria-hidden="true" size={13} />
              {variant === "menu" ? (
                <span>{option.label}</span>
              ) : (
                <span className="sr-only">{option.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
