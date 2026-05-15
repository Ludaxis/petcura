"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { TrackedMarketingLink } from "./TrackedMarketingLink";
import { leadSources } from "../_data/landing";

type MobileMarketingMenuProps = {
  labels: {
    menu: string;
    close: string;
    howItWorks: string;
    safety: string;
    security: string;
    pricing: string;
    owners: string;
    signIn: string;
    demo: string;
  };
  locale: SupportedLocale;
  hrefs: {
    demo: string;
    owners: string;
    signIn: string;
  };
};

export function MobileMarketingMenu({
  labels,
  locale,
  hrefs
}: MobileMarketingMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        aria-expanded={open}
        aria-label={open ? labels.close : labels.menu}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X aria-hidden="true" size={17} /> : <Menu aria-hidden="true" size={17} />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-[65px] z-50 border-b border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_24px_48px_-34px_rgba(41,38,27,0.42)]">
          <nav aria-label={labels.menu} className="grid gap-1">
            {[
              { href: "#how-it-works", label: labels.howItWorks },
              { href: "#safety", label: labels.safety },
              { href: "#security", label: labels.security },
              { href: "#pricing", label: labels.pricing }
            ].map((item) => (
              <Link
                className="rounded-[var(--radius)] px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <TrackedMarketingLink
              className="rounded-[var(--radius)] px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              eventName="owner_path_clicked"
              href={hrefs.owners}
              locale={locale}
              onClick={() => setOpen(false)}
              route="/owners"
              source={leadSources.ownerPath}
            >
              {labels.owners}
            </TrackedMarketingLink>
            <Link
              className="rounded-[var(--radius)] px-3 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              href={hrefs.signIn}
              onClick={() => setOpen(false)}
            >
              {labels.signIn}
            </Link>
            <Button asChild className="mt-2 w-full">
              <TrackedMarketingLink
                eventName="landing_cta_clicked"
                href={hrefs.demo}
                locale={locale}
                onClick={() => setOpen(false)}
                route="/demo"
                source={leadSources.mobileBar}
              >
                {labels.demo}
              </TrackedMarketingLink>
            </Button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
