import { Inbox } from "lucide-react";

export function InboxSkeleton({ label }: { label?: string } = {}) {
  return (
    <ul
      aria-busy="true"
      aria-label={label ?? "Loading inbox"}
      className="flex flex-col"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <li
          key={i}
          className="grid grid-cols-[14px_minmax(110px,max-content)_minmax(0,1fr)_auto_56px_18px] items-center gap-3 border-b border-[var(--line)] px-4 py-4"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--soft)]" />
          <span className="h-3 w-24 rounded bg-[var(--soft)]" />
          <span className="h-3 w-full max-w-[280px] rounded bg-[var(--soft)]" />
          <span className="h-4 w-16 rounded-full bg-[var(--soft)]" />
          <span className="h-3 w-12 rounded bg-[var(--soft)]" />
          <span />
        </li>
      ))}
    </ul>
  );
}

export function InboxEmptyState({
  message,
  body
}: {
  message: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]"
      >
        <Inbox size={22} />
      </span>
      <p className="text-[15px] font-medium text-[var(--ink)]">{message}</p>
      <p className="max-w-xs text-[12.5px] leading-[1.5] text-[var(--muted)]">
        {body}
      </p>
    </div>
  );
}
