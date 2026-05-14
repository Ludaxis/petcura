"use client";

import { CheckCircle2 } from "lucide-react";
import { KineticHeadline } from "@petcura/ui";
import { SectionKicker } from "../_components/SectionKicker";

type AISafetyProps = {
  kicker: string;
  taglineLine1: string;
  taglineLine2: string;
  body: string;
  will: {
    title: string;
    items: readonly string[];
  };
  willNot: {
    title: string;
    items: readonly string[];
  };
  training: string;
};

/**
 * AISafety — narrative §7. The trust spine of the page. The kinetic
 * headline reveals as two line-grouped beats ("PetCura drafts." /
 * "Your team decides."). The negative-enum list is visually heavier
 * than the will-do list (left rule, stronger contrast, slightly
 * larger leading) so reduced-motion users see the same hierarchy.
 */
export function AISafety({
  kicker,
  taglineLine1,
  taglineLine2,
  body,
  will,
  willNot,
  training
}: AISafetyProps) {
  return (
    <section
      aria-labelledby="safety-heading"
      className="border-b border-[var(--line)]"
      id="safety"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionKicker>{kicker}</SectionKicker>
          <KineticHeadline
            as="h2"
            className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="safety-heading"
            lines={[taglineLine1, taglineLine2]}
          />
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article
            className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6"
            data-list="will-do"
          >
            <header className="flex items-center gap-2 text-[var(--primary-strong)]">
              <CheckCircle2 aria-hidden="true" size={18} />
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em]">
                {will.title}
              </h3>
            </header>
            <ul className="flex flex-col gap-2" role="list">
              {will.items.map((item, index) => (
                <li
                  className="flex items-start gap-2 text-sm leading-6 text-[var(--muted)]"
                  key={`${index}-${item}`}
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-1 text-[var(--primary)]"
                    size={14}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article
            className="flex flex-col gap-4 rounded-[var(--radius)] border-l-4 border-[var(--line)] border-l-[var(--foreground)] bg-[var(--paper)] p-6"
            data-list="will-not"
          >
            <header className="flex items-center gap-2 text-[var(--foreground)]">
              <h3 className="text-sm font-semibold uppercase tracking-[0.06em]">
                {willNot.title}
              </h3>
            </header>
            <ul className="flex flex-col gap-3" role="list">
              {willNot.items.map((item, index) => (
                <li
                  className="flex items-baseline gap-3 text-[15px] font-medium leading-7 text-[var(--foreground)]"
                  key={`${index}-${item}`}
                >
                  <span aria-hidden="true" className="select-none text-[var(--foreground)]">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          <strong className="font-semibold text-[var(--foreground)]">
            {training}
          </strong>
        </p>
      </div>
    </section>
  );
}
