# PetCura — Microcopy Patterns

**Owner:** Three UX writers (EN / ET / RU)
**Status:** Pattern reference. Every microcopy decision in PetCura conforms to one of these patterns. New patterns are added here before they appear in product.
**Read with:** `voice-and-tone.md`, `glossary.md`.

Every pattern below specifies: **shape**, **when**, **EN example**, **ET example**, **RU example**, **anti-pattern**.

---

## 1. Buttons

### 1.1 Primary action button
**Shape:** Verb + (optional) object. Sentence case. ≤ 3 words.
**When:** Single primary CTA per screen.

| Locale | Example |
|---|---|
| EN | `Send reply` · `Request a pilot` · `Schedule reminder` |
| ET | `Saada vastus` · `Telli piloot` · `Plaani meeldetuletus` |
| RU | `Отправить ответ` · `Запросить пилот` · `Создать напоминание` |

**Anti:** `Click to submit`, `OK`, `Continue` (without object), `Submit Now!`.

### 1.2 Secondary action button
**Shape:** Verb + object, or just object. Quieter than primary.

| Locale | Example |
|---|---|
| EN | `Cancel` · `Save draft` · `Open record` |
| ET | `Tühista` · `Salvesta mustand` · `Ava kaart` |
| RU | `Отмена` · `Сохранить черновик` · `Открыть карточку` |

### 1.3 Destructive button
**Shape:** Verb that names the destruction. Never `Delete`.

| Locale | Example |
|---|---|
| EN | `Resolve request` · `Remove staff member` · `Discard draft` |
| ET | `Lahenda pöördumine` · `Eemalda töötaja` · `Loobu mustandist` |
| RU | `Закрыть обращение` · `Удалить сотрудника` · `Отменить черновик` |

**Anti:** `Yes, delete it!`, `Confirm`, `Are you sure?` as the button label.

### 1.4 Character budget
| Locale | Soft limit | Hard limit |
|---|---|---|
| EN | 14 | 18 |
| ET | 18 | 22 |
| RU | 20 | 24 |

If a button overflows in ET or RU, **rewrite the EN to be shorter** rather than truncating. Layout follows copy.

---

## 2. Links

**Shape:** The link text is the destination. Never `here` or `click here`.

| Locale | Good | Bad |
|---|---|---|
| EN | `Read the DPA` | `Click here to read it` |
| ET | `Loe andmetöötluslepingut` | `Vaata seda siit` |
| RU | `Прочитайте DPA` | `Нажмите здесь` |

Inline links lowercase verbs (sentence-case sentence). External links never open in new tabs unless they're PDFs or downloads.

---

## 3. Form labels

**Shape:** Noun phrase, sentence case, no colon.

| Locale | Example |
|---|---|
| EN | `Clinic name` · `Pet name` · `Phone with country code` |
| ET | `Kliiniku nimi` · `Lemmiku nimi` · `Telefon koos riigikoodiga` |
| RU | `Название клиники` · `Имя питомца` · `Телефон с кодом страны` |

**Anti:** `Clinic Name:` (capitalised + colon), `Enter your clinic name` (instruction-as-label).

## 4. Placeholders

**Shape:** Example or format hint, never duplicate of the label.

| Locale | Example |
|---|---|
| EN | `+372 555 1234` · `Bella` · `vet@clinic.com` |
| ET | `+372 555 1234` · `Muki` · `vet@kliinik.ee` |
| RU | `+7 901 555 12 34` · `Барсик` · `vet@klinika.ru` |

**Anti:** `Enter phone here`, `Type pet name`, `Required`.

## 5. Helper text

**Shape:** One sentence, ≤ 14 words. Below the field. Optional.

| Locale | Example |
|---|---|
| EN | `Used to send your sign-in link. Never shared.` |
| ET | `Saadame sellele sisselogimislingi. Ei jaga kunagi.` |
| RU | `Сюда отправим ссылку для входа. Не передаём третьим лицам.` |

## 6. Validation errors (inline, beside the field)

**Shape:** What's wrong + what to do. ≤ 12 words. Polite-neutral.

