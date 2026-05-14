import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SectionKicker } from "../_components/SectionKicker";

type ComplianceProps = {
  kicker: string;
  title: string;
  body: string;
  strip: string;
  training: string;
  trustCenterLink: string;
  badges: ReadonlyArray<{ id: string; label: string }>;
};

/**
 * Compliance — narrative §8. Promotes residency + audit trail to a
 * first-class signal. The training line ("We don't train your data on
 * our models.") deliberately also appears in §7 (AISafety) — same
 * canonical string in two placements. Removing one is a regression
 * per acceptance §16.5.
 */
export function Compliance({
  kicker,
  title,
  body,
  strip,
  training,
  trustCenterLink,
  badges
}: ComplianceProps) {
  return (
    <section
      aria-labelledby="security-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
      id="security"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="security-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
          <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
          <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[var(--foreground)]">
            {strip}
          </p>
          <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
            <strong className="font-semibold text-[var(--foreground)]">
              {training}
            </strong>
          </p>
          <p>
            <Link
              className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary-strong)] underline-offset-4 hover:underline focus-visible:underline"
              href="/trust"
            >
              {trustCenterLink}
            </Link>
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {badges.map((badge) => (
            <li
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
              key={badge.id}
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              >
                <ShieldCheck size={16} />
              </span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {badge.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
