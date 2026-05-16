# PetCura — Voice and Tone

**Owner:** Reza (product) + UX writers (EN / ET / RU)
**Status:** Source of truth. All copy across the product, marketing, legal, and transactional surfaces is judged against this document.
**Read with:** `microcopy-patterns.md`, `glossary.md`, `key-inventory.md`, and `docs/design/a11y-i18n-contract-2026-05.md` (sections 3.1–3.6).

---

## 1. What PetCura sounds like

PetCura is the calm, competent voice in a busy clinic.

We speak the way a senior vet speaks to a new vet nurse at 9 a.m.: short, specific, useful, never patronising. We do not perform. We do not sell. We do the work.

Three constants hold across every surface:

1. **Concrete over abstract.** Name the pet, the message, the action.
2. **Verbs over adjectives.** "Reply faster" beats "Faster reply times."
3. **Honest over polished.** If AI drafted it, we say so. If we are still in pilot, we say so. If a feature is coming later, we say so.

## 2. What PetCura never sounds like

- Excited. No exclamation marks in the clinic app. Ever.
- Apologetic. "Sorry, something went wrong" is replaced with what happened and what to do.
- Promotional in the wrong context. The clinic inbox is a tool, not a brochure.
- Cute. No emoji in clinic, owner, or transactional copy. Reserve emoji for the WhatsApp marketing landing illustration alt-text only — and even there, prefer plain language.
- Mysterious about AI. Every AI-authored string is labelled. We never let an AI draft pass as a human one.
- Hedged. "It seems that" / "you may want to" / "we think" — cut all three.

## 3. The hybrid surface map

PetCura has six writing modes. Each surface picks one and stays in it.

| Surface | Mode | Reference | Why |
|---|---|---|---|
| Marketing (`/`, `/owners`, `/demo`, `/sandbox`, `/trust`) | **Apple.com aspirational** | Apple product launches: short, declarative, trust-led | The visitor is choosing whether to trust us with their clinic. We earn it in three sentences. |
| Clinic app (`/inbox`, `/requests`, `/directory`, `/pets`, `/reminders`, `/settings`, `/profile`) | **Apple Mail / Calendar operational** | macOS Mail, Calendar, Settings | The staff member is mid-shift. We are a tool, not company. |
| Owner app + intake (`/o/*`, `/intake`, `/owners`) | **Apple Health reassurance** | iOS Health onboarding | The owner is worried about a pet. We disappear behind the clinic relationship. |
| Legal (`/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors`) | **Apple Privacy plain-language** | apple.com/privacy | Compliance officers and worried owners both read this. Both must understand it. |
| Errors + empty states (everywhere) | **Apple system honesty** | macOS / iOS system alerts | The user already feels friction. We add zero blame. |
| Transactional (email / SMS / WhatsApp) | **Apple receipts** | App Store, Apple Pay receipts | One job per message. Useful, scannable, gone. |

---

## 4. Surface deep-dives with before/after

### 4.1 Marketing — Apple.com aspirational

Three example pairs.

**Hero**
- Before: "The complete WhatsApp solution for modern veterinary clinics seeking to revolutionize their client communication."
- After: "The WhatsApp inbox built for veterinary clinics. Turn phone chaos into structured requests, safe AI drafts, and clean PMS exports — without changing how owners message you."

**Pricing**
- Before: "Affordable plans for clinics of every size."
- After: "Pilot pricing, locked through 2027. No long-term contract — leave any time."

**AI safety**
- Before: "Powerful AI assists your team."
- After: "PetCura drafts. Your team decides."

Rules:
- Hero = one declarative sentence + one outcome sentence. Stop.
- Subheads ≤ 9 words.
- Body paragraphs ≤ 24 words.
- Buttons in sentence-case ("Request a pilot," not "Request A Pilot" or "REQUEST PILOT").
- AI claims wrapped in **will / will-not** structure. Never extend the "will" list without Codex review.

### 4.2 Clinic app — Apple Mail / Calendar operational

**Empty inbox**
- Before: "No requests yet. Things are quiet!"
- After: "Inbox is clear."

