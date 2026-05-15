"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Button } from "@petcura/ui";
import { motion } from "motion/react";
import type { SupportedLocale } from "@petcura/shared";
import { TrackedMarketingLink } from "../_components/TrackedMarketingLink";
import { leadSources } from "../_data/landing";

type HeroProps = {
  copy: {
    eyebrow: string;
    title: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ownerPath: string;
    trust: string;
    loop: {
      whatsappLabel: string;
      whatsappFrom: string;
      whatsappMessage: string;
      whatsappTime: string;
      aiLabel: string;
      aiCategory: string;
      aiSummary: string;
      aiDisclaimer: string;
      replyLabel: string;
      replyBody: string;
      replyAuthor: string;
      exportLabel: string;
      exportDetail: string;
    };
  };
  hrefs: {
    demo: string;
    owners: string;
    sandbox: string;
  };
  locale: SupportedLocale;
};

/**
 * Hero — narrative §1. The H1 is the only h1 on the page and renders
 * statically so the first viewport never depends on an observer before
 * the core offer is readable.
 */
export function Hero({ copy, hrefs, locale }: HeroProps) {
  const titleLines = splitHeadlineIntoLines(copy.title);

  const heroEntrance = (_delay: number, _distance = 48) => ({
    initial: false as const,
    animate: { opacity: 1, y: 0 }
  });

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-[var(--line)]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
            {...heroEntrance(150, 24)}
          >
            <ShieldCheck aria-hidden="true" size={13} />
            <span>{copy.eyebrow}</span>
          </motion.span>

          <h1
            className="max-w-2xl text-[40px] font-semibold leading-[1.05] text-[var(--foreground)] sm:text-[52px] lg:text-[60px]"
            id="hero-heading"
          >
            {titleLines.map((line) => (
              <span className="block" key={line}>
                {line}
              </span>
            ))}
          </h1>

          <motion.p
            className="block max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8"
            {...heroEntrance(1100)}
          >
            {copy.body}
          </motion.p>

          <motion.div
            className="mt-2 flex flex-wrap items-center gap-3"
            {...heroEntrance(1350)}
          >
            <Button asChild>
              <TrackedMarketingLink
                eventName="landing_cta_clicked"
                href={hrefs.demo}
                locale={locale}
                route="/demo"
                source={leadSources.hero}
              >
                {copy.ctaPrimary}
                <ArrowRight aria-hidden="true" size={16} />
              </TrackedMarketingLink>
            </Button>
            <Button asChild variant="secondary">
              <TrackedMarketingLink
                eventName="landing_cta_clicked"
                href={hrefs.sandbox}
                locale={locale}
                route="/sandbox"
                source={leadSources.hero}
              >
                {copy.ctaSecondary}
              </TrackedMarketingLink>
            </Button>
          </motion.div>

          <motion.p
            className="flex flex-wrap items-center gap-2 text-sm leading-6 text-[var(--muted)]"
            {...heroEntrance(1500, 24)}
          >
            <PawPrint
              aria-hidden="true"
              className="text-[var(--primary)]"
              size={15}
            />
            <TrackedMarketingLink
              className="font-semibold text-[var(--primary-strong)] underline-offset-4 hover:underline focus-visible:underline"
              eventName="owner_path_clicked"
              href={hrefs.owners}
              locale={locale}
              route="/owners"
              source={leadSources.ownerPath}
            >
              {copy.ownerPath}
            </TrackedMarketingLink>
          </motion.p>

          <motion.ul
            aria-label="Trust signals"
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--muted)]"
            role="list"
            {...heroEntrance(1700, 24)}
          >
            {copy.trust
              .split(" · ")
              .map((chip) => chip.trim())
              .filter(Boolean)
              .map((chip) => (
                <li className="inline-flex items-center gap-1.5" key={chip}>
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]"
                  />
                  {chip}
                </li>
              ))}
          </motion.ul>
        </div>

        <ProductLoopVisual copy={copy.loop} />
      </div>
    </section>
  );
}

function splitHeadlineIntoLines(headline: string): string[] {
  // Heuristic: split on whitespace into roughly three balanced lines, but
  // never split inside a word. For short headlines (<6 words) we render
  // as one or two lines instead. Cyrillic kerning stays intact because
  // each line is a whole-word group.
  const words = headline.split(" ").filter(Boolean);
  if (words.length <= 5) return [headline];
  const target = Math.ceil(words.length / 3);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += target) {
    lines.push(words.slice(i, i + target).join(" "));
  }
  return lines;
}

function ProductLoopVisual({
  copy
}: {
  copy: HeroProps["copy"]["loop"];
}) {
  return (
    <figure
      aria-label="Product preview: WhatsApp message becomes a typed request, AI drafts a reply, staff approves, record exports to PMS"
      className="relative flex w-full flex-col gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--paper)] p-4 pl-6 shadow-[0_24px_48px_-32px_rgba(74,107,63,0.35)] sm:p-5 sm:pl-7"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-5 left-2.5 top-5 w-px overflow-hidden rounded-full bg-[var(--line)]"
      >
        <span className="pc-loop-trail block h-full w-full origin-top bg-[var(--primary)]" />
      </span>

      <div className="pc-loop-step pc-loop-step-1 rounded-[10px] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]">
            <MessageCircle aria-hidden="true" size={12} />
            {copy.whatsappLabel}
          </span>
          <span
            className="text-[10px] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {copy.whatsappTime}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
          {copy.whatsappMessage}
        </p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          {copy.whatsappFrom}
        </p>
      </div>

      <div className="pc-loop-step pc-loop-step-2 rounded-[10px] border border-[var(--primary-soft)] bg-[var(--primary-soft)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--primary-strong)]">
            <Sparkles aria-hidden="true" size={12} />
            {copy.aiLabel}
          </span>
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1 text-[var(--primary-strong)]"
          >
            <span className="pc-typing-dot pc-typing-dot-1 inline-block h-1 w-1 rounded-full bg-current" />
            <span className="pc-typing-dot pc-typing-dot-2 inline-block h-1 w-1 rounded-full bg-current" />
            <span className="pc-typing-dot pc-typing-dot-3 inline-block h-1 w-1 rounded-full bg-current" />
          </span>
        </div>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--primary-strong)]">
          {copy.aiCategory}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--foreground)]">
          {copy.aiSummary}
        </p>
        <p className="mt-2 text-[11px] italic text-[var(--primary-strong)]">
          {copy.aiDisclaimer}
        </p>
      </div>

      <div className="pc-loop-step pc-loop-step-3 rounded-[10px] border border-[var(--line)] bg-[var(--paper)] p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            <CheckCircle2 aria-hidden="true" size={12} />
            {copy.replyLabel}
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            {copy.replyAuthor}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
          {copy.replyBody}
        </p>
      </div>

      <div
        className="pc-loop-step pc-loop-step-4 flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
          <FileText aria-hidden="true" size={12} />
          {copy.exportLabel}
        </span>
        <span className="text-[10.5px] text-[var(--muted)]">
          {copy.exportDetail}
        </span>
      </div>
    </figure>
  );
}
