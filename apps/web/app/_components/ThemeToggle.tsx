"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { SegmentedControl } from "@petcura/ui";

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
  const liveRef = useRef<HTMLDivElement>(null);
  const prefRef = useRef(pref);
  // The ready flag previously gated CSS animation. SegmentedControl now owns
  // the rendered radiogroup; we wrap it so the ready data attribute still
  // lives on the same DOM element selectors used by /design's e2e.
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.setAttribute("data-theme-toggle-ready", "true");
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

  return (
    <>
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      <div ref={wrapperRef} className={variant === "menu" ? "w-full" : "inline-flex"}>
        <SegmentedControl
          value={pref}
          onValueChange={(next: ThemePreference) => setTheme(next)}
          aria-label={labels.label}
          tone="primary"
          fullWidth={variant === "menu"}
        >
          <SegmentedControl.Item
            value="light"
            label={labels.light}
            icon={<Sun aria-hidden="true" size={13} />}
            iconOnly={variant !== "menu"}
          />
          <SegmentedControl.Item
            value="dark"
            label={labels.dark}
            icon={<Moon aria-hidden="true" size={13} />}
            iconOnly={variant !== "menu"}
          />
          <SegmentedControl.Item
            value="system"
            label={labels.system}
            icon={<Monitor aria-hidden="true" size={13} />}
            iconOnly={variant !== "menu"}
          />
        </SegmentedControl>
      </div>
    </>
  );
}
