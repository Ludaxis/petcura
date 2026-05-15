import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge, Button } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { SectionKicker } from "../_components/SectionKicker";
import { TrackedMarketingLink } from "../_components/TrackedMarketingLink";
import { leadSources } from "../_data/landing";

type PricingProps = {
  kicker: string;
  title: string;
  body: string;
  tier: {
    title: string;
    body: string;
    badge: string;
    features: readonly string[];
    ctaPrimary: string;
    ctaSecondary: string;
    sandboxNote: string;
  };
  hrefs: {
    demo: string;
    sandbox: string;
  };
  locale: SupportedLocale;
};

/**
 * Pricing — narrative §10. Demo-wall break. Dual CTA mirrors hero
 * (demo + sandbox). The "Locked through 2027" line gets a static
 * leitmotif underline; no draw-on-enter animation lib needed.
 */
export function Pricing({ kicker, title, body, tier, hrefs, locale }: PricingProps) {
  return (
    <section
      aria-labelledby="pricing-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
      id="pricing"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="pricing-heading"
            style={{ textWrap: "balance" }}
          >
            <span className="underline decoration-[var(--primary)] decoration-2 underline-offset-[6px]">
              {title}
            </span>
          </h2>
          <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
        </div>

        <article className="flex flex-col gap-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-2xl font-semibold text-[var(--foreground)]">
              {tier.title}
            </h3>
            <Badge tone="teal">{tier.badge}</Badge>
          </header>
          <p className="text-sm leading-6 text-[var(--muted)]">{tier.body}</p>
          <ul className="grid gap-2" role="list">
            {tier.features.map((feature, index) => (
              <li
                className="flex items-start gap-2 text-sm leading-6 text-[var(--foreground)]"
                key={`${index}-${feature}`}
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-1 text-[var(--primary)]"
                  size={14}
                />
                {feature}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <TrackedMarketingLink
                eventName="landing_cta_clicked"
                href={hrefs.demo}
                locale={locale}
                route="/demo"
                source={leadSources.pricing}
              >
                {tier.ctaPrimary}
                <ArrowRight aria-hidden="true" size={16} />
              </TrackedMarketingLink>
            </Button>
            <Button asChild variant="secondary">
              <TrackedMarketingLink
                eventName="landing_cta_clicked"
                href={hrefs.sandbox}
                locale={locale}
                route="/sandbox"
                source={leadSources.pricing}
              >
                {tier.ctaSecondary}
              </TrackedMarketingLink>
            </Button>
          </div>
          <p className="text-xs italic text-[var(--muted)]">
            {tier.sandboxNote}
          </p>
        </article>
      </div>
    </section>
  );
}
