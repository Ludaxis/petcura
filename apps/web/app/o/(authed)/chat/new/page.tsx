import Link from "next/link";
import { ArrowLeft, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import {
  getLocalizedRequestCategories
} from "@petcura/shared";
import { Button, cn } from "@petcura/ui";
import { getRequestLocale } from "@/lib/locale";
import { requireOwnerContext } from "@/lib/owner/auth";
import { listOwnerPets } from "@/lib/owner/data";
import { createOwnerTranslator } from "@/lib/owner/i18n";
import { startOwnerRequest } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewOwnerChatPage() {
  const locale = await getRequestLocale();
  const context = await requireOwnerContext(locale, "/o/chat/new");
  const t = createOwnerTranslator(locale);
  const pets = await listOwnerPets(context);
  const categories = getLocalizedRequestCategories(locale);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-10">
      <header>
        <Link
          href="/o/chat"
          className={cn(
            "mb-4 inline-flex items-center gap-1 text-sm text-[var(--muted)]",
            "hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          )}
        >
          <ArrowLeft size={14} weight="bold" aria-hidden />
          {t("tab.chat")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]">
            <ChatCircle size={24} weight="duotone" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
              {t("chat.new.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {t("chat.new.body")}
            </p>
          </div>
        </div>
      </header>

      <form
        action={startOwnerRequest}
        className="grid gap-4 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--paper)] p-5"
      >
        <input name="lang" type="hidden" value={locale} />
        <div className="grid gap-1.5">
          <label
            className="text-sm font-semibold text-[var(--ink)]"
            htmlFor="new-chat-pet"
          >
            {t("chat.new.pet")}
          </label>
          <select
            className="h-12 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
            id="new-chat-pet"
            name="petId"
          >
            <option value="">{t("chat.new.noPet")}</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label
            className="text-sm font-semibold text-[var(--ink)]"
            htmlFor="new-chat-category"
          >
            {t("chat.new.category")}
          </label>
          <select
            className="h-12 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
            defaultValue="medical_question"
            id="new-chat-category"
            name="category"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label
            className="text-sm font-semibold text-[var(--ink)]"
            htmlFor="new-chat-message"
          >
            {t("chat.new.message")}
          </label>
          <textarea
            className="min-h-36 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-sm leading-6 text-[var(--ink)]"
            id="new-chat-message"
            maxLength={4000}
            name="message"
            placeholder={t("chat.composer.placeholder")}
            required
          />
        </div>

        <Button className="justify-center" type="submit">
          {t("chat.new.submit")}
        </Button>
      </form>
    </div>
  );
}
