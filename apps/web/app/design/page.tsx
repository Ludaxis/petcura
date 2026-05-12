import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import {
  Badge,
  Button,
  StatusPill,
  UrgencyDot
} from "@petcura/ui";
import {
  ActiveStateMatrix,
  ConfidenceBuckets,
  MobileShellPair,
  NavConfigSnippet,
  ShellSkeleton,
  SidebarStatesRow
} from "./_components/ShellShowcase";

export const metadata: Metadata = {
  title: "PetCura · Foundation Review",
  description:
    "Direction B locked · brand tokens, principles, primitives, surface previews."
};

const PALETTE_LIGHT: Array<{ name: string; val: string; note?: string }> = [
  { name: "ink", val: "#29261b", note: "Body text" },
  { name: "ink-2", val: "#4d4738", note: "Secondary" },
  { name: "muted", val: "#847e6b", note: "Meta" },
  { name: "muted-2", val: "#a39b86", note: "Disabled" },
  { name: "paper", val: "#f6f4ef", note: "Surface" },
  { name: "soft", val: "#ede9df", note: "Soft surface" },
  { name: "line", val: "#e2dccc", note: "Border" },
  { name: "primary", val: "#4a6b3f", note: "Sage · CTA" },
  { name: "p-soft", val: "#e2ead6", note: "Selected row" },
  { name: "amber", val: "#b07d2c", note: "Today / warning" },
  { name: "red", val: "#a64a3c", note: "Urgent" },
  { name: "green", val: "#4a6b3f", note: "Resolved" }
];

const PALETTE_DARK: Array<{ name: string; val: string }> = [
  { name: "ink", val: "#ece8de" },
  { name: "ink-2", val: "#c9c4b6" },
  { name: "muted", val: "#8a8270" },
  { name: "paper", val: "#1c1a16" },
  { name: "soft", val: "#221f19" },
  { name: "line", val: "#2a2620" },
  { name: "primary", val: "#87a87f" },
  { name: "p-soft", val: "#1f2a1d" },
  { name: "amber", val: "#d4a872" },
  { name: "red", val: "#d49080" },
  { name: "green", val: "#9bb892" }
];

const TYPE_SCALE = [
  { name: "Display L", size: 48, weight: 600, tracking: -0.02 },
  { name: "Display M", size: 32, weight: 600, tracking: -0.015 },
  { name: "Title", size: 24, weight: 600, tracking: -0.015 },
  { name: "Heading", size: 18, weight: 600, tracking: -0.01 },
  { name: "Body", size: 14, weight: 400, tracking: -0.005 },
  { name: "Body sm", size: 13, weight: 400, tracking: -0.005 },
  { name: "Caption", size: 11, weight: 500, tracking: 0 },
  { name: "Mono", size: 11, weight: 500, tracking: 0.04, mono: true }
];

const PRINCIPLES = [
  {
    n: "P1",
    t: "Inbox-first, board on demand",
    d: "List view by default — five-column kanban toggle for batch sweeps."
  },
  {
    n: "P2",
    t: "AI is a draft, never a decision",
    d: "Every AI artifact ships with source span, confidence, accept/edit/reject — and is never sent without staff confirmation."
  },
  {
    n: "P3",
    t: "Trilingual by default",
    d: "EE / EN / RU surface as first-class. Translation is one tap, never a separate flow."
  },
  {
    n: "P4",
    t: "Keyboard-equal-to-mouse",
    d: "Every staff action is reachable via shortcut. ⌘K is the spine."
  },
  {
    n: "P5",
    t: "Audit-grade trace",
    d: "Every send, edit, and AI use is logged with actor + locale + raw input. Compliance is built in, not bolted on."
  },
  {
    n: "P6",
    t: "Minutes saved, not screens added",
    d: "If a surface costs more time than it saves, it does not ship."
  }
];

