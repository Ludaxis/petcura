# ET UX Writer — Task List

**Owner:** Estonian UX writer.
**Reviewer:** Reza (tone, product); Codex (legal + AI claims); Estonian veterinary partner clinic (domain validation).
**Estimated effort:** 3–4 weeks across five waves, starting after EN writer publishes each wave's canonical draft.
**Read first (in this order):** `voice-and-tone.md` → `microcopy-patterns.md` → `glossary.md` → `key-inventory.md` → `docs/design/a11y-i18n-contract-2026-05.md` §3.1–3.6.

You own **Estonian fluency**. You translate against the EN canonical strings, but you are not bound to mirror EN sentence structure — you produce the idiomatic Estonian equivalent that holds the same meaning, register, and char budget.

---

## Working agreements

- One branch per wave: `claude/ui-et-wave-{a|b|c|d|e}`.
- Edit only the `et` block of `packages/shared/src/i18n.ts` and the `et` dictionary in `apps/web/lib/owner/i18n.ts`.
- Run before pushing: `npm run lint && npm run typecheck`.
- Start your wave **after** the EN canonical draft for that wave is merged. (Estimated 2–3 days behind EN.)
- Tag the EN writer if any source string is ambiguous — push the question back rather than guessing.

---

## Estonian-specific house rules

### Register
- **Owner app + intake:** "sina/sinu" form. Warm, direct, second-person singular.
- **Clinic app + admin + settings + auth:** still "sina" by default — Estonia's professional register tolerates "sina" in tools used inside the same team. Use "teie" only in legal pages and the demo-form consent line.
- **Legal pages:** "teie" form throughout. Matches the existing `docs/compliance/public-legal-copy.md` register.

### Diacritics
- Required: õ, ä, ö, ü. Never substitute base letters under any circumstance.
- Verify in the running app — early Estonian font fallbacks have stripped õ on some surfaces.

### Word order
- Estonian word order is freer than English. Lead with the topic of the sentence in app strings — typically the object or action, not the subject. Example: EN "We sent you a sign-in link." → ET "Sisselogimislink on saadetud."

### Agent nouns
- Status chips that name an actor: `waiting_staff` → `Ootab töötajat`, `waiting_owner` → `Ootab omanikku`. Confirmed in current dictionary; keep.

### Compound nouns
- Estonian builds long compounds (e.g., `sisselogimislink`). This pushes button labels over budget. Allowed expansion:
  - `dense-short` tier (sidebar, chips): max 22 chars. If a compound runs over, split with a space or shorten — never truncate.
- Example: EN "Schedule reminder" → ET "Plaani meeldetuletus" (20 chars, fits).

### Plurals
- Use the partitive plural in counts: `5 pöördumist` not `5 pöördumised`. The existing dictionary mostly handles this correctly; double-check Wave C reminders and inbox counts.

---

## Wave A — Foundations (Week 1, starts after EN Wave A merges)

Scope (~80 strings):
- `nav.*` (32) · `menu.*` (13) · `role.*` (6) · `router.*` (5) · `language.*` (1) · `comingSoon.*` (2)
- Enum labels lines 41–203 — polish only (already mostly translated)

Required:
- Every nav label 1–2 words. Compound nouns acceptable if ≤ 22 chars.
- `postkast` for inbox (confirmed).
- Theme labels: `Hele`, `Tume`, `Süsteem`. Final call yours.

Acceptance:
- All `glossary.md` ET entries reviewed and any `unconfirmed` flags cleared.
- Reza walks `?lang=et` of `/login` and `/inbox` shell.

---

## Wave B — Owner surfaces (Week 1–2)

Scope (~225 strings):
- Owner app: `app.*`, `tab.*`, `home.*`, `pet.*`, `chat.*`, `services.*`, `me.*`, `login.*`, `join.*`, `auth.*`
- Shared: `intake.*`, `owners.*`, `home.*`

Required:
- Emergency disclaimer translated **once** in the locked form from `glossary.md` §9. Reuse verbatim.
- "Your clinic stays in control." → "Sinu kliinik on alati juhi rollis." (locked anchor). Use across at least three surfaces.
- Pet species locked in `glossary.md` §3.
- AI mention only in `chat.*` keys. Use "AI mustand" — never just "AI" alone.

