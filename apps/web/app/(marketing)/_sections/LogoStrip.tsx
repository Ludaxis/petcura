type LogoStripProps = {
  heading: string;
  footnote: string;
  signals: readonly string[];
};

/**
 * Honest pilot proof strip. No fabricated logo placeholders, no named
 * clinics without written consent.
 */
export function LogoStrip({ heading, footnote, signals }: LogoStripProps) {
  return (
    <section
      aria-labelledby="logos-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
          id="logos-heading"
        >
          {heading}
        </p>
        <ul
          aria-label="Pilot-stage proof points"
          className="mt-6 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6"
          role="list"
        >
          {signals.map((signal) => (
            <li
              className="flex min-h-12 w-full max-w-[190px] items-center justify-center rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-center text-[11px] font-semibold uppercase leading-5 text-[var(--muted)]"
              key={signal}
            >
              {signal}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[11px] italic text-[var(--muted)]">
          {footnote}
        </p>
      </div>
    </section>
  );
}
