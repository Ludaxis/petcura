import { cn } from "@/lib/utils";

/**
 * Compatibility shim. Existing shadcn callers import `Skeleton` from this
 * path; PetCura's design-system shimmer is delivered via the global
 * `.pc-shimmer` utility (see `apps/web/app/globals.css`). Keeping this file
 * means every legacy call site picks up the sage shimmer + reduced-motion
 * fallback without changes. New code should import `Shimmer` / `SkeletonRow`
 * / `SkeletonCard` from `@petcura/ui` directly.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("pc-shimmer rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
