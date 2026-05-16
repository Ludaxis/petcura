"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Languages,
  MessageCircle,
  Send,
  Sparkles
} from "lucide-react";
import { ScrollStory, type ScrollStoryBeat } from "@petcura/ui";
import { sandboxInbox } from "../_data/landing";
import { SectionKicker } from "../_components/SectionKicker";

type WalkthroughProps = {
  kicker: string;
  title: string;
  body: string;
  beats: {
    one: string;
    two: string;
    three: string;
    four: string;
  };
};

/**
 * Walkthrough — narrative §4. The conversion centerpiece. Engages
 * gsap/ScrollTrigger on viewports >= 768px with motion allowed; falls
 * back to a first-class vertical card stack everywhere else.
 *
 * gsap is dynamic-imported inside <ScrollStory>; nothing in this file
 * pulls it into the initial bundle.
 */
export function Walkthrough({ kicker, title, body, beats }: WalkthroughProps) {
  const beatList: ScrollStoryBeat[] = [
    {
      id: "whatsapp",
      caption: beats.one,
      frame: (
        <WorkflowDemoFrame
          icon={<MessageCircle aria-hidden="true" size={14} />}
          kind="whatsapp"
          step="01"
        />
      )
    },
    {
      id: "ai",
      caption: beats.two,
      frame: (
        <WorkflowDemoFrame
          icon={<ClipboardList aria-hidden="true" size={14} />}
          kind="structured"
          step="02"
        />
      )
    },
    {
      id: "approve",
      caption: beats.three,
      frame: (
        <WorkflowDemoFrame
          icon={<Sparkles aria-hidden="true" size={14} />}
          kind="review"
          step="03"
        />
      )
    },
    {
      id: "export",
      caption: beats.four,
      frame: (
        <WorkflowDemoFrame
          icon={<FileText aria-hidden="true" size={14} />}
          kind="export"
          step="04"
        />
      )
    }
  ];

  return (
    <section
      aria-labelledby="how-heading"
      className="border-b border-[var(--line)] bg-[var(--surface-soft)]"
      id="how-it-works"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionKicker>{kicker}</SectionKicker>
          <h2
            className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl"
            id="how-heading"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted)]">
            {body}
          </p>
        </div>
        <div className="mt-10">
          <ScrollStory beats={beatList} title={title} />
        </div>
      </div>
    </section>
  );
}

type WorkflowFrameKind = "whatsapp" | "structured" | "review" | "export";

const frameCopy: Record<WorkflowFrameKind, { title: string }> = {
  whatsapp: { title: "WhatsApp message arrives" },
  structured: { title: "Request becomes structured" },
  review: { title: "Draft reply waits for approval" },
  export: { title: "Audit trail is ready to export" }
};

function WorkflowDemoFrame({
  icon,
  kind,
  step
}: {
  icon: React.ReactNode;
  kind: WorkflowFrameKind;
  step: string;
}) {
  const { title } = frameCopy[kind];

  return (
    <article className="flex h-full min-h-[480px] flex-col rounded-[22px] border border-[var(--line)] bg-[var(--paper)] shadow-[0_28px_80px_-48px_rgba(28,40,28,0.45)] lg:min-h-[560px]">
      <header className="border-b border-[var(--line)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#E9A192]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#EAC179]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--primary-strong)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {icon}
            Step {step}
          </span>
          <p className="ml-3 hidden min-w-0 flex-1 truncate text-sm font-semibold text-[var(--foreground)] lg:block lg:text-base">
            {title}
          </p>
          <span
            className="ml-auto shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)] lg:ml-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Live workflow
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)] lg:hidden">
          {title}
        </p>
      </header>

      <div className="flex flex-1 flex-col bg-[var(--background)] p-4 sm:p-5 lg:p-6">
        {kind === "whatsapp" ? <WhatsAppIntakeFrame /> : null}
        {kind === "structured" ? <StructuredRequestFrame /> : null}
        {kind === "review" ? <HumanReviewFrame /> : null}
        {kind === "export" ? <ExportAuditFrame /> : null}
      </div>
    </article>
  );
}

function WhatsAppIntakeFrame() {
  return (
    <div className="grid h-full items-start gap-4 md:grid-cols-2">
      <div className="flex items-center justify-center rounded-[20px] border border-[var(--line)] bg-[#ECF6EF] p-4">
        <div className="flex w-full max-w-[280px] flex-col rounded-[24px] border border-[#153D2F]/20 bg-[#F7FBF8] p-3 shadow-[0_22px_48px_-32px_rgba(23,60,46,0.45)]">
          <div className="mb-3 flex items-center gap-2 border-b border-[#D7E6DC] pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#128C7E] text-white">
              <MessageCircle aria-hidden="true" size={15} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#173C2E]">
                {sandboxInbox.ownerMessage.from}
              </p>
              <p className="text-[11px] text-[#587262]">
                {sandboxInbox.ownerMessage.channel}
              </p>
            </div>
          </div>
          <div className="rounded-[14px] rounded-bl-sm bg-[#F7FBF8] p-3 text-sm leading-6 text-[#173C2E] shadow-sm">
            {sandboxInbox.ownerMessage.body}
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#6A7F70]">
              <span>{sandboxInbox.ownerMessage.time}</span>
              <span>{sandboxInbox.ownerMessage.language}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <WorkflowPanel title="Captured intake">
          <DemoFact label="Owner" value="Marta" />
          <DemoFact label="Pet" value="Luna · Cat" />
          <DemoFact label="Language" value="EN → ET available" />
        </WorkflowPanel>
        <WorkflowPanel title="Clarifying questions">
          <ul className="space-y-2 text-sm leading-6 text-[var(--foreground)]">
            {[
              "How long has Luna not eaten?",
              "Any vomiting, lethargy, or breathing trouble?",
              "Can you send a photo or short video?"
            ].map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--primary)]"
                  size={14}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </WorkflowPanel>
      </div>
    </div>
  );
}