**Empty reminders**
- Before: "No reminders to display. Please create one to get started."
- After: "Reminders appear here once you schedule one." (+ link "Schedule a reminder →")

**Toast**
- Before: "Successfully resolved request!"
- After: "Request resolved · Bella."

Rules:
- Sidebar labels 1–2 words. Column headers 1–2 words. Status chips 1 word.
- No exclamation marks. Anywhere.
- Toasts name the object and the actor, not the verb tense: `{object} · {who/what context}`.
- Empty states use active voice: *X appears here once Y* — never *No X yet*.
- AI provenance labels appear on every AI-authored string: "Drafted by AI · review before sending."

### 4.3 Owner app + intake — Apple Health reassurance

**Intake**
- Before: "Please describe your veterinary concern in the field below."
- After: "Tell your clinic what's happening."

**Privacy reassurance**
- Before: "We protect your data with industry-leading security."
- After: "Your clinic stays in control."

**Emergency banner (locked)**
- Locked: "If your pet is struggling to breathe, collapsing, bleeding heavily, having seizures, or seems severely weak, call your clinic or local emergency vet immediately." — translate, never reword.

Rules:
- Subject is *your clinic* or *your vet*. Never *we*. PetCura disappears.
- Owners do not want to hear about AI. The word "AI" appears only when the owner sees an AI-drafted reply (and the clinic has reviewed it). Then it appears clearly.
- One thought per line. WhatsApp tone — short lines, line breaks instead of paragraphs.
- The "Your clinic stays in control" line is an anchor phrase. Use it across at least three surfaces.

### 4.4 Legal — Apple Privacy plain-language

**Privacy hero**
- Before: "PetCura is committed to safeguarding the privacy of personal data processed in the course of providing our services."
- After: "PetCura protects the communication layer around veterinary care. The clinic stays the controller of owner and patient data. PetCura processes that data on the clinic's behalf."

Rules:
- Each legal page opens with a 2-sentence plain-language summary in EN/ET/RU.
- Short sentences. Defined terms on first use. Bulleted lists instead of dense paragraphs.
- Writers improve readability only. **No legal claim added, removed, or softened without Codex sign-off against `docs/compliance/public-legal-copy.md`.**
- Banned forever: "SOC 2 certified," "ISO 27001 compliant," "EU AI Act conformant," "We do not train on clinic data" — until each is contractually true. The compliance doc is the master list of forbidden phrases.

### 4.5 Errors + empty states — Apple system honesty

**Auth error (bad email)**
- Before: "Invalid email."
- After: "That email isn't on your clinic's list. Ask your admin to add you."

**Auth error (rate limit)**
- Before: "Too many requests. Please try again later."
- After: "We've sent a lot of links to this address. Try again in 5 minutes."

**System error (unknown)**
- Before: "An error occurred. Please try again."
- After: "Something on our side broke. Try again, or refresh the page."

Rules:
- Errors = *what happened* + *what to do*. Two clauses. No third.
- Never apologise. Never blame.
- Never use "Oops," "Whoops," "Yikes," or any cute synonym.
- Banned: "Please." Use directly. "Try again in 5 minutes" not "Please try again in 5 minutes."

### 4.6 Transactional — Apple receipts

**Magic-link email subject**
- Before: "Your secure PetCura authentication link is here."
- After: "Your PetCura sign-in link"

**WhatsApp reminder**
- Before: "Hello! This is a friendly reminder from your veterinary clinic..."
- After: "Reminder · Bella's vaccination is due 24 May at Tartu Loomakliinik. Reply to reschedule."

Rules:
- One job per message. No upsell, no cross-link.
- Subject includes the pet name when known.
- Magic-link email: subject < 50 chars, body < 60 words, one CTA, one disclaimer.

---

## 5. Forbidden phrases (across all locales)

Never use, in any locale:

1. "Powerful AI" / "AI-powered" / "Magic"
2. "Seamless" / "Effortless"
3. "Revolutionary" / "Game-changing" / "Disruptive"
4. "Delight" / "Delightful" (as a noun)
5. "Robust" / "Cutting-edge" / "Best-in-class"
6. "Synergy" / "Holistic" / "Solution"
7. "Click here" (use the destination as the link text)
8. "Please" in error messages and empty states (verbose; remove)
9. "Oops" / "Whoops" / "Yikes" / "Hmm"
10. "Sorry, something went wrong" (replace with what happened + what to do)

