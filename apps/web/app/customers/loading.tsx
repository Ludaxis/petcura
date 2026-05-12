import { Shimmer } from "@petcura/ui";

export default function CustomersLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading customers"
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-8 rounded-[var(--radius)]" />
          <Shimmer className="h-6 w-40 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-64 rounded-[var(--radius)]" />
          <Shimmer className="h-8 w-28 rounded-[var(--radius)]" />
        </div>
      </header>

      <ul
        aria-hidden="true"
        className="flex flex-col rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] items-center gap-3 border-b border-[var(--line)] px-4 py-3.5 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Shimmer className="h-8 w-8 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Shimmer className="h-3 w-32 rounded" />
                <Shimmer className="h-2.5 w-24 rounded" />
              </div>
            </div>
            <Shimmer className="h-3 w-40 rounded" />
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-3 w-16 rounded" />
            <Shimmer className="h-7 w-7 rounded-[var(--radius)]" />
          </li>
        ))}
      </ul>
    </main>
  );
}
