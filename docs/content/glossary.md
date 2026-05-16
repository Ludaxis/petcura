# PetCura — Trilingual Glossary

**Owner:** Three UX writers (EN / ET / RU), with veterinary-domain validation from a partner clinic per locale.
**Status:** Locked translations. A term is "locked" once it appears in this file with all three locales and a Reza sign-off. Locked terms do **not** vary across surfaces unless a row below explicitly says they do.
**Read with:** `voice-and-tone.md` §10 (AI accountability sentence), `microcopy-patterns.md` §14 (status chips).

How to use:
- Writers consult this file before drafting any new copy.
- If a term in product is missing here, draft it, add a row, mark `unconfirmed`, and request review.
- Locked terms are referenced by their EN form in design docs (e.g. "the request detail page"). Translators always render the locked ET / RU form for that EN term.

---

## 1. Core product nouns

| EN | ET | RU | Notes |
|---|---|---|---|
| PetCura | PetCura | PetCura | Brand name. Never translated. Never possessive ("PetCura's"). |
| clinic | kliinik | клиника | The customer. Singular by default. |
| clinic staff | kliiniku töötajad | сотрудники клиники | Plural form in nav and onboarding. |
| vet (veterinarian) | loomaarst | ветеринар | Use "loomaarst" in ET; "veterinaar" reads as foreign. |
| vet nurse | loomaarsti abi | ветеринарный ассистент | Confirm with ET clinic — also "veterinaartehnik" exists. |
| front desk | vastuvõtt | администратор | "Vastuvõtt" = the reception desk role. RU "регистратор" is also acceptable; RU writer chooses. |
| pet owner | omanik | владелец | Avoid "klient" / "клиент" — owners are not the customer; the clinic is. |
| owner | omanik | владелец | Same. Plural: "omanikud" / "владельцы". |
| pet | lemmik | питомец | Generic. For species-specific copy, see §3. |
| PMS (Practice Management System) | PMS (kliiniku infosüsteem) | PMS (информационная система клиники) | Acronym kept; long form in parens on first use. |

## 2. Workflow nouns

| EN | ET | RU | Notes |
|---|---|---|---|
| inbox | postkast | входящие | Existing dictionary uses "Posti…" — locked to "postkast" / "входящие". |
| request | pöördumine | обращение | The unit of work. Plural: "pöördumised" / "обращения" — see plural forms §17 of microcopy patterns. |
| intake | sissevõtt | первичный приём | "Sissevõtt" is the act of taking in. ET writer confirms with clinic vocabulary. |
| reminder | meeldetuletus | напоминание | |
| follow-up | järelkontroll | повторный контакт | "Järelkontroll" is medical follow-up; for non-medical, ET writer may pick "järelkontakt". |
| recheck | korduskontroll | повторный осмотр | Medical recheck visit. |
| refill | ravimi pikendamine | продление препарата | Prescription refill. Confirm RU pharmacy norm with reviewer. |
| appointment | aeg vastuvõtule | запись на приём | Booking-style; "vastuvõtuaeg" also possible — locked to "aeg vastuvõtule" per existing dictionary. |
| medical question | terviseküsimus | вопрос о здоровье | |
| admin question | haldusküsimus | административный вопрос | |
| urgency | kiireloomulisus | срочность | The metric. |
| urgent | kiire | срочно | Status chip — see microcopy §14. |
| waiting on staff | ootab töötajat | ждёт клинику | RU "ждёт клинику" preferred over "ожидает клинику" in chip context. |
| waiting on owner | ootab omanikku | ждёт владельца | |
| resolved | lahendatud | закрыто | RU "закрыто" preferred over "решено" — matches CRM/inbox idiom. |
| new (status) | uus | новый | |
| audit trail | auditi jälg | журнал аудита | Plural: "logs" → "logid" / "журналы". |

## 3. Pet species

| EN | ET | RU |
|---|---|---|
| dog | koer | собака |
| cat | kass | кошка |
| rabbit | küülik | кролик |
| bird | lind | птица |
| ferret | tuhkur | хорёк |
| rodent | näriline | грызун |
| reptile | roomaja | рептилия |
| other | muu | другое |

(More species can be added — keep alphabetical in EN.)

## 4. Channel and message terms

| EN | ET | RU | Notes |
|---|---|---|---|
| WhatsApp | WhatsApp | WhatsApp | Never translated. |
| SMS | SMS | SMS | |
| web (intake fallback) | veeb | веб | "Veebivorm" / "веб-форма" when referring to the form specifically. |
| channel | kanal | канал | |
| message | sõnum | сообщение | |
| reply | vastus | ответ | |
| draft | mustand | черновик | |
| AI draft | AI mustand | черновик ИИ | RU writer: "ИИ" preferred over "AI" except in marketing where the brand context is set. |
| attachment | manus | вложение | |

## 5. Auth and account terms

| EN | ET | RU | Notes |
|---|---|---|---|
| sign in | logi sisse | войти | |
| sign out | logi välja | выйти | |
| magic link | sisselogimislink | ссылка для входа | Never "magic" — that triggers the forbidden-phrase list (`voice-and-tone.md` §5). |
| OTP / code | kood | код | Six-digit code. Always "code" in marketing; "kood" / "код" in app. |
| account | konto | аккаунт | |
| admin | administraator | администратор | |
| invite | kutse | приглашение | |
| invited | kutsutud | приглашён / приглашена | RU gendered — system uses neutral "Приглашение принято". |

