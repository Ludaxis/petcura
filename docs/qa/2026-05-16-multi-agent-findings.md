## Context

Multi-agent QA pass on 2026-05-16 covering the staff dashboard, landing, owner intake, and the newly-added Directory + mobile nav. Five specialist agents reviewed in parallel: `qa-engineer`, `accessibility-reviewer`, `design-system-guardian`, `product-designer`, and an `i18n-completeness` audit. All 4 local quality gates (typecheck, lint, vitest, build) are green on `main`.

The MobileBottomNav findings (truncation, contrast, indicator drift, stale e2e) were already addressed in [#claude/ui-mobile-nav-directory-reports](../tree/claude/ui-mobile-nav-directory-reports). Everything below is **out of that PR's scope** and parked for follow-up.

Owner column per `AGENTS.md`: **Claude** = UI/UX/frontend implementation; **Codex** = backend, RLS, AI safety; **Product** = workflow/scope decisions; **QA** = test infrastructure.

---

## P0 — ship-blockers

### Owner = Claude

- [ ] **`AnalyticsConsent.tsx` is hardcoded English.** Visible to every owner on `/intake` in ET/RU. Wire through `createTranslator` + add `consent.*` keys in EN/ET/RU. — `apps/web/app/_components/AnalyticsConsent.tsx:38,43,45–47,56,62,69`
- [ ] **`/pets/[id]` allergies are not surfaced as a safety chip.** Renders in muted text below medical metadata. A vet mid-exam can miss it. Convert to a red-soft block above the dl grid with explicit "Allergies" heading; show "No known allergies" in muted when empty. — `apps/web/app/pets/[petId]/page.tsx:115-137`
- [ ] **No `tel:` call link anywhere.** Owner contact is WhatsApp-only on pet detail + OwnerRow. Vet calling from a phone has no 1-tap option. Add `tel:` next to WhatsApp on both surfaces. — `apps/web/app/pets/[petId]/page.tsx:151-174`, `apps/web/app/directory/_components/OwnerRow.tsx:178-189`
- [ ] **Body text uses `--muted-2` token across the app.** Token is documented as "Disabled / decorative chrome" (~2.6:1 on `--paper`, fails WCAG 1.4.3 AA). Audit and swap to `--muted` for any rendered text. — `InboxRow.tsx:193,225,240`; `OwnerRow.tsx:147`; `PetRow.tsx:140,151,157`; `settings/page.tsx:343,358,640,723`; `Composer.tsx:164`
- [ ] **Composer clears textarea before knowing send succeeded.** Send-failure recovery depends on the user spotting a toast. Hold the draft until success, or restore on `?action_error=…` redirect. — `apps/web/app/requests/[id]/_components/Composer.tsx:70-80`
- [ ] **`/intake` leaks staff AI plumbing to owners.** Renders `routingSuggestion` token, `serviceIntent` token, `categorySuggestion`, `urgencySuggestion`, and `confidence%` to a worried pet owner. Either hide behind staff review or replace with reassuring confirmation copy. — `apps/web/app/intake/intake-form.tsx:248-278`
- [ ] **`/intake` `formatToken()` emits raw enum strings to owners.** Owners see `medical_question`, `front_desk_triage`, etc. Wire a `getRoutingLabel(routing, locale)` helper mirroring `getRequestCategoryLabel`. — `apps/web/app/intake/intake-form.tsx:251,255,569`

### Owner = Product

- [ ] **Decide: keep Reports in mobile bottom nav?** Product-designer agent flagged it as a weekly destination diluting the inbox-first model. Considered alternatives: drop to 4 tabs and move Reports to the Me sheet "Workspace" section; or replace with a Compose `+` FAB (primary tone) for new request. Decision needed before scaling owner-app traffic.
- [ ] **Decide: AI confidence/routing visibility on `/intake`.** Currently exposes internal tokens. Owner-friendly alternative: "We've shared this with the clinic — they'll reply via WhatsApp." Hide everything else behind staff review.

---

## P1 — should-fix-next

### Owner = Claude (accessibility)

- [ ] **MobileMeSheet close button uses literal "x" character.** Sighted ambiguity; the `<X />` icon is already imported elsewhere. — `apps/web/app/_components/MobileMeSheet.tsx:130-137`
- [ ] **MobileBottomNav Me trigger aria-label doesn't toggle.** Reads "Open user menu" even when sheet is open. Compute label as `meSheetOpen ? labels.closeUserMenu : labels.openUserMenu`. — `apps/web/app/_components/MobileBottomNav.tsx:240-265`
- [ ] **DirectoryHeader search clear button has no `focus-visible:*` styling.** Tab-focusable with invisible focus. Add the standard 2px outline. — `apps/web/app/directory/_components/DirectoryHeader.tsx:222-229`
- [ ] **OwnerRow/PetRow `opacity-0` quick action stays in accessibility tree.** Tab moves focus to an invisible WhatsApp link. Either reveal on `focus-visible` of the link, or use `invisible`/`hidden` when not hovered. — `OwnerRow.tsx:177-190`, `PetRow.tsx:89-94`
- [ ] **OwnerRow/PetRow hardcoded English fragments in aria-label.** `"…, ${owner.petCount} pets"` and `"…, owner ${pet.ownerName}"`. Use existing `t("directory.owner.petsLabel")` and add `directory.pet.ownerPrefix`. — `OwnerRow.tsx:89-91`, `PetRow.tsx:91`
- [ ] **Truncated user data lacks `title`.** Pet names, owner names, breed, email truncate without a hover/AT recovery path. — `OwnerRow.tsx:107-114, 138-141, 199-208`; `PetRow.tsx:107-115, 124-132, 187-188`; `MobileShellHeader.tsx:44-46`
- [ ] **InlineEditRow has no focus boundary + redundant `aria-hidden`+`inert`.** Tab from last field falls into the next row's cover-link. Either focus-trap inside the panel or visibly mark the boundary. Remove `aria-hidden={!editing}` — `inert` already handles it. — `apps/web/app/directory/_components/InlineEditRow.tsx:96-166`
- [ ] **Skip link target may sit under the sticky header.** Add `scroll-margin-top: 3rem` to `#main-content` and `tabindex="-1"` on first child. — `apps/web/app/_components/AppShell.tsx:223-247`
- [ ] **InboxRow roving-tabindex relies on `InboxKeyboard` being mounted.** If error fallback renders, list becomes keyboard-inaccessible. Verify unconditional mount; add a Playwright test for arrow-down → row focus → Enter activation. — `InboxRow.tsx:120-132`
- [ ] **Composer pulse animation has no `motion-reduce:` guard.** — `Composer.tsx:182-187`
- [ ] **DirectoryHeader search spinner reads as "Search directory" repeatedly during debounce.** Use a dedicated `directory.search.loading` ("Searching…") key. — `DirectoryHeader.tsx:231-239`
- [ ] **MobileMeSheet theme radiogroup needs arrow-key navigation.** Currently each radio is its own tab stop. — `MobileMeSheet.tsx:185-214`
- [ ] **Intake `FieldError` lacks `role="alert"` + `aria-describedby` to the field.** — `intake-form.tsx:79-91`
- [ ] **MobileShellHeader root should be `<header role="banner">`.** Adds a recognized landmark for AT. — `apps/web/app/_components/MobileShellHeader.tsx`

### Owner = Claude (design system)

- [ ] **Two parallel Directory header components exist.** `DirectoryHeader.tsx` uses `text-[20px]` h1; `directory/page.tsx:165-199` uses `text-[22px]`. Collapse to one shared primitive. — see both files
- [ ] **Card-in-card on `/directory` page.** `bg-[var(--soft)]` outer panel wraps two bordered `paper` cards (tabs strip + filter form) — violates design rule "do not nest cards inside cards." — `directory/page.tsx:201-234`
- [ ] **Inconsistent focus-visible treatment.** `outline-2` (primitives) vs `ring-2` (MobileBottomNav, shadcn sidebar) vs `ring-3` (shadcn button) vs `outline-none` (some sheets) vs global 3px rule in `globals.css:253-256` (not the primary token). Standardize on `outline-2 outline-offset-2 outline-[var(--primary)]`. — multiple files
- [ ] **`tone="amber"` misused for open-request counter.** Amber means "warning / today" in the system; having open requests is normal operational state. Use `tone="teal"` for "has open" and reserve amber for overdue/today. — `OwnerRow.tsx:164`, `PetRow.tsx:166`
- [ ] **Density mismatch directory vs inbox.** Inbox is one half-step taller in both density modes; users toggling between them get visual whiplash. Pick one rhythm. — `OwnerRow.tsx:78` vs `InboxRow.tsx:159`
- [ ] **Off-scale radii.** `rounded-[5px]` (Button sm + 8 directory/inbox call sites) and `rounded-[10px]` (7+ call sites: MobileBottomNav, Composer, Thread, AiDraftCard, AiMemoryPanel, OwnerTabBar). Snap to `--radius-sm` (6px) and `--radius-lg` (8px) or `--radius-xl` (12px) — or add `--radius-pill: 10px` to the theme.
- [ ] **Inconsistent micro-mono font sizes.** `text-[11px]` (PetRow) vs `text-[11.5px]` (Button sm, DirectoryHeader). Pick one (suggest 11px).
- [ ] **Status/error toast pattern duplicated across pages.** Extract to a shared `<Toast tone="success|error">` in `packages/ui/`.
- [ ] **Empty-state pattern divergence.** Directory uses a single `<p>` with rounded border; inbox uses icon + headline + subtext. Promote a shared `EmptyState` primitive. — `DirectoryListSection.tsx:89,133`
- [ ] **MobileBottomNav indicator uses `--ease-leitmotif`.** The motion doc reserves leitmotif for the single route-morph indicator. Use `--ease-standard`. — `MobileBottomNav.tsx:153`
- [ ] **DirectoryHeader pending spinner overlap.** `absolute right-7` collides with clear button at `right-2` if both render. Hide clear while pending, or stack. — `DirectoryHeader.tsx:231-239`
- [ ] **Density toggle uses `aria-current="page"`.** Toggling density doesn't change page. Convert to `<button aria-pressed>`. — `DirectoryHeader.tsx:319`, `MobileMeSheet.tsx:232`

### Owner = Claude (product UX)

- [ ] **RequestDetail header wraps unpredictably below 1280px.** Pet name + species + owner + phone + channel + assignee + 3 badges + close X in one band. Promote assignee to a chip; consider sticky close in sidebar. — `RequestDetail.tsx:147-205`
- [ ] **Sub-`lg` urgency/status/assign changes require a sheet.** Tablet receptionists do 2 clicks where desktop does 1. Show compact action bar from `md`. — `RequestDetail.tsx:211-219`
- [ ] **Inbox row hides language chip on desktop.** EN/ET/RU language is critical context for vets and reception. — `InboxRow.tsx:113,213-224`
- [ ] **Inbox category renders as mono micro-caption.** Categories are first-class triage data; should be a tinted chip parallel to StatusPill. — `InboxRow.tsx:193-196`
- [ ] **Pet detail header missing age + weight chips.** Vet has to scan medical card to answer "how old is Luna?" Surface as chips next to pet name. — `pets/[petId]/page.tsx:82-91`
- [ ] **Directory species filter disabled on Owners tab without cross-tab hint.** Vet searching "kass" on Owners gets empty results. Show a "Try Pets tab" inline hint. — `directory/page.tsx:280-282`
- [ ] **Directory submit-button label is `t("directory.sort.label")` ("Sort").** Button applies all filters; mislabel. Add `directory.filter.apply` or similar. — `directory/page.tsx:315-317`

### Owner = Claude (i18n)

- [ ] **Intake form placeholders hardcoded Estonian.** "Marta Tamm", "+372 ...", "Luna" — EN/RU owners see Estonian samples. Move to `intake.*Placeholder` keys. — `intake-form.tsx:368,381,396`
- [ ] **PetRow ProfileField labels hardcoded English.** `label="Breed"`, `label="Sex"` instead of `t(...)`. — `PetRow.tsx:253,261`
- [ ] **Marketing aria-labels hardcoded English.** `"PetCura home"`, `"Primary"`, `"Footer"`, `"Trust signals"`, `"Trust notes"`. — `(marketing)/page.tsx:349,359,507,522`; `Hero.tsx:148`; `LegalPageShell.tsx:154`
- [ ] **UserMenu Back button hardcoded.** Use existing `t("nav.back")`. — `UserMenu.tsx:560`
- [ ] **Intake free-text species accepts "kitty", "kass", "кошка".** Use a canonical select mapping to staff species set.
- [ ] **Dead i18n keys.** Unused: `intake.attachments`, `intake.badge`, `intake.description`, `intake.disclaimer`, `intake.submit`, `intake.title`. Remove from all 3 locales.
- [ ] **5 RU/ET values byte-identical to EN.** `auth.brandPane.clinic.attribution1` (ET), `customers.email`/`settings.email` (RU), `landing.footer.trust` (RU), `admin.activity.payload` (RU), `admin.leads.status.qualified` (RU).
- [ ] **`/owners` route is a public marketing page, but staff terminology uses "Owners" tab in directory.** Internal links typing `/owners` land on marketing. Rename `/owners` → `/for-owners` or `/owners/welcome`. — `apps/web/app/owners/page.tsx`

### Owner = Codex (backend)

- [ ] **Reports metrics use `Intl.NumberFormat("en-US")` and `Intl.DateTimeFormat("en-US",…)` regardless of viewer locale.** Thread `locale` through every helper. — `apps/web/lib/reports/metrics.ts:83,97,135,241`; `apps/web/app/reports/page.tsx:212`

### Owner = QA (test infrastructure)

- [ ] **No Playwright spec for `/directory`.** Tab switch, filters (URL persistence + species-disabled-on-owners), inline edit permission gate, empty state, `directory_status=saved` toast, `directory_error` alert. Create `apps/web/e2e/directory.spec.ts`.
- [ ] **No `/intake` happy-path e2e.** Owner submission flow including language switching and validation errors.
- [ ] **No `/health` smoke spec.**
- [ ] **No `/owner/*` PWA specs.** Login, chat, new request, services.
- [ ] **No EN/ET/RU label-fit smoke at 320px.** Specifically MobileBottomNav after the just-shipped 5-tab change.
- [ ] **No regression test that `/customers` and `/pets` 302 to `/directory?tab=…`.** One-liner spec.
- [ ] **No `@axe-core/playwright` a11y suite.** Add over `/inbox`, `/directory`, `/requests/[id]`, `/reminders`, `/reports`, `/settings`, `/profile`, `/`, `/intake`. Lock thresholds to zero `serious`+`critical` violations.

---

## P2 — polish

- Directory filter form needs a "Filters" disclosure with active-count badge instead of a 6-column row. — `directory/page.tsx:234-318`
- Pet detail open-request fraction "0/0" reads ambiguous. Reword to "0 open" / "2 open · 7 total". — `PetRow.tsx:163-175`
- Pet age renders as `Age · 5y` mono uppercase; looks like a code. Use sentence-case in local script. — `PetRow.tsx:139-143`
- Marketing landing page has 10+ sections before pricing; "stop the call chaos" promise is implicit, not in hero. — `(marketing)/page.tsx:86-117`
- MobileCTABar on marketing + MobileBottomNav on app could compete on auth boundary. Confirm only one paints at a time. — `(marketing)/page.tsx:319-324`
- Bottom-nav reminder dot has no count — staff with 12 reminders see the same dot as someone with 1. Cap at "9+". — `MobileBottomNav.tsx:213-219`
- InboxRow bulk-select checkbox always occupies 22px column even outside bulk mode. — `InboxRow.tsx:170-174`
- Composer keyboard shortcut for reply focus (`R`) is undiscoverable; not in the shortcuts sheet. — `inbox/page.tsx:107-113`
- Indicator `calc()` hardcodes `0.25rem` for `gap-1`. Extract to constant.
- Intake "submit another request" path missing — multi-pet households resubmit by reloading.
- Intake consent box needs visible privacy link.

---

## Already shipped on `claude/ui-mobile-nav-directory-reports`

Mobile bottom nav refactor with QA fixes:

- 5-tab layout: Inbox · Directory · Reminders · Reports · Me
- Inactive label `--muted-2` → `--muted` (A1 contrast)
- All 5 labels `block max-w-full truncate text-center` + `title` (A2 ET/RU clipping)
- Indicator transform/transition only when `activeIndex >= 0` (P0-2 drift on off-nav routes)
- `mobile-redesign-screens.spec.ts` asserts `toHaveCount(5)` + directory/reports visibility; baseline renamed `mobile-bottom-nav-5.png`
- i18n keys `nav.bottom.directory` and `nav.bottom.reports` in EN/ET/RU

PR: https://github.com/Ludaxis/petcura/pull/new/claude/ui-mobile-nav-directory-reports

---

## How this issue was generated

Five parallel specialist agents on `claude-opus-4-7`:
- `qa-engineer` — route inventory + e2e coverage gaps
- `accessibility-reviewer` — WCAG 2.2 AA across all surfaces in EN/ET/RU
- `design-system-guardian` — tokens, variants, spacing, typography, focus consistency
- `product-designer` — three core clinic workflows (reception, vet, owner intake) + landing
- `i18n-completeness` — translation completeness + ET/RU clipping + locale-aware formatting

Total scope: ~30 distinct issues across 4 owner categories.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
