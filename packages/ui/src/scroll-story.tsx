"use client";

/**
 * <ScrollStory>
 *
 * Pinned scroll-scrubbed sequence used by the landing Walkthrough section
 * (the conversion centerpiece — see docs/design/landing-narrative-2026-05.md
 * §4). One instance per page maximum.
 *
 * Architecture:
 *
 *   1. SSR + first paint render the same content the reduced-motion / mobile
 *      fallback uses: a vertical card stack of every beat, fully visible.
 *      Screen readers, search crawlers, and reduced-motion users see the
 *      complete narrative immediately. There is no skeleton step.
 *
 *   2. After mount, on viewports ≥ 768px AND with `prefers-reduced-motion`
 *      unset, we dynamic-import `gsap` + `gsap/ScrollTrigger` and replace
 *      the static stack with a pinned scrub container. The pinned view
 *      keeps every beat in the DOM; ScrollTrigger only toggles
 *      `data-active` to drive cross-fade through CSS.
 *
 *   3. The current beat caption is announced via an aria-live="polite"
 *      region so AT users get a textual step counter when the visual
 *      scrub is in effect.
 *
 *   4. No GSAP plugins beyond ScrollTrigger. No autoplay. No video.
 */

import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import { useReducedMotion } from "motion/react";

export type ScrollStoryBeat = {
  /** Stable id used for aria-labelledby + ScrollTrigger keying. */
  id: string;
  /** Translated caption sentence — appears under the visual on the active beat. */
  caption: string;
  /** Pre-rendered visual frame — keep it cheap; no autoplay video. */
  frame: ReactNode;
};

export type ScrollStoryProps = {
  beats: ScrollStoryBeat[];
  /**
   * Total pinned scroll distance on desktop. Default "140vh".
   * Mobile / reduced-motion ignores this entirely.
   */
  desktopHeight?: string;
  /** Optional region heading for the static stack fallback. */
  title?: string;
  className?: string;
};

// `gsap` and `gsap/ScrollTrigger` are dynamic-imported inside useEffect so
// they never appear in the initial route bundle.
//
// Note: we treat the gsap instance + ScrollTrigger as opaque — no plugin
// imports, no `gsap/all`. ScrollTrigger is the only gsap plugin allowed
// per motion-system §6.

export function ScrollStory({
  beats,
  desktopHeight = "140vh",
  title,
  className
}: ScrollStoryProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrubEnabled, setScrubEnabled] = useState(false);
  const liveRegionId = useId();
  const captionBaseId = useId();

  // Decide whether to engage the scrub. Reduced motion + viewports <768px
  // get the first-class static stack.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setScrubEnabled(mql.matches && !reduce);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [reduce]);

  // Engage gsap/ScrollTrigger only when scrub is enabled. The dynamic
  // import keeps gsap (~15kB gz) out of the initial bundle.
  useEffect(() => {
    if (!scrubEnabled) return;
    const containerEl = containerRef.current;
    const pinEl = pinRef.current;
    if (!containerEl || !pinEl) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger")
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const trigger = ScrollTrigger.create({
        trigger: containerEl,
        start: "top top",
        end: "bottom bottom",
        pin: pinEl,
        pinSpacing: false,
        scrub: 0.6,
        onUpdate: (self) => {
          const progress = self.progress;
          const next = Math.min(
            beats.length - 1,
            Math.max(0, Math.floor(progress * beats.length))
          );
          setActiveIndex(next);
        }
      });

      cleanup = () => {
        trigger.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scrubEnabled, beats.length]);

  // --- Static stack (reduced-motion / mobile / first paint) -----------------

  if (!scrubEnabled) {
    return (
      <div className={className}>
        {title ? (
          <p className="sr-only" role="presentation">
            {title}
          </p>
        ) : null}
        <ol
          aria-label={title}
          className="flex flex-col gap-4"
          data-scroll-story="static"
        >
          {beats.map((beat, index) => {
            const captionId = `${captionBaseId}-${beat.id}`;
            return (
              <li
                aria-labelledby={captionId}
                aria-posinset={index + 1}
                aria-setsize={beats.length}
                className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
                data-beat={beat.id}
                key={beat.id}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary-strong)]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {index + 1}
                  </span>
                  <p
                    className="text-sm font-semibold leading-6 text-[var(--foreground)]"
                    id={captionId}
                  >
                    {beat.caption}
                  </p>
                </div>
                <div>{beat.frame}</div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // --- Pinned scrub (desktop, motion allowed) -------------------------------

  return (
    <div className={className}>
      <div
        aria-atomic="true"
        aria-live="polite"
        className="sr-only"
        id={liveRegionId}
      >
        {`Step ${activeIndex + 1} of ${beats.length}: ${beats[activeIndex]?.caption ?? ""}`}
      </div>
      <div
        ref={containerRef}
        style={{ height: desktopHeight, position: "relative" }}
      >
        <div
          aria-describedby={liveRegionId}
          className="relative grid h-screen w-full place-items-center"
          ref={pinRef}
        >
          <div className="grid w-full max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <div className="relative min-h-[280px]">
              {beats.map((beat, index) => {
                const captionId = `${captionBaseId}-${beat.id}`;
                const active = index === activeIndex;
                return (
                  <div
                    aria-hidden={!active}
                    aria-labelledby={captionId}
                    className="absolute inset-0 transition-opacity duration-300 ease-out"
                    data-active={active ? "true" : "false"}
                    data-beat={beat.id}
                    key={beat.id}
                    role="group"
                    style={{ opacity: active ? 1 : 0 }}
                  >
                    {beat.frame}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-4">
              {beats.map((beat, index) => {
                const captionId = `${captionBaseId}-${beat.id}`;
                const active = index === activeIndex;
                return (
                  <p
                    aria-current={active ? "step" : undefined}
                    className="flex items-baseline gap-3 text-base leading-7 transition-colors"
                    id={captionId}
                    key={beat.id}
                    style={{
                      color: active
                        ? "var(--foreground)"
                        : "var(--muted-2, var(--muted))",
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[11px] font-semibold text-[var(--primary-strong)]"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {index + 1}
                    </span>
                    {beat.caption}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