const PATTERNS = [
  {
    title: "AI is a draft",
    locale: "P2",
    body: `Every AI artifact carries:

• Source span (which message)
• Confidence (0.0–1.0)
• Locale (in/out)
• Accept · Edit · Reject

Nothing reaches the owner without a staff send.
Every use is logged with actor + raw input + final output.`
  },
  {
    title: "EE · EN · RU",
    locale: "P3",
    body: `Source language detected on every inbound message.
Translation is a per-bubble toggle, not a separate flow.
AI replies generated in source language.
Audit log preserves source AND translation.

Note: EE strings can run ~25% longer than EN — pad row min-heights.`
  },
  {
    title: "⌘K is the spine",
    locale: "P4",
    body: `⌘K  Command palette
J/K Navigate threads
E   Resolve
A   Assign
R   Reply (focus composer)
T   Translate thread
⌘↵  Send reply
?   Show all shortcuts`
  },
  {
    title: "Four tiers, never five",
    locale: "contracts/request-lifecycle",
    body: `urgent  · within 1h
today   · within 8h
week    · within 5d
routine · best effort

Urgency is a request property, not a status.
Staff can override AI urgency at any time.`
  }
];

const LOCKED: Array<[string, string]> = [
  ["Direction", "B · Warm sage on cream"],
  ["Type", "Montserrat (UI) + JetBrains Mono (meta)"],
  ["Themes", "Light & Dark — both v1"],
  ["Layout", "Inbox-first list, kanban toggle"],
  ["Selected row", "Dot only (no avatars in row)"],
  ["Urgency", "Four tiers"],
  ["Locales", "EE · EN · RU"],
  ["AI", "Draft-only, with source/conf/accept-edit-reject"]
];

const OPEN_QUESTIONS = [
  "Reminder model — opt-in per request, or rules-based per pet?",
  "Multi-clinic switcher — top-level org rail or per-account?",
  "AI categories — fixed taxonomy or learned per clinic?",
  "Web intake → WhatsApp handoff — automatic or staff-triggered?",
  "Owner-side notifications when staff are typing?",
  "Bulk-resolve flow — kanban-only, or list multi-select too?"
];

// Iframes target the prototypes under apps/web/public/prototypes/, which now
// link to ./tokens.css (mirrored from globals.css). The prototypes read state
// from the hash fragment (#viewport=…&theme=…). The live /inbox and /intake
// routes are auth-gated and would just redirect to /login inside an iframe;
// the prototypes are public and self-contained for design review.
const CLINIC_ARTBOARDS = [
  {
    id: "clinic-desktop-light",
    label: "Desktop · Light",
    src: "/prototypes/Clinic%20Prototype.html#viewport=desktop&theme=light",
    width: 1320,
    height: 820,
    dark: false
  },
  {
    id: "clinic-desktop-dark",
    label: "Desktop · Dark",
    src: "/prototypes/Clinic%20Prototype.html#viewport=desktop&theme=dark",
    width: 1320,
    height: 820,
    dark: true
  },
  {
    id: "clinic-tablet",
    label: "Tablet · Light",
    src: "/prototypes/Clinic%20Prototype.html#viewport=tablet&theme=light",
    width: 820,
    height: 1080,
    dark: false
  },
  {
    id: "clinic-mobile",
    label: "Phone · Dark",
    src: "/prototypes/Clinic%20Prototype.html#viewport=phone&theme=dark",
    width: 420,
    height: 860,
    dark: true
  }
];

const INTAKE_ARTBOARDS = [
  {
    id: "wa-light",
    label: "WhatsApp · Light",
    src: "/prototypes/Owner%20Intake.html#channel=whatsapp&theme=light",
    width: 420,
    height: 860,
    dark: false
  },
  {
    id: "wa-dark",
    label: "WhatsApp · Dark",
    src: "/prototypes/Owner%20Intake.html#channel=whatsapp&theme=dark",
    width: 420,
    height: 860,
    dark: true
  },
  {
    id: "web-step",
    label: "Web intake · Step 2",
    src: "/prototypes/Owner%20Intake.html#channel=web&step=1",
    width: 420,
    height: 860,
    dark: false
  },
  {
    id: "web-review",
    label: "Web intake · Review",
    src: "/prototypes/Owner%20Intake.html#channel=web&step=4",
    width: 420,
    height: 860,
    dark: false
  }
];

