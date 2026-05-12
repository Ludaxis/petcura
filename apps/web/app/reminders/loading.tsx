import { Shimmer, SkeletonList } from "@petcura/ui";

export default function RemindersLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
    >
      <header className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-full" />
          <div className="flex flex-col gap-2">
            <Shimmer className="h-5 w-40 rounded" />
            <Shimmer className="h-3 w-56 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shimmer className="h-8 w-20 rounded-full" />
          <Shimmer className="h-8 w-20 rounded-full" />
          <Shimmer className="h-8 w-24 rounded-full" />
          <Shimmer className="h-8 w-24 rounded-full" />
        </div>
      </header>

      <section className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]">
        <SkeletonList
          rows={8}
          label="Loading reminders"
          density="comfortable"
        />
      </section>
    </main>
  );
}
