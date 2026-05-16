# PetCura — Key Inventory (EN / ET / RU)
**Generated from:** `packages/shared/src/i18n.ts` (uiCopy) and `apps/web/lib/owner/i18n.ts` (dictionaries.en).
**Total keys to translate:** 1018 (shared) + 159 (owner) = 1177.
**Plus:** ~50 enum labels in `packages/shared/src/i18n.ts` (status, urgency, category, channel, reminder type, reminder status, sender) already translated — writers polish only.

**Status:** Living document. Writers update the `notes`, `legal-sensitive`, and `AI-sensitive` columns as they work through each surface.

**Read with:** `voice-and-tone.md` (surface mode table), `microcopy-patterns.md` (patterns referenced below), `glossary.md` (locked terms).

---

## Char-budget tiers (EN / ET / RU)

| Tier | EN | ET | RU | Used for |
|---|---|---|---|---|
| `dense-short` | ≤18 | ≤22 | ≤24 | Sidebar, columns, chips, buttons in app |
| `auth-tight` | ≤60 | ≤72 | ≤78 | Auth errors, form helpers |
| `owner-clear` | ≤80 | ≤96 | ≤104 | Owner app body lines |
| `marketing-long` | n/a | n/a | n/a | Marketing body — meaning-first |
| `marketing-form` | ≤50 | ≤60 | ≤65 | Form labels and placeholders on demo |
| `onboarding` | ≤90 | ≤108 | ≤117 | Step descriptions |
| `enum` | ≤14 | ≤18 | ≤20 | Status, category, channel labels |
| `system` | ≤30 | ≤36 | ≤40 | Theme labels, locale labels |

---

## Part A — Shared dictionary (`packages/shared/src/i18n.ts`)

Grouped by top-level namespace, in descending size.

### `landing.*` — 172 keys
- **Surface:** Marketing
- **Audience:** Visitor
- **Voice mode:** Apple.com aspirational
- **Default char budget:** `marketing-long`
- **Legal-sensitive:** Y
- **AI-sensitive:** Y

Keys:
```
landing.compliance.badge.aiact
landing.compliance.badge.audit
landing.compliance.badge.eu
landing.compliance.badge.gdpr
landing.compliance.badge.iso
landing.compliance.badge.soc
landing.compliance.body
landing.compliance.kicker
landing.compliance.strip
landing.compliance.title
landing.compliance.training
landing.compliance.trustcenter_link
landing.cta.body
landing.cta.primary
landing.cta.secondary
landing.cta.secondary_owner
landing.cta.secondary_sandbox
landing.cta.title
landing.faq.a1
landing.faq.a2
landing.faq.a3
landing.faq.a4
landing.faq.a5
landing.faq.a6
landing.faq.a7
… +147 more keys in this namespace
```

### `request.*` — 161 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** Y

Keys:
```
request.actionError
request.actionSaved
request.actions
request.addInternalNote
request.aiDraft.accept
request.aiDraft.accepted.toast
request.aiDraft.cancel
request.aiDraft.confidence
request.aiDraft.confidence.high
request.aiDraft.confidence.low
request.aiDraft.confidence.medium
request.aiDraft.confidenceLabel
request.aiDraft.edit
request.aiDraft.editLabel
request.aiDraft.edited.toast
request.aiDraft.error.accept
request.aiDraft.error.edit
request.aiDraft.error.reject
request.aiDraft.eyebrow
request.aiDraft.from
request.aiDraft.locale
request.aiDraft.region
request.aiDraft.reject
request.aiDraft.rejected.toast
request.aiDraft.save
… +136 more keys in this namespace
```

### `inbox.*` — 107 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** Y

Keys:
```
inbox.assigned.you
inbox.board.card.dragLabel
inbox.board.column.dropHint
inbox.board.column.new
inbox.board.column.resolved
inbox.board.column.urgent
inbox.board.column.waiting_owner
inbox.board.column.waiting_staff
inbox.board.dnd.canceled
inbox.board.dnd.dropped
inbox.board.dnd.error
inbox.board.dnd.instructions
inbox.board.dnd.over
inbox.board.dnd.pickedUp
inbox.board.title
inbox.bulk.assign
inbox.bulk.assignDone
inbox.bulk.cancel
inbox.bulk.error
inbox.bulk.resolve
inbox.bulk.resolveDone
inbox.bulk.rowToggleLabel
inbox.bulk.rowToggleLabelFor
inbox.bulk.selected
inbox.cmdk.actions
… +82 more keys in this namespace
```

