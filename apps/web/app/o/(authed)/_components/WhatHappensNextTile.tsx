// Server component. Calm, low-prominence reassurance tile for first-run owners.

type WhatHappensNextTileProps = {
  heading: string;
  steps: [string, string, string];
};

export function WhatHappensNextTile({
  heading,
  steps
}: WhatHappensNextTileProps) {
  return (
    <section
      aria-labelledby="journey-heading"
      className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--soft)] p-4 sm:p-5"
    >
      <h2
        id="journey-heading"
        className="text-sm font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
      >
        {heading}
      </h2>
      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((row, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm leading-6 text-[var(--ink)]"
            style={{ ["--pc-stagger-index" as string]: i }}
          >
            <span
              aria-hidden="true"
              className="pc-auth-stagger mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[10px] font-semibold text-[var(--primary-strong)]"
            >
              {i + 1}
            </span>
            <span className="pc-auth-stagger">{row}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
