import {
  Calendar,
  FileText,
  Globe,
  Languages,
  MessageCircle,
  Phone
} from "lucide-react";
import { SectionKicker } from "../_components/SectionKicker";

type IntegrationsProps = {
  kicker: string;
  title: string;
  body: string;
  labels: {
    whatsapp: string;
    pms: string;
    calendar: string;
    web: string;
    sms: string;
    translate: string;
  };
};

/**
 * Integrations — narrative §6. Reassures buyers that PetCura is
 * additive: WhatsApp Business, PMS, calendar. No orbit/lines
 * animations — those signal "AI-startup" theatre, not "vet ops".
 */
export function Integrations({
  kicker,
  title,
  body,
  labels
}: IntegrationsProps) {
  const chips = [
    { icon: <MessageCircle aria-hidden="true" size={16} />, label: labels.whatsapp },
    { icon: <FileText aria-hidden="true" size={16} />, label: labels.pms },
    { icon: <Calendar aria-hidden="true" size={16} />, label: labels.calendar },
    { icon: <Globe aria-hidden="true" size={16} />, label: labels.web },
    { icon: <Phone aria-hidden="true" size={16} />, label: labels.sms },
    { icon: <Languages aria-hidden="true" size={16} />, label: labels.translate }
  ];

  return (
    <section
      aria-labelledby="integrations-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
        <div className="flex flex-col gap-4">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="integrations-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
          <p className="max-w-lg text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {chips.map((chip) => (
            <li
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-4"
              key={chip.label}
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--surface-soft)] text-[var(--primary)]"
              >
                {chip.icon}
              </span>
              <span className="text-sm font-medium text-[var(--foreground)]">
                {chip.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
