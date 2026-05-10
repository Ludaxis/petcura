import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { Badge, Button, Panel, Metric } from "@petcura/ui";
import { demoRequests, pilotMetrics } from "@petcura/shared";
import { getPublicEnvStatus } from "@/lib/env";

const workflow = [
  "Owner sends WhatsApp or web intake",
  "AI suggests category, summary, and risk flags",
  "Staff confirms urgency and replies",
  "Reminder or PMS export closes the loop"
];

export default function HomePage() {
  const envStatus = getPublicEnvStatus();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--primary)] text-white">
            <Stethoscope aria-hidden="true" size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--primary)]">
              PetCura
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-[var(--foreground)]">
              Clinic ClientOps foundation
            </h1>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Primary">
          <Button asChild variant="secondary">
            <Link href="/intake">Owner intake</Link>
          </Button>
          <Button asChild>
            <Link href="/inbox">
              Clinic inbox
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal">WhatsApp-native</Badge>
              <Badge tone="neutral">Staff-approved AI</Badge>
              <Badge tone="neutral">PMS-friendly exports</Badge>
            </div>
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
                One operational layer for owner requests, replies, and follow-ups.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
                This scaffold proves the first PetCura path: owner intake,
                clinic inbox, request detail, Supabase-ready data contracts, and
                AI safety boundaries.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflow.map((step, index) => (
                <div
                  className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-soft)] p-3"
                  key={step}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--primary)]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-[var(--foreground)]">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--muted)]">
                Foundation status
              </p>
              <h2 className="mt-1 text-xl font-semibold">Ready for Sprint 0</h2>
            </div>
            <Badge tone={envStatus.success ? "teal" : "amber"}>
              {envStatus.success ? "Supabase env set" : "Env pending"}
            </Badge>
          </div>
          <div className="mt-5 grid gap-3">
            <Metric
              icon={<Inbox aria-hidden="true" size={18} />}
              label="Demo requests"
              value={String(demoRequests.length)}
            />
            <Metric
              icon={<Clock3 aria-hidden="true" size={18} />}
              label="Pilot response target"
              value={pilotMetrics.responseTimeTarget}
            />
            <Metric
              icon={<Activity aria-hidden="true" size={18} />}
              label="Call reduction target"
              value={pilotMetrics.callReductionTarget}
            />
            <Metric
              icon={<ShieldCheck aria-hidden="true" size={18} />}
              label="Safety target"
              value="0 incidents"
            />
          </div>
          <div className="mt-5 rounded-[var(--radius)] border border-[var(--line)] bg-white p-4">
            <div className="flex gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 text-[var(--primary)]"
                size={18}
              />
              <p className="text-sm leading-6 text-[var(--muted)]">
                Add hosted Supabase values to `.env.local`, run migrations, then
                replace demo data with live requests through the shared
                contracts.
              </p>
            </div>
          </div>
        </Panel>
      </section>
    </main>
  );
}
