import { Inbox, Sparkles, Stethoscope } from "lucide-react";
import { SectionKicker } from "../_components/SectionKicker";

type UseCasesProps = {
  kicker: string;
  title: string;
  cards: ReadonlyArray<{
    id: string;
    title: string;
    body: string;
    outcome: string;
    icon: "front" | "vet" | "owner";
  }>;
};

const ICONS = {
  front: <Inbox aria-hidden="true" size={18} />,
  vet: <Stethoscope aria-hidden="true" size={18} />,
  owner: <Sparkles aria-hidden="true" size={18} />
} as const;

/**
 * UseCases — narrative §5. Three cards. The outcome chip lives below
 * the body and reads on its own ("Phone load down meaningfully in
 * month one." etc.) so each persona can see themselves in one beat.
 */
export function UseCases({ kicker, title, cards }: UseCasesProps) {
  return (
    <section
      aria-labelledby="usecases-heading"
      className="border-b border-[var(--line)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="usecases-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              className="flex flex-col gap-4 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-6"
              key={card.id}
            >
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
              >
                {ICONS[card.icon]}
              </span>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {card.title}
              </h3>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {card.body}
              </p>
              <p className="mt-auto inline-flex items-center self-start rounded-full border border-[var(--primary-soft)] bg-[var(--primary-soft)] px-3 py-1 text-[11.5px] font-semibold text-[var(--primary-strong)]">
                {card.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
