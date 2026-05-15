import type { MarketingLeadSource } from "@petcura/validation";

export const marketingRoutes = {
  home: "/",
  demo: "/demo",
  sandbox: "/sandbox",
  trust: "/trust",
  owners: "/owners",
  ownerPortal: "/o",
  ownerLogin: "/o/login",
  ownerIntake: "/intake",
  clinicLogin: "/login"
} as const;

export const leadSources = {
  hero: "hero",
  ownerPath: "owner_path",
  pricing: "pricing",
  finalCta: "final_cta",
  mobileBar: "mobile_bar",
  demoPage: "demo_page",
  sandbox: "sandbox",
  trust: "trust",
  footer: "footer"
} as const satisfies Record<string, MarketingLeadSource>;

export const demoHrefBySource = (source: MarketingLeadSource) =>
  `${marketingRoutes.demo}?source=${source}`;

export const pilotProofSignals = [
  "Private EU pilot cohort",
  "25% fewer routine calls target by week 12",
  "Median first response target: <=4 business hours",
  "Reminder delivery target: >=95%",
  "Zero AI safety incidents target",
  "Named logos only with written consent"
] as const;

export const sandboxInbox = {
  ownerMessage: {
    channel: "WhatsApp",
    from: "Marta, owner of Luna",
    time: "09:12",
    body: "Luna has not eaten since yesterday and is hiding under the bed. Can someone tell me if I should bring her in?",
    language: "EN"
  },
  request: {
    id: "SANDBOX-8421",
    pet: "Luna",
    species: "Cat",
    category: "Medical question",
    suggestedRisk: "Needs staff review",
    status: "New",
    language: "EN -> ET available",
    summary:
      "Owner reports no appetite for about 24 hours and hiding behavior. Staff should review promptly and decide next step."
  },
  aiDraft: {
    label: "AI draft for staff review",
    body: "Thanks for the details. A team member will review Luna's symptoms now. If Luna is struggling to breathe, collapses, or seems severely weak, please call the clinic emergency number immediately.",
    boundary: "Not sent until clinic staff approve or edit it."
  },
  staffAction: {
    reviewer: "Tiina, front desk",
    decision: "Edited and approved",
    ownerReply:
      "We can see Luna today at 14:00. Please bring her in a covered carrier. If she becomes very weak before then, call us immediately."
  },
  export: {
    destination: "PMS export preview",
    auditId: "AUD-2026-05-14-8421",
    fields: [
      "Owner message",
      "Staff-reviewed reply",
      "Category and status",
      "AI draft metadata",
      "Delivery lifecycle"
    ]
  }
} as const;

export const trustClaims = {
  residency: [
    "Primary application data is designed for EU-region hosting.",
    "PetCura is processor; the clinic remains controller.",
    "The PMS remains the medical system of record."
  ],
  aiSafety: [
    "AI assists staff with intake, categorization, risk flags, summaries, translation, and reply drafts.",
    "AI does not diagnose, prescribe, set final urgency, or auto-send medical advice.",
    "Owner-facing medical replies require staff approval."
  ],
  auditability: [
    "Request timeline events are stored for staff actions.",
    "AI outputs retain model, prompt version, input, output, confidence, latency, token usage, and review state.",
    "Outbound delivery lifecycle is tracked separately."
  ],
  roadmap: [
    { label: "SOC 2", status: "In progress" },
    { label: "ISO 27001", status: "Planned" },
    { label: "EU AI Act", status: "Readiness tracked" }
  ]
} as const;

export const trustProhibitedClaims = [
  "Completed SOC 2",
  "Completed ISO 27001",
  "EU AI Act conformity or certification",
  "Autonomous medical advice",
  "Diagnosis or prescription",
  "Named clinic proof without written consent"
] as const;