### `admin.*` — 83 keys
- **Surface:** Admin
- **Audience:** Super-admin / ops
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
admin.activate
admin.active
admin.activity.empty
admin.activity.payload
admin.addStaff
admin.addStaffButton
admin.clinic
admin.clinics
admin.clinicsDescription
admin.country
admin.create
admin.createClinic
admin.deactivate
admin.demoLeads
admin.demoLeadsConsent
admin.demoLeadsCount
admin.demoLeadsDescription
admin.demoLeadsEmpty
admin.demoLeadsMessage
admin.demoLeadsNotProvided
admin.demoLeadsPms
admin.demoLeadsVolume
admin.description
admin.email
admin.error
… +58 more keys in this namespace
```

### `directory.*` — 61 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
directory.action.addReminder
directory.action.edit
directory.action.message
directory.action.openRequests
directory.action.viewOwner
directory.action.viewPet
directory.density.comfortable
directory.density.compact
directory.density.label
directory.description
directory.detail.audit
directory.detail.audit.created
directory.detail.audit.id
directory.detail.close
directory.detail.contact
directory.detail.linkedPets
directory.detail.medical
directory.detail.noRequests
directory.detail.notes
directory.detail.openOwner
directory.detail.ownerHeading
directory.detail.recentRequests
directory.detail.selectOwner
directory.detail.selectPet
directory.edit.close
… +36 more keys in this namespace
```

### `onboarding.*` — 55 keys
- **Surface:** Onboarding
- **Audience:** Clinic owner / staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `onboarding`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
onboarding.clinic.allSet
onboarding.clinic.body
onboarding.clinic.doLater
onboarding.clinic.edit
onboarding.clinic.heading
onboarding.clinic.help
onboarding.clinic.markDone
onboarding.clinic.progressChipLabel
onboarding.clinic.skip
onboarding.clinic.skipItem
onboarding.clinic.statusDone
onboarding.clinic.statusSkipped
onboarding.clinic.statusTodo
onboarding.clinic.step.choose_pms.cta
onboarding.clinic.step.choose_pms.subtext
onboarding.clinic.step.choose_pms.title
onboarding.clinic.step.connect_whatsapp.cta
onboarding.clinic.step.connect_whatsapp.subtext
onboarding.clinic.step.connect_whatsapp.title
onboarding.clinic.step.invite_teammate.cta
onboarding.clinic.step.invite_teammate.subtext
onboarding.clinic.step.invite_teammate.title
onboarding.clinic.step.quiet_hours.cta
onboarding.clinic.step.quiet_hours.subtext
onboarding.clinic.step.quiet_hours.title
… +30 more keys in this namespace
```

### `settings.*` — 40 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
settings.activate
settings.active
settings.activityTitle
settings.addStaff
settings.archiveReason
settings.archivedDescription
settings.archivedTitle
settings.clinicLocale
settings.clinicName
settings.clinicSlug
settings.clinicTimezone
settings.clinicTitle
settings.currentUser
settings.deactivate
settings.description
settings.email
settings.emptyActivity
settings.emptyArchived
settings.emptyTeam
settings.error
settings.inactive
settings.noArchiveReason
settings.noTeamManage
settings.ownerGuard
settings.readOnly
… +15 more keys in this namespace
```