## 6. Compliance and trust terms

These follow `docs/compliance/public-legal-copy.md` strictly. Writers translate the EN phrase — never paraphrase the legal meaning.

| EN | ET | RU |
|---|---|---|
| controller | vastutav töötleja | контролёр данных |
| processor | volitatud töötleja | обработчик данных |
| subprocessor | alltöötleja | субобработчик |
| data processing addendum (DPA) | andmetöötlusleping | соглашение об обработке данных |
| pilot | piloot | пилот |
| EU-region hosting | EU-piirkonna majutus | размещение в регионе ЕС |
| audit log | auditi logi | журнал аудита |
| consent | nõusolek | согласие |
| retention | säilitusaeg | срок хранения |

## 7. AI-specific terms

| EN | ET | RU |
|---|---|---|
| AI assistance | AI abi | помощь ИИ |
| risk flag | riskimärgis | флаг риска |
| category suggestion | kategooria soovitus | подсказка категории |
| summary | kokkuvõte | сводка |
| translation | tõlge | перевод |
| reply draft | vastuse mustand | черновик ответа |
| review (verb) | vaata üle | проверить |
| approve | kinnita | подтвердить |

## 8. The locked AI accountability sentence

This sentence is translated once and reused everywhere AI scope is described.

| Locale | Text |
|---|---|
| EN | PetCura assists staff. It does not diagnose, prescribe, set final urgency, or auto-send medical advice. |
| ET | PetCura on töötajate abi. Ta ei pane diagnoosi, ei kirjuta välja ravimeid, ei määra lõplikku kiireloomulisust ega saada arstinõu ise. |
| RU | PetCura помогает сотрудникам клиники. Сервис не ставит диагнозы, не выписывает лекарства, не назначает окончательную срочность и не отправляет медицинские советы автоматически. |

## 9. The locked emergency disclaimer

Legal copy. Translate the EN once; reuse verbatim. No paraphrase across surfaces.

| Locale | Text |
|---|---|
| EN | If your pet is struggling to breathe, collapsing, bleeding heavily, having seizures, or seems severely weak, call your clinic or local emergency vet immediately. |
| ET | Kui sinu lemmik hingab raskelt, kukub kokku, veritseb tugevalt, on krampides või tundub väga nõrk, helista kohe kliinikusse või kohalikku loomade kiirabisse. |
| RU | Если у питомца затруднено дыхание, он теряет сознание, сильно кровоточит, у него судороги или он выглядит крайне слабым — немедленно позвоните в клинику или местную ветеринарную службу экстренной помощи. |

## 10. Anchor phrases (locked)

| EN | ET | RU |
|---|---|---|
| Your clinic stays in control. | Sinu kliinik on alati juhi rollis. | Ваша клиника всё контролирует. |
| Drafted by AI · review before sending. | AI mustand · vaata üle enne saatmist. | Черновик от ИИ · проверьте перед отправкой. |
| We host in the EU. | Majutame Euroopa Liidus. | Хостинг в ЕС. |
| The PMS stays your medical system of record. | PMS jääb sinu meditsiiniliseks põhisüsteemiks. | PMS остаётся вашей основной медицинской системой. |
| PetCura drafts. Your team decides. | PetCura koostab. Sinu meeskond otsustab. | PetCura предлагает. Решает ваша команда. |
| Inbox is clear. | Postkast on tühi. | Входящие пусты. |
| Pilot pricing, locked through 2027. | Piloodi hind, fikseeritud kuni 2027. | Пилотная цена, зафиксирована до 2027. |
| No diagnosis. No prescription. No auto-send. | Ei diagnoosi. Ei retsepti. Ei automaatset saatmist. | Без диагноза. Без рецепта. Без автоотправки. |
| Check your inbox. | Vaata postkasti. | Проверьте почту. |

## 11. House-style notes per locale

### EN
- Sentence case for headlines and buttons.
- Oxford comma.
- "veterinary clinic" (full) in marketing; "clinic" in app.
- "vet" is acceptable in marketing for register matching; "veterinarian" is reserved for legal copy.

### ET
- "Sina" form by default in owner-facing copy. "Teie" only in admin/staff settings where it matches institutional register.
- Diacritics required: õ, ä, ö, ü. Never substitute base letters.
- Decimal separator: comma (`24,5`). Thousands: thin space.
- Date format: `24. mai 2026`.

### RU
- "Вы" form everywhere. Capitalised "Вы" only when addressing a named recipient (email subject, magic-link greeting); lowercase "вы" in marketing addressing visitors generally.
- Gendered past-tense verbs avoided in system messages — prefer infinitive or passive ("Сохранено", not "Сохранил/а").
- Decimal separator: comma (`24,5`). Thousands: thin space.
- Date format: `24 мая 2026` (no period after day).
- Cyrillic-glyph rendering: depends on `next/font` having the `cyrillic` subset — see plan file Risk #3.

## 12. Adding a term

1. Add a row in the right section with EN, ET, RU.
2. Mark `unconfirmed` until Reza signs off.
3. Open the PR and tag the EN writer (canonical source), then ET, then RU.
4. Once approved, remove the `unconfirmed` tag. The term is now locked.
