import Link from "next/link";
import { Clock } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@petcura/ui";
import type { SupportedLocale } from "@petcura/shared";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { formatPrice } from "@/lib/owner/format";
import type { Service } from "@/lib/owner/types";

type Props = {
  service: Service;
  locale: SupportedLocale;
};

export function ServiceCard({ service, locale }: Props) {
  const t = createOwnerTranslator(locale);
  const price = formatPrice(service.priceCents, service.currency, locale);

  return (
    <Link
      href={`/o/services/${service.slug}/request`}
      className={cn(
        "flex h-full flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-4",
        "transition-colors hover:border-[var(--line-2)] hover:bg-[var(--soft)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight text-[var(--ink)]">
          {service.name}
        </h3>
        <span className="shrink-0 text-sm font-semibold text-[var(--primary-strong)]">
          {price ?? t("services.price.onRequest")}
        </span>
      </div>
      <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">{service.description}</p>
      <p className="mt-auto inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <Clock size={12} weight="regular" aria-hidden />
        {t("services.duration", { n: service.durationMinutes })}
      </p>
    </Link>
  );
}
