// shadcn/ui projects expect `@/lib/utils#cn` to exist. We already ship `cn`
// from `@petcura/ui`, so re-export it here rather than duplicate the helper.
// This keeps the workspace single-sourced on tailwind-merge / clsx wiring.
export { cn } from "@petcura/ui";