export default function DesignCanvasPage() {
  return (
    <main
      className="min-h-screen text-[var(--ink)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(74, 107, 63, 0.06), transparent 320px), var(--paper)"
      }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-24 px-8 py-16 lg:px-14">
        <CoverSection />
        <Section
          id="principles"
          eyebrow="Foundation"
          title="Six principles"
          subtitle="The promises every screen has to keep"
        >
          <PrinciplesGrid />
        </Section>

        <Section
          id="brand"
          eyebrow="Brand & tokens"
          title="Color, type, the moves we'll keep using"
          subtitle="Direction B · Warm sage on cream — locked"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ColorTokens />
            </div>
            <div className="lg:col-span-5">
              <Components />
            </div>
            <div className="lg:col-span-12">
              <TypeScale />
            </div>
          </div>
        </Section>

        <Section
          id="shell"
          eyebrow="App shell"
          title="Shell & navigation"
          subtitle="Live primitives — the rail, the active states, the mobile sheet. Regressions in any of these light up here first."
        >
          <div className="flex flex-col gap-12">
            <ShowcaseGroup
              title="A · Sidebar — three states"
              note="Three captioned tiles using the live shadcn Sidebar primitives. If a future PR breaks the active/hover/super-admin rules, one of these tiles shows the broken state immediately."
            >
              <SidebarStatesRow />
            </ShowcaseGroup>

            <ShowcaseGroup
              title="B · AppShell skeleton"
              note="Sidebar (left, --soft) + main (right, --paper). The surface tones must differ — that's how the rail reads as anchored when content scrolls."
            >
              <ShellSkeleton />
            </ShowcaseGroup>

            <ShowcaseGroup
              title="C · Mobile shell"
              note="Below md the rail folds into a Sheet drawer triggered by the MobileShellHeader. The open state here is a visual approximation; the live Sheet renders through a Radix portal."
            >
              <MobileShellPair />
            </ShowcaseGroup>

            <ShowcaseGroup
              title="D · Active-state matrix"
              note="Static chips rendered with the exact same cn classes SidebarMenuSubButton applies in each state. The contract: this table mirrors the live row — break the classes, break this row."
            >
              <ActiveStateMatrix />
            </ShowcaseGroup>

            <ShowcaseGroup
              title="E · AI confidence bucket"
              note="Three buckets surface across AI reply drafts, urgency suggestions, and intake category guesses. The text label carries the meaning (WCAG 1.4.1); color is reinforcement only."
            >
              <ConfidenceBuckets />
            </ShowcaseGroup>

            <ShowcaseGroup
              title="F · Nav config"
              note="The sidebar is data-driven. One typed entry per top-level feature, gated to roles when needed."
            >
              <NavConfigSnippet />
            </ShowcaseGroup>
          </div>
        </Section>

        <Section
          id="clinic"
          eyebrow="Surface 1"
          title="Clinic inbox"
          subtitle="Live preview — light + dark, three viewports"
        >
          <ArtboardRow artboards={CLINIC_ARTBOARDS} kind="clinic" />
        </Section>

        <Section
          id="intake"
          eyebrow="Surface 2"
          title="Owner intake"
          subtitle="Mobile-first · WhatsApp + Web · Estonian primary"
        >
          <ArtboardRow artboards={INTAKE_ARTBOARDS} kind="intake" />
        </Section>

        <Section
          id="patterns"
          eyebrow="Cross-surface"
          title="Where the system shows up consistently"
          subtitle="Same pattern across clinic, intake, audit log"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {PATTERNS.map((p) => (
              <SurfaceTile
                key={p.title}
                title={p.title}
                locale={p.locale}
                body={p.body}
              />
            ))}
          </div>
        </Section>

        <Section
          id="next"
          eyebrow="Open & next"
          title="What's locked, what's still up for review"
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <LockedCard />
            <OpenQuestionsCard />
            <FilesCard />
          </div>
        </Section>

        <footer className="mt-12 border-t border-[var(--line)] pt-8 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
          PetCura · Foundation review · v1.0 · May 2026
        </footer>
      </div>
    </main>
  );
}

