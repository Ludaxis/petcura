import Link from "next/link";
import { PawPrint, ArrowRight } from "lucide-react";
import { Button } from "@petcura/ui";
import { SectionKicker } from "../_components/SectionKicker";

type OwnersBandProps = {
  kicker: string;
  title: string;
  body: string;
  ctaPrimary: string;
  ctaSecondary: string;
  signInHref: string;
  ownersHref: string;
};

export function OwnersBand({
  kicker,
  title,
  body,
  ctaPrimary,
  ctaSecondary,
  signInHref,
  ownersHref
}: OwnersBandProps) {
  return (
    <section
      aria-labelledby="owners-band-heading"
      className="bg-[var(--paper)] py-16 sm:py-20"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--soft)] p-8 sm:flex-row sm:items-center sm:gap-10 sm:p-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]">
            <PawPrint aria-hidden="true" size={22} />
          </div>
          <div className="flex-1">
            <SectionKicker>{kicker}</SectionKicker>
            <h2
              id="owners-band-heading"
              className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl"
            >
              {title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {body}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href={signInHref}>
                {ctaPrimary}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={ownersHref}>{ctaSecondary}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
