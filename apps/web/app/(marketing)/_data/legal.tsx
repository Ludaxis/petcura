import type { LegalPageShellProps } from "../_components/LegalPageShell";
import { CookiePreferences } from "../_components/CookiePreferences";

export const legalRoutes = {
  terms: "/terms",
  dpa: "/dpa",
  privacy: "/privacy",
  cookies: "/cookies",
  subprocessors: "/subprocessors"
} as const;

export const legalNavLinks = [
  { href: legalRoutes.terms, label: "Terms" },
  { href: legalRoutes.dpa, label: "DPA" },
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
  terms: {
    metadata: {
      title: "PetCura Terms of Service",
      description:
        "The pilot-stage service terms for clinics and invited owner users who use PetCura."
    },
    eyebrow: "Terms",
    title: "Terms of Service",
    lede:
      "These terms describe how clinics and invited pet owners may use PetCura during the pilot stage. Signed order forms, data processing agreements, and clinic-specific agreements control where they conflict with this public summary.",
    updatedDate,
    updatedDateTime,
    callouts: [
      {
        title: "Pilot-stage terms",
        tone: "notice",
        body: "Commercial details, legal entity information, governing law, fees, and service levels must be confirmed in the signed customer agreement."
      },
      {
        title: "Not veterinary care",
        tone: "caution",
        body: "PetCura structures communication and workflow. It is not a PMS, emergency service, diagnosis tool, prescription tool, or substitute for veterinary professionals."
      },
      {
        title: "Clinic-controlled data",
        tone: "trust",
        body: (
          <>
            The clinic remains responsible for owner communications and medical
            decisions. PetCura processes clinic-controlled data under the{" "}
            <a href={legalRoutes.dpa}>Data Processing Addendum</a>.
          </>
        )
      }
    ],
    sections: [
      {
        id: "agreement",
        title: "Agreement Scope",
        body: (
          <>
            <p>
              These Terms apply to access to PetCura&apos;s website, clinic
              workspace, owner-facing intake or chat surfaces, integrations,
              support, and related services. A clinic may also have an order
              form, pilot agreement, data processing addendum, security exhibit,
              or other written agreement with PetCura.
            </p>
            <p>
              If a signed agreement conflicts with this public Terms page, the
              signed agreement controls for that clinic relationship.
            </p>
          </>
        )
      },
      {
        id: "product-role",
        title: "What PetCura Does",
        items: [
          "Receives owner requests through WhatsApp, web intake, or fallback channels configured by the clinic.",
          "Structures requests into a clinic inbox so staff can triage, reply, follow up, and export records.",
          "Assists staff with drafts, summaries, translations, categories, risk flags, reminders, and audit records.",
          "Tracks workflow, delivery events, and AI accountability metadata.",
          "Leaves medical judgment, final urgency, diagnosis, prescriptions, and PMS records with the clinic."
        ]
      },
      {
        id: "clinic-responsibilities",
        title: "Clinic Responsibilities",
        items: [
          {
            title: "Authority",
            body: "The person creating or administering a clinic account must have authority to bind the clinic or must use PetCura only under an approved pilot invitation."
          },
          {
            title: "Owner communication",
            body: "The clinic is responsible for obtaining required owner permissions, maintaining accurate clinic contact details, and deciding what messages are sent to owners."
          },
          {
            title: "Medical decisions",
            body: "Clinic staff must review clinical context, decide urgency, approve medical replies, and keep the PMS or other medical system of record current."
          },
          {
            title: "Users and access",
            body: "The clinic must invite only appropriate staff, remove access when roles change, and keep credentials secure."
          },
          {
            title: "Compliance",
            body: "The clinic remains responsible for its professional, clinical, privacy, recordkeeping, and messaging obligations."
          }
        ]
      },
      {
        id: "owner-use",
        title: "Pet Owner Use",
        body: (
          <p>
            Pet owners should use PetCura only when a clinic invites them or
            makes a PetCura intake path available. Owners should not rely on
            PetCura for emergencies. If a pet may need urgent care, the owner
            should call the clinic, use the clinic&apos;s emergency instructions,
            or seek local emergency veterinary care.
          </p>
        )
      },
      {
        id: "ai-assistance",
        title: "AI Assistance",
        body: (
          <>
            <p>
              PetCura AI is a staff-assistance feature. It may help with
              intake questions, summaries, translation, category suggestions,
              risk flags, memory context, and reply drafts. It does not
              diagnose, prescribe, set final urgency, or auto-send medical
              advice.
            </p>
            <p>
              Clinic staff are responsible for reviewing AI-assisted content
              before using it in owner-facing medical communication. PetCura
              stores AI accountability records as described in the Privacy
              Notice and customer agreement.
            </p>
          </>
        )
      },
      {
        id: "acceptable-use",
        title: "Acceptable Use",
        items: [
          "Do not use PetCura to send spam, deceptive messages, unlawful content, or communications that violate WhatsApp, SMS, telecom, or clinic policies.",
          "Do not attempt to bypass authentication, tenant isolation, rate limits, audit logs, security controls, or AI safety controls.",
          "Do not upload malware, production secrets, stolen data, or content you do not have rights to process.",
          "Do not use PetCura to build a competing product by copying non-public product behavior, interfaces, or documentation.",
          "Do not use PetCura for emergency dispatch, autonomous diagnosis, prescription, or final medical triage."
        ]
      },
      {
        id: "data-protection",
        title: "Data Protection",
        body: (
          <>
            <p>
              PetCura processes clinic-controlled personal data as a processor
              under the clinic&apos;s documented instructions and the applicable{" "}
              <a href={legalRoutes.dpa}>Data Processing Addendum</a>. PetCura
              may act as an independent controller for its own website, sales,
              account administration, support, security, and operational data.
            </p>
            <p>
              The Privacy Notice, Cookie Notice, Subprocessors page, and signed
              customer agreement provide more detail about roles, processing,
              retention, transfers, subprocessors, and privacy rights.
            </p>
          </>
        )
      },
      {
        id: "integrations",
        title: "Integrations And Third-Party Services",
        body: (
          <p>
            PetCura may connect to WhatsApp, SMS, PMS export destinations,
            background job providers, hosting providers, analytics,
            observability tools, AI providers, and other clinic-approved
            systems. Third-party services may have their own terms, service
            limitations, routing, and availability. PetCura is not responsible
            for a third-party service outside PetCura&apos;s reasonable control.
          </p>
        )
      },
      {
        id: "fees",
        title: "Fees, Trials, And Pilot Access",
        body: (
          <p>
            Pilot pricing, free trials, usage limits, renewal terms, taxes,
            payment timing, and cancellation rights are set out in the signed
            order form or pilot agreement. If no paid order is signed, PetCura
            may limit, change, or end pilot access with reasonable notice.
          </p>
        )
      },
      {
        id: "availability",
        title: "Availability And Changes",
        body: (
          <p>
            PetCura aims to provide a reliable service, but pilot features may
            change as we learn from clinics. We may add, remove, or modify
            features to improve safety, security, reliability, compliance,
            performance, or product fit. Any committed service levels must be
            stated in a signed agreement.
          </p>
        )
      },
      {
        id: "ip",
        title: "Intellectual Property",
        body: (
          <p>
            PetCura and its licensors own the product, software, design,
            documentation, workflows, and non-public product materials. Clinics
            and owners keep their rights in data and content they submit.
            Feedback may be used by PetCura to improve the product without
            obligation, unless a signed agreement says otherwise.
          </p>
        )
      },
      {
        id: "termination",
        title: "Suspension And Termination",
        body: (
          <p>
            PetCura may suspend access where needed to address security risks,
            unlawful use, non-payment, misuse, suspected compromise, legal
            obligations, or material breach. Termination, export, deletion, and
            transition assistance are handled under the signed customer
            agreement and Data Processing Addendum.
          </p>
        )
      },
      {
        id: "liability",
        title: "Disclaimers And Liability",
        body: (
          <p>
            PetCura is provided with the warranties, disclaimers, liability
            limits, exclusions, indemnities, and remedies stated in the signed
            customer agreement. Until final legal terms are approved, public
            website copy should not be treated as a complete legal contract or
            as legal, medical, or regulatory advice.
          </p>
        )
      },
      {
        id: "contact",
        title: "Contact",
        body: (
          <p>
            For terms, privacy, or security questions, contact{" "}
            <a href="mailto:legal@petcura.app">legal@petcura.app</a>,{" "}
            <a href="mailto:privacy@petcura.app">privacy@petcura.app</a>, or{" "}
            <a href="mailto:security@petcura.app">security@petcura.app</a>.
          </p>
        )
      }
    ]
  },
  dpa: {
    metadata: {
      title: "PetCura Data Processing Addendum",
      description:
        "A public DPA overview for PetCura clinic customers, covering controller and processor roles, Article 28 processing details, subprocessors, security, and data rights support."
    },
    eyebrow: "DPA",
    title: "Data Processing Addendum",
    lede:
      "This public DPA overview explains PetCura's processor commitments for clinic-controlled personal data. The signed DPA or customer agreement controls the legal relationship with each clinic.",
    updatedDate,
    updatedDateTime,
    callouts: [
      {
        title: "Article 28 structure",
        tone: "trust",
        body: "This overview follows the GDPR controller-processor contract topics: subject matter, duration, nature, purpose, data types, data subjects, and controller rights."
      },
      {
        title: "Signed DPA controls",
        tone: "notice",
        body: "This page is a public summary and implementation target. Clinics should rely on the signed DPA for binding obligations."
      },
      {
        title: "Legal review required",
        tone: "caution",
        body: "Entity details, audit mechanics, liability, transfer modules, breach timelines, and final vendor terms must be approved by counsel before launch."
      }
    ],
    sections: [
      {
        id: "roles",
        title: "Roles",
        body: (
          <>
            <p>
              For clinic communication data, the clinic is the controller and
              PetCura is the processor. PetCura processes that personal data
              only to provide, secure, support, improve, and document the
              PetCura service under the clinic&apos;s documented instructions.
            </p>
            <p>
              PetCura may act as an independent controller for its own website,
              sales, account administration, support, security, and operational
              data, as described in the Privacy Notice.
            </p>
          </>
        )
      },
      {
        id: "processing-details",
        title: "Processing Details",
        items: [
          {
            title: "Subject matter",
            body: "Clinic communication, intake, follow-up workflow, delivery tracking, AI-assisted staff review, exports, auditability, support, and security."
          },
          {
            title: "Duration",
            body: "For the term of the clinic agreement and any post-termination export, deletion, audit, legal, or security period agreed in writing."
          },
          {
            title: "Nature and purpose",
            body: "Hosting, storing, transmitting, organizing, analyzing for staff assistance, securing, logging, exporting, deleting, and supporting clinic-controlled communications and workflow records."
          },
          {
            title: "Data subjects",
            body: "Clinic staff, pet owners or representatives, and other people whose details appear in clinic communications or workflow records."
          },
          {
            title: "Personal data categories",
            body: "Contact details, messages, attachments, pet/request context, workflow notes, reminders, delivery metadata, account data, support data, audit logs, and AI accountability records."
          },
          {
            title: "Special category or sensitive context",
            body: "PetCura is not a human healthcare system, but owner communications may still contain sensitive personal context. Clinic configuration and staff behavior should minimize unnecessary personal data."
          }
        ]
      },
      {
        id: "processor-commitments",
        title: "Processor Commitments",
        items: [
          "Process clinic-controlled personal data only on documented clinic instructions, unless required by applicable law.",
          "Ensure authorized personnel are subject to confidentiality obligations.",
          "Maintain appropriate technical and organizational measures for access control, tenant isolation, encryption where appropriate, auditability, secure development, monitoring, backups, and incident response.",
          "Support clinic requests for access, correction, export, deletion, restriction, or objection where PetCura processes data as the clinic's processor.",
          "Assist with security, data breach assessment, data protection impact assessments, and supervisory authority consultation where legally required and reasonably applicable.",
          "Return, export, delete, or de-identify clinic-controlled data at termination according to the signed agreement, while preserving limited audit or legal records where required.",
          "Keep records needed to demonstrate processor compliance and make relevant information available under agreed audit terms."
        ]
      },
      {
        id: "subprocessors",
        title: "Subprocessors",
        body: (
          <p>
            PetCura uses subprocessors only for documented service purposes and
            requires them to protect personal data through appropriate
            contractual, security, and confidentiality commitments. Current and
            planned provider categories are listed on the{" "}
            <a href={legalRoutes.subprocessors}>Subprocessors page</a>.
            Material changes are handled under the signed DPA.
          </p>
        )
      },
      {
        id: "security",
        title: "Security Measures",
        items: [
          {
            title: "Access control",
            body: "Role-based access, tenant isolation, least-privilege operational access, staff membership checks, and prompt revocation paths."
          },
          {
            title: "Application security",
            body: "Webhook signature verification, idempotent inbound processing, secrets kept out of client code, input validation, RLS for tenant data, and security headers."
          },
          {
            title: "Auditability",
            body: "Request events, AI outputs, delivery events, staff actions, and relevant system events are logged for operational accountability."
          },
          {
            title: "Operational controls",
            body: "Monitoring, incident response, backups, dependency review, deployment controls, and environment separation."
          },
          {
            title: "AI controls",
            body: "Minimum-necessary prompts, staff approval for medical replies, provider-route documentation, prompt versioning, output accountability, and review status tracking."
          }
        ]
      },
      {
        id: "transfers",
        title: "International Transfers",
        body: (
          <p>
            PetCura is designed for EU-region primary application data hosting.
            Some subprocessors may process limited data outside the EEA when
            needed for messaging, hosting, observability, AI assistance, or
            support. Transfer mechanisms, regional configuration, and provider
            terms must be documented in the signed DPA or subprocessor record.
          </p>
        )
      },
      {
        id: "breach",
        title: "Security Incidents",
        body: (
          <p>
            PetCura will notify affected clinic customers without undue delay
            after confirming a personal data breach involving clinic-controlled
            personal data processed by PetCura, and will provide information
            reasonably needed for the clinic to meet its own notification
            obligations. Exact timelines and escalation paths belong in the
            signed DPA.
          </p>
        )
      },
      {
        id: "deletion-export",
        title: "Export And Deletion",
        body: (
          <p>
            PetCura supports clinic-controlled export and deletion workflows
            consistent with auditability, security, legal retention, backup
            lifecycle, and veterinary recordkeeping requirements. Erasure flows
            should minimize personal data while preserving required audit
            integrity.
          </p>
        )
      },
      {
        id: "order-of-precedence",
        title: "Order Of Precedence",
        body: (
          <p>
            If this public DPA overview conflicts with a signed customer
            agreement, signed DPA, standard contractual clauses, or legally
            required data transfer terms, the signed or legally required terms
            control.
          </p>
        )
      }
    ]
  },
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