### `intake.*` — 39 keys
- **Surface:** Owner-facing
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
intake.aiFallback
intake.aiOrganize
intake.aiOrganizing
intake.aiReviewBody
intake.aiReviewTitle
intake.aiSubmittedBody
intake.aiSubmittedTitle
intake.attachments
intake.attachments.comingSoon
intake.badge
intake.caseId
intake.category
intake.categorySuggestion
intake.clarifyingQuestions
intake.consent
intake.description
intake.disclaimer
intake.emergencyInfoLink
intake.error
intake.followUpLabel
intake.followUpPlaceholder
intake.followUpSend
intake.followUpSending
intake.manualSubmit
intake.message
… +14 more keys in this namespace
```

### `demo.*` — 37 keys
- **Surface:** Marketing
- **Audience:** Clinic buyer
- **Voice mode:** Apple.com aspirational
- **Default char budget:** `marketing-form`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
demo.body
demo.eyebrow
demo.form.body
demo.form.clinicName
demo.form.consent
demo.form.contactName
demo.form.country
demo.form.fallbackBody
demo.form.fallbackCta
demo.form.fallbackTitle
demo.form.message
demo.form.messagePlaceholder
demo.form.monthlyRequestVolume
demo.form.pmsSystem
demo.form.requiredError
demo.form.submit
demo.form.submitting
demo.form.successBody
demo.form.successTitle
demo.form.title
demo.form.volume.100300
demo.form.volume.300800
demo.form.volume.800plus
demo.form.volume.placeholder
demo.form.volume.under100
… +12 more keys in this namespace
```

### `auth.*` — 35 keys
- **Surface:** Auth
- **Audience:** Staff / owner
- **Voice mode:** Apple system honesty
- **Default char budget:** `auth-tight`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
auth.brandPane.clinic.attribution1
auth.brandPane.clinic.attribution2
auth.brandPane.clinic.attribution3
auth.brandPane.clinic.quote1
auth.brandPane.clinic.quote2
auth.brandPane.clinic.quote3
auth.checkEmail
auth.email
auth.emailNotAuthorized
auth.error.emailNotAuthorized
auth.error.invalidEmail
auth.error.loginError
auth.error.noMembership
auth.error.rateLimited
auth.error.recoveryContactClinic
auth.error.recoverySignInStaff
auth.error.recoveryTryAgain
auth.error.recoveryWaitlist
auth.invalidEmail
auth.login
auth.login.bodyCold
auth.login.bodyInvite
auth.login.eyebrowClinic
auth.login.eyebrowInvite
auth.login.headingCold
… +10 more keys in this namespace
```

### `owners.*` — 34 keys
- **Surface:** Marketing
- **Audience:** Pet owner (educational)
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `marketing-long`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
owners.body
owners.cta.back
owners.cta.body
owners.cta.primary
owners.cta.secondary
owners.cta.title
owners.emergency.body
owners.emergency.title
owners.eyebrow
owners.feature.1.body
owners.feature.1.title
owners.feature.2.body
owners.feature.2.title
owners.feature.3.body
owners.feature.3.title
owners.invited.body
owners.invited.kicker
owners.invited.title
owners.language.body
owners.language.title
owners.next.1
owners.next.2
owners.next.3
owners.path.portal.body
owners.path.portal.title
… +9 more keys in this namespace
```

### `nav.*` — 32 keys
- **Surface:** Shared shell
- **Audience:** All
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
nav.admin
nav.back
nav.bottom.inbox
nav.bottom.label
nav.bottom.me
nav.bottom.reminders
nav.bottom.search
nav.clinicInbox
nav.customers
nav.directory
nav.headerTitle.admin
nav.headerTitle.customers
nav.headerTitle.directory
nav.headerTitle.inbox
nav.headerTitle.pets
nav.headerTitle.profile
nav.headerTitle.reminders
nav.headerTitle.reports
nav.headerTitle.requests
nav.headerTitle.settings
nav.identityAria
nav.inbox
nav.openMenu
nav.ownerIntake
nav.pets
… +7 more keys in this namespace
```

### `trust.*` — 29 keys
- **Surface:** Marketing
- **Audience:** Compliance officer / buyer
- **Voice mode:** Apple.com aspirational
- **Default char budget:** `marketing-long`
- **Legal-sensitive:** Y
- **AI-sensitive:** Y

Keys:
```
trust.ai.body
trust.ai.title
trust.audit.body
trust.audit.title
trust.body
trust.cta.demo
trust.cta.sandbox
trust.docs.badge
trust.docs.body
trust.docs.cookies.body
trust.docs.dpa.body
trust.docs.privacy.body
trust.docs.subprocessors.body
trust.docs.terms.body
trust.docs.title
trust.eyebrow
trust.limits.badge
trust.limits.body
trust.limits.item.1
trust.limits.item.2
trust.limits.item.3
trust.limits.item.4
trust.limits.title
trust.nav.back
trust.residency.body
… +4 more keys in this namespace
```

### `reminders.*` — 23 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
reminders.actions
reminders.body
reminders.cancel
reminders.description
reminders.due
reminders.empty
reminders.emptyBody
reminders.error
reminders.markAcknowledged
reminders.markCompleted
reminders.openRequest
reminders.owner
reminders.pet
reminders.request
reminders.statusUpdated
reminders.tabs.acknowledged
reminders.tabs.all
reminders.tabs.cancelled
reminders.tabs.completed
reminders.tabs.missed
reminders.tabs.scheduled
reminders.tabs.sent
reminders.title
```

