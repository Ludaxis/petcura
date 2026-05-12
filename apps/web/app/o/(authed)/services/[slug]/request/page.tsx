import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Button, cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { getService, mockPets } from "@/lib/owner/mock";
import { formatPrice } from "@/lib/owner/format";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceRequestPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const t = createOwnerTranslator(locale);
  const service = getService(slug);
  if (!service) notFound();

  const eligiblePets =
    service.requiresPetSpecies.length === 0
      ? mockPets
      : mockPets.filter((p) => (service.requiresPetSpecies as string[]).includes(p.species));
  const price = formatPrice(service.priceCents, service.currency, locale);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <div>
        <Link
          href="/o/services"
          className={cn(
            "mb-3 inline-flex items-center gap-1 text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
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
        action={async () => {
          "use server";
          // TODO: call public.request_appointment(...) per appointments.md
        }}
      >
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
            className={cn(
              "h-11 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]",
              "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
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
              "focus-visible:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            )}
          />
        </label>

        <Button type="submit" className="self-end">{t("services.request.submit")}</Button>
      </form>
    </div>
  );
}
