import { InboxSkeleton } from "./_components/InboxStates";

export default function InboxLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-6 sm:py-5 lg:px-8">
      <div className="h-12 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--soft)]" />
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)]">
        <InboxSkeleton />
      </div>
    </main>
  );
}