Forbidden by surface:
- **Clinic app:** any exclamation mark, any emoji, "yay/wow/great."
- **Owner app:** any mention of AI unless the owner is seeing an AI-drafted reply.
- **Marketing:** any superlative without proof on the same page ("the best," "the fastest," "the only").
- **Legal:** any compliance claim from §1 of `docs/compliance/public-legal-copy.md` "Do not use" list.

## 6. Anchor phrases (keep verbatim across surfaces)

Use unchanged. Translators lock these.

1. **Your clinic stays in control.** — owner reassurance, used across `/owners`, `/intake`, `/privacy`.
2. **Drafted by AI · review before sending.** — AI provenance label on every staff-facing AI draft.
3. **We host in the EU.** — trust line on `/`, `/trust`, `/subprocessors`.
4. **The PMS stays your medical system of record.** — boundary line on marketing + trust.
5. **PetCura drafts. Your team decides.** — AI-safety section header.
6. **Inbox is clear.** — empty-state line for `/inbox`.
7. **Pilot pricing, locked through 2027.** — pricing transparency.
8. **No diagnosis. No prescription. No auto-send.** — AI will-not triad. Order is fixed.
9. **Call your clinic or local emergency vet immediately.** — emergency disclaimer closing line (full disclaimer is the locked legal text).
10. **Check your inbox.** — magic-link success state.

## 7. Punctuation

- **Sentence case.** Headlines, buttons, and labels are sentence case. Title Case is reserved for proper nouns.
- **Serial (Oxford) comma.** "intake, inbox, and exports."
- **Em-dash with surrounding spaces.** " — " (matches existing repo style; see hero copy in `_sections/Hero`).
- **Middle dot for separators.** "Request resolved · Bella" — preferred over "Request resolved – Bella" or "Request resolved | Bella."
- **No exclamation marks in the clinic app.** Marketing may use *at most one* per landing page, and only in a testimonial quote.
- **Curly quotes** in body copy (" "), straight quotes in code samples.
- **Ellipsis as a single character** (…), not three dots — but only where intentional (e.g., loading states "Sending…"). Banned on body and headline copy (see a11y-i18n contract §3.5).

## 8. Numbers, dates, currency

- **Numbers ≤ 9:** spell out in prose ("three reminders"). **≥ 10:** numerals.
- **In UI (counts, badges, tables):** always numerals.
- **Dates:** locale-aware via `Intl.DateTimeFormat`. Never hardcode "May 16, 2026" in copy; pass a date and format per locale.
- **Times:** 24-hour in clinic app and owner app (matches EU norms across EN/ET/RU). 12-hour acceptable only in marketing hero illustrations.
- **Currency:** EUR only, formatted via Intl (`€19/month`, `19 €/kuu`, `19 €/мес`).

## 9. Address (формы обращения)

- **EN:** second-person ("you," "your clinic"). Never "thee" or "one."
- **ET:** second-person singular ("sa/sinu") in owner app; second-person plural formal ("teie") in clinic admin/settings. Confirm with ET writer.
- **RU:** **formal "Вы" everywhere.** Capitalised "Вы" when addressing a single named person; lowercase "вы" in marketing copy addressing visitors generally. RU writer makes the final call per surface.

## 10. The AI accountability sentence

This is the one sentence every PetCura surface uses verbatim when describing what AI does and does not do:

> **PetCura assists staff. It does not diagnose, prescribe, set final urgency, or auto-send medical advice.**

Translators lock this. Marketing uses it. Trust center uses it. DPA uses it. The AI-safety section uses it.

## 11. How writers know they're done

A passage is finished when:

1. A clinic vet nurse, mid-shift, reads it in their language and never thinks "what does this mean?"
2. A pet owner reads it on a phone, in a hurry, and never feels patronised.
3. A compliance officer reads it and never finds a claim that isn't backed.
4. Removing one more word would change the meaning.
5. The translator in the other two languages can match it without inventing intent.

If any of those five fails, the passage isn't done yet.
