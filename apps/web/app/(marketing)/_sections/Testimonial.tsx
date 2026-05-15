import { SectionKicker } from "../_components/SectionKicker";

type TestimonialProps = {
  kicker: string;
  title: string;
  quote: string;
  author: string;
  metricLabel: string;
  metric: string;
  disclaimer: string;
};

/**
 * Honest proof panel. Pilot stage means goal-based proof and consent rules,
 * not fabricated customer quotes or logos.
 */
export function Testimonial({
  kicker,
  title,
  quote,
  author,
  metricLabel,
  metric,
  disclaimer
}: TestimonialProps) {
  return (
    <section
      aria-labelledby="proof-heading"
      className="border-b border-[var(--line)]"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="proof-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
        </div>

        <figure className="mt-10 grid items-center gap-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-12">
          <blockquote className="space-y-6">
            <p className="text-xl leading-relaxed text-[var(--foreground)] sm:text-2xl">
              {quote}
            </p>
            <figcaption className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              {author}
            </figcaption>
          </blockquote>
          <aside className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              {metricLabel}
            </p>
            <p className="mt-2 text-base font-medium leading-6 text-[var(--foreground)]">
              {metric}
            </p>
          </aside>
        </figure>

        <p className="mt-4 text-xs italic text-[var(--muted)]">
          {disclaimer}
        </p>
      </div>
    </section>
  );
}
