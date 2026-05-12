import { Shimmer, SkeletonText } from "@petcura/ui";

/**
 * Owner-facing intake skeleton. Airier than clinic loaders — pet owners
 * shouldn't see a dense list of placeholders. One big card, a few lines,
 * and a sage CTA pill so the page feels reassuring while it boots.
 */
export default function IntakeLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading intake form"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <Shimmer className="h-8 w-24 rounded-[var(--radius)]" />
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-20 rounded-[var(--radius)]" />
          <Shimmer className="h-7 w-20 rounded-full" />
        </div>
      </header>

      <section className="flex flex-col gap-5 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <Shimmer className="h-10 w-10 rounded-[var(--radius)]" />
          <div className="flex flex-1 flex-col gap-2">
            <Shimmer className="h-6 w-2/3 rounded" />
            <SkeletonText
              lines={2}
              widths={["w-full", "w-10/12"]}
              gap="tight"
            />
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-5 rounded" />
            <Shimmer className="h-3 w-56 rounded" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Shimmer className="h-3 w-32 rounded" />
          <Shimmer className="h-10 w-full rounded-[var(--radius)]" />
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-10 w-full rounded-[var(--radius)]" />
          <Shimmer className="h-3 w-28 rounded" />
          <Shimmer className="h-24 w-full rounded-[var(--radius)]" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Shimmer className="h-10 w-24 rounded-[var(--radius)]" />
          <Shimmer className="h-10 w-32 rounded-[var(--radius)]" />
        </div>
      </section>
    </main>
  );
}
