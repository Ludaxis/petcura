"use client";

import {
  CheckCircle2,
  FileText,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { ScrollStory, type ScrollStoryBeat } from "@petcura/ui";
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
        <BeatFrame
          accent="surface"
          icon={<MessageCircle aria-hidden="true" size={14} />}
          subtitle={beats.one}
          title="WhatsApp"
        />
      )
    },
    {
      id: "ai",
      caption: beats.two,
      frame: (
        <BeatFrame
          accent="primary"
          icon={<Sparkles aria-hidden="true" size={14} />}
          subtitle={beats.two}
          title="AI draft"
        />
      )
    },
    {
      id: "approve",
      caption: beats.three,
      frame: (
        <BeatFrame
          accent="surface"
          icon={<CheckCircle2 aria-hidden="true" size={14} />}
          subtitle={beats.three}
          title="Staff approves"
        />
      )
    },
    {
      id: "export",
      caption: beats.four,
      frame: (
        <BeatFrame
          accent="muted"
          icon={<FileText aria-hidden="true" size={14} />}
          subtitle={beats.four}
          title="PMS export"
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

function BeatFrame({
  accent,
  icon,
  subtitle,
  title
}: {
  accent: "surface" | "primary" | "muted";
  icon: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  const accentClasses: Record<typeof accent, string> = {
    surface: "border-[var(--line)] bg-[var(--surface-soft)]",
    primary: "border-[var(--primary-soft)] bg-[var(--primary-soft)]",
    muted: "border-dashed border-[var(--line)] bg-[var(--paper)]"
  };
  return (
    <div
      className={`flex h-full min-h-[400px] flex-col justify-between gap-4 rounded-[16px] border p-6 shadow-[0_24px_48px_-32px_rgba(74,107,63,0.25)] ${accentClasses[accent]}`}
    >
      <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--primary-strong)]">
        {icon}
        {title}
      </span>
      <p className="text-base leading-7 text-[var(--foreground)]">{subtitle}</p>
      <span
        aria-hidden="true"
        className="mt-auto h-[2px] w-12 rounded-full bg-[var(--primary)] opacity-60"
      />
    </div>
  );
}
