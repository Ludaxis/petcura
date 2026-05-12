import { Shimmer, SkeletonText } from "@petcura/ui";

/**
 * Skeleton for /profile. Mirrors the page's two-region layout (sticky header
 * over the soft-surface body holding the profile editor card) so the
 * transition into the live page doesn't shift the layout. Renders before
 * AppShell hydrates — pure server-stable HTML, no client JS.
 */
export default function ProfileLoading() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-screen w-full flex-col bg-[var(--soft)]"
    >
      <header className="border-b border-[var(--line)] bg-[var(--paper)] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <Shimmer className="h-8 w-8 rounded-[var(--radius)]" />
              <Shimmer className="h-6 w-32 rounded" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="h-3 w-72 rounded" />
          </div>
          <Shimmer className="h-9 w-44 rounded-[var(--radius)]" />
        </div>
      </header>

      <div className="flex-1 px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto max-w-4xl">
          <section className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <Shimmer className="h-14 w-14 rounded-[var(--radius)]" />
                <div className="flex min-w-0 flex-col gap-2">
                  <Shimmer className="h-4 w-44 rounded" />
                  <SkeletonText lines={2} gap="tight" />
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Shimmer className="h-3 w-24 rounded" />
                  <Shimmer className="h-10 w-full rounded-[var(--radius)]" />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Shimmer className="h-9 w-28 rounded-[var(--radius)]" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
