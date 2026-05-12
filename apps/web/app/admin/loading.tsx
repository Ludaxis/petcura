import { Shimmer } from "@petcura/ui";

export default function AdminLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-6"
      aria-busy="true"
      aria-label="Loading admin"
    >
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
        <Shimmer className="h-8 w-16 rounded-[var(--radius)]" />
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-3 w-24 rounded" />
          <Shimmer className="h-5 w-40 rounded" />
        </div>
        <Shimmer className="ml-auto h-8 w-44 rounded-[var(--radius)]" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5"
          >
            <Shimmer className="h-5 w-32 rounded" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Shimmer
                  key={j}
                  className="h-10 rounded-[var(--radius)]"
                />
              ))}
            </div>
            <Shimmer className="mt-2 h-10 rounded-[var(--radius)]" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5">
        <Shimmer className="h-5 w-20 rounded" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Shimmer key={i} className="h-28 rounded-[var(--radius)]" />
        ))}
      </div>
    </main>
  );
}
