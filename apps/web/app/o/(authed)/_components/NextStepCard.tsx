// Server component. Single-action card driving the owner's most valuable next move.

import Link from "next/link";
import { ArrowRight, Plus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";

export type NextStepKind =
  | { kind: "active_request"; requestId: string; relativeTime: string; clinicName: string }
  | { kind: "no_pets" }
  | { kind: "send_first_message"; clinicName: string };

type NextStepCardProps = {
  next: NextStepKind;
  eyebrow: string;
  /** Localized copy table keyed by kind. */
  copy: {
    activeTitle: string;
    activeSubtitle: string;
    activeCta: string;
    noPetsTitle: string;
    noPetsSubtitle: string;
    noPetsCta: string;
    sendFirstTitle: string;
    sendFirstSubtitle: string;
    sendFirstCta: string;
  };
};

export function NextStepCard({ next, eyebrow, copy }: NextStepCardProps) {
  let title: string;
  let subtitle: string;
  let ctaLabel: string;
  let href: string;
  let icon = <ArrowRight size={16} weight="bold" aria-hidden />;

  switch (next.kind) {
    case "active_request":
      title = copy.activeTitle;
      subtitle = copy.activeSubtitle;
      ctaLabel = copy.activeCta;
      href = `/o/chat/${next.requestId}`;
      break;
    case "no_pets":
      title = copy.noPetsTitle;
      subtitle = copy.noPetsSubtitle;
      ctaLabel = copy.noPetsCta;
      href = "/o/me";
      icon = <Plus size={16} weight="bold" aria-hidden />;
      break;
    case "send_first_message":
      title = copy.sendFirstTitle;
      subtitle = copy.sendFirstSubtitle;
      ctaLabel = copy.sendFirstCta;
      href = "/o/chat";
      break;
  }

  return (
    <article
      aria-labelledby="next-step-heading"
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2
        id="next-step-heading"
        className="text-lg font-semibold text-[var(--ink)]"
      >
        {title}
      </h2>
      <p className="text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
      <Link
        href={href}
        className={cn(
          "mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--paper)] transition",
          "hover:bg-[var(--primary-strong)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        )}
      >
        {ctaLabel}
        {icon}
      </Link>
    </article>
  );
}
