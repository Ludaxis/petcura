import { SkeletonList } from "@petcura/ui";

/**
 * Left-rail skeleton fired by the list Suspense boundary while
 * `loadInboxRows` resolves. Wraps the shared `SkeletonList` primitive in the
 * same 320px column chrome `RequestList` uses (hidden below `lg`) so the
 * swap to the real rail doesn't shift the detail pane to the left.
 */
export function RequestListSkeleton({
  ariaLabel,
  rows = 10
}: {
  ariaLabel: string;
  rows?: number;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="hidden min-h-0 w-[320px] shrink-0 flex-col self-stretch overflow-hidden border-r border-[var(--line)] bg-[var(--paper)] lg:flex"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <SkeletonList rows={rows} density="comfortable" label={ariaLabel} />
      </div>
    </nav>
  );
}