### `home.*` — 21 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
home.badge.ai
home.badge.exports
home.badge.whatsapp
home.hero.body
home.hero.title
home.kicker
home.metric.callReduction
home.metric.demoRequests
home.metric.responseTarget
home.metric.safety
home.metric.zeroIncidents
home.next
home.status.envPending
home.status.kicker
home.status.supabaseReady
home.status.title
home.title
home.workflow.1
home.workflow.2
home.workflow.3
home.workflow.4
```

### `sandbox.*` — 20 keys
- **Surface:** Marketing
- **Audience:** Visitor
- **Voice mode:** Apple.com aspirational
- **Default char budget:** `marketing-long`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
sandbox.badge.fakeData
sandbox.badge.noAuth
sandbox.badge.noWrites
sandbox.body
sandbox.cta.demo
sandbox.cta.trust
sandbox.eyebrow
sandbox.guard.1.body
sandbox.guard.1.title
sandbox.guard.2.body
sandbox.guard.2.title
sandbox.guard.3.body
sandbox.guard.3.title
sandbox.nav.back
sandbox.preview.language
sandbox.preview.risk
sandbox.preview.staffReview
sandbox.preview.status
sandbox.preview.structured
sandbox.title
```

### `profile.*` — 20 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
profile.birthDate
profile.breed
profile.description
profile.displayName
profile.editProfile
profile.error
profile.fullName
profile.jobTitle
profile.language
profile.myProfile
profile.noEmail
profile.petName
profile.phone
profile.photo
profile.save
profile.saved
profile.sex
profile.staffDescription
profile.title
profile.unknownUser
```

### `menu.*` — 13 keys
- **Surface:** Shared shell
- **Audience:** All
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
menu.admin
menu.ariaLabel
menu.help
menu.language
menu.profile
menu.search
menu.settings
menu.sheetTitle
menu.signedInAs
menu.theme
menu.themeDark
menu.themeLight
menu.themeSystem
```

### `customers.*` — 11 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
customers.description
customers.email
customers.empty
customers.language
customers.latestRequest
customers.notes
customers.owner
customers.pets
customers.phone
customers.requests
customers.title
```

### `pets.*` — 11 keys
- **Surface:** Clinic app
- **Audience:** Clinic staff
- **Voice mode:** Apple Mail operational
- **Default char budget:** `dense-short`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
pets.allergies
pets.breed
pets.description
pets.empty
pets.notes
pets.owner
pets.pet
pets.requests
pets.species
pets.title
pets.weight
```

### `role.*` — 6 keys
- **Surface:** Shared shell
- **Audience:** Internal
- **Voice mode:** Apple Mail operational
- **Default char budget:** `enum`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
role.admin
role.owner
role.reception
role.tech
role.vet
role.viewer
```

### `router.*` — 5 keys
- **Surface:** Shared shell
- **Audience:** All
- **Voice mode:** Apple Mail operational
- **Default char budget:** `system`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
router.fallback.body
router.fallback.contact
router.fallback.heading
router.fallback.retry
router.transient.settingUp
```

