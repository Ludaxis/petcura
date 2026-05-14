import { Phone } from "lucide-react";
import { SectionKicker } from "../_components/SectionKicker";

type ProblemProps = {
  kicker: string;
  title: string;
  body: string;
  items: readonly string[];
  sceneCaption: string;
};

/**
 * Problem — narrative §3. Four bullets, abstract sage rings as the
 * visual cue. Reduced motion = all bullets render simultaneously,
 * rings render at final position. Caption carries the visual point
 * via copy.
 */
export function Problem({
  kicker,
  title,
  body,
  items,
  sceneCaption
}: ProblemProps) {
  return (
    <section
      aria-labelledby="problem-heading"
      className="border-b border-[var(--line)]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="problem-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
          <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
          <p className="sr-only" id="problem-scene-caption">
            {sceneCaption}
          </p>
          <div
            aria-describedby="problem-scene-caption"
            aria-hidden="true"
            className="relative mt-2 hidden h-32 w-32 lg:block"
          >
            {/* Three concentric sage rings — static SVG; no animation
                imported so reduced-motion is automatic. */}
            <svg
              className="absolute inset-0"
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="20"
                stroke="var(--primary)"
                strokeOpacity="0.9"
                strokeWidth="1.5"
              />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="36"
                stroke="var(--primary)"
                strokeOpacity="0.55"
                strokeWidth="1.5"
              />
              <circle
                cx="60"
                cy="60"
                fill="none"
                r="54"
                stroke="var(--primary)"
                strokeOpacity="0.25"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
        <ul
          className="grid gap-3 sm:grid-cols-2"
          role="list"
        >
          {items.map((item, index) => (
            <li
              className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
              key={`${index}-${item}`}
            >
              <span
                aria-hidden="true"
                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--red-soft)] text-[var(--red)]"
              >
                <Phone size={13} />
              </span>
              <p className="text-sm leading-6 text-[var(--foreground)]">
                {item}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