Estonian veterinary domain check:
- `loomaarst` vs `veterinaar` — confirmed `loomaarst`.
- `loomaarsti abi` vs `veterinaartehnik` — confirm with partner clinic.
- `järelkontroll` vs `järelkontakt` — confirm with partner clinic.

Acceptance:
- Walk `?lang=et` of `/o/login` → magic link → `/o/(authed)` → chat.
- Owner-clear tier holds: body lines ≤ 96 chars.

---

## Wave C — Clinic surfaces (Week 2–3)

Scope (~430 strings):
- `inbox.*` · `request.*` · `directory.*` · `customers.*` · `pets.*` · `reminders.*` · `settings.*` · `profile.*`

Required:
- No `!` anywhere.
- No `Palun` (Estonian "please") in errors or empty states.
- Empty states: "X ilmub siia, kui Y" pattern. Banned: "Pole veel X-i."
- Success toasts: `{Objekt} {tegusõna minevikus} · {kontekst}`.
- Status chips: max 22 chars (`Ootab töötajat` = 14 chars, fine; `Ootab omanikku` = 14, fine).
- Reminder types confirmed: `järelkontroll`, `korduskontroll`, `vaktsineerimine`, `ravimi pikendamine`.

Estonian veterinary domain check:
- `vaktsineerimine` vs `vaktsineerimisaeg` for reminder type — pick one with partner clinic.

Acceptance:
- Walk `?lang=et` of `/login` → `/inbox` → open a request → resolve → `/reminders` → `/directory`.
- No clipping at 320px, 768px, 1280px viewports per a11y contract §3.6.

---

## Wave D — Auth + Admin + Transactional (Week 3)

Scope (~135 strings + templates):
- `auth.*` (35) · `admin.*` (83, optional but recommended) · `onboarding.*` (55)
- ET versions of magic-link email, owner-invite WhatsApp, owner-invite SMS, reminder WhatsApp

Required:
- Auth errors: "Mis juhtus + mida teha" pattern. No apology, no "vabandust."
- Magic-link email subject < 60 chars in ET (slightly looser than EN's 50 to allow compound nouns).
- Audit log entries: `{Tegija} {verb} {object} · {aeg}` pattern, past tense.

Acceptance:
- Trigger one auth error per state (bad email, rate limit, expired link).
- Magic-link email renders correctly in Estonian on mobile and desktop email clients.

---

## Wave E — Marketing + Legal polish (Week 3–4)

Scope (~360 strings):
- `landing.*` (172) · `trust.*` (29) · `demo.*` (37) · `sandbox.*` (20)
- Legal: `/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors`, `/trust`

Required:
- Hero in ET: idiomatic, not a literal translation. EN "The WhatsApp inbox built for veterinary clinics" → ET "Loomakliinikute WhatsApp-postkast" (concise, native-feeling).
- AI accountability sentence from `glossary.md` §8 — reuse verbatim.
- Legal pages open with a 2-sentence Estonian plain-language summary.
- Forbidden phrases in `voice-and-tone.md` §5: their Estonian equivalents are also forbidden. "Võimas AI" → not allowed. "Sujuv" / "revolutsiooniline" → not allowed.

Estonian-specific marketing notes:
- Use "loomakliinik" (single word) consistently. Avoid "veterinaarkliinik" — feels formal-foreign.
- Buyer-facing FAQ in ET: keep tone professional but not bureaucratic.

Acceptance:
- Codex reviews legal-page ET drafts.
- Reza walks `?lang=et` of `/`, `/owners`, `/trust`, all legal pages.

---

## Definition of done (ET scope)

- Every key in the `et` block of both dictionaries has a final value.
- All transactional templates have a final ET version.
- Diacritics correct on every string (`grep -n "[Oo]" packages/shared/src/i18n.ts | grep -i et` — sanity check for õ omissions).
- Char budgets per tier in `key-inventory.md` Part C respected.
- Walk-through completes for all five surfaces at `?lang=et` with no clipping or fallback-to-EN visible.
- Partner clinic signs off on veterinary terms in glossary.
- Reza signs off on overall tone.