### `comingSoon.*` — 2 keys
- **Surface:** Shared shell
- **Audience:** All
- **Voice mode:** Apple system honesty
- **Default char budget:** `system`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
comingSoon.body
comingSoon.title
```

### `language.*` — 1 keys
- **Surface:** Shared shell
- **Audience:** All
- **Voice mode:** Apple Mail operational
- **Default char budget:** `system`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
language.label
```

---

## Part B — Owner dictionary (`apps/web/lib/owner/i18n.ts`)

Grouped by top-level namespace.

### `login.*` — 34 keys
- **Surface:** Owner auth
- **Audience:** Pet owner
- **Voice mode:** Apple system honesty
- **Default char budget:** `auth-tight`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
login.error.invalidCode
login.error.invalidPhone
login.error.inviteExpired
login.error.loginError
login.error.noMembership
login.error.notFound
login.error.oauthAmbiguousEmail
login.error.oauthNotLinked
login.error.otpUnavailable
login.error.ownerRequired
login.error.rateLimited
login.eyebrowOwner
login.help
login.oauth.apple
login.oauth.google
login.oauth.separator
login.otp.back
login.otp.cellLabel
login.otp.helper
login.otp.resend
login.otp.resendIn
login.otp.resendNow
login.otp.subtitle
login.otp.subtitleSms
login.otp.subtitleWhatsApp
… +9 more keys in this namespace
```

### `home.*` — 31 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
home.conversation.empty
home.conversation.open
home.conversation.title
home.greeting
home.greetingFallback
home.journey.heading
home.journey.step1
home.journey.step2
home.journey.step3
home.nextStep.active_request.cta
home.nextStep.active_request.subtitle
home.nextStep.active_request.title
home.nextStep.eyebrow
home.nextStep.no_pets.cta
home.nextStep.no_pets.subtitle
home.nextStep.no_pets.title
home.nextStep.send_first.cta
home.nextStep.send_first.subtitle
home.nextStep.send_first.title
home.pets.add
home.pets.title
home.quick.ask
home.quick.book
home.quick.title
home.seededPet.banner
… +6 more keys in this namespace
```

### `pet.*` — 25 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
pet.notes.placeholder
pet.selfService.body
pet.selfService.measuredAt
pet.selfService.ownerNotes
pet.selfService.photo
pet.selfService.save
pet.selfService.title
pet.selfService.weight
pet.species.bird
pet.species.cat
pet.species.dog
pet.species.other
pet.species.rabbit
pet.species.reptile
pet.tab.notes
pet.tab.photos
pet.tab.timeline
pet.tab.vaccines
pet.timeline.empty
pet.vax.dueSoon
pet.vax.empty
pet.vax.nextDue
pet.vax.overdue
pet.vax.upToDate
pet.weight
```

### `me.*` — 18 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
me.clinics.title
me.gdpr.delete
me.gdpr.export
me.gdpr.privacy
me.gdpr.title
me.notifications.pause
me.notifications.push
me.notifications.title
me.profile.email
me.profile.help
me.profile.language
me.profile.name
me.profile.phone
me.profile.photo
me.profile.save
me.profile.title
me.signout
me.title
```

### `chat.*` — 17 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** Y

Keys:
```
chat.composer.attach
chat.composer.placeholder
chat.composer.send
chat.empty.body
chat.empty.title
chat.list.empty
chat.list.startNew
chat.list.title
chat.new.body
chat.new.category
chat.new.message
chat.new.noPet
chat.new.pet
chat.new.submit
chat.new.title
chat.status.delivered
chat.status.read
```

### `join.*` — 13 keys
- **Surface:** Owner auth
- **Audience:** Pet owner
- **Voice mode:** Apple system honesty
- **Default char budget:** `auth-tight`
- **Legal-sensitive:** Y
- **AI-sensitive:** N

Keys:
```
join.body
join.confirm.body
join.confirm.continueNow
join.confirm.heading
join.confirm.redirecting
join.cta.continue
join.cta.continueNoPet
join.eyebrow
join.headingClinic
join.notMe
join.subheadingNoPet
join.subheadingWithPet
join.terms
```

