import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { withLocale, type SupportedLocale } from "@petcura/shared";

type RequestRailProps = {
  locale: SupportedLocale;
  clinicName: string;
  staffLabel: string;
  labels: {
    cmdkHint: string;
    backToInbox: string;
    rail: string;
    /** Localized template "Signed in as {staff} at {clinic}". */
    signedIn: string;
  };
};

/**
 * 56px left rail mirroring the inbox shell. Hidden on mobile/tablet so the
 * detail pane has the full width; mobile uses the back-arrow header instead.
 *
 * The theme toggle lives in the command palette and the detail header — the
 * 56px column is too narrow for a 3-radio segmented control.
 */
export function RequestRail({
  locale,
  clinicName,
  staffLabel,
  labels
}: RequestRailProps) {
  return (
    <aside
      className="hidden h-full w-14 shrink-0 flex-col items-center gap-3 border-r border-[var(--line)] bg-[var(--paper)] py-3 lg:flex"
      aria-label={labels.rail}
    >
      <Link
        href={withLocale("/inbox", locale)}
        aria-label={labels.backToInbox}
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--muted)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] focus-visible:bg-[var(--soft)]"
      >
        <ArrowLeft aria-hidden="true" size={16} />
      </Link>
      <div
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
        title={clinicName}
      >
        <Inbox aria-hidden="true" size={14} />
      </div>
      <div className="flex flex-1 flex-col items-center gap-2" />
      <span
        className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-[var(--muted-2)]"
        aria-label={labels.cmdkHint}
      >
        ⌘K
      </span>
      <span className="sr-only">
        {labels.signedIn
          .replace("{staff}", staffLabel)
          .replace("{clinic}", clinicName)}
      </span>
    </aside>
  );
}
