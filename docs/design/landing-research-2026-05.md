# Landing Page Research — AI Startups, May 2026

PetCura redesign brief. Researched 2026-05-14. Owner: design (Claude). Reviewers: product, founder.

The current `apps/web/app/page.tsx` is a scaffold demo, not a marketing site. This doc captures where AI-startup landing pages have moved in May 2026, where vet-vertical incumbents sit, and what PetCura specifically should ship.

---

## 1. TL;DR — Five highest-leverage moves

**1. Lead with the channel, not the category.** Hero verb-led, WhatsApp-first, with the WhatsApp Business mark visible. Working draft: *"The WhatsApp inbox built for veterinary clinics."* Subhead: *"Turn phone chaos into structured requests, safe AI drafts, and clean PMS exports — without changing how owners message you."* No vet incumbent does this; we own the wedge in one line.

**2. Show the product as motion in the hero.** 6–12s silent loop: raw owner WhatsApp message → AI-suggested category → staff-approved reply → audit-logged export to PMS. This is the Granola/Sierra "watch the agent work" pattern. We already have `request_events` and `ai_outputs` to back the audit-trail beat with a real screenshot, not a mock.

**3. Publish the AI safety contract on the page.** Mirror `AGENTS.md` AI Safety Rules as a first-class section: *"PetCura drafts. Your team decides. PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice."* Negative enumeration is the strongest credible-to-DVMs move. Zero vet incumbents do it.

**4. Make EU/GDPR/audit-trail the trust frame, not "10,000+ clinics."** Sub-hero trust strip: *"EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress."* Add the Nabla line verbatim: *"We don't train your data on our models."* The entire vet category leaves EU residency unclaimed.

**5. Break the demo wall.** Vet incumbents all gate on demo. Pair *"Book a 15-min clinic demo"* with one of: (a) a sandbox inbox seeded with fake owner messages, or (b) visible pilot pricing per clinic. Provet (per-DVM price) and Scribenote (free tier + pricing + SOC 2) prove this builds trust at this stage.

---

## 2. AI landing trends, May 2026

