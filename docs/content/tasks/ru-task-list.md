# RU UX Writer — Task List

**Owner:** Russian UX writer.
**Reviewer:** Reza (tone, product); Codex (legal + AI claims); Russian-speaking veterinary partner clinic (domain validation).
**Estimated effort:** 3–4 weeks across five waves, starting after EN writer publishes each wave's canonical draft.
**Read first (in this order):** `voice-and-tone.md` → `microcopy-patterns.md` → `glossary.md` → `key-inventory.md` → `docs/design/a11y-i18n-contract-2026-05.md` §3.1–3.6.

You own **Russian fluency** and the Cyrillic-rendering verification. You translate against the EN canonical strings, but the goal is *idiomatic Russian* that holds the same meaning, register, and char budget.

---

## Working agreements

- One branch per wave: `claude/ui-ru-wave-{a|b|c|d|e}`.
- Edit only the `ru` block of `packages/shared/src/i18n.ts` and the `ru` dictionary in `apps/web/lib/owner/i18n.ts`.
- Run before pushing: `npm run lint && npm run typecheck`.
- Start your wave **after** the EN canonical draft for that wave is merged.
- Tag the EN writer if any source string is ambiguous.

---

## Pre-flight: Cyrillic rendering check

Before Wave A ships, verify Cyrillic renders correctly in the Montserrat / JetBrains Mono fonts used by the app. The current `next/font` subset is `["latin", "latin-ext"]` (per the audit). Cyrillic is **not** in the explicit subset.

Path:
1. Open `apps/web/app/layout.tsx` (or wherever `next/font` is configured).
2. Add `"cyrillic"` to the subset array. If you cannot edit code, file a ticket against Claude (frontend) and block Wave A until merged.
3. After fix lands, walk `/?lang=ru` and confirm characters render in the brand font, not a system fallback.

If Cyrillic falls back to a system font, the visual quality of all RU work suffers. This is the single blocking risk for the RU track.

---

## Russian-specific house rules

### Address ("Вы" vs "ты")
- **All surfaces:** formal "Вы" form. Russian B2B norm; clinics expect it.
- **Capitalised "Вы"** only when addressing one named individual (magic-link greeting "Здравствуйте, {name}", email signature).
- **Lowercase "вы"** in marketing copy addressing visitors generally.
- Avoid second-person plural ambiguity by repeating the subject when needed.

### Gendered grammar
- Avoid gendered past-tense verbs in system messages where the user's gender is unknown.
  - Bad: "Вы сохранили изменения." (forces user gender)
  - Good: "Изменения сохранены." (passive, ungendered)
- For "you" referring to a single staff member or owner, use passive constructions in toasts and confirmations.
- Pet owner referred to as "владелец/владелица" — system messages use neutral phrasing or the owner's name.

### Pluralization
- Russian has 4 forms: `one`, `few` (2–4), `many` (5+, 0), `other` (decimals).
- All count strings must include all four forms — see `microcopy-patterns.md` §17.
- Example: "1 обращение / 2 обращения / 5 обращений".

### Loanwords vs. native forms
- Brand and channel names not translated: WhatsApp, SMS, PetCura, AI (in marketing context).
- App terms: prefer native Russian where natural — "входящие" not "инбокс", "напоминание" not "ремайндер".
- "AI" in app surfaces → "ИИ". In marketing first mention "ИИ (искусственный интеллект)" then "ИИ" thereafter.

### Punctuation
- Russian uses « » as primary quotation marks, " " inside quotes. Match across the app.
- En-dash with spaces ( — ) for parenthetical insertions, same as EN.
- No `!` in clinic app.

### Decimal and date format
- Decimal: comma. Thousands: thin space.
- Date: `24 мая 2026` (no period after day). Locale-aware via `Intl.DateTimeFormat`.

---

## Wave A — Foundations (Week 1, starts after EN Wave A merges + Cyrillic-rendering fix)

Scope (~80 strings):
- `nav.*` (32) · `menu.*` (13) · `role.*` (6) · `router.*` (5) · `language.*` (1) · `comingSoon.*` (2)
- Enum labels lines 41–203 — polish only

Required:
- Sidebar labels ≤ 24 chars in RU. Russian compounds expand ~20–25% over EN.
- `inbox` → `Входящие` (8 chars, fits any tier).
- `waiting_staff` status chip: test **"Ждёт клинику"** (12 chars) vs current "Ожидает клинику" (15 chars). Pick the shorter idiomatic option.
- Theme labels: `Светлая`, `Тёмная`, `Системная`. Final call yours.

Acceptance:
- All `glossary.md` RU entries reviewed; `unconfirmed` flags cleared.
- Cyrillic rendering visually verified in the brand font.
- Reza walks `?lang=ru` of `/login` and `/inbox` shell.

---

## Wave B — Owner surfaces (Week 1–2)

Scope (~225 strings):
- Owner app: `app.*`, `tab.*`, `home.*`, `pet.*`, `chat.*`, `services.*`, `me.*`, `login.*`, `join.*`, `auth.*`
- Shared: `intake.*`, `owners.*`, `home.*`