### `services.*` — 10 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
services.duration
services.empty.body
services.empty.title
services.price.onRequest
services.request.notes
services.request.petPicker
services.request.submit
services.request.title
services.request.window
services.title
```

### `auth.*` — 6 keys
- **Surface:** Owner auth
- **Audience:** Pet owner
- **Voice mode:** Apple system honesty
- **Default char budget:** `auth-tight`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
auth.brandPane.owner.attribution1
auth.brandPane.owner.attribution2
auth.brandPane.owner.attribution3
auth.brandPane.owner.quote1
auth.brandPane.owner.quote2
auth.brandPane.owner.quote3
```

### `tab.*` — 4 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
tab.chat
tab.home
tab.me
tab.services
```

### `app.*` — 1 keys
- **Surface:** Owner app
- **Audience:** Pet owner
- **Voice mode:** Apple Health reassurance
- **Default char budget:** `owner-clear`
- **Legal-sensitive:** N
- **AI-sensitive:** N

Keys:
```
app.name
```

---

## Part C — Enum labels (already trilingual; polish only)

Located in `packages/shared/src/i18n.ts`, lines 41–203. These are the only strings writers should not aggressively rewrite — they are referenced by many UI surfaces and must match `microcopy-patterns.md` §14 chip rules.

| Block | Keys | Notes |
|---|---|---|
| `requestCategoryLabels` | medical_question, refill, appointment, follow_up, admin | Confirm with glossary. RU writer: review `refill` → `Продление препарата` reads correctly. |
| `requestStatusLabels` | new, urgent, waiting_staff, waiting_owner, resolved | RU: test `Ждёт клинику` vs current `Ожидает клинику` for chip width. |
| `urgencyLabels` | low, medium, high | One word each, all locales. |
| `channelLabels` | whatsapp, sms, web | WhatsApp + SMS never translated; web → `Veeb` / `Веб`. |
| `reminderTypeLabels` | follow_up, recheck, vaccination, refill | Match medical terms in glossary §2. |
| `reminderStatusLabels` | scheduled, sent, acknowledged, completed, missed, cancelled | All 6 forms in all 3 locales. |
| `senderLabels` | owner, staff, system, ai | RU `ai` → `ИИ` (lowercase forbidden in chip context). |

---

## Part D — Strings NOT in the dictionaries (audit before writers begin)

These surfaces likely contain inline strings that bypass the i18n layer. Frontend (Claude) must route them through dictionaries before writers can edit them in a single place.

1. `apps/web/app/(marketing)/_data/*` — array contents (FAQ items, walkthrough beats, integrations list)
2. `apps/web/app/(marketing)/_sections/**/*.tsx` — any hardcoded text not yet routed through `t()`
3. `apps/web/app/(marketing)/privacy/page.tsx`, `terms/page.tsx`, `dpa/page.tsx`, `cookies/page.tsx`, `subprocessors/page.tsx` — legal copy currently inline, sourced from `docs/compliance/public-legal-copy.md`
4. `apps/web/app/.well-known/security.txt` — static, EN only, no i18n needed
5. `supabase/templates/magic_link.html` — EN only; needs locale parameterization (Codex ticket)
6. WhatsApp inbound auto-reply template (Twilio backend; Codex owns)
7. WhatsApp outbound reminder template (Twilio backend; Codex owns)
8. SMS fallback template (Twilio backend; Codex owns)
9. Owner intake confirmation message (post-submit)

---

## Part E — How writers work this inventory

1. **EN writer** drafts the canonical string for every key in their assigned wave (see per-locale task lists in `tasks/`).
2. **ET writer** translates against EN, validating against the char budget for the namespace tier.
3. **RU writer** translates against EN with the same constraints, plus the Cyrillic-rendering verification.
4. Any key flagged `legal-sensitive: Y` requires Codex review on the PR.
5. Any key flagged `AI-sensitive: Y` requires Codex review on the PR.
6. New keys discovered while writing get appended to the relevant namespace section here, marked `+ NEW`.

PRs touch `packages/shared/src/i18n.ts` and `apps/web/lib/owner/i18n.ts` directly. The TypeScript type system enforces that every key exists in all three locales — that is the safety net.