### Hero structure
- **Centered hero is the 2026 winner** for vertical AI / B2B SaaS. Outcome headline (4–8 words) + verb-led subhead (one constraint) + dual CTA + product visual directly underneath.
- **Static, polished product screenshot** beats animation for enterprise (Linear, Harvey, Hebbia). **Short silent loops (6–12s)** for motion-driven products (Granola, Cursor). **Live in-hero playgrounds** only for narrow-scope tools (v0, Lovable).
- **Eyebrow pill** announcing compliance or momentum is near-universal (Sierra's ISO 42001 pill is the archetype).
- "Vibes" gradients with no product are tired. Reserve for foundation-model labs.

> **PetCura applies this as**: centered light hero, real product UI screenshot or 6–12s loop of the WhatsApp → inbox transformation, eyebrow pill reading *"EU-hosted · GDPR-aligned · Built for veterinary clinics."*

### Section canon (vertical AI)
Hero → logo bar → problem framing → product walkthrough (bento/chess) → use cases → "how it works" → integrations grid → security/compliance → testimonials with numbers → pricing → FAQ → final full-width CTA. **9–12 sections is normal.** AI-specific additions vs. traditional SaaS: "how the AI works," explicit human-in-the-loop, eval/quality numbers, capability matrix, model/provider transparency.

> **PetCura applies this as**: hero → pilot clinic logos → problem (4-place phone chaos) → product walkthrough (3-step bento) → use cases (front desk / vet tech / clinic owner) → integrations (Twilio WhatsApp, PMS, calendar) → **AI safety contract** → **compliance + EU residency** → testimonial + numbers → pilot pricing → FAQ → final CTA.

### Visual trends
- **Color**: dark-mode for devtools (Linear, Vercel, Cursor); editorial cream + serif for enterprise vertical AI (Sierra, Harvey); confident single-accent for prosumer (Granola green). Multi-stop neon gradients read 2023.
- **Type**: oversized display (60–96px), tight tracking. **Serifs are back** for trust-heavy verticals. Mono reserved for devtools.
- **Motion**: restrained. Short product loops + scroll-pinned section transitions + Framer Motion micro-interactions. Lottie has faded for B2B; heavy 3D/WebGL is foundation-lab-only.
- **Light page + dark product UI screenshots** is the highest-trust combo for clinical/ops verticals.

> **PetCura applies this as**: light page (extend existing sage/beige token system), confident sans display, dark UI screenshots inside light sections. No neon, no Lottie. Motion limited to the hero loop + tasteful scroll reveals on bento blocks.

### Trust & social proof
- Logo bar directly under hero in ~90% of pages; 6–10 logos; **static grid beats auto-scroll carousels** (carousels now flagged as a conversion leak in 2026 teardowns).
- Testimonials: short voice quote + named person + role + company logo + headshot. Specificity is the entire game in 2026.
- Case study cards with one big specific number ("64% deflection," "47 seconds saved per visit").
- Security badges (SOC 2, HIPAA, GDPR, ISO 27001, ISO 42001, EU AI Act) get a **dedicated section**, not a footer line. Sierra puts ISO 42001 in the hero eyebrow.
- Video testimonials rising for enterprise.

> **PetCura applies this as**: static logo grid (pilot cohort, even if N=3 — label honestly as "in pilot with"). Single named clinic testimonial in Glean's skepticism-overcome format: *"I was skeptical at first … then [specific outcome]."* Dedicated compliance section with EU AI Act badge as differentiator.

### CTAs
- "Book a demo" caps near 1.5% conversion (Howdygo, Matt Lerner data). **Duration-anchored softening wins**: *"Book a 15-min demo,"* *"See it live,"* *"Get a walkthrough."*
- **First-person CTAs** (*"Start my pilot"*) outperform second-person by ~14% in 2026 B2B data.
- **Dual CTA is the default**: primary filled, secondary outlined/text-link.
- Sticky CTA in nav after hero scroll is standard; mobile bottom bar is rising.
- "No credit card required" microcopy is **out** — replaced by proof bands underneath the CTA.

> **PetCura applies this as**: primary *"Book a 15-min clinic demo"*; secondary *"See a live inbox tour"* (anchor link to product loop or sandbox). Sticky nav CTA after hero scroll. Mobile bottom-bar CTA. Proof band underneath: pilot clinics logo strip or *"In pilot with 3 EU clinics. Locked-in pilot pricing through 2027."*

### Copy
- **"AI-powered" is dead.** None of Linear, Notion, Granola, Decagon, Harvey, Sierra, Abridge, Cursor use it in the hero. Replace with the concrete capability: *"drafts replies,"* *"summarizes the visit,"* *"flags follow-ups."*
- **"Agent"** is hot but saturating. Smarter move: name what the agent does.
- **"Human in the loop"** is fading as a marketing band-phrase. Replaced by operational verbs ("review, validate, ship" — Sierra) or **negative enumeration** of what the AI refuses to do (Hippocratic: *"Our AI agents do not diagnose or prescribe."*).
- **Skepticism handling**: testimonials that *name the skepticism* — Glean ships *"Nothing worked. So, I was skeptical at first. However, Glean quickly proved that my skepticism was invalid."* — Casey Carlton, Webflow.

> **PetCura applies this as**: kill "AI-powered." Use verbs: *drafts, structures, summarizes, flags, exports.* Reserve "human in the loop" for the `/security` page only. Adopt negative-enumeration directly: *"PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice."*

### Footer table-stakes
Changelog, Status, Trust Center, Manifesto. The Resources/Blog/Webinar mega-footer is dying.

> **PetCura applies this as**: footer includes Changelog (even small early changes — signals momentum), Status, Trust Center (consolidates EU residency, GDPR, audit trail, subprocessors), and a single Manifesto page ("Why phones broke veterinary care").

---

## 3. UX writing patterns — verbatim examples

### Hero headlines
Three working archetypes in 2026:

- **"The X for Y" (noun-led category).** *"The product development system for teams and agents."* — Linear (linear.app). *"The AI Notepad for back-to-back meetings."* — Granola (granola.ai). *"The AI concierge for every customer."* — Decagon (decagon.ai).
- **Outcome / state claim.** *"Practice Made Perfect"* — Harvey (harvey.ai). *"Better customer experiences. Built on Sierra."* — Sierra (sierra.ai). *"Intelligence at the point of conversation"* — Abridge (abridge.com).
- **Provocative declarative.** *"Meet the night shift."* — Notion (notion.com). *"Issue tracking is dead."* — Linear (secondary headline).

Length: 4–8 words. Cursor's longer hero reads dated against this set.

> **PetCura applies this as**: lead option *"The WhatsApp inbox built for veterinary clinics."* (channel-led, owns the wedge). Test variant: *"The ClientOps inbox for veterinary clinics."* (Linear/Decagon noun-led, safer).

### Subheads
Verb-led wins. *"Granola takes your raw meeting notes and makes them awesome"* — Granola. *"Notion agents keep work moving 24/7. They capture knowledge, answer questions, and push projects forward — all while you sleep."* — Notion. Don't stuff proof points into the subhead; Glean separates: hero *"Work AI that works for all,"* then a band *"Glean saves up to 110 hours per user/year."*

> **PetCura applies this as**: *"Turn phone chaos into structured requests, safe AI drafts, and clean PMS exports — without changing how owners message you."* Verb-led, three-beat, ends with the constraint (existing owner behavior).

### Trust copy
- *"Harvey meets the highest industry standards for security and compliance. We include all default controls that enterprise teams expect: SAML SSO, audit logs, IP allow-listing, data lifecycle management, and more."* — Harvey. Specificity > adjectives.
- *"Our AI agents do not diagnose or prescribe."* — Hippocratic AI. The negative-enumeration archetype.
- *"We don't train our models on your data."* — Nabla. The most-copied 2026 data-trust line.
- *"90% of clinicians give more undivided attention. 86% of clinicians do less after-hours work."* — Abridge. Control is implicit in the verb.

> **PetCura applies this as**: drop "human-in-the-loop" as a marketing phrase. Use the moment-of-control: *"Staff approves every owner-facing reply. PetCura drafts. Your team decides."* Adopt Nabla's training line verbatim. Adopt Hippocratic's negative-enumeration directly from `AGENTS.md` AI Safety Rules.

### Feature/section headings
- **Verb-first capabilities**: *"Agents turn ideas into code."* / *"Works autonomously, runs in parallel."* / *"Magically accurate autocomplete."* — Cursor.
- **Outcome-first imperatives**: *"Make product operations self-driving."* / *"Define the product direction."* — Linear.

> **PetCura applies this as**: *"Structure every owner message in seconds."* / *"Draft replies your team can trust."* / *"Export clean records to your PMS."* / *"See every owner conversation, even after hours."*

### CTA microcopy
- Enterprise/vertical AI: **"Get a demo" / "Request a demo"** dominates (Decagon, Glean, Harvey, Abridge, Notion-secondary).
- Prosumer self-serve: **"Get [product] free" / "Start free"** (Notion's *"Get Notion free"* — note the product name in the verb).
- Three CTAs in the hero is cluttered (Cursor's exception).

> **PetCura applies this as**: primary *"Book a 15-min clinic demo."* Secondary *"See a live inbox tour."* No third CTA. No "no credit card required" microcopy.

### Social proof
- One-sentence, character-voiced quotes: *"You just have to use it and you will see, you will just feel it."* — Gabriel Peal, OpenAI (Linear).
- Quote + standalone metric chip (Decagon pattern): *"70% chat and voice resolution"*, *"80% deflection rate."*
- Skepticism-overcome (Glean): *"Nothing worked. So, I was skeptical at first. However, Glean quickly proved that my skepticism was invalid."*
- Logo-bar headings have moved past "Trusted by." *"Powering concierge experiences for the world's leading enterprises."* — Decagon.

> **PetCura applies this as**: single named clinic testimonial, Glean format. Quote + separate metric chip (e.g., *"Phone volume down 40%"*). Logo strip heading: *"In pilot with veterinary clinics across the EU."*

### Tone calibration
- Horizontal AI (Notion, Linear, Cursor): confident, playful, slightly cocky.
- Vertical AI in regulated industries (Harvey, Abridge, Sierra, Decagon): calm, restrained, outcome-quantified.

> **PetCura applies this as**: sit closer to Abridge/Harvey for clinic-facing surfaces (calm, specific, metric-led). Owner-facing surfaces (intake forms, status pages) can borrow Granola's warmth — plainspoken verbs, no jargon, no "AI" word at all.

---

## 4. Vet SaaS competitive teardown

### Digitail — digitail.com
- **Hero**: *"The all-in-one software for better veterinary care."* / *"Cloud-based AI-native veterinary software for simpler operations, improved pet care, and getting home on time."* Primary: **Book a Demo**.
- **AI**: loud and ambitious. "Tails AI" brand with 20+ workflows (SOAP Dictation, Medical Agent, Concierge, Patient Intake, Practice Manager Agent). No safety framing.
- **Social proof**: heavy. 10,000+ vets, named DVMs, "50 hours saved per DVM per month," 4.8 rating. No accreditation badges.
- **CTA**: demo-only, no pricing.
- **Visual**: navy + teal, modern sans, mixed photography + UI.
- **Does well**: granular outcome stats per clinic. **Tired**: "#1 rated all-in-one" + AI-agent grab-bag reads as 2025 feature inflation.

### Vetstoria — vetstoria.com
- **Hero**: *"Veterinary online booking software and websites."* / *"Automate the busy work. Treat more pets."* Primary: **Get A Demo**.
- **AI**: **none.** Strikingly absent for 2026.
- **Social proof**: 10,000+ clinics, 900,000+ appointments monthly, named clinics.
- **CTA**: demo-led, no pricing.
- **Visual**: white/teal/blue, illustrations only.
- **Does well**: crisp single-job framing. **Tired**: zero AI reads as left-behind.

### PetDesk — petdesk.com
- **Hero**: *"Simplify your veterinary clinic. Strengthen your care."* / *"Reclaim your time, connect with clients their way, and grow your clinic with veterinary software trusted by vets and loved by pet parents."* Primary: **Get a demo** (4×).
- **AI**: one feature — "Scribe" (speech to appointment notes). AI is a sub-feature, not the headline.
- **Social proof**: 12,000+ practices, 50% call reduction, 90% no-show decrease.
- **CTA**: demo-only.
- **Visual**: warm, pet-friendly palette; lifestyle photo + product UI.
- **Does well**: "What are you most interested in?" interest-picker as first interaction. **Tired**: "trusted by vets, loved by pet parents" is a vet-SaaS template phrase.

### Provet — provet.com
- **Hero**: *"Book, treat, bill."* / *"In one intelligent veterinary workspace."* Primary: **Book a demo**. Secondary: **Get pricing**.
- **AI**: "AI Scribe" — *"documents the consultation in real time"; "notes, summaries, and records write themselves."* Framed as *"Native AI tools that speak veterinary."* No safety framing.
- **Social proof**: 20M+ pets managed, 55,000+ vet professionals, 150 integrations, 3,000+ clinics. Enterprise logos (CVS, Anicura, IVC Evidensia).
- **CTA**: demo + pricing visible (rare). No free trial.
- **Visual**: purple + teal, real photography, modern sans. Cleanest "Linear-adjacent" execution in the set.
- **Does well**: *"Book, treat, bill."* — only memorable hero in the audit. **Tired**: "intelligent workspace" — universal SaaS filler.

### Otto — otto.vet
- **Hero**: *"Ditch the duct tape. Otto is the all-in-one client communications platform."* / *"Otto truly includes everything you need — no 'upgrade-to-unlock' games, no overage fees."* Primary: **Request Demo**. Secondary: **Try It Free for 21 days** (Scribe only).
- **AI**: Otto AI Scribe + OttoPilot (business insights). No safety framing on home.
- **Social proof**: 10,000+ vet professionals, named clinics, *"reduced incoming calls by about a third."*
- **CTA**: demo-led + 21-day free Scribe trial (rare in this set).
- **Visual**: white + navy + teal, dog illustrations + lifestyle + UI, modern sans.
- **Does well**: transparent pricing language (*"no 'upgrade-to-unlock' games, no overage fees"*). **Tired**: dog puns ("ruff connections") grate quickly.

### PetsApp — petsapp.com (closest direct comp)
- **Hero**: *"The most successful veterinary teams use PetsApp."* / kitchen-sink subhead listing 11 features. Primary: **Schedule a demo**.
- **AI**: CoPilot + Scribe, framed exploratively. No safety framing.
- **Social proof**: HomeVets, Sanderson, Godiva (166 hours saved), Pennard Vets (85% missed-call reduction). Heavy case-study/video.
- **WhatsApp framing**: named **once** in a feature list — **not** the hero. **PetsApp does not position as WhatsApp-native.**
- **CTA**: demo-only.
- **Visual**: white/navy/green, Yorkie character + UI.
- **Does well**: authority-led hero is a confident inversion of "trusted by." **Tired**: 11-feature subhead kills any positioning.

### Scribenote — scribenote.com (AI-scribe outlier worth studying)
- **Hero**: *"AI for veterinarians who love practicing, not paperwork."* / *"Designed with veterinarians, Scribenote's delightful veterinary AI scribe automates documentation to save you hours each day."* Primary: **Get Started for Free**. Secondary: **Book a demo**.
- **AI**: specific and bounded. Explicit human-in-the-loop: *"AI is not perfect"* with <2-min edit step. **Only page in the audit to surface AI safety language.**
- **Social proof**: 6,000+ vets, named clinics, time-savings progression. **SOC 2 Type II badge + trust.scribenote.com.** **Only page in the audit with a compliance certification.**
- **CTA**: self-serve free tier + visible pricing (Free / $79 DVM/mo / Enterprise). Plus 2-week Pro free.
- **Visual**: white, navy, lime CTAs, illustration-heavy.
- **Does well**: publishes pricing + free tier + SOC 2 + HITL language — completes the trust loop in a way no other page does. **Tired**: illustration heroes feel templated.

### Gap analysis: vet SaaS vs. modern AI startups

What the incumbents share, and what's missing:

- **Identical hero formulas.** Five of seven use *"trusted by vets, loved by pet parents"* or *"all-in-one."* Linear/Sierra/Harvey heroes are verb-led, outcome-led, or stance-led — never category-led.
- **Demo-gating as universal CTA.** 6/8 pages have no visible pricing and no self-serve trial. Modern AI pages (Sierra, Granola, Linear) show price or let you try the product in the first scroll.
- **AI as feature grab-bag.** Nobody describes bounded model behavior or what AI is *not allowed* to do — except Scribenote.
- **No compliance signal.** Only Scribenote shows SOC 2. None show GDPR / EU-residency. **Open slot for PetCura.**
- **Navy-and-teal stock visual soup.** Nothing has Granola/Linear-tier typographic restraint.
- **Nobody is WhatsApp-native.** PetsApp uses WhatsApp as a sub-feature. **The positioning slot is unclaimed.**

The five PetCura moves (§1) follow directly from these gaps.

---

## 5. Section-by-section recommended IA

Each section: purpose · content · success criterion.

1. **Hero.** Purpose: anchor the WhatsApp-native wedge in one breath; convert visitor to demo or sandbox. Content: eyebrow pill (EU + GDPR + vertical), headline (channel-led), subhead (verb-led, three-beat, constraint), dual CTA, 6–12s product loop, trust strip beneath. Success: visitor knows what we do, who we're for, and that we're EU/safe within 5s.
2. **Pilot logo strip.** Purpose: honest social proof at small N. Content: 3–6 pilot clinic marks, label as *"In pilot with veterinary clinics across the EU"*. Success: doesn't lie; signals momentum without "10,000+ clinics" theater.
3. **Problem framing — "Phones break clinics."** Purpose: name the pain in clinic-owner language. Content: short scene (4-place phone chaos: front desk + vet + owner-on-hold + missed messages). One stat from product-brief if real. Success: a clinic owner nods within 10 seconds.
4. **Product walkthrough (3-step bento).** Purpose: show the loop concretely. Content: (a) Owner messages on WhatsApp → structured request; (b) Team-approved AI drafts; (c) Clean PMS export with full audit trail. Real product screenshots, not mocks. Success: clinic owner can repeat the workflow back without reading.
5. **Use cases.** Purpose: let buyer self-identify. Content: front desk / vet tech / clinic owner. One outcome + one screenshot per. Success: each role sees themselves; small clinics see "this fits us."
6. **Integrations.** Purpose: dissolve switching anxiety. Content: Twilio WhatsApp Business, PMS partners (named where real, "PMS-friendly exports" where not yet), calendar. Success: visitor sees PetCura as additive, not replacement.
7. **AI safety contract.** Purpose: defuse vet skepticism and own the differentiator. Content: PetCura drafts. Your team decides. Negative enumeration directly from `AGENTS.md`: *"PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice."* Plus Nabla line on training. Success: DVMs feel respected, not replaced.
8. **Compliance + EU residency.** Purpose: turn compliance into a first-class trust signal. Content: EU-hosted Supabase, GDPR-aligned (processor model), full audit trail, SOC 2 in progress, EU AI Act badge. Subprocessor list linked. Success: a clinic owner's IT person nods.
9. **Testimonial + numbers.** Purpose: humanize. Content: one named clinic, Glean-format skepticism-overcome quote + standalone metric chip. Success: feels real, not stock.
10. **Pilot pricing.** Purpose: break the demo wall. Content: pilot tier description + price (or "Talk to us — pilot pricing locked through 2027"). Optional sandbox link. Success: visitor knows the order of magnitude before booking.
11. **FAQ.** Purpose: catch objections (PMS support, languages, data, switching, who replies). Content: 6–8 plain-English questions. Success: deflects sales-call objections, reduces friction.
12. **Final CTA.** Purpose: convert scrollers. Content: restated headline + primary CTA + secondary anchor. Success: capture intent at the end of the page.
13. **Footer.** Purpose: signal maturity. Content: Changelog, Status, Trust Center, Manifesto, contact. Success: implies operational rigor.

---

## 6. Tired patterns to avoid

- *"AI-powered [thing] for [thing]"* headline
- *"Trusted by vets, loved by pet parents"* — used by 3+ incumbents
- *"All-in-one platform"* / *"Revolutionize / Unlock / Supercharge / 10x"*
- Auto-scrolling logo carousels
- Generic *"Get started"* / *"Sign up"* without anchor
- *"Human in the loop"* as a marketing band-phrase (move to `/security` only)
- Neon / 3D vibes hero with no product visible
- Navy + teal + stock dog photography (the entire vet category)
- Friction-reducing button microcopy (*"no credit card required"*)
- Lottie-heavy hero
- 11-feature kitchen-sink subhead (PetsApp's mistake)
- Cute tier names (*"Starter Pilot Captain"*) — use plain Free / Pro / Business / Enterprise
- AI-generated voiceover on founder video (flagged anti-pattern on AI landing pages in 2026)

---

## 7. Sources

Audited live 2026-05-14.

**AI landing references**
- Linear — https://linear.app
- Vercel — https://vercel.com
- Cursor — https://cursor.com
- Granola — https://granola.ai
- Lovable — https://lovable.dev
- v0 — https://v0.app
- Sierra — https://sierra.ai
- Decagon — https://decagon.ai
- Harvey — https://harvey.ai
- Hebbia — https://hebbia.com
- Glean — https://glean.com
- Abridge — https://abridge.com
- Notion — https://notion.com
- Nabla — https://nabla.com
- Hippocratic AI — https://hippocraticai.com

**Vet SaaS audit**
- Digitail — https://digitail.com
- Vetstoria — https://vetstoria.com
- PetDesk — https://petdesk.com
- Provet — https://www.provet.com
- Vetcove — https://shop.vetcove.com
- Otto — https://otto.vet
- PetsApp — https://petsapp.com
- Scribenote — https://scribenote.com

**Industry analysis**
- Evil Martians, "We studied 100 devtool landing pages — here's what actually works in 2025" — https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025
- SaaSFrame, "10 SaaS Landing Page Trends for 2026" — https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples
- VC Corner, "Win the first 5 seconds: the YC landing formula" — https://www.thevccorner.com/p/win-the-first-5-seconds-the-yc-landing
- TechCrunch, "16 of the most interesting startups from YC W26 Demo Day" — https://techcrunch.com/2026/03/26/16-of-the-most-interesting-startups-from-yc-w26-demo-day/
- Sacra, "Sierra vs Decagon" — https://sacra.com/research/sierra-vs-decagon/
- Bessemer, "Building Vertical AI: an early-stage playbook" — https://www.bvp.com/atlas/building-vertical-ai-an-early-stage-playbook-for-founders
- Howdygo, "Your 'Book a Demo' button is losing conversions" — https://www.howdygo.com/blog/your-book-a-demo-button-is-losing-conversions
- Walnut, "Interactive demos conversion rates B2B 2026 data" — https://www.walnut.io/blog/product-demos/interactive-demos-conversion-rates-b2b-2026-data/
- Secureframe, "HIPAA and SOC 2 compliance" — https://secureframe.com/hub/hipaa/and-soc-2-compliance
- StoryArb, "How to Market AI Products in 2026" — https://storyarb.com/ai-report-2026
- VoiceFleet, "Complete guide: AI receptionist for vet clinics 2026" — https://voicefleet.ai/blog/complete-guide-ai-receptionist-vet-clinics-2026

**Internal references**
- `AGENTS.md` — UX rules (lines 77–82), AI safety rules (lines 90–96)
- `CLAUDE.md` — frontend ownership scope
- `apps/web/app/page.tsx` — current landing scaffold
- `packages/ui/src/primitives.tsx` — design system primitives
- `packages/shared/src/i18n.ts` — copy keys for EN/ET/RU
- `docs/product/product-brief.md` — positioning context
