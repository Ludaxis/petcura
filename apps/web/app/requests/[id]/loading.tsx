import { Shimmer, SkeletonList } from "@petcura/ui";

export default function RequestLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading request"
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
    >
      <div className="flex items-center gap-3">
        <Shimmer className="h-8 w-20 rounded-[var(--radius)]" />
        <Shimmer className="ml-auto h-8 w-40 rounded-[var(--radius)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside
          aria-label="Loading conversation list"
          className="hidden flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] lg:flex"
        >
          <SkeletonList rows={8} density="comfortable" label="Loading list" />
        </aside>
        <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex items-center gap-3 pb-3">
            <Shimmer className="h-10 w-10 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Shimmer className="h-5 w-1/2 rounded" />
              <Shimmer className="h-3 w-1/3 rounded" />
            </div>
            <Shimmer className="h-7 w-20 rounded-full" />
            <Shimmer className="h-7 w-20 rounded-full" />
          </div>
          <div className="mt-1 flex flex-col gap-3">
            {[80, 64, 96, 72].map((h, i) => (
              <div
                key={i}
                className={`flex ${
                  i % 2 === 0 ? "justify-start" : "justify-end"
                }`}
              >
                <Shimmer
                  className="rounded-[var(--radius)]"
                  style={{ height: h, width: `${50 + (i % 3) * 15}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--line-2)] bg-[var(--surface-soft)] p-3">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-12 w-full rounded" />
            <div className="flex items-center justify-end gap-2">
              <Shimmer className="h-8 w-20 rounded-[var(--radius)]" />
              <Shimmer className="h-8 w-24 rounded-[var(--radius)]" />
            </div>
          </div>
        </section>
        <aside
          aria-label="Loading details"
          className="hidden flex-col gap-3 xl:flex"
        >
          <Shimmer className="h-24 rounded-[var(--radius)]" />
          <Shimmer className="h-32 rounded-[var(--radius)]" />
          <Shimmer className="h-24 rounded-[var(--radius)]" />
        </aside>
      </div>
    </main>
  );
}