function ShowcaseGroup({
  title,
  note,
  children
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
          {title}
        </h3>
        {note ? (
          <p className="max-w-3xl text-[12.5px] leading-[1.5] text-[var(--ink-2)]">
            {note}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-16 flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-[var(--line)] pb-5">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-semibold tracking-[-0.015em] text-[var(--ink)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-[var(--ink-2)]">{subtitle}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function CoverSection() {
  return (
    <section
      id="cover"
      className="relative overflow-hidden rounded-2xl border border-[var(--line)] px-10 py-16 lg:px-16 lg:py-24"
      style={{
        background:
          "linear-gradient(160deg, #f6f4ef 0%, #ede9df 50%, #d9e6cc 100%)"
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-10 h-[380px] w-[380px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(74,107,63,0.13), transparent 70%)"
        }}
      />
      <div className="relative flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            PetCura · Foundation review · v1.0 · May 2026
          </span>
          <h1 className="max-w-3xl text-[44px] font-bold leading-[1.04] tracking-[-0.025em] text-[var(--ink)] sm:text-[56px] lg:text-[72px]">
            The WhatsApp-native
            <br />
            ClientOps inbox
            <br />
            <span className="font-semibold text-[var(--primary)]">
              for vet clinics.
            </span>
          </h1>
          <p className="max-w-xl text-base leading-[1.45] text-[var(--ink-2)] sm:text-lg">
            Direction B (warm sage) — locked. Two surfaces, three locales, one
            keyboard-first inbox.
          </p>
          <p className="max-w-xl text-xs italic text-[var(--muted)]">
            View as document — original was a pannable canvas. Sections below
            preserve the artboard order.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-5">
          <Stat n="2" l="surfaces" />
          <Stat n="3" l="locales" />
          <Stat n="2" l="themes" />
          <Stat n="6" l="principles" />
          <Stat n="4" l="urgency tiers" />
        </div>
      </div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[44px] font-semibold leading-none tracking-[-0.02em] text-[var(--ink)]">
        {n}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
        {l}
      </span>
    </div>
  );
}

function PrinciplesGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
      {PRINCIPLES.map((p) => (
        <article key={p.n} className="flex flex-col gap-1">
          <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[var(--primary)]">
            {p.n}
          </span>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">
            {p.t}
          </h3>
          <p className="text-[13px] leading-[1.5] text-[var(--ink-2)]">
            {p.d}
          </p>
        </article>
      ))}
    </div>
  );
}

function ColorTokens() {
  return (
    <div className="flex flex-col gap-7 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-7">
      <SectionLabel>Color · Direction B · Light</SectionLabel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PALETTE_LIGHT.map((c) => (
          <div key={c.name} className="flex flex-col gap-1.5">
            <div
              className="h-14 rounded-md border border-[var(--line)]"
              style={{ background: c.val }}
            />
            <span className="text-[11px] font-semibold text-[var(--ink)]">
              {c.name}
            </span>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              {c.val}
            </span>
            {c.note ? (
              <span className="text-[10px] text-[var(--muted-2)]">
                {c.note}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <SectionLabel>Color · Direction B · Dark</SectionLabel>
      <div
        className="grid grid-cols-2 gap-3 rounded-lg p-3 sm:grid-cols-3 lg:grid-cols-4"
        style={{ background: "#1c1a16" }}
      >
        {PALETTE_DARK.map((c) => (
          <div key={c.name} className="flex flex-col gap-1">
            <div
              className="h-12 rounded-md"
              style={{ background: c.val, border: "1px solid #2a2620" }}
            />
            <span
              className="text-[10.5px] font-semibold"
              style={{ color: "#ece8de" }}
            >
              {c.name}
            </span>
            <span
              className="font-mono text-[9.5px]"
              style={{ color: "#8a8270" }}
            >
              {c.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeScale() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-7">
      <SectionLabel>Type · Montserrat + JetBrains Mono</SectionLabel>
      <div className="flex flex-col gap-4">
        {TYPE_SCALE.map((t) => (
          <div
            key={t.name}
            className="grid items-baseline gap-4"
            style={{ gridTemplateColumns: "120px 1fr 100px" }}
          >
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {t.name}
            </span>
            <span
              className="overflow-hidden truncate text-[var(--ink)]"
              style={{
                fontSize: t.size,
                fontWeight: t.weight,
                letterSpacing: `${t.tracking}em`,
                fontFamily: t.mono ? "var(--font-mono)" : "var(--font-sans)",
                lineHeight: 1.15
              }}
            >
              The quick brown fox
            </span>
            <span className="font-mono text-[10.5px] text-[var(--muted-2)]">
              {t.size}/{t.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Components() {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-7">
      <SectionLabel>Component primitives</SectionLabel>

      <Group title="Status pills">
        <StatusPill status="new" />
        <StatusPill status="waiting-staff" />
        <StatusPill status="waiting-owner" />
        <StatusPill status="resolved" />
        <StatusPill status="urgent" />
      </Group>

      <Group title="Badges">
        <Badge tone="teal">WhatsApp</Badge>
        <Badge tone="neutral">AI assist</Badge>
        <Badge tone="amber">Today</Badge>
        <Badge tone="red">Urgent</Badge>
      </Group>

      <Group title="Buttons">
        <Button variant="primary">Send reply</Button>
        <Button variant="secondary">Save draft</Button>
        <Button variant="ghost">Cancel</Button>
      </Group>

      <Group title="Urgency dots">
        <span className="inline-flex items-center gap-3">
          <UrgencyDot level="urgent" label="Urgent — within 1h" />
          <UrgencyDot level="today" label="Today — within 8h" />
          <UrgencyDot level="week" label="This week — within 5d" />
          <UrgencyDot level="routine" label="Routine — best effort" />
        </span>
      </Group>

      <Group title="Inputs">
        <input
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2.5 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--muted-2)] focus:border-[var(--primary)]"
          placeholder="Search threads, owners, pets…"
          aria-label="Search threads, owners, pets"
        />
      </Group>

      <Group title="AI suggestion card">
        <div
          className="w-full rounded-lg border p-3 text-[12.5px] leading-[1.45] text-[var(--ink)]"
          style={{
            background: "var(--primary-soft)",
            borderColor: "rgba(74,107,63,0.25)"
          }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] text-[9px] font-bold"
              style={{ background: "var(--primary)", color: "var(--paper)" }}
            >
              ✦
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--primary-strong)]">
              Suggested reply · EE → EE
            </span>
            <span className="ml-auto text-[10px] text-[var(--muted)]">
              conf 0.86
            </span>
          </div>
          <p className="m-0">
            “Tere Liis! Soovitan tuua Lumi täna kell 14:00. Toite ja liiva
            muutus võib olla allergia põhjus…”
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button variant="primary" size="sm">
              Accept
            </Button>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
            <Button variant="ghost" size="sm">
              Reject
            </Button>
          </div>
        </div>
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[var(--muted)]">
        {title}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="border-b border-[var(--line)] pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
      {children}
    </span>
  );
}

type Artboard = {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  dark?: boolean;
};

function ArtboardRow({
  artboards,
  kind
}: {
  artboards: Artboard[];
  kind: "clinic" | "intake";
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:px-0">
      <div className="flex items-stretch gap-6">
        {artboards.map((a) => (
          <ArtboardFrame key={a.id} artboard={a} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function ArtboardFrame({
  artboard,
  kind
}: {
  artboard: Artboard;
  kind: "clinic" | "intake";
}) {
  const SCALE = 0.5;
  const innerStyle: CSSProperties = {
    width: artboard.width,
    height: artboard.height,
    transform: `scale(${SCALE})`,
    transformOrigin: "top left",
    border: 0
  };
  const frameStyle: CSSProperties = {
    width: artboard.width * SCALE,
    height: artboard.height * SCALE
  };
  return (
    <figure className="flex shrink-0 flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted)]">
          {artboard.label}
        </span>
        <span className="font-mono text-[10px] text-[var(--muted-2)]">
          {artboard.width}×{artboard.height}
        </span>
      </figcaption>
      <div
        className={`overflow-hidden rounded-lg border border-[var(--line)] shadow-sm ${
          artboard.dark ? "dark" : ""
        }`}
        style={{
          ...frameStyle,
          background: artboard.dark ? "#1c1a16" : "var(--paper)"
        }}
      >
        <iframe
          src={artboard.src}
          title={`${kind === "clinic" ? "Clinic" : "Owner intake"} — ${artboard.label}`}
          loading="lazy"
          style={innerStyle}
        />
      </div>
    </figure>
  );
}

function SurfaceTile({
  title,
  locale,
  body
}: {
  title: string;
  locale: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-[var(--muted)]">
          {locale}
        </span>
      </header>
      <pre className="m-0 whitespace-pre-wrap font-sans text-[12.5px] leading-[1.55] text-[var(--ink-2)]">
        {body}
      </pre>
    </article>
  );
}

function LockedCard() {
  return (
    <article
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{ background: "var(--primary-soft)" }}
    >
      <span
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "var(--primary-strong)" }}
      >
        Locked for v1
      </span>
      <ul className="flex list-none flex-col gap-3 p-0">
        {LOCKED.map(([k, v]) => (
          <li
            key={k}
            className="grid items-baseline gap-3"
            style={{ gridTemplateColumns: "120px 1fr" }}
          >
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: "var(--primary-strong)" }}
            >
              {k}
            </span>
            <span className="text-[13px] text-[var(--ink)]">{v}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function OpenQuestionsCard() {
  return (
    <article
      className="flex flex-col gap-4 rounded-xl p-6"
      style={{ background: "#f5e7c8" }}
    >
      <span
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "#7e571d" }}
      >
        Open questions
      </span>
      <ol className="flex list-none flex-col gap-3 p-0">
        {OPEN_QUESTIONS.map((q, i) => (
          <li
            key={q}
            className="grid gap-2"
            style={{ gridTemplateColumns: "32px 1fr" }}
          >
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: "#7e571d" }}
            >
              Q{i + 1}
            </span>
            <span className="text-[13px] leading-[1.45] text-[var(--ink)]">
              {q}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function FilesCard() {
  const links = [
    { href: "/", label: "Marketing home", glyph: "◆" },
    { href: "/inbox", label: "Clinic inbox", glyph: "▣" },
    { href: "/intake", label: "Owner intake", glyph: "○" },
    { href: "/login", label: "Staff login", glyph: "↩" }
  ];
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
        Open standalone
      </span>
      <ul className="flex list-none flex-col gap-2.5 p-0">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="flex items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--soft)] px-3 py-2.5 text-[13px] text-[var(--ink)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)]"
            >
              <span
                aria-hidden
                className="font-mono text-[12px] text-[var(--primary)]"
              >
                {l.glyph}
              </span>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12px] leading-[1.5] text-[var(--ink-2)]">
        Original Design Canvas was a pannable artboard surface (drag · ⌘+scroll
        zoom · ←/→ step). This document recreates the same content as a
        scrollable foundation review.
      </p>
    </article>
  );
}
