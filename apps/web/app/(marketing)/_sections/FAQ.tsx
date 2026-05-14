import { SectionKicker } from "../_components/SectionKicker";

type FAQProps = {
  kicker: string;
  title: string;
  items: ReadonlyArray<{ id: string; question: string; answer: string }>;
};

/**
 * FAQ — narrative §11. Native <details>/<summary> for keyboard
 * accessibility by default. Reduced-motion users get the same
 * native behavior — no custom JS disclosure.
 */
export function FAQ({ kicker, title, items }: FAQProps) {
  return (
    <section
      aria-labelledby="faq-heading"
      className="border-b border-[var(--line)]"
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="faq-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
        </div>
        <div className="mt-10 flex flex-col gap-2">
          {items.map((item) => (
            <details
              className="group rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-5 transition open:bg-[var(--surface-soft)]"
              key={item.id}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--foreground)]">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
