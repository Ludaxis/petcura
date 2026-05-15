# Public Legal And Trust Copy

Last updated: 2026-05-15

Status: Website-ready draft for legal review. Do not publish as final legal text until counsel approves entity details, vendor contracts, transfer mechanisms, retention periods, cookie inventory, and AI inference settings.

Owner: UX writing/content specialist

Scope: Public copy for `/privacy`, `/cookies`, `/subprocessors`, trust-center enhancements, footer/legal microcopy, and legal-review placeholders.

## Claim Guardrails

Use:

- PetCura is the WhatsApp-native ClientOps inbox for veterinary clinics.
- The clinic remains the data controller. PetCura acts as the processor for clinic-controlled owner and patient communication data.
- The clinic PMS remains the medical system of record.
- Primary application data is designed to be hosted in EU regions.
- PetCura keeps audit trails for requests, staff actions, AI outputs, exports, reminders, and message delivery lifecycle.
- AI assists staff with intake questions, category suggestions, risk flags, summaries, translations, and reply drafts.
- Staff approve owner-facing medical replies before they are sent.
- PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice.
- SOC 2 is in progress.
- ISO 27001 is planned.

Do not use:

- Completed SOC 2, SOC 2 certified, SOC 2 compliant, or SOC 2 Type II unless an audit report exists and legal approves the exact scope.
- ISO 27001 certified or compliant unless certification exists and legal approves the exact scope.
- EU AI Act certified, EU AI Act conformant, or equivalent completed-compliance claims.
- "EU-only" unless every production subprocessor and transfer path supports that claim.
- "We do not train models on clinic data" until every deployed AI provider route, DPA, inference setting, and product behavior supports that exact statement.

## `/privacy`

### Page Title

Privacy

### Hero

PetCura protects the communication layer around veterinary care.

Veterinary clinics use PetCura to manage WhatsApp intake, owner replies, reminders, follow-ups, AI-assisted drafts, and exports into their existing PMS. The clinic remains the controller of owner and patient data. PetCura processes that data on the clinic's behalf.

### Short Version

- Your clinic stays in control of owner and patient data.
- PetCura helps the clinic organize communication, not replace the PMS.
- AI suggestions are for staff review. They are not diagnosis, prescription, final urgency, or auto-sent medical advice.
- Primary application data is designed for EU-region hosting.
- We use a small set of subprocessors to run messaging, hosting, database, observability, background jobs, and AI assistance.
- We do not sell owner data or use owner conversations for advertising.

### Who This Notice Is For

This notice is for clinic staff, clinic buyers, pet owners who interact with a clinic through PetCura, and website visitors.

If you are a pet owner, your veterinary clinic is usually the best first contact for privacy requests about your pet, appointment, message, or medical context. PetCura supports the clinic in responding to those requests.

### What PetCura Processes

PetCura may process:

- clinic account and staff profile details;
- owner contact details, such as name, phone number, email, and preferred language;
- messages, forms, attachments, and delivery metadata sent through WhatsApp, SMS, or web intake;
- pet and request details provided by the owner or clinic staff;
- categories, risk flags, reminders, exports, and staff workflow notes;
- audit logs for requests, staff actions, AI outputs, delivery events, and exports;
- product, security, support, and website analytics needed to operate and improve the service.

PetCura is not the clinic PMS. The PMS remains the medical system of record.

### How PetCura Uses Data

We use data to:

- deliver the PetCura service to clinics;
- route owner messages into the clinic inbox;
- help staff structure intake and follow-up work;
- create staff-reviewed drafts, summaries, translations, category suggestions, and risk flags;
- send clinic-approved replies, reminders, and fallback SMS where configured;
- export clean communication records to the clinic's PMS or files;
- maintain audit trails and accountability records;
- secure, monitor, debug, and improve the service;
- meet contractual and legal obligations.

We do not sell owner data. We do not use owner conversations for advertising.

### AI Assistance

PetCura's AI assists clinic staff. It does not replace veterinary professionals.

AI may help structure intake, suggest categories or risk flags, summarize conversations, translate messages, and draft replies for staff review. Staff approve owner-facing medical replies before sending. PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice.

