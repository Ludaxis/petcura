// Server component. The confirmation card for an owner arriving from a
// WhatsApp deep link. Single primary CTA + a "this isn't me" escape.

import Link from "next/link";
import { PawPrint, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@petcura/ui";

type JoinHeroProps = {
  clinicName: string;
  clinicPhotoUrl?: string | undefined;
  petName?: string | undefined;
  petSpeciesLabel?: string | undefined;
  body: string;
  primaryLabel: string;
  notMeLabel: string;
  termsCopy: string;
  /** Form action that consumes the join token cookie and issues a session. */
  consumeAction: (formData: FormData) => Promise<void>;
  notMeHref: string;
  locale: string;
};

export function JoinHero({
  clinicName,
  clinicPhotoUrl,
  petName,
  petSpeciesLabel,
  body,
  primaryLabel,
  notMeLabel,
  termsCopy,
  consumeAction,
  notMeHref,
  locale
}: JoinHeroProps) {
  void petName;
  void petSpeciesLabel;
  return (
    <section
      aria-labelledby="join-clinic-heading"
      className="pc-auth-mount mx-auto flex w-full max-w-[480px] flex-col items-stretch gap-5 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6"
    >
      <div className="flex items-center gap-4">
        {clinicPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinicPhotoUrl}
            alt={`${clinicName} logo`}
            className="h-16 w-16 rounded-full border border-[var(--line-2)] object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line-2)] bg-[var(--primary-soft)] text-[var(--primary)]"
          >
            <PawPrint size={28} weight="fill" />
          </span>
        )}
        <h1
          id="join-clinic-heading"
          className="text-xl font-semibold text-[var(--ink)]"
          style={{ viewTransitionName: "pc-join-clinic" }}
        >
          {clinicName}
        </h1>
      </div>

      <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>

      <form action={consumeAction}>
        <input type="hidden" name="lang" value={locale} />
        <Button type="submit" className="h-11 w-full">
          {primaryLabel}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
      </form>

      <Link
        href={notMeHref}
        className="text-center text-sm text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      >
        {notMeLabel}
      </Link>

      <p className="text-center text-xs text-[var(--muted-2)]">{termsCopy}</p>
    </section>
  );
}
