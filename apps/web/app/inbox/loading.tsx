import { Shimmer } from "@petcura/ui";
import { InboxSkeleton } from "./_components/InboxStates";

export default function InboxLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading inbox"
      className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8"
    >
      <div className="flex items-center gap-2">
        <Shimmer className="h-9 w-9 rounded-[var(--radius)]" />
        <Shimmer className="h-9 flex-1 max-w-md rounded-[var(--radius)]" />
        <Shimmer className="ml-auto h-9 w-20 rounded-[var(--radius)]" />
        <Shimmer className="h-9 w-9 rounded-[var(--radius)]" />
      </div>
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]">
        <InboxSkeleton />
      </div>
    </main>
  );
}