Required:
- Emergency disclaimer translated **once** in the locked form from `glossary.md` §9. Reuse verbatim.
- "Your clinic stays in control." → "Ваша клиника всё контролирует." (locked anchor). Use across at least three surfaces.
- Pet species locked in `glossary.md` §3.
- AI mention only in `chat.*` keys. Use "Черновик ИИ" — never just "ИИ" alone.

Russian-language domain check:
- `владелец` vs `хозяин` for pet owner. `владелец` is more neutral / professional; pick it.
- `питомец` is the standard term in modern Russian veterinary copy; avoid `животное` (clinical, cold).
- `повторный контакт` vs `повторный визит` for follow-up — `повторный контакт` matches the inbox-not-PMS framing.

Acceptance:
- Walk `?lang=ru` of `/o/login` → magic link → `/o/(authed)` → chat.
- Owner-clear tier holds: body lines ≤ 104 chars.

---

## Wave C — Clinic surfaces (Week 2–3)

Scope (~430 strings):
- `inbox.*` · `request.*` · `directory.*` · `customers.*` · `pets.*` · `reminders.*` · `settings.*` · `profile.*`

Required:
- No `!` anywhere.
- No "пожалуйста" in errors or empty states (verbose, drops the register).
- Empty states: "X появляются здесь, когда Y" pattern. Banned: "Пока нет X."
- Success toasts: `{Объект} {глагол прошедшего времени, страдательный залог} · {контекст}`. Example: `Обращение закрыто · Барсик.`
- Status chips ≤ 24 chars. Many chip strings are tight in RU — flag any that don't fit and propose alternatives.
- Reminder types: `повторный контакт`, `повторный осмотр`, `вакцинация`, `продление препарата`.

Russian-language domain check:
- `обращение` vs `заявка` vs `запрос` for "request" → confirmed `обращение` (matches healthcare/clinic register).
- `закрыто` vs `решено` for "resolved" — `закрыто` is the CRM idiom; pick it.

Acceptance:
- Walk `?lang=ru` of `/login` → `/inbox` → open a request → resolve → `/reminders` → `/directory`.
- No clipping at 320px, 768px, 1280px viewports.
- Cyrillic still renders in brand font on every screen.

---

## Wave D — Auth + Admin + Transactional (Week 3)

Scope (~135 strings + templates):
- `auth.*` (35) · `admin.*` (83, optional but recommended) · `onboarding.*` (55)
- RU versions of magic-link email, owner-invite WhatsApp, owner-invite SMS, reminder WhatsApp

Required:
- Auth errors: "Что произошло + что делать" pattern. No "извините," no "к сожалению."
- Magic-link email subject < 65 chars in RU.
- Audit log entries: `{Действующий} {глагол} {объект} · {время}`, past passive where the actor is the system, active when a named user did it.

Acceptance:
- Trigger one auth error per state (bad email, rate limit, expired link).
- Magic-link email renders correctly in Russian on mobile and desktop email clients — verify Cyrillic in both Gmail and Yandex.Mail.

---

## Wave E — Marketing + Legal polish (Week 3–4)

Scope (~360 strings):
- `landing.*` (172) · `trust.*` (29) · `demo.*` (37) · `sandbox.*` (20)
- Legal: `/privacy`, `/terms`, `/dpa`, `/cookies`, `/subprocessors`, `/trust`

Required:
- Hero in RU: idiomatic, not literal. EN "The WhatsApp inbox built for veterinary clinics" → RU "WhatsApp-входящие для ветеринарных клиник" or similar — your final call.
- AI accountability sentence from `glossary.md` §8 — reuse verbatim.
- Legal pages open with a 2-sentence Russian plain-language summary.
- Forbidden-phrase equivalents in Russian also banned: "мощный ИИ," "бесшовный," "революционный," "прорывной," "восторг," "магия."

Russian-specific marketing notes:
- Use "ветеринарная клиника" (full form) in marketing first mention; "клиника" thereafter.
- Buyer-facing FAQ: professional register without bureaucratic phrasing. Avoid clichés like "в современных реалиях."
- Compliance and trust copy: legal-register Russian but plain-language. Read aloud — if a non-lawyer Russian speaker stumbles, rewrite.

Acceptance:
- Codex reviews legal-page RU drafts.
- Reza walks `?lang=ru` of `/`, `/owners`, `/trust`, all legal pages.

---

## Definition of done (RU scope)

- Every key in the `ru` block of both dictionaries has a final value.
- All transactional templates have a final RU version.
- Cyrillic renders in the brand font on every screen at every viewport — verified visually.
- Char budgets per tier in `key-inventory.md` Part C respected.
- All four plural forms included in every count string.
- Walk-through completes for all five surfaces at `?lang=ru` with no clipping or fallback-to-EN visible.
- Partner clinic signs off on veterinary terms in glossary.
- Reza signs off on overall tone.
