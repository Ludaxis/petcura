import { Shimmer, SkeletonCard, SkeletonText } from "@petcura/ui";

export default function SettingsLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-3 py-4 sm:px-6 sm:py-5 lg:px-8"
    >
      <header className="flex flex-col gap-2 border-b border-[var(--line)] pb-4">
        <Shimmer className="h-6 w-32 rounded" />
        <Shimmer className="h-3 w-72 rounded" />
      </header>

      {/* Account card */}
      <section className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Shimmer className="h-4 w-40 rounded" />
            <Shimmer className="h-3 w-64 rounded" />
          </div>
        </div>
        <SkeletonText lines={2} gap="tight" />
      </section>

      {/* Team card with table rows */}
      <section className="flex flex-col gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-32 rounded" />
          <Shimmer className="h-8 w-28 rounded-[var(--radius)]" />
        </div>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_auto] items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Shimmer className="h-8 w-8 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Shimmer className="h-3 w-32 rounded" />
                  <Shimmer className="h-2.5 w-40 rounded" />
                </div>
              </div>
              <Shimmer className="h-3 w-16 rounded" />
              <Shimmer className="h-6 w-20 rounded-full" />
              <Shimmer className="h-7 w-7 rounded-[var(--radius)]" />
            </li>
          ))}
        </ul>
      </section>

      {/* Permissions/notifications card */}
      <SkeletonCard lines={4} footer />
    </main>
  );
}
