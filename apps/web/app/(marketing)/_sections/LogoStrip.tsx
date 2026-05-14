type LogoStripProps = {
  heading: string;
  placeholder: string;
  footnote: string;
};

/**
 * Logo strip — narrative §2. Static 6-up grid (3-up on mobile). No marquee,
 * no auto-scroll — those are 2026 conversion leaks per the research file.
 * Reveal on enter happens at the wrapper via CSS-only (handled by the
 * Reveal primitive when a parent introduces one); this section stays
 * server-rendered for SSR friendliness.
 */
export function LogoStrip({ heading, placeholder, footnote }: LogoStripProps) {
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
          aria-label="Pilot clinics"
          className="mt-6 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6"
          role="list"
        >
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <li
              className="flex h-10 w-full max-w-[160px] items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--paper)] text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted-2,var(--muted))]"
              key={index}
            >
              {placeholder} {index}
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
