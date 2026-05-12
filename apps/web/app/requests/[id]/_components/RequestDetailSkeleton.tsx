import { Shimmer } from "@petcura/ui";

/**
 * Pane-scoped skeleton that paints inside the detail Suspense boundary while
 * `getRequestDetail` resolves. Mirrors the geometry of the real detail header
 * (pet identity row + sticky action chips) and the thread/composer column so
 * the swap from skeleton to content avoids visible layout shift. The route's
 * `loading.tsx` still owns the initial-paint skeleton for cold navigations —
 * this fallback only fires on subsequent in-segment navigations (e.g. when
 * the user clicks a sibling row in the left rail).
 *
 * Does NOT carry the `pc-request-{id}` view-transition name. The view
 * transition pairs the inbox row's name with the eventual `RequestDetail`
 * header — having the skeleton claim that name would break the pairing.
 */
export function RequestDetailSkeleton({ label }: { label: string }) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden bg-[var(--paper)]"
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex flex-col gap-2">
            <Shimmer className="h-5 w-40 rounded" />
            <Shimmer className="h-3 w-56 rounded" />
            <Shimmer className="h-3 w-32 rounded" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Shimmer className="h-6 w-16 rounded-full" />
            <Shimmer className="h-6 w-20 rounded-full" />
            <Shimmer className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Shimmer className="h-8 w-28 rounded-[var(--radius)]" />
          <Shimmer className="h-8 w-28 rounded-[var(--radius)]" />
          <Shimmer className="h-8 w-32 rounded-[var(--radius)]" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3 sm:px-6">
          {[72, 56, 96, 64, 80].map((h, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
            >
              <Shimmer
                className="rounded-[var(--radius)]"
                style={{ height: h, width: `${48 + (i % 3) * 14}%` }}
              />
            </div>
          ))}
          <div className="mt-auto flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--surface-soft)] p-3">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-12 w-full rounded" />
            <div className="flex items-center justify-end gap-2">
              <Shimmer className="h-8 w-20 rounded-[var(--radius)]" />
              <Shimmer className="h-8 w-24 rounded-[var(--radius)]" />
            </div>
          </div>
        </div>
        <aside
          aria-hidden="true"
          className="hidden h-full w-[280px] shrink-0 flex-col gap-3 border-l border-[var(--line)] bg-[var(--paper)] p-4 xl:flex"
        >
          <Shimmer className="h-20 rounded-[var(--radius)]" />
          <Shimmer className="h-28 rounded-[var(--radius)]" />
          <Shimmer className="h-24 rounded-[var(--radius)]" />
        </aside>
      </div>
    </section>
  );
}