| Locale | Example |
|---|---|
| EN | `Add a country code, like +372.` |
| ET | `Lisa riigikood, näiteks +372.` |
| RU | `Добавьте код страны, например +372.` |

**Anti:** `Invalid phone number.` (no fix), `This field is required` (no specificity).

## 7. System errors (full-screen, full-modal, banner)

**Shape:** What happened + what to do + (optional) what we're doing.

| Locale | Example |
|---|---|
| EN | `Something on our side broke. Try again, or refresh the page.` |
| ET | `Meie poolel läks midagi katki. Proovi uuesti või värskenda lehte.` |
| RU | `На нашей стороне сбой. Попробуйте ещё раз или обновите страницу.` |

**Anti:** `Error 500`, `Internal Server Error`, `Oops, something went wrong`.

## 8. Success toasts

**Shape:** `{Object} {past-participle}` + optional context. ≤ 6 words.

| Locale | Example |
|---|---|
| EN | `Request resolved · Bella.` · `Reminder scheduled · 24 May.` |
| ET | `Pöördumine lahendatud · Muki.` · `Meeldetuletus plaanitud · 24. mai.` |
| RU | `Обращение закрыто · Барсик.` · `Напоминание создано · 24 мая.` |

**Anti:** `Saved!`, `Successfully completed.`, `Done.`.

## 9. Empty states

**Shape:** *{X} appears here once {Y}.* + optional one-link nudge.

| Locale | Example |
|---|---|
| EN | `Reminders appear here once you schedule one.` → link `Schedule a reminder →` |
| ET | `Meeldetuletused ilmuvad siia, kui need plaanid.` → link `Plaani meeldetuletus →` |
| RU | `Напоминания появятся здесь, когда вы их создадите.` → link `Создать напоминание →` |

Ultra-short variants (used in dense lists / kanban columns):

| Locale | Example |
|---|---|
| EN | `Inbox is clear.` |
| ET | `Postkast on tühi.` |
| RU | `Входящие пусты.` |

**Anti:** `No reminders yet.`, `Nothing here.`, `Coming soon!`.

## 10. Loading states

**Shape:** Verb in present continuous + `…` (single character). Never `Please wait`.

| Locale | Example |
|---|---|
| EN | `Sending…` · `Loading inbox…` · `Drafting reply…` |
| ET | `Saadan…` · `Laen postkasti…` · `Koostan vastust…` |
| RU | `Отправляем…` · `Загружаем входящие…` · `Готовим ответ…` |

Skeleton loaders preferred over textual states for >300ms loads.

## 11. Confirmations (non-destructive)

**Shape:** Action + named count or object. Title sentence; body one line.

| Locale | Title | Body |
|---|---|---|
| EN | `Mark 12 leads as contacted?` | `They move out of the New column.` |
| ET | `Märgi 12 müügivihjet kontaktituks?` | `Need liiguvad „Uued" tulbast välja.` |
| RU | `Отметить 12 лидов как обработанные?` | `Они уйдут из колонки «Новые».` |

Buttons: primary `Mark as contacted` / `Märgi kontaktituks` / `Отметить как обработанные`. Secondary `Cancel` / `Tühista` / `Отмена`.

## 12. Destructive confirmations

**Shape:** Plain warning of consequence. Verb-named primary button. No `Are you sure?`.

| Locale | Title | Body | Primary button |
|---|---|---|---|
| EN | `Remove Anna from this clinic?` | `She'll lose access to the inbox right away. You can re-invite her later.` | `Remove` |
| ET | `Eemalda Anna kliinikust?` | `Ta kaotab postkasti ligipääsu kohe. Hiljem saab uuesti kutsuda.` | `Eemalda` |
| RU | `Удалить Анну из клиники?` | `Она потеряет доступ к входящим сразу. Её можно пригласить заново.` | `Удалить` |

Never autofocus the destructive button.

## 13. AI provenance labels

**Shape:** `Drafted by AI · review before sending.` — exact. Locked across surfaces.

| Locale | Example |
|---|---|
| EN | `Drafted by AI · review before sending.` |
| ET | `AI mustand · vaata üle enne saatmist.` |
| RU | `Черновик от ИИ · проверьте перед отправкой.` |

