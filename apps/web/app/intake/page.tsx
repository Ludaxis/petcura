import Link from "next/link";
import { ArrowLeft, Camera, MessageSquareText, ShieldCheck } from "lucide-react";
import { Badge, Button, Panel } from "@petcura/ui";
import { requestCategories } from "@petcura/shared";

export default function IntakePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <Button asChild variant="ghost">
          <Link href="/">
            <ArrowLeft aria-hidden="true" size={16} />
            Back
          </Link>
        </Button>
        <Badge tone="teal">Owner web fallback</Badge>
      </header>

      <Panel className="p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
            <MessageSquareText aria-hidden="true" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Create a request</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This is the web fallback for owners who are not using WhatsApp.
              The next backend slice will submit this form to Supabase.
            </p>
          </div>
        </div>

        <form className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="owner-name">
              Your name
            </label>
            <input
              className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
              id="owner-name"
              name="ownerName"
              placeholder="Marta Tamm"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="phone">
              Phone number
            </label>
            <input
              className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
              id="phone"
              name="phone"
              placeholder="+372 ..."
              type="tel"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="pet-name">
              Pet name
            </label>
            <input
              className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
              id="pet-name"
              name="petName"
              placeholder="Luna"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="category">
              Request type
            </label>
            <select
              className="h-11 rounded-[var(--radius)] border border-[var(--line)] bg-white px-3"
              id="category"
              name="category"
              defaultValue="medical_question"
            >
              {requestCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="message">
              What is happening?
            </label>
            <textarea
              className="min-h-36 resize-y rounded-[var(--radius)] border border-[var(--line)] bg-white px-3 py-3"
              id="message"
              name="message"
              placeholder="Tell the clinic what changed, when it started, and what you have already tried."
            />
          </div>

          <div className="rounded-[var(--radius)] border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Camera aria-hidden="true" size={18} />
              Photo/video attachments will be enabled with Supabase Storage.
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-xs leading-5 text-[var(--muted)]">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={15}
              />
              PetCura structures requests for clinic staff. It does not provide
              diagnosis or emergency medical advice.
            </p>
            <Button type="button" aria-disabled="true">
              Submit once Supabase is connected
            </Button>
          </div>
        </form>
      </Panel>
    </main>
  );
}