For accountability, AI outputs are logged with model and prompt details, input and output records, confidence where available, review status, and edits made by staff.

[LEGAL REVIEW: Add provider-specific language about model training, retention, region, abuse monitoring, and opt-out settings only after deployed provider contracts and inference settings are confirmed.]

### Controller And Processor Roles

For clinic communication data, the clinic is the controller and PetCura is the processor. PetCura processes that data under the clinic's instructions and the applicable data processing agreement.

For PetCura's own website, sales, account administration, security, and support operations, PetCura may act as an independent controller. In those cases, we process only what is needed to respond, secure the service, and manage the business relationship.

[LEGAL REVIEW: Insert legal entity name, registered address, DPO or privacy contact, governing law, and supervisory authority details.]

### Where Data Is Processed

PetCura is designed for EU-region primary application data hosting.

Some service providers, including messaging, observability, hosting, and AI providers, may process limited data outside the EEA where needed to provide the service. PetCura documents subprocessors, data categories, regions, and transfer safeguards on the Subprocessors page.

[LEGAL REVIEW: Confirm exact production regions, transfer mechanisms, SCCs, adequacy decisions, TIAs, and any country-specific restrictions before publication.]

### Retention

Clinics control retention for clinic-owned communication records, subject to their legal and clinical obligations. PetCura keeps data while needed to provide the service, support clinic-controlled export or erasure, maintain auditability, secure the product, and meet legal obligations.

Audit records may be retained where necessary to preserve security, accountability, and dispute-resolution requirements while minimizing personal data.

[LEGAL REVIEW: Insert retention periods for account data, messages, attachments, AI outputs, audit logs, delivery events, backups, support tickets, and marketing leads.]

### Privacy Rights

Pet owners can ask their clinic for access, correction, export, restriction, or deletion of personal data. PetCura helps the clinic respond where PetCura processes data on the clinic's behalf.

Clinic staff and website visitors may contact PetCura directly for requests about PetCura account, website, sales, support, or security data.

Contact: privacy@petcura.app

[LEGAL REVIEW: Confirm mailbox, request workflow, identity verification flow, response timelines, and exceptions for audit retention.]

### Security

PetCura is built with tenant isolation, access controls, webhook signature verification, idempotent message handling, secret management, audit logging, and operational monitoring. We review vendors before production use and keep security and compliance documentation current for clinic buyers.

SOC 2 is in progress. ISO 27001 is planned.

### Important Care Notice

PetCura is not an emergency service and does not provide veterinary medical advice. If an owner believes a pet may need urgent care, they should contact their clinic by phone or seek local emergency veterinary care.

## `/cookies`

### Page Title

Cookie Notice

### Hero

We use only the cookies and similar technologies needed to run PetCura, remember your choices, keep the service secure, and understand whether the product is working.

### Cookie Banner

PetCura uses essential cookies to run the site and secure your session. With your permission, we use analytics cookies to understand product usage and improve clinic workflows. We do not use advertising cookies.

Buttons:

- Accept analytics
- Reject optional
- Manage choices

### Categories

| Category | Purpose | Choice |
| --- | --- | --- |
| Essential | Sign-in, session security, clinic or owner routing, language, theme, cookie choices, and service reliability. | Always on |
| Analytics | Website and product usage measurement, conversion events, performance, and error trends. | Optional |
| Support and diagnostics | Error reports, logs, uptime checks, and security diagnostics. | Limited to what is needed to run and secure the service |
| Advertising | PetCura does not use advertising cookies or owner-message retargeting. | Not used |

### Cookie Settings Copy

You can change your cookie choices at any time from Cookie settings.

Analytics is optional. Rejecting analytics will not block access to PetCura.

### Conservative Analytics Copy

When analytics is enabled, PetCura measures page views, product events, and performance signals so we can improve onboarding, intake, inbox reliability, and clinic workflows. We avoid sending owner message content, medical notes, or attachments into analytics tools.

[LEGAL REVIEW: Confirm analytics implementation, consent mode, whether any analytics can qualify as consent-exempt in target jurisdictions, and whether session replay is disabled or separately consented.]