function StructuredRequestFrame() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_18px_48px_-42px_rgba(28,40,28,0.45)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Clinic inbox
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {sandboxInbox.request.pet}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#FBE5DE] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A3A2D]">
            {sandboxInbox.request.suggestedRisk}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <DemoMetric label="Category" value={sandboxInbox.request.category} />
          <DemoMetric label="Status" value={sandboxInbox.request.status} />
          <DemoMetric label="Language" value={sandboxInbox.request.language} />
        </div>
      </div>

      <div className="grid flex-1 items-start gap-4 md:grid-cols-2">
        <WorkflowPanel title="AI summary">
          <p className="text-sm leading-6 text-[var(--foreground)]">
            Luna has not eaten for 24h and is hiding. Staff should review
            promptly and decide the next step.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["No appetite 24h", "Hiding", "Staff review"].map((label) => (
              <span
                className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--primary-strong)]"
                key={label}
              >
                {label}
              </span>
            ))}
          </div>
        </WorkflowPanel>
        <WorkflowPanel title="Routing">
          <div className="space-y-1">
            {([
              ["Assigned", "Front desk"],
              ["SLA", "Today"],
              ["Next", "Vet review"]
            ] as const).map(([label, value]) => (
              <DemoFact key={label} label={label} value={value} />
            ))}
          </div>
        </WorkflowPanel>
      </div>
    </div>
  );
}

function HumanReviewFrame() {
  return (
    <div className="grid h-full items-start gap-4 lg:grid-cols-[1.1fr_1fr]">
      <WorkflowPanel title={sandboxInbox.aiDraft.label}>
        <p className="text-sm leading-6 text-[var(--foreground)]">
          Thanks for the details. A team member will review Luna&rsquo;s
          symptoms now. If Luna is struggling to breathe, collapses, or seems
          severely weak, please call the clinic emergency number immediately.
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-[12px] bg-[#FFF2DF] p-3 text-sm leading-6 text-[#7A4B16]">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0"
            size={15}
          />
          <span>{sandboxInbox.aiDraft.boundary}</span>
        </div>
      </WorkflowPanel>

      <div className="flex flex-col gap-4">
        <WorkflowPanel title="Staff action">
          <div className="space-y-1">
            <DemoFact
              label="Reviewer"
              value={sandboxInbox.staffAction.reviewer}
            />
            <DemoFact
              label="Decision"
              value={sandboxInbox.staffAction.decision}
            />
          </div>
        </WorkflowPanel>
        <WorkflowPanel title="Reply sent">
          <p className="rounded-[14px] bg-[var(--primary)] p-4 text-sm leading-6 text-[var(--paper)]">
            We can see Luna today at 14:00. Please bring her in a covered
            carrier.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary-strong)]">
            <Send aria-hidden="true" size={14} />
            WhatsApp delivery tracked
          </div>
        </WorkflowPanel>
      </div>
    </div>
  );
}

function ExportAuditFrame() {
  return (
    <div className="grid h-full items-start gap-4 md:grid-cols-2">
      <WorkflowPanel title={sandboxInbox.export.destination}>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {sandboxInbox.export.auditId}
        </p>
        <ul className="mt-3 space-y-2.5">
          {sandboxInbox.export.fields.map((field) => (
            <li
              className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]"
              key={field}
            >
              <CheckCircle2
                aria-hidden="true"
                className="shrink-0 text-[var(--primary)]"
                size={15}
              />
              {field}
            </li>
          ))}
        </ul>
      </WorkflowPanel>

      <div className="flex flex-col gap-4">
        <WorkflowPanel title="Timeline">
          <ol className="space-y-2.5">
            {[
              ["09:12", "Owner message received"],
              ["09:13", "AI summary stored"],
              ["09:18", "Staff reply approved"],
              ["09:19", "WhatsApp delivered"],
              ["09:20", "PMS export generated"]
            ].map(([time, event]) => (
              <li
                className="grid grid-cols-[48px_1fr] items-baseline gap-3 text-sm"
                key={event}
              >
                <span
                  className="text-[12px] font-semibold text-[var(--muted)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {time}
                </span>
                <span className="text-[var(--foreground)]">{event}</span>
              </li>
            ))}
          </ol>
        </WorkflowPanel>
        <div className="flex flex-wrap gap-3">
          <MiniStatus
            icon={<Languages aria-hidden="true" size={14} />}
            label="Translation cache"
            value="EN · ET ready"
          />
          <MiniStatus
            icon={<FileText aria-hidden="true" size={14} />}
            label="Export"
            value="PDF + CSV"
          />
        </div>
      </div>
    </div>
  );
}

function WorkflowPanel({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_18px_48px_-42px_rgba(28,40,28,0.45)] sm:p-5">
      <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function DemoFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-2 last:border-b-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function DemoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}

function MiniStatus({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[160px] flex-1 items-center gap-3 rounded-[14px] border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary-strong)]"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[var(--foreground)]">
          {value}
        </p>
      </div>
    </div>
  );
}
