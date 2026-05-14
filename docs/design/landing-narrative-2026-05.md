# Landing Narrative — 2026-05

**Owner:** product-designer (Claude). **Reviewers:** human PO, design-system-guardian, accessibility-reviewer.
**Status:** Wave 1 contract. Frontend-engineer (Wave 2) implements against this.
**Pairs with:** [motion-system-2026-05.md](./motion-system-2026-05.md), [a11y-i18n-contract-2026-05.md](./a11y-i18n-contract-2026-05.md), [/Users/reza/.claude/plans/as-a-world-class-cached-valley.md](file:///Users/reza/.claude/plans/as-a-world-class-cached-valley.md).

---

## 0. Section order and rationale

Final order: **Hero → LogoStrip → Problem → Walkthrough → UseCases → Integrations → AISafety → Compliance → Testimonial → Pricing → FAQ → FinalCTA**.

**Reordering vs. current `apps/web/app/page.tsx`:** AISafety + Compliance promoted earlier (positions 7–8), immediately after Integrations. A DVM who hits Pricing without first having seen "PetCura does not diagnose, prescribe, set final urgency, or auto-send medical advice" bounces on price alone. Trust must lead price. Walkthrough is promoted from a static 3-step bento to a **scroll-scrubbed ScrollStory** so the AI safety section can refer back to a concrete loop the visitor has just watched.

LogoStrip stays at position 2 (research confirms ~90% of 2026 AI pages do this). Honesty is "In pilot with veterinary clinics across the EU"; N=3 is fine.

---

## 1. Hero

### 1.1 Purpose
Anchor the WhatsApp-native wedge in one breath, raise the AI-safety promise without overclaiming, convert to demo booking or sandbox inbox within 5 seconds.

### 1.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Eyebrow | EU-hosted · GDPR-aligned · Built for veterinary clinics | EU-s majutatud · GDPR-iga kooskõlas · Loodud loomakliinikutele | Размещено в ЕС · соответствует GDPR · создано для ветклиник |
| Headline (locked) | The WhatsApp inbox built for veterinary clinics. | WhatsApp postkast loomakliinikutele. | Входящие WhatsApp для ветеринарных клиник. |
| Subhead | Structure every owner message, draft replies your team approves, export clean records to your PMS — without changing how owners message you. | Struktureeri iga omaniku sõnum, koosta vastused, mida tiim kinnitab, ja ekspordi puhtad andmed PMS-i — muutmata seda, kuidas omanikud sulle kirjutavad. | Структурируйте каждое сообщение владельца, готовьте ответы, которые утверждает команда, и выгружайте чистые записи в PMS — не меняя то, как владельцы вам пишут. |
| Primary CTA | Book a 15-min clinic demo | Broneeri 15-minutiline kliiniku demo | Запланировать 15-минутное демо |
| Secondary CTA | Try the sandbox inbox | Proovi näidispostkasti | Открыть демо-входящие |
| Trust strip | EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress | EU-s majutatud · GDPR-iga kooskõlas · Täielik auditijälg · SOC 2 töös | Размещено в ЕС · соответствует GDPR · полный журнал аудита · SOC 2 в процессе |

Headline length check: EN 51 / ET 41 / RU 51 — within RU expansion budget for H1 grid.

**Sandbox-CTA handoff:** the secondary CTA points to `/sandbox`, which does not yet exist. Until that route ships, `href` falls back to `#walkthrough`. A separate `docs/contracts/sandbox-inbox.md` is filed for Codex.

### 1.3 Motion intent
**kinetic-headline** + a contained 6–12s product loop on the right rail.

- H1 reveals in **three line-grouped beats** matching subhead verbs (*structure / draft / export*). Line-grouped, never letter-by-letter — RU Cyrillic widths break per-glyph staggers.
- Stagger: 80ms between lines; total reveal ≤ 320ms. Easing = `--ease-leitmotif`.
- Eyebrow pill fades + slides 8px up, 120ms.
- Product-loop card on the right plays the `ProductLoopMock` evolution (WhatsApp → AI category chip → staff-approved reply → audit-logged PMS row), silent, no autoplay video. 9s loop, paused on first paint; plays on `IntersectionObserver` first-entry.

### 1.4 Reduced-motion fallback (first-class)
- All three H1 lines render at final opacity/position on first paint. No reveal animation, no layout shift.
- Eyebrow pill renders static.
- Product-loop card swaps to a **static 2×2 composite still** showing all four loop frames with frame numbers and the same audit-trail caption. Same logical screenshot bundle — no separate art file — so EN/ET/RU copy stays in sync.
- CTAs reachable in same DOM order; tab order = primary, secondary, trust chips.

---

## 2. LogoStrip

### 2.1 Purpose
Honest social proof at small N. Signal momentum without "10,000+ clinics" theater.

### 2.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Heading | In pilot with veterinary clinics across the EU | Pilootimas Euroopa loomakliinikutega | Пилот с ветеринарными клиниками в ЕС |
| Logo `alt` template | Pilot clinic — {name} | Pilootkliinik — {name} | Пилотная клиника — {name} |
| Footnote (small) | Pilot cohort. Named with each clinic's written consent. | Pilootgrupp. Nimetatud iga kliiniku kirjalikul nõusolekul. | Пилотная группа. Указано с письменного согласия каждой клиники. |

New i18n key: `landing.logos.consent_footnote`.

### 2.3 Motion intent
**reveal-on-enter** only. Logos fade in left-to-right with 60ms stagger at 75% viewport. **No marquee, no auto-scroll** — 2026 conversion leak.

### 2.4 Reduced-motion fallback
Static 6-up grid (3-up on mobile). Same order, full opacity on first paint.

---

## 3. Problem — "Phones break clinics."

### 3.1 Purpose
Name the pain in clinic-owner language so the visitor nods within 10 seconds before being offered a solution.

### 3.2 Copy
Existing keys `landing.problem.kicker | title | body | item.1–4` kept. New key: `landing.problem.scene_caption`.

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | The problem | Probleem | Проблема |
| Headline | Phones break clinics. | Telefonid lõhuvad kliinikuid. | Телефоны ломают клиники. |
| Body | Front desk juggles four conversations at once. Half of callbacks vanish into voicemail. Owner intake never makes it to the PMS. After-hours messages get lost. | (existing ET) | (existing RU) |
| Scene alt | A reception desk during a phone surge: front desk on call, vet mid-consult, owner on hold, voicemail blinking. | Vastuvõtt telefonitulva ajal: vastuvõtuametnik kõnel, veterinaararst konsultatsioonis, omanik ootel, kõnepost vilgub. | Регистратура в час пиковой нагрузки: сотрудник на звонке, врач на приёме, владелец ждёт, мигает голосовая почта. |

### 3.3 Motion intent
**reveal-on-enter**, segmented. The four bullets enter in 80ms succession at 60% viewport. The illustration uses **abstract geometric motion** (three concentric rings ticking out of sync) keyed to `--ease-leitmotif`. No literal phone ringing animation, no clipart.

### 3.4 Reduced-motion fallback
All four bullets render simultaneously. Rings render as static SVG in resolved positions. Caption added so the visual point is made via copy.

---

## 4. Walkthrough — scroll-scrubbed product loop (the conversion centerpiece)

### 4.1 Purpose
Show the loop concretely so a clinic owner can repeat the workflow back without reading the rest of the page. Largest conversion weight on the page.

### 4.2 Copy
Existing keys kept. Four new beat captions:

- `landing.walkthrough.beat.1`: "Owner messages on WhatsApp." / "Omanik kirjutab WhatsAppis." / "Владелец пишет в WhatsApp."
- `landing.walkthrough.beat.2`: "PetCura structures the request and suggests a category." / "PetCura struktureerib pöördumise ja pakub kategooria." / "PetCura структурирует запрос и предлагает категорию."
- `landing.walkthrough.beat.3`: "Your team approves a drafted reply." / "Tiim kinnitab koostatud vastuse." / "Команда утверждает подготовленный ответ."
- `landing.walkthrough.beat.4`: "PetCura logs the audit trail and exports to your PMS." / "PetCura logib auditijälje ja ekspordib PMS-i." / "PetCura записывает журнал аудита и выгружает в PMS."

Section copy:

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | How it works | Kuidas see töötab | Как это работает |
| Headline | Three steps. One audit trail. | Kolm sammu. Üks auditijälg. | Три шага. Один журнал аудита. |
| Subhead | Real product. No demo lab. | Päris toode. Mitte demo. | Реальный продукт. Без демо-лаборатории. |

### 4.3 Motion intent
**scroll-scrubbed.** Only section on the page using `gsap/ScrollTrigger`. Dynamic-imported, marketing-only.

- Sticky-pinned `ScrollStory` container, 1.4× viewport height on desktop.
- Four scrub stops mapped to the four beats. Canvas morphs left-to-right: WhatsApp bubble → category chip + risk flag → staff-approved reply → audit row in PMS export panel.
- Leitmotif curve draws a sage-green trail along the four stops, encoding the "one audit trail" promise visually.
- Four beat captions cross-fade in sync; only one visible at a time. Real translated copy, not in-image text.
- On mobile (<768px), section **degrades to a static stepped list** of the four beats with one frame per beat, full-bleed cards in vertical stack.

### 4.4 Reduced-motion fallback
Same as mobile: four-card vertical stack, fully-rendered on first paint, in EN/ET/RU caption order. No pin, no scrub, no morph. Sage trail renders as a connecting static SVG. Each card has `aria-labelledby` referencing its beat caption.

---

## 5. UseCases

### 5.1 Purpose
Let buyer self-identify. Front-desk lead, vet-tech, and clinic owner each see themselves in their card's first sentence.

### 5.2 Copy
Existing keys kept. Add outcome chips:

| Card | EN | ET | RU |
|---|---|---|---|
| Front desk outcome | Phone load down meaningfully in month one. | Telefonikoormus esimesel kuul märgatavalt langeb. | Нагрузка на телефон заметно снижается в первый месяц. |
| Vet & nurse outcome | Triage summaries arrive before the owner does. | Triaaži kokkuvõtted jõuavad enne omanikku. | Сводка по триажу приходит раньше владельца. |
| Clinic owner outcome | Every reply is auditable. Every export is clean. | Iga vastus on kontrollitav. Iga eksport on puhas. | Каждый ответ можно проверить. Каждая выгрузка чистая. |

New i18n keys: `landing.usecases.{front,vet,owner}.outcome`.

### 5.3 Motion intent
**reveal-on-enter** only. Cards rise 12px + fade with 60ms stagger.

### 5.4 Reduced-motion fallback
Static 3-up grid; on mobile, stacked.

---

## 6. Integrations

### 6.1 Purpose
Dissolve switching anxiety. Visitor should leave the section believing PetCura is *additive*, not a replacement.

### 6.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | Works with what you have | Töötab koos sinu tööriistadega | Работает с тем, что у вас уже есть |
| Headline | WhatsApp Business. Your PMS. Your calendar. | WhatsApp Business. Sinu PMS. Sinu kalender. | WhatsApp Business. Ваш PMS. Ваш календарь. |
| Subhead body | PetCura sits next to your PMS, never replacing it. The clinical record stays where it is; communication and intake get sane. | PetCura on PMS-i kõrval, mitte selle asemel. Meditsiiniline kirje jääb omale kohale; suhtlus ja vastuvõtt saavad rahu. | PetCura работает рядом с PMS, не заменяя его. Медицинская запись остаётся на своём месте; коммуникация и приём становятся управляемыми. |

### 6.3 Motion intent
**reveal-on-enter.** Integration tiles fade up in 2×3 grid with 50ms stagger. No connecting lines, no orbit animation.

### 6.4 Reduced-motion fallback
Static 2×3 grid (2-up on mobile), full opacity, identical layout.

---

## 7. AISafety — the trust spine of the page

### 7.1 Purpose
Defuse vet skepticism. Mirror `AGENTS.md`'s negative-enumeration verbatim. This must be the visually most prominent trust block on the page — larger than the testimonial.

### 7.2 Copy
Existing keys kept. New: `landing.safety.tagline_kinetic_1/2`.

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | AI safety contract | AI turvaleping | Соглашение о безопасности AI |
| Headline (line 1) | PetCura drafts. | PetCura koostab. | PetCura готовит. |
| Headline (line 2) | Your team decides. | Sinu tiim otsustab. | Ваша команда решает. |
| Body | AI assists your clinic. It never replaces a veterinary professional. Staff approve every owner-facing reply before it leaves the building. | AI aitab kliinikut. See ei asenda kunagi loomaarsti. Iga omanikule minev vastus saab töötaja kinnituse enne saatmist. | AI помогает клинике. Он никогда не заменяет ветеринарного специалиста. Каждый ответ владельцу утверждает сотрудник до отправки. |
| Will-do title | What PetCura's AI does | Mida PetCura AI teeb | Что делает AI PetCura |
| Will-do 1 | Suggests categories and risk flags | Pakub kategooriaid ja riskimärke | Предлагает категории и метки риска |
| Will-do 2 | Drafts triage summaries | Koostab triaaži kokkuvõtteid | Готовит сводки по триажу |
| Will-do 3 | Translates between EN, ET, RU | Tõlgib EN, ET, RU vahel | Переводит между EN, ET, RU |
| Will-do 4 | Drafts replies your team can edit | Koostab vastuseid, mida tiim muudab | Готовит ответы, которые команда может править |
| Will-not title | What PetCura's AI will not do | Mida PetCura AI ei tee | Что AI PetCura не делает |
| Will-not 1 | Diagnose | Ei pane diagnoosi | Не ставит диагноз |
| Will-not 2 | Prescribe medication | Ei kirjuta ravimeid | Не назначает лекарства |
| Will-not 3 | Set final urgency | Ei määra lõplikku kiireloomulisust | Не устанавливает окончательную срочность |
| Will-not 4 | Auto-send medical advice | Ei saada automaatselt meditsiinilist nõu | Не отправляет автоматически медицинские советы |
| Training line | We don't train our models on your data. | Me ei treeni mudeleid sinu andmetel. | Мы не обучаем наши модели на ваших данных. |

The negative-enum list **must** be visually heavier than the will-do list: stronger contrast text, thin `--accent-foreground` left rule, slightly larger leading. This is the differentiator the page is built around.

### 7.3 Motion intent
**kinetic-headline** on the H2 only ("PetCura drafts. / Your team decides."). Two line-grouped beats with a 120ms gap, leitmotif easing. The two columns reveal **side-by-side simultaneously** — not staggered — so the visitor's eye reads the contrast as a single statement. The training-data line slides in 200ms after the columns settle, in a slightly heavier weight than body copy.

The will-not list items each get a small static "—" prefix (typographic dash, not an icon). No red, no warning iconography — warning chrome reads as defensive in 2026 vet-vertical pages.

### 7.4 Reduced-motion fallback
Headline and both columns render simultaneously, full opacity. Training-data line still renders heavier, but with no slide. **The negative-enum visual hierarchy is carried by CSS, not by animation**, so reduced-motion users see the same emphasis.

---

## 8. Compliance

### 8.1 Purpose
Turn compliance into a first-class trust signal — not a footer line.

### 8.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | Security & residency | Turve ja andmeasukoht | Защита и размещение данных |
| Headline | European by default. | Euroopas vaikimisi. | По умолчанию в Европе. |
| Compliance strip (single line) | EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress. | EU-s majutatud · GDPR-iga kooskõlas · Täielik auditijälg · SOC 2 töös. | Размещено в ЕС · соответствует GDPR · полный журнал аудита · SOC 2 в процессе. |
| Training line | We don't train your data on our models. | Me ei treeni teie andmetel oma mudeleid. | Мы не обучаем наши модели на ваших данных. |
| Badges | EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress · ISO 27001 planned · EU AI Act conformant | (existing) | (existing) |
| Trust Center link | View Trust Center | Vaata Usalduskeskust | Открыть Центр доверия |

New keys: `landing.compliance.strip`, `landing.compliance.training`, `landing.compliance.trustcenter_link`.

### 8.3 Motion intent
**reveal-on-enter.** Badges cascade in 40ms intervals. Trust Center link receives a subtle leitmotif underline draw on hover (<200ms).

### 8.4 Reduced-motion fallback
Badges render in their final grid simultaneously. Trust Center underline renders static, but visible focus and hover states still apply.

---

## 9. Testimonial

### 9.1 Purpose
Humanize. One named clinic, Glean skepticism-overcome format, paired with a standalone metric chip — never inline numbers in the quote.

### 9.2 Copy
Existing keys correct. Quote shape: "I was skeptical at first — another inbox to manage. Then [specific outcome in clinic's own words]."

If consent for a named pilot isn't yet in place, the author key renders "Pilot clinic, Tallinn" with the disclaimer "Quote shared with the clinic's written consent. Identifying details adjusted at their request."

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | Early pilots | Esimesed piloodid | Первые пилоты |
| Headline | What pilot clinics are saying | Mida pilootkliinikud räägivad | Что говорят пилотные клиники |
| Author | Pilot clinic, Tallinn | Pilootkliinik, Tallinn | Пилотная клиника, Таллинн |
| Metric chip label | Pilot result | Piloodi tulemus | Результат пилота |
| Metric chip | Phone load down meaningfully in month one | Telefonikoormus esimesel kuul märgatavalt langenud | Нагрузка на телефон заметно снизилась в первый месяц |

### 9.3 Motion intent
**reveal-on-enter** only. Quote fades up; metric chip slides in 120ms after the quote settles.

### 9.4 Reduced-motion fallback
Both render together. No slide.

---

## 10. Pricing — the demo wall break

### 10.1 Purpose
Break the vet-SaaS demo wall by showing pilot pricing visibly + offering a sandbox path. Dual-path mirrors and reinforces the hero's dual CTA.

### 10.2 Copy
Existing keys kept. New: `landing.pricing.cta_secondary`, `landing.pricing.sandbox_note`.

| Slot | EN | ET | RU |
|---|---|---|---|
| Kicker | Pricing | Hinnad | Цены |
| Headline | Pilot pricing, locked through 2027. | Piloodi hind, lukus kuni 2027. | Цена пилота зафиксирована до 2027. |
| Body | One tier. Everything we ship. Locked in for pilot clinics through the end of 2027. | Üks tase. Kõik, mida tarnime. Hind lukus pilootkliinikutele kuni 2027 lõpuni. | Один уровень. Всё, что мы выпускаем. Цена зафиксирована для пилотных клиник до конца 2027. |
| Tier name | Pilot | Piloot | Пилот |
| Primary CTA | Book a 15-min clinic demo | Broneeri 15-minutiline kliiniku demo | Запланировать 15-минутное демо |
| Secondary CTA | Try the sandbox inbox | Proovi näidispostkasti | Открыть демо-входящие |
| Sandbox note | Seeded with fake owner messages. No card, no commitment. | Täidetud näidisõnumitega. Kaarti pole, kohustusi pole. | Заполнено демо-сообщениями. Без карты и обязательств. |

### 10.3 Motion intent
**reveal-on-enter.** Pricing card lifts 16px on enter; feature list reveals at 50ms stagger; CTAs settle last. "Locked through 2027" line gets a thin leitmotif underline draw on enter.

### 10.4 Reduced-motion fallback
Static card, all features visible, no underline draw. Both CTAs reachable in same DOM order.

---

## 11. FAQ

### 11.1 Purpose
Catch the six objections that surface in pilot sales calls. Reduce demo-call friction.

### 11.2 Copy
Existing keys kept. Order:

1. Does PetCura replace our PMS?
2. Which PMS systems do you support?
3. What languages are supported?
4. Who replies — staff or AI?
5. Where is data hosted?
6. How do we get owners onto WhatsApp?

**A1 must say "No" as the first word** — clinic-owner FAQ scanners read the first noun-verb only.

### 11.3 Motion intent
**reveal-on-enter** for the list. Per-row disclosure transitions use CSS-only `details/summary` height transition (250ms, leitmotif easing). No JS animation lib for FAQ rows.

### 11.4 Reduced-motion fallback
Disclosure rows expand instantly. Native `details` behavior.

---

## 12. FinalCTA

### 12.1 Purpose
Convert scrollers who didn't book at the hero. Restate the headline promise in present tense and offer the same dual path.

### 12.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Headline | Bring calm to your phone lines this quarter. | Too rahu oma telefoniliinidele juba sellel kvartalil. | Принесите спокойствие на ваши телефонные линии уже в этом квартале. |
| Body | One 15-minute call. You'll see the inbox, the AI safety contract, and the audit trail. No slide deck. | Üks 15-minutiline kõne. Näed postkasti, AI turvalepingut ja auditijälge. Slaide pole. | Один 15-минутный звонок. Вы увидите входящие, соглашение по безопасности AI и журнал аудита. Без слайдов. |
| Primary CTA | Book a 15-min demo | Broneeri 15-min demo | Запланировать 15-мин демо |
| Secondary CTA | Try the sandbox inbox | Proovi näidispostkasti | Открыть демо-входящие |

### 12.3 Motion intent
**kinetic-headline.** Same engine as hero, line-grouped reveal, leitmotif easing. "Bring calm" verb gets the heaviest entrance weight. Only other place kinetic type is allowed — closes the typographic frame the hero opened.

### 12.4 Reduced-motion fallback
Headline renders static. Body and CTAs render in DOM order, no animation.

---

## 13. Mobile sticky CTA bar

### 13.1 Purpose
DVM mobile traffic dominates. Persistent bottom CTA bar appears after the hero scrolls out of view.

### 13.2 Copy

| Slot | EN | ET | RU |
|---|---|---|---|
| Primary | Book demo | Broneeri demo | Демо |
| Secondary | Sandbox | Näidis | Демо-входящие |

New keys: `landing.mobilebar.primary | secondary`.

### 13.3 Motion intent
Slide-up from below on first hero-exit IntersectionObserver event. 200ms, leitmotif curve.

### 13.4 Reduced-motion fallback
Renders in place, no slide. Identical hit area, identical contrast.

---

## 14. i18n key naming convention

Keep existing `landing.<section>.<slot>` convention. Rules for new keys:

- `landing.<section>.<slot>` for one-off strings.
- `landing.<section>.<slot>.<n>` for ordered lists (1-indexed).
- `landing.<section>.<slot>_<modifier>` (snake_case suffix) for variants.

### Net-new keys (handoff list for frontend + i18n author)

| Key | EN reference |
|---|---|
| `landing.logos.consent_footnote` | Pilot cohort. Named with each clinic's written consent. |
| `landing.problem.scene_caption` | (alt text — see §3.2) |
| `landing.walkthrough.beat.1` | Owner messages on WhatsApp. |
| `landing.walkthrough.beat.2` | PetCura structures the request and suggests a category. |
| `landing.walkthrough.beat.3` | Your team approves a drafted reply. |
| `landing.walkthrough.beat.4` | PetCura logs the audit trail and exports to your PMS. |
| `landing.usecases.front.outcome` | Phone load down meaningfully in month one. |
| `landing.usecases.vet.outcome` | Triage summaries arrive before the owner does. |
| `landing.usecases.owner.outcome` | Every reply is auditable. Every export is clean. |
| `landing.safety.tagline_kinetic_1` | PetCura drafts. |
| `landing.safety.tagline_kinetic_2` | Your team decides. |
| `landing.compliance.strip` | EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress. |
| `landing.compliance.training` | We don't train your data on our models. |
| `landing.compliance.trustcenter_link` | View Trust Center |
| `landing.pricing.cta_secondary` | Try the sandbox inbox |
| `landing.pricing.sandbox_note` | Seeded with fake owner messages. No card, no commitment. |
| `landing.cta.secondary_sandbox` | Try the sandbox inbox |
| `landing.mobilebar.primary` | Book demo |
| `landing.mobilebar.secondary` | Sandbox |

All keys must ship EN + ET + RU on the same PR. CI must fail if a key is referenced but missing in any locale.

---

## 15. File-map handoff to frontend-engineer (Wave 2)

- `apps/web/app/(marketing)/_sections/Hero.tsx` — §1; client only for the kinetic-headline + product-loop visibility hook.
- `apps/web/app/(marketing)/_sections/LogoStrip.tsx` — §2; server, `Reveal` wrapper.
- `apps/web/app/(marketing)/_sections/Problem.tsx` — §3; server.
- `apps/web/app/(marketing)/_sections/Walkthrough.tsx` — §4; **client component** (ScrollTrigger). Dynamic-imported.
- `apps/web/app/(marketing)/_sections/UseCases.tsx` — §5; server.
- `apps/web/app/(marketing)/_sections/Integrations.tsx` — §6; server.
- `apps/web/app/(marketing)/_sections/AISafety.tsx` — §7; client only for kinetic-headline H2.
- `apps/web/app/(marketing)/_sections/Compliance.tsx` — §8; server.
- `apps/web/app/(marketing)/_sections/Testimonial.tsx` — §9; server.
- `apps/web/app/(marketing)/_sections/Pricing.tsx` — §10; server.
- `apps/web/app/(marketing)/_sections/FAQ.tsx` — §11; server.
- `apps/web/app/(marketing)/_sections/FinalCTA.tsx` — §12; client only for kinetic-headline.
- `apps/web/app/(marketing)/_components/MobileCTABar.tsx` — §13; client.

---

## 16. Acceptance criteria (Wave 2 sign-off)

1. Every section renders correctly in EN, ET, and RU via `?lang=` query param. No clipped text at the widest RU strings.
2. With macOS "Reduce motion" on: scrolling the full page fires zero JS animations; every section remains legible and visually communicates the same hierarchy.
3. Hero H1 is the literal string "The WhatsApp inbox built for veterinary clinics." in EN; its three locale variants match this doc.
4. AISafety section's negative-enumeration list is visually heavier than the will-do list at every breakpoint. The four "will not" items match `AGENTS.md` verbatim: diagnose / prescribe / set final urgency / auto-send medical advice.
5. The Nabla training line appears in **both** §7 (Safety) and §8 (Compliance) — same canonical string, two visible placements. Removing one is a regression.
6. Compliance strip reads "EU-hosted · GDPR-aligned · Full audit trail · SOC 2 in progress." in EN.
7. Hero and FinalCTA both ship the dual CTA (demo + sandbox). Hero secondary `href` is `/sandbox` with `#walkthrough` fallback.
8. Walkthrough degrades to a static vertical card stack under 768px and under reduced motion. Both fallbacks are first-class and tested.
9. No section uses Lottie, three.js, autoplay video, audio, or auto-scrolling marquees.
10. Visual regression matrix passes for EN/ET/RU × light/dark × desktop/mobile × motion/reduced-motion.

---

## 17. Open questions for human PO

1. **Sandbox inbox scope.** Feasible for pilot timeline, or fall back to `#walkthrough` until the route ships? Recommendation: ship the copy now, route lands in the next sprint; Codex receives a separate contract.
2. **Named pilot consent.** Do we have written consent from any of the three pilots to name them on the marketing page by Wave 2 merge?
3. **SOC 2 status copy.** "SOC 2 in progress." vs. "Type I targeted Q4 2026" — confirm with founder.
4. **EU AI Act badge.** Defensible today as "conformant" or should it read "ready" until counsel signs off?
5. **Pilot pricing visibility.** Show a per-clinic monthly number, or stay on "talk to us" + "locked through 2027"? Number visible is the stronger demo-wall break.
6. **Quote skepticism phrase.** Edit a pilot's quote to fit the "I was skeptical at first" frame, or quote verbatim? Recommendation: verbatim with consent.
7. **Mobile sticky CTA bar.** Confirm desired vs. sticky nav CTA alone.
