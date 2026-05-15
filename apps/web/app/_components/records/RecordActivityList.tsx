import type { SupportedLocale } from "@petcura/shared";

export type RecordActivityItem = {
  id: string;
  action: string;
  createdAt: string;
};

export function RecordActivityList({
  title,
  rows,
  locale,
  emptyLabel
}: {
  title: string;
  rows: RecordActivityItem[];
  locale: SupportedLocale;
  emptyLabel: string;
}) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm">
      <h2 className="text-[14px] font-semibold text-[var(--ink)]">{title}</h2>
      <ol className="mt-3 grid gap-2">
        {rows.map((event) => (
          <li
            className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
            key={event.id}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.05em] text-[var(--ink)]">
              {event.action}
            </p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              {dateFormatter.format(new Date(event.createdAt))}
            </p>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-[13px] text-[var(--muted)]">{emptyLabel}</li>
        ) : null}
      </ol>
    </section>
  );
}
