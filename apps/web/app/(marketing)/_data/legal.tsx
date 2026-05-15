import type { LegalPageShellProps } from "../_components/LegalPageShell";
import { CookiePreferences } from "../_components/CookiePreferences";

export const legalRoutes = {
  privacy: "/privacy",
  cookies: "/cookies",
  subprocessors: "/subprocessors"
} as const;

export const legalNavLinks = [
  { href: legalRoutes.privacy, label: "Privacy" },
  { href: legalRoutes.cookies, label: "Cookies" },
  { href: legalRoutes.subprocessors, label: "Subprocessors" }
] as const;

export const marketingBackLink = {
  href: "/",
  label: "Back to PetCura"
} as const;

type LegalPageKey = keyof typeof legalRoutes;
type LegalPageContent = Omit<LegalPageShellProps, "backLink"> & {
  metadata: {
    title: string;
    description: string;
  };
};

const updatedDate = "15 May 2026";
const updatedDateTime = "2026-05-15";

export const legalPages: Record<LegalPageKey, LegalPageContent> = {
  privacy: {
    metadata: {
      title: "PetCura Privacy Notice",
      description:
        "How PetCura handles website, clinic, owner, messaging, and AI accountability data."
    },
    eyebrow: "Privacy",
    title: "Privacy Notice",
    lede:
      "PetCura protects the communication layer around veterinary care. Clinics stay in control of owner and patient data; PetCura processes that data on the clinic's behalf.",
    updatedDate,
    updatedDateTime,
    callouts: [
      {
        title: "Clinic-controlled data",
        tone: "trust",
        body: "For clinic communication data, the clinic is controller and PetCura is processor."
      },
      {
        title: "Staff-approved AI",
        tone: "notice",
        body: "AI may draft, summarize, translate, and suggest. Clinic staff decide what is sent."
      },
      {
        title: "Legal review required",
        tone: "caution",
        body: "Entity details, retention periods, and final vendor terms must be confirmed before public launch."
      }
    ],
    sections: [
      {
        id: "short-version",
        title: "Short Version",
        items: [
          "Your clinic stays in control of owner and patient data.",
          "PetCura helps the clinic organize communication, not replace the PMS.",
          "AI suggestions are for staff review and are not diagnosis, prescription, final urgency, or auto-sent medical advice.",
          "Primary application data is designed for EU-region hosting.",
          "PetCura does not sell owner data or use owner conversations for advertising."
        ]
      },
      {
        id: "who-this-is-for",
        title: "Who This Notice Is For",
        body: (
          <>
            <p>
              This notice is for clinic staff, clinic buyers, pet owners who
              interact with a clinic through PetCura, and website visitors.
            </p>
            <p>
              If you are a pet owner, your veterinary clinic is usually the best
              first contact for privacy requests about your pet, appointment,
              message, or medical context. PetCura supports the clinic in
              responding to those requests.
            </p>
          </>
        )
      },
      {
        id: "what-we-process",
        title: "What PetCura Processes",
        body: (
          <p>
            PetCura may process clinic account and staff profile details, owner
            contact details, messages, forms, attachments, delivery metadata,
            pet and request details, workflow notes, reminders, exports, audit
            logs, product events, security logs, support messages, and AI
            accountability records. PetCura is not the clinic PMS; the PMS
            remains the medical system of record.
          </p>
        )
      },
      {
        id: "how-we-use-data",
        title: "How PetCura Uses Data",
        items: [
          "Deliver the PetCura service to clinics and route owner messages into the clinic inbox.",
          "Help staff structure intake, follow-up work, replies, reminders, and PMS-friendly exports.",
          "Create staff-reviewed drafts, summaries, translations, category suggestions, and risk flags.",
          "Maintain audit trails, security monitoring, reliability diagnostics, and accountability records.",
          "Meet contractual and legal obligations."
        ]
      },
      {
        id: "ai-assistance",
        title: "AI Assistance",
        body: (
          <>
            <p>
              PetCura&apos;s AI assists clinic staff. It does not replace veterinary
              professionals. AI may help structure intake, suggest categories or
              risk flags, summarize conversations, translate messages, and draft
              replies for staff review.
            </p>
            <p>
              Staff approve owner-facing medical replies before sending. PetCura
              does not diagnose, prescribe, set final urgency, or auto-send
              medical advice. AI outputs are logged with model and prompt
              details, input and output records, confidence where available,
              review status, and staff edits.
            </p>
          </>
        )
      },
      {
        id: "roles",
        title: "Controller And Processor Roles",
        body: (
          <>
            <p>
              For clinic communication data, the clinic is the controller and
              PetCura is the processor. PetCura processes that data under the
              clinic&apos;s instructions and the applicable data processing
              agreement.
            </p>
            <p>
              For PetCura&apos;s own website, sales, account administration,
              security, and support operations, PetCura may act as an
              independent controller.
            </p>
          </>
        )
      },
      {
        id: "where-data-is-processed",
        title: "Where Data Is Processed",
        body: (
          <p>
            PetCura is designed for EU-region primary application data hosting.
            Some service providers, including messaging, observability, hosting,
            and AI providers, may process limited data outside the EEA where
            needed to provide the service. We document those providers on the{" "}
            <a href={legalRoutes.subprocessors}>Subprocessors page</a>.
          </p>
        )
      },
      {
        id: "retention",
        title: "Retention",
        body: (
          <p>
            Clinics control retention for clinic-owned communication records,
            subject to their legal and clinical obligations. PetCura keeps data
            while needed to provide the service, support clinic-controlled export
            or erasure, maintain auditability, secure the product, and meet
            legal obligations. Audit records may be retained where necessary
            while minimizing personal data.
          </p>
        )
      },
      {
        id: "rights",
        title: "Privacy Rights",
        body: (
          <p>
            Pet owners can ask their clinic for access, correction, export,
            restriction, or deletion of personal data. PetCura helps the clinic
            respond where PetCura processes data on the clinic&apos;s behalf. Clinic
            staff and website visitors may contact PetCura directly for account,
            website, sales, support, or security data at{" "}
            <a href="mailto:privacy@petcura.app">privacy@petcura.app</a>.
          </p>
        )
      },
      {
        id: "security",
        title: "Security",
        body: (
          <p>
            PetCura is built with tenant isolation, access controls, webhook
            signature verification, idempotent message handling, secret
            management, audit logging, and operational monitoring. SOC 2 is in
            progress. ISO 27001 is planned.
          </p>
        )
      },
      {
        id: "care-notice",
        title: "Important Care Notice",
        body: (
          <p>
            PetCura is not an emergency service and does not provide veterinary
            medical advice. If an owner believes a pet may need urgent care,
            they should contact their clinic by phone or seek local emergency
            veterinary care.
          </p>
        )
      }
    ]
  },
  cookies: {
    metadata: {
      title: "PetCura Cookie Notice",
      description:
        "How PetCura uses essential cookies, preferences, analytics, diagnostics, and cookie choices."
    },
    eyebrow: "Cookies",
    title: "Cookie Notice",
    lede:
      "PetCura uses only the cookies and similar technologies needed to run the service, remember choices, keep sessions secure, and understand whether the product is working.",
    updatedDate,
    updatedDateTime,
    callouts: [
      {
        title: "Essential first",
        tone: "trust",
        body: "Login, routing, session security, language, theme, and owner invite flows rely on essential cookies."
      },
      {
        title: "No ad cookies in pilot",
        tone: "notice",
        body: "PetCura does not use advertising cookies or owner-message retargeting during the pilot stage."
      },
      {
        title: "Inventory pending",
        tone: "caution",
        body: "Exact cookie names, durations, analytics consent behavior, and diagnostics settings need final legal/product confirmation."
      }
    ],
    sections: [
      {
        id: "banner-copy",
        title: "Cookie Banner Copy",
        body: (
          <p>
            PetCura uses essential cookies to run the site and secure your
            session. With your permission, we use analytics cookies to
            understand product usage and improve clinic workflows. We do not use
            advertising cookies.
          </p>
        ),
        items: ["Accept analytics", "Reject optional", "Manage choices"]
      },
      {
        id: "cookie-settings",
        title: "Cookie Settings",
        body: <CookiePreferences />
      },
      {
        id: "categories",
        title: "Cookie Categories",
        items: [
          {
            title: "Essential",
            body: "Sign-in, session security, clinic or owner routing, language, theme, cookie choices, and service reliability. Always on."
          },
          {
            title: "Analytics",
            body: "Website and product usage measurement, conversion events, performance, and error trends. Optional where consent is required."
          },
          {
            title: "Support and diagnostics",
            body: "Error reports, logs, uptime checks, and security diagnostics, limited to what is needed to run and secure the service."
          },
          {
            title: "Advertising",
            body: "PetCura does not use advertising cookies or owner-message retargeting during the pilot stage."
          }
        ]
      },
      {
        id: "analytics",
        title: "Analytics",
        body: (
          <p>
            When analytics is enabled, PetCura measures page views, product
            events, and performance signals so we can improve onboarding,
            intake, inbox reliability, and clinic workflows. We avoid sending
            owner message content, medical notes, attachments, emails, phone
            numbers, clinic names, or free-text form content into marketing
            analytics.
          </p>
        )
      },
      {
        id: "examples",
        title: "Examples",
        items: [
          {
            title: "petcura-theme",
            body: "Remembers light, dark, or system theme preference."
          },
          {
            title: "pc_last_route_staff and pc_last_route_owner",
            body: "Help return signed-in users to their last relevant page."
          },
          {
            title: "pc_join_token and pc_join_meta",
            body: "Support short-lived owner invite confirmation."
          },
          {
            title: "Supabase auth cookies",
            body: "Maintain secure staff or owner sessions."
          }
        ]
      },
      {
        id: "choices",
        title: "Managing Choices",
        body: (
          <p>
            You can change non-essential cookie choices when cookie settings are
            available and through your browser settings. Blocking strictly
            necessary cookies may prevent login, owner invite links, or
            preference features from working.
          </p>
        )
      }
    ]
  },
  subprocessors: {
    metadata: {
      title: "PetCura Subprocessors",
      description:
        "Service providers PetCura uses for hosting, messaging, observability, jobs, analytics, and AI assistance."
    },
    eyebrow: "Subprocessors",
    title: "Subprocessors",
    lede:
      "PetCura uses a small set of service providers to deliver secure clinic communication. Each provider is reviewed for purpose, data categories, region, transfer mechanism, and contract coverage before production use.",
    updatedDate,
    updatedDateTime,
    callouts: [
      {
        title: "Purpose-limited vendors",
        tone: "trust",
        body: "Subprocessors may process personal data only under contract and only for the purposes needed to support PetCura."
      },
      {
        title: "Change notice",
        tone: "notice",
        body: "Clinic customers receive notice of material subprocessor changes as set out in the DPA."
      },
      {
        title: "Region confirmation pending",
        tone: "caution",
        body: "Final vendor regions, DPAs, transfer mechanisms, and AI provider routes must be confirmed before public launch."
      }
    ],
    sections: [
      {
        id: "buyer-summary",
        title: "Buyer Summary",
        items: [
          "Primary application data is designed for EU-region hosting.",
          "Messaging providers may process message content and delivery metadata to send WhatsApp or SMS messages.",
          "Observability tools receive limited operational, diagnostic, or product analytics data.",
          "AI providers receive only the minimum necessary context for staff-facing assistance, subject to contract and product controls.",
          "PetCura does not sell owner data."
        ]
      },
      {
        id: "core-providers",
        title: "Core Providers",
        items: [
          {
            title: "Supabase",
            body: "Database, authentication, storage, and realtime infrastructure for clinic records, staff accounts, owner request data, attachments, audit logs, and AI accountability records. EU project region must be confirmed for production."
          },
          {
            title: "Vercel",
            body: "Web hosting, server-side execution, CDN, deployment logs, and web analytics. Function regions and logging configuration must be documented."
          },
          {
            title: "Twilio and Meta / WhatsApp",
            body: "WhatsApp Business and SMS delivery, delivery status, and messaging webhooks. Telecom and WhatsApp routing may involve international infrastructure and documented transfer safeguards."
          },
          {
            title: "Inngest",
            body: "Background jobs for AI tasks, reminders, delivery retries, exports, and scheduled workflows. Sensitive payloads should be minimized or encrypted where feasible."
          },
          {
            title: "AI inference provider routes",
            body: "Staff-facing intake questions, summaries, translations, category suggestions, risk flags, memory context, and reply drafts. Provider, region, retention, training, and abuse-monitoring settings are confirmed per route before publication."
          }
        ]
      },
      {
        id: "optional-providers",
        title: "Observability And Analytics",
        items: [
          {
            title: "Sentry",
            body: "Error monitoring and application diagnostics with PII scrubbing and limited request context."
          },
          {
            title: "PostHog EU",
            body: "Product analytics and usage measurement where enabled. No owner message content; session replay requires separate approval."
          },
          {
            title: "Better Stack",
            body: "Uptime monitoring, logging, incident response, and status pages with log redaction and retention controls."
          }
        ]
      },
      {
        id: "clinic-specific",
        title: "Clinic-Specific Providers",
        body: (
          <p>
            PMS export destinations, calendar integrations, or local messaging
            providers may be added for a clinic only when agreed with that
            clinic.
          </p>
        )
      },
      {
        id: "faq",
        title: "Subprocessor FAQ",
        items: [
          {
            title: "Does PetCura sell owner data?",
            body: "No. PetCura does not sell owner data or use owner conversations for advertising."
          },
          {
            title: "Is PetCura EU-hosted?",
            body: "PetCura is designed for EU-region primary application data hosting. Some service providers may process limited data outside the EEA where needed to deliver messaging, hosting, observability, or AI assistance."
          },
          {
            title: "Does AI see every owner message?",
            body: "No. AI tasks should receive the minimum necessary context for the active staff workflow. AI outputs are logged for accountability and staff review."
          },
          {
            title: "Can clinics object to a new subprocessor?",
            body: "Clinic rights depend on the signed DPA. PetCura will publish notice and objection language consistent with the final legal agreement."
          }
        ]
      }
    ]
  }
};
