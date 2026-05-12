import { Shimmer } from "@petcura/ui";

type DirectoryListSkeletonProps = {
  rows?: number;
  label?: string;
};

/**
 * Skeleton that mirrors OwnerRow / PetRow geometry: avatar disc + two text
 * lines + secondary column + status pill cluster + chevron. Rendered inside
 * the Suspense boundary that wraps DirectoryListSection so tab and filter
 * switches paint a calm placeholder in ~100ms instead of blocking the whole
 * page response.
 *
 * `pc-shimmer` is the global sage shimmer; it falls back to a static surface
 * for `prefers-reduced-motion`. Row count is intentionally bounded (default
 * 8) so the skeleton stays under a viewport on most laptops and never
 * dominates the page.
 */
export function DirectoryListSkeleton({
  rows = 8,
  label = "Loading directory"
}: DirectoryListSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      role="status"
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] shadow-sm"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[40px_minmax(160px,1.2fr)_minmax(0,1.4fr)_auto_18px] items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0 sm:py-3.5 max-md:grid-cols-[36px_minmax(0,1fr)_auto]"
        >
          {/* Avatar disc */}
          <Shimmer className="h-10 w-10 rounded-full" />

          {/* Primary column: name line + secondary line */}
          <span className="flex min-w-0 flex-col gap-1.5">
            <span className="flex items-center gap-2">
              <Shimmer className="h-3.5 w-32 rounded" />
              <Shimmer className="h-3 w-10 rounded-full" />
            </span>
            <Shimmer className="h-3 w-44 rounded" />
          </span>

          {/* Secondary column: pets summary + latest activity */}
          <span className="hidden min-w-0 flex-col gap-1.5 md:flex">
            <Shimmer className="h-3 w-40 rounded" />
            <Shimmer className="h-2.5 w-24 rounded" />
          </span>

          {/* Status pill cluster */}
          <span className="hidden items-center gap-2 md:inline-flex">
            <Shimmer className="h-4 w-10 rounded-[5px]" />
            <Shimmer className="h-4 w-12 rounded-[5px]" />
          </span>

          {/* Chevron */}
          <Shimmer className="h-3 w-3 rounded justify-self-end" />
        </div>
      ))}
    </div>
  );
}
