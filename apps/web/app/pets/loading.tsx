import { Shimmer } from "@petcura/ui";

export default function PetsLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading pets"
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-8 rounded-[var(--radius)]" />
          <Shimmer className="h-6 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-64 rounded-[var(--radius)]" />
          <Shimmer className="h-8 w-24 rounded-[var(--radius)]" />
        </div>
      </header>

      <ul
        aria-hidden="true"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <li
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
          >
            <div className="flex items-center gap-3">
              <Shimmer className="h-10 w-10 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Shimmer className="h-4 w-28 rounded" />
                <Shimmer className="h-3 w-36 rounded" />
              </div>
              <Shimmer className="h-6 w-16 rounded-full" />
            </div>
            <Shimmer className="h-3 w-full rounded" />
            <Shimmer className="h-3 w-3/4 rounded" />
          </li>
        ))}
      </ul>
    </main>
  );
}
