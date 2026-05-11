import "server-only";
import type { LucideIcon } from "lucide-react";

/**
 * Reused by reminders/reports/settings stubs while their workflows are
 * still scoped (Slice C). Keeps the surface branded so the navigation
 * doesn't dead-end on a 404 or an unstyled placeholder.
 */
export function ComingSoonCard({
  Icon,
  title,
  body,
  comingSoonTitle
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
  comingSoonTitle: string;
}) {
  return (
    <section className="mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          >
            <Icon size={18} />
          </span>
          <div className="flex flex-col">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--primary)]">
              {comingSoonTitle}
            </p>
            <h1 className="text-[20px] font-semibold text-[var(--ink)]">
              {title}
            </h1>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-[var(--muted)]">
          {body}
        </p>
      </div>
    </section>
  );
}
