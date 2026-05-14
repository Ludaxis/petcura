// Server component. Renders the calm sage right-hand pane of AuthShell on
// desktop, an 8vh decorative strip on mobile. Three crossfading quotes via
// CSS keyframe — no JS scheduler, no motion libraries.

import { PawPrint } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";

export type BrandPaneQuote = {
  body: string;
  attribution: string;
};

type BrandPaneProps = {
  variant: "clinic" | "owner";
  quotes: readonly BrandPaneQuote[];
};

export function BrandPane({ variant, quotes }: BrandPaneProps) {
  void variant; // variant currently selects the quote set upstream; reserved
  return (
    <aside
      aria-hidden="true"
      className={cn(
        // mobile: thin strip; desktop: full panel
        "relative overflow-hidden bg-[var(--soft)]",
        "h-[8vh] max-h-24 w-full md:h-auto md:min-h-dvh md:max-h-none"
      )}
    >
      {/* sage radial glow background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, var(--primary-soft), transparent 70%)"
        }}
      />

      {/* loop trail motif — single vertical 2px sage line, only on desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/4 hidden h-1/2 w-px -translate-x-1/2 bg-[var(--primary)] opacity-30 md:block"
      />

      {/* mobile: tiny paw glyph only */}
      <div className="flex h-full items-center justify-center md:hidden">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper)] text-[var(--primary)]"
          aria-hidden="true"
        >
          <PawPrint size={18} weight="fill" />
        </span>
      </div>

      {/* desktop: quote card */}
      <div className="relative hidden h-full items-center justify-center px-8 md:flex">
        <div
          className={cn(
            "relative min-h-[180px] w-full max-w-[420px]",
            "rounded-[var(--radius-xl)] border border-[var(--line-2)] bg-[var(--paper)]/80 p-6",
            "shadow-sm backdrop-blur-sm"
          )}
        >
          {quotes.slice(0, 3).map((q, i) => (
            <div
              key={i}
              data-index={i}
              className={cn(
                "pc-brand-quote absolute inset-0 flex flex-col justify-center gap-3 p-6",
                i === 0 && "static"
              )}
            >
              <p className="text-base italic leading-7 text-[var(--ink)]">
                &ldquo;{q.body}&rdquo;
              </p>
              <p className="text-sm text-[var(--muted)]">{q.attribution}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
