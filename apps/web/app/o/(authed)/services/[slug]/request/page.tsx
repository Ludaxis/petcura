import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Button, cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import {
  getEligiblePetsForService,
  getOwnerService,
  listOwnerPets
} from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { formatPrice } from "@/lib/owner/format";
import { requestOwnerAppointment } from "../../../actions";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceRequestPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, `/o/services/${slug}/request`);
  const t = createOwnerTranslator(locale);
  const [service, pets] = await Promise.all([
    getOwnerService(context, slug, locale),
    listOwnerPets(context)
  ]);
  if (!service) notFound();

  const eligiblePets = getEligiblePetsForService(service, pets);
  if (eligiblePets.length === 0) notFound();
  const price = formatPrice(service.priceCents, service.currency, locale);
  const idempotencyKey = randomUUID();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <div>
        <Link
          href="/o/services"
          className={cn(
            "mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          )}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden />
          {t("services.title")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
          {t("services.request.title", { service: service.name })}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{service.description}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t("services.duration", { n: service.durationMinutes })}
          {price ? ` · ${price}` : ` · ${t("services.price.onRequest")}`}
        </p>
      </div>

      <form
        className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
        action={requestOwnerAppointment}
      >
        <input type="hidden" name="serviceId" value={service.id} />
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-[var(--ink)]">
            {t("services.request.petPicker")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {eligiblePets.map((p, i) => (
              <label
                key={p.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] p-3",
                  "transition-colors hover:border-[var(--line-2)] has-[input:checked]:border-[var(--primary)] has-[input:checked]:bg-[var(--primary-soft)]"
                )}
              >
                <input
                  type="radio"
                  name="petId"
                  value={p.id}
                  defaultChecked={i === 0}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--ink)]">{p.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">{t("services.request.window")}</span>
          <input
            type="datetime-local"
            name="proposedAt"
            required
            className={cn(
              "h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]",
              "focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            )}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--ink)]">{t("services.request.notes")}</span>
          <textarea
            name="notes"
            rows={4}
            className={cn(
              "rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm leading-6 text-[var(--ink)]",
              "focus-visible:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            )}
          />
        </label>

        <Button type="submit" className="self-end">{t("services.request.submit")}</Button>
      </form>
    </div>
  );
}
