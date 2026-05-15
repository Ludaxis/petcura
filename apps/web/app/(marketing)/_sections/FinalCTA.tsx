"use client";

import { ArrowRight } from "lucide-react";
import { Button, KineticHeadline } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { TrackedMarketingLink } from "../_components/TrackedMarketingLink";
import { leadSources } from "../_data/landing";

type FinalCTAProps = {
  title: string;
  body: string;
  primary: string;
  secondary: string;
  hrefs: {
    demo: string;
    owners: string;
  };
  locale: SupportedLocale;
};

/**
 * FinalCTA — narrative §12. Closes the typographic frame the hero
 * opened: same KineticHeadline engine, line-grouped reveal. Only
 * other place kinetic type is allowed on the page.
 */
export function FinalCTA({
  title,
  body,
  primary,
  secondary,
  hrefs,
  locale
}: FinalCTAProps) {
  const lines = splitHeadlineIntoLines(title);
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
        <KineticHeadline
          as="h2"
          className="max-w-2xl text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
          id="final-cta-heading"
          lines={lines}
        />
        <p className="max-w-xl text-base leading-7 text-[var(--muted)]">
          {body}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <TrackedMarketingLink
              eventName="landing_cta_clicked"
              href={hrefs.demo}
              locale={locale}
              route="/demo"
              source={leadSources.finalCta}
            >
              {primary}
              <ArrowRight aria-hidden="true" size={16} />
            </TrackedMarketingLink>
          </Button>
          <Button asChild variant="secondary">
            <TrackedMarketingLink
              eventName="owner_path_clicked"
              href={hrefs.owners}
              locale={locale}
              route="/owners"
              source={leadSources.ownerPath}
            >
              {secondary}
            </TrackedMarketingLink>
          </Button>
        </div>
      </div>
    </section>
  );
}

function splitHeadlineIntoLines(headline: string): string[] {
  const words = headline.split(" ").filter(Boolean);
  if (words.length <= 4) return [headline];
  const target = Math.ceil(words.length / 2);
  return [
    words.slice(0, target).join(" "),
    words.slice(target).join(" ")
  ].filter(Boolean);
}
