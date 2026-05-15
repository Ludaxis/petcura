"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { SupportedLocale } from "@petcura/shared";
import { TrackedMarketingLink } from "./TrackedMarketingLink";
import { leadSources } from "../_data/landing";

type MobileCTABarProps = {
  primary: string;
  secondary: string;
  hrefs: {
    demo: string;
    owners: string;
  };
  locale: SupportedLocale;
};

/**
 * MobileCTABar — narrative §13. Slides up from below after the hero
 * scrolls out of view. Reduced-motion = renders in place with no
 * slide. Hit area + contrast identical in both states.
 *
 * Only visible <md so it doesn't compete with the sticky top nav
 * on desktop.
 */
export function MobileCTABar({
  primary,
  secondary,
  hrefs,
  locale
}: MobileCTABarProps) {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Sentinel sits above the bar in DOM but is portaled via a
    // hidden ref watcher — simpler: observe the first <section>
    // (hero) on document load.
    if (typeof window === "undefined") return;
    const hero = document.querySelector(
      "section[aria-labelledby='hero-heading']"
    );
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} />
      <motion.aside
        animate={
          reduce
            ? { opacity: visible ? 1 : 0, y: 0 }
            : { opacity: visible ? 1 : 0, y: visible ? 0 : 24 }
        }
        aria-hidden={!visible}
        aria-label="Mobile call-to-action"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-2 border-t border-[var(--line)] bg-[var(--paper)] p-3 shadow-[0_-12px_24px_-20px_rgba(0,0,0,0.18)] md:hidden"
        initial={{ opacity: 0, y: 24 }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <TrackedMarketingLink
          className="flex-1 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-center text-sm font-semibold text-white"
          eventName="landing_cta_clicked"
          href={hrefs.demo}
          locale={locale}
          route="/demo"
          source={leadSources.mobileBar}
        >
          {primary}
        </TrackedMarketingLink>
        <TrackedMarketingLink
          className="flex-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-center text-sm font-semibold text-[var(--foreground)]"
          eventName="owner_path_clicked"
          href={hrefs.owners}
          locale={locale}
          route="/owners"
          source={leadSources.ownerPath}
        >
          {secondary}
        </TrackedMarketingLink>
      </motion.aside>
    </>
  );
}