### Cookie Inventory Placeholder

[LEGAL REVIEW: Replace with final inventory before publication.]

| Name | Provider | Category | Purpose | Duration |
| --- | --- | --- | --- | --- |
| TBD | PetCura | Essential | Session, routing, preference, or consent function. | TBD |
| TBD | Supabase | Essential | Authentication/session support. | TBD |
| TBD | PostHog EU | Analytics | Product and website analytics, if enabled. | TBD |
| TBD | Sentry | Diagnostics | Error monitoring, if enabled. | TBD |

## `/subprocessors`

### Page Title

Subprocessors

### Hero

PetCura uses a small set of service providers to deliver secure clinic communication.

Each provider is reviewed for purpose, data categories, region, transfer mechanism, and contract coverage before production use. Clinics receive notice of material changes as set out in the DPA.

### Buyer Summary

- Primary application data is designed for EU-region hosting.
- Messaging providers may process message content and delivery metadata to send WhatsApp or SMS messages.
- Observability tools receive limited operational, diagnostic, or product analytics data.
- AI providers receive only the minimum necessary context for staff-facing assistance, subject to contract and product controls.
- PetCura does not sell owner data.

### Draft Subprocessor Table

[LEGAL REVIEW: Confirm final vendor list, legal entity names, products, processing locations, transfer mechanisms, DPA availability, retention, and whether each vendor is active, planned, or optional.]

| Provider | Purpose | Data categories | Region/residency copy | Public status copy |
| --- | --- | --- | --- | --- |
| Supabase | Database, authentication, storage, and realtime infrastructure. | Clinic records, staff accounts, owner request data, attachments, audit logs, AI accountability records. | Primary project region to be configured in the EU. | Core infrastructure. DPA and EU region selection required before pilot go-live. |
| Vercel | Web hosting, server-side execution, CDN, and deployment logs. | HTTP request metadata, operational logs, limited application data during request processing. | Function regions must be configured and documented. CDN and platform operations may be global. | Core hosting. Publish only after production region and logging configuration are confirmed. |
| Twilio | WhatsApp Business and SMS delivery, delivery status, and messaging webhooks. | Phone numbers, message content, media, delivery events, channel metadata. | Global communications infrastructure; transfers require documented safeguards. | Core messaging provider. WhatsApp/SMS terms, DPA, and opt-in flows must be reviewed. |
| Meta / WhatsApp | WhatsApp Business channel and platform rules. | Customer contact information, WhatsApp message content and metadata as required for WhatsApp delivery. | Global WhatsApp service; terms include processor and subprocessor provisions for covered business data. | Required for WhatsApp channel. Do not imply WhatsApp is EU-only. |
| Inngest | Background jobs for AI tasks, reminders, delivery retries, exports, and scheduled workflows. | Event payloads, job state, operational metadata; minimize or encrypt sensitive payloads where feasible. | Vendor security materials state cloud data hosting in the United States unless self-hosted or otherwise contracted. | Planned/core jobs provider. Review DPA, region, payload minimization, and encryption middleware before production use. |
| Sentry | Error monitoring and application diagnostics. | Error events, stack traces, device/browser metadata, limited request context. | EU data center available; some data may be stored outside selected region per vendor docs. | Optional diagnostics provider. PII scrubbing and EU org selection required before pilot go-live. |
| PostHog EU | Product analytics and usage measurement. | Pseudonymous product events, page views, performance signals, conversion events. | EU Cloud option available. | Optional analytics provider. No owner message content. Session replay requires separate legal/product approval. |
| Better Stack | Uptime monitoring, logging, incident response, and status pages. | Operational logs, uptime events, alert metadata, limited request diagnostics. | Vendor states data is stored in EU regions by default. | Observability provider. Confirm log redaction and retention before production use. |
| AI inference provider(s) | Staff-facing intake questions, summaries, translations, category suggestions, risk flags, memory context, and reply drafts. | Minimum necessary message excerpts, structured prompts, model outputs, token usage, latency, prompt version, review status. | TBD by provider route and contract. | Do not name or publish provider-specific claims until DPA, no-training settings, retention, and residency are approved. |