Variants (use only when noted in inventory):
- Inline beside the message: `AI draft` / `AI mustand` / `Черновик ИИ`
- Editor placeholder: `Editing AI draft · changes are yours.` / `Muudad AI mustandit · muudatused on sinu omad.` / `Редактируете черновик ИИ · правки ваши.`

## 14. Status chips (1-word ideal)

Already locked in `packages/shared/src/i18n.ts` enum blocks. Reproduced here for reference; do not rewrite without coordinating with the inventory.

| Status | EN | ET | RU |
|---|---|---|---|
| new | New | Uus | Новый |
| urgent | Urgent | Kiire | Срочно |
| waiting_staff | Waiting · staff | Ootab töötajat | Ждёт клинику |
| waiting_owner | Waiting · owner | Ootab omanikku | Ждёт владельца |
| resolved | Resolved | Lahendatud | Закрыто |

Note: RU "Ожидает клинику" reads as "expects the clinic" — the writer should test "Ждёт клинику" (shorter, more natural in chip context). Final call rests with the RU writer.

## 15. Time strings (relative)

**Shape:** Short, locale-natural relative time. Skip "ago" where the language carries it grammatically.

| English | Estonian | Russian |
|---|---|---|
| just now | äsja | только что |
| 5 min ago | 5 min tagasi | 5 мин назад |
| 1 hr ago | 1 t tagasi | 1 ч назад |
| yesterday | eile | вчера |
| 24 May | 24. mai | 24 мая |
| 24 May 2026 | 24. mai 2026 | 24 мая 2026 |

Render via `Intl.DateTimeFormat` and `Intl.RelativeTimeFormat`. Writers supply the unit labels above; engineers pass the dates.

## 16. Date/time formats per locale

| Locale | Date | Date + time | Numeric |
|---|---|---|---|
| EN | `24 May 2026` | `24 May 2026, 14:30` | `1,234.56` |
| ET | `24. mai 2026` | `24. mai 2026, 14:30` | `1 234,56` |
| RU | `24 мая 2026` | `24 мая 2026, 14:30` | `1 234,56` |

24-hour everywhere in app surfaces.

## 17. Pluralization

We use ICU plural-style messages for any string with a count. Writers provide all forms; engineers wire `Intl.PluralRules`.

EN forms: `one`, `other`. ET forms: `one`, `other`. RU forms: `one`, `few`, `many`, `other`.

| Locale | Pattern |
|---|---|
| EN | `{count, plural, one {# request} other {# requests}}` |
| ET | `{count, plural, one {# pöördumine} other {# pöördumist}}` |
| RU | `{count, plural, one {# обращение} few {# обращения} many {# обращений} other {# обращения}}` |

When the count is part of an action (`Mark 12 leads…`), apply the same plural pattern to the action's noun.

## 18. Truncation

We do not truncate body or headline copy. We only truncate:
- The language-switcher short label ("EN" / "ET" / "RU"). Always 2 chars; never truncates in practice.
- PMS clinic names in dense list rows. Truncate at the **end** with `text-overflow: ellipsis` only.

Forbidden: truncating headlines, marketing body, button labels, status chips, error messages.

## 19. Inclusive language

- Address pet owners with the singular "they" in EN when gender is unknown.
- Avoid pet-gender assumptions ("he/she") in templates; use the pet's name.
- ET / RU writers handle grammatical gender per their language's norms — the EN copy never forces a gender that doesn't exist in the source.

## 20. Numbers in copy that change per language

- Phone numbers always show the country code (`+372 …`).
- Dates always show the month name in localized form, not numerals (`24 May`, `24. mai`, `24 мая`) to avoid `04/05/2026` ambiguity between US and EU readings.

---

## 21. The "one more word" test

For any microcopy under review, remove one word at a time until the meaning changes. The cut just before the meaning changes is the final copy.

Example walk:
1. "Please click here to send your message right away." (10 words)
2. "Click here to send your message right away." (8)
3. "Send your message right away." (5)
4. "Send your message." (3)
5. "Send message." (2) ← meaning-preserving floor in EN
6. "Send." (1) ← if the context (already inside a compose box) makes "message" redundant, stop here.

Translators run the same walk in their language. The floor may sit at a different word count.
