// Server component. Calm welcome header for the clinic onboarding route.
// Left pane on desktop; collapses into a 56px heading band on mobile.

import { ShieldCheck, Sparkle, FileText } from "@phosphor-icons/react/dist/ssr";

type ClinicWelcomeHeaderProps = {
  heading: string;
  body: string;
  trustEu: string;
  trustAi: string;
  trustAudit: string;
  helpLine: string;
};

export function ClinicWelcomeHeader({
  heading,
  body,
  trustEu,
  trustAi,
  trustAudit,
  helpLine
}: ClinicWelcomeHeaderProps) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[var(--ink)] sm:text-3xl">
          {heading}
        </h1>
        <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
      </div>
      <ul className="hidden flex-col gap-3 border-y border-[var(--line)] py-4 text-sm text-[var(--ink)] md:flex">
        <li className="flex items-center gap-3">
          <ShieldCheck
            size={18}
            weight="duotone"
            aria-hidden
            className="text-[var(--primary)]"
          />
          <span>{trustEu}</span>
        </li>
        <li className="flex items-center gap-3">
          <Sparkle
            size={18}
            weight="duotone"
            aria-hidden
            className="text-[var(--primary)]"
          />
          <span>{trustAi}</span>
        </li>
        <li className="flex items-center gap-3">
          <FileText
            size={18}
            weight="duotone"
            aria-hidden
            className="text-[var(--primary)]"
          />
          <span>{trustAudit}</span>
        </li>
      </ul>
      <p className="hidden text-sm leading-6 text-[var(--muted)] md:block">
        {helpLine}
      </p>
    </section>
  );
}