### Change Notice Copy

We keep this list current. If we add or replace a subprocessor that materially affects clinic-controlled data, we will notify clinic customers according to the DPA.

### Subprocessor FAQ

**Does PetCura sell owner data?**

No. PetCura does not sell owner data or use owner conversations for advertising.

**Is PetCura EU-hosted?**

PetCura is designed for EU-region primary application data hosting. Some service providers may process limited data outside the EEA where needed to deliver messaging, hosting, observability, or AI assistance. Those providers and transfer safeguards are documented here.

**Does AI see every owner message?**

No. AI tasks should receive the minimum necessary context for the active staff workflow. AI outputs are logged for accountability and staff review.

**Can clinics object to a new subprocessor?**

Clinic rights depend on the signed DPA. PetCura will publish notice and objection language consistent with the final legal agreement.

## Trust Center Enhancements

### Trust Hero

Trust for the clinic communication layer.

PetCura helps veterinary teams manage owner communication without moving the medical record out of the PMS. We keep the workflow accountable: every request, staff action, AI output, delivery event, reminder, and export has a trail.

Trust badges:

- EU-region primary data design
- GDPR processor model
- Staff-approved AI
- Full audit trail
- SOC 2 in progress
- ISO 27001 planned

### Clinic Controls The Record

Your PMS remains the medical system of record. PetCura organizes the conversation around it: intake, inbox, replies, reminders, follow-ups, and exports.

### Staff-Approved AI

PetCura drafts. Your team decides.

AI can summarize, translate, suggest categories or risk flags, and draft replies. Staff review owner-facing medical content before it is sent. PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice.

### Auditability

The inbox is not a black box. PetCura logs request timelines, message delivery events, staff actions, AI outputs, edits, reviews, reminders, and exports so clinics can see what happened and why.

### Security And Compliance Roadmap

PetCura is built for EU veterinary clinics and pilot-stage procurement reviews.

- Primary application data: EU-region design
- GDPR posture: clinic controller, PetCura processor
- SOC 2: in progress
- ISO 27001: planned
- AI Act readiness: tracked, with human review and output accountability

### Trust FAQ

**Is PetCura a PMS?**

No. PetCura does not replace the PMS. PetCura manages communication, intake, follow-ups, reminders, exports, AI assistance, and auditability.

**Does PetCura make medical decisions?**

No. PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice. Staff approve medical replies before they leave the clinic.

**Where is data hosted?**

Primary application data is designed for EU-region hosting. Some subprocessors may process limited data outside the EEA where needed to provide messaging, hosting, observability, or AI assistance.

**Can a clinic export its records?**

Yes. PetCura is designed to export clean communication records for the clinic's PMS and operational records.

**Can owners request deletion or export?**

Owners should contact their clinic first. PetCura supports clinics with export and erasure workflows while preserving required audit records where legally necessary.

## Footer And Legal Microcopy

### Footer Line

PetCura is a WhatsApp-native ClientOps inbox for veterinary clinics. It is not a PMS and does not provide veterinary medical advice.

### Legal Nav

Privacy | Cookies | Subprocessors | Trust Center | Status | Contact

### Demo Form Consent

By submitting this form, you agree that PetCura may contact you about your request. See our Privacy notice.

### Owner Intake Notice

Your clinic uses PetCura to collect this request. PetCura processes your information on the clinic's behalf. If your pet may need urgent care, call your clinic or local emergency veterinary service.

### AI Draft Label

AI draft. Review before sending.

### AI Safety Tooltip

PetCura can draft and summarize for staff review. It does not diagnose, prescribe, set final urgency, or auto-send medical advice.

### Audit Tooltip

PetCura logs request events, delivery events, staff actions, AI outputs, and exports for clinic accountability.

### Subprocessor Link Label

See where PetCura data is processed.

### Cookie Settings Link

Cookie settings

### Privacy Request Link

Privacy requests: privacy@petcura.app

## Legal-Review Placeholders

Resolve before publication:

- Legal entity name, registration number, registered address, and contracting entity.
- Privacy contact, DPO contact if applicable, and supervisory authority.
- Final DPA link and clinic customer terms.
- Exact controller/processor language for clinic data, staff account data, website leads, support, and security logs.
- Production hosting regions for Supabase and Vercel.
- Final subprocessor list, legal entities, regions, transfer mechanisms, DPA links, and notification process.
- AI provider route list, model names where public, region, retention, training/no-training terms, abuse-monitoring behavior, and opt-out settings.
- Cookie inventory: names, providers, categories, purposes, durations, consent state, and withdrawal flow.
- Analytics implementation, consent basis, and whether session replay is disabled.
- Retention periods for owner messages, attachments, AI outputs, audit logs, delivery events, exports, backups, support tickets, and marketing leads.
- GDPR export and erasure workflow, including audit-retention exceptions and PII minimization.
- Incident notice wording and breach escalation timelines.
- WhatsApp/SMS opt-in, stop, emergency-care disclaimer, and channel fallback wording.
- SOC 2 roadmap language, auditor if public, scope, and timeline.
- ISO 27001 roadmap language, scope, and timeline.
- Local veterinary-care disclaimers for launch countries.
- Whether any veterinary/owner data is treated as special-category or heightened-risk data under local law.

## Source Links

Internal PetCura sources:

- [Trust Center Contract](../contracts/trust-center.md)
- [Security and Compliance](../architecture/security-compliance.md)
- [AI Safety](../architecture/ai-safety.md)
- [Product Brief](../product/product-brief.md)
- [Data Model](../architecture/data-model.md)
- [System Architecture](../architecture/system-architecture.md)

External legal, vendor, and standards sources:

- [EDPB GDPR Article 28 - Processor](https://www.edpb.europa.eu/gdpr-articles/article-28-processor_en)
- [EDPB GDPR Article 12 - Transparent information](https://www.edpb.europa.eu/gdpr-articles/article-12-transparent-information-communication-and-modalities-exercise-rights-data_en)
- [EDPB GDPR Article 33 - Breach notification](https://www.edpb.europa.eu/gdpr-articles/article-33-notification-personal-data-breach-supervisory-authority_en)
- [EDPB SME guide - Data breaches](https://www.edpb.europa.eu/sme-data-protection-guide/data-breaches_en)
- [European Commission - When is consent valid?](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/legal-grounds-processing-data/grounds-processing/when-consent-valid_en)
- [EDPB Guidelines 05/2020 on consent](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en)
- [European Commission - AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [AICPA & CIMA SOC 2 Trust Services Criteria overview](https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2)
- [AICPA & CIMA SOC 2 description criteria](https://www.aicpa-cima.com/resources/download/get-description-criteria-for-your-organizations-soc-2-r-report)
- [ISO/IEC 27001 overview](https://www.iso.org/standard/27001)
- [Supabase regions](https://supabase.com/docs/guides/platform/regions)
- [Supabase DPA](https://supabase.com/downloads/docs/Supabase%2BDPA%2B260317.pdf)
- [Vercel DPA](https://vercel.com/legal/dpa)
- [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
- [Twilio data privacy](https://www.twilio.com/en-us/privacy)
- [Twilio subprocessors](https://www.twilio.com/en-us/legal/sub-processors)
- [WhatsApp Business Terms](https://www.whatsapp.com/legal/business-terms/)
- [WhatsApp Business Data Processing Terms](https://www.whatsapp.com/legal/business-data-processing-terms/)
- [WhatsApp Business Solution Terms](https://www.whatsapp.com/legal/business-solution-terms/)
- [Inngest security docs](https://www.inngest.com/docs/learn/security)
- [Inngest security page](https://www.inngest.com/security)
- [Sentry EU Region FAQ](https://sentry.zendesk.com/hc/en-us/articles/25074658211227-Sentry-s-EU-Region-FAQ)
- [PostHog Trust Center](https://trust.posthog.com/)
- [PostHog Cloud region selector](https://posthog.com/)
- [Better Stack security and compliance](https://betterstack.com/security)
