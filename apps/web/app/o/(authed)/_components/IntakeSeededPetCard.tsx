// Server component. Lightweight banner-wrapper above PetCard for first-run
// owners arriving from intake. Visually identifies the pet as "seeded".

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

type IntakeSeededPetCardProps = {
  banner: string;
  ctaLabel: string;
  petId: string;
  children: ReactNode;
};

export function IntakeSeededPetCard({
  banner,
  ctaLabel,
  petId,
  children
}: IntakeSeededPetCardProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)]">
      <aside
        className="flex flex-col gap-2 border-l-[3px] border-[var(--primary)] bg-[var(--primary-soft)] px-4 py-3 text-sm leading-6 sm:flex-row sm:items-center sm:justify-between"
        role="note"
      >
        <p className="text-[var(--ink)]">{banner}</p>
        <Link
          href={`/o/pets/${petId}?from=welcome`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary-strong)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          {ctaLabel}
          <ArrowRight size={14} weight="bold" aria-hidden />
        </Link>
      </aside>
      <div>{children}</div>
    </div>
  );
}
