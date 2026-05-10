export const supportedLocales = ["en", "et", "ru"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";

export const localeOptions = [
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "et", label: "Eesti", shortLabel: "ET" },
  { value: "ru", label: "Русский", shortLabel: "RU" }
] satisfies Array<{
  value: SupportedLocale;
  label: string;
  shortLabel: string;
}>;

export function normalizeLocale(input: unknown): SupportedLocale {
  const value = Array.isArray(input) ? input[0] : input;

  if (typeof value !== "string") {
    return defaultLocale;
  }

  const normalized = value
    .toLowerCase()
    .split(",")[0]
    ?.split(";")[0]
    ?.trim()
    .split("-")[0];

  return supportedLocales.includes(normalized as SupportedLocale)
    ? (normalized as SupportedLocale)
    : defaultLocale;
}

export function withLocale(path: string, locale: SupportedLocale) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}lang=${locale}`;
}

export const requestCategoryLabels = {
  en: {
    medical_question: "Medical question",
    refill: "Refill",
    appointment: "Appointment",
    follow_up: "Follow-up",
    admin: "Admin"
  },
  et: {
    medical_question: "Terviseküsimus",
    refill: "Ravimi pikendamine",
    appointment: "Aeg vastuvõtule",
    follow_up: "Järelkontroll",
    admin: "Haldusküsimus"
  },
  ru: {
    medical_question: "Вопрос о здоровье",
    refill: "Продление препарата",
    appointment: "Запись на прием",
    follow_up: "Повторный контакт",
    admin: "Административный вопрос"
  }
} as const;

export type RequestCategory = keyof typeof requestCategoryLabels.en;

export const requestStatusLabels = {
  en: {
    new: "New",
    urgent: "Urgent",
    waiting_staff: "Waiting Staff",
    waiting_owner: "Waiting Owner",
    resolved: "Resolved"
  },
  et: {
    new: "Uus",
    urgent: "Kiire",
    waiting_staff: "Ootab töötajat",
    waiting_owner: "Ootab omanikku",
    resolved: "Lahendatud"
  },
  ru: {
    new: "Новый",
    urgent: "Срочно",
    waiting_staff: "Ожидает клинику",
    waiting_owner: "Ожидает владельца",
    resolved: "Решено"
  }
} as const;

export const urgencyLabels = {
  en: {
    low: "Low",
    medium: "Medium",
    high: "High"
  },
  et: {
    low: "Madal",
    medium: "Keskmine",
    high: "Kõrge"
  },
  ru: {
    low: "Низкая",
    medium: "Средняя",
    high: "Высокая"
  }
} as const;

export const channelLabels = {
  en: {
    whatsapp: "WhatsApp",
    sms: "SMS",
    web: "Web"
  },
  et: {
    whatsapp: "WhatsApp",
    sms: "SMS",
    web: "Veeb"
  },
  ru: {
    whatsapp: "WhatsApp",
    sms: "SMS",
    web: "Веб"
  }
} as const;

export type RequestChannel = keyof typeof channelLabels.en;

export const senderLabels = {
  en: {
    owner: "Owner",
    staff: "Staff",
    system: "System",
    ai: "AI"
  },
  et: {
    owner: "Omanik",
    staff: "Töötaja",
    system: "Süsteem",
    ai: "AI"
  },
  ru: {
    owner: "Владелец",
    staff: "Сотрудник",
    system: "Система",
    ai: "AI"
  }
} as const;

export type MessageSender = keyof typeof senderLabels.en;

export const uiCopy = {
  en: {
    "nav.back": "Back",
    "nav.inbox": "Inbox",
    "nav.ownerIntake": "Owner intake",
    "nav.clinicInbox": "Clinic inbox",
    "auth.login": "Staff login",
    "auth.logout": "Sign out",
    "auth.email": "Work email",
    "auth.sendLink": "Send magic link",
    "auth.checkEmail": "Check your email for the secure login link.",
    "auth.noMembership":
      "This account is not linked to an active clinic yet.",
    "auth.invalidEmail": "Enter a valid work email.",
    "auth.rateLimited":
      "Too many login links were requested. Wait a few minutes, then try again.",
    "auth.emailNotAuthorized":
      "Supabase Auth is still using the default email sender, so this address is not authorized. Configure custom SMTP before inviting clinic staff.",
    "auth.loginError": "Could not send the login link. Try again.",
    "nav.admin": "Admin",
    "admin.kicker": "Platform setup",
    "admin.title": "Clinic bootstrap",
    "admin.description":
      "Create clinics, provision staff, and copy clinic-specific intake URLs without touching Supabase manually.",
    "admin.superAdmin": "Super admin",
    "admin.createClinic": "Create clinic",
    "admin.addStaff": "Add staff",
    "admin.clinics": "Clinics",
    "admin.staff": "Staff",
    "admin.name": "Name",
    "admin.slug": "Slug",
    "admin.country": "Country",
    "admin.timezone": "Timezone",
    "admin.locale": "Language",
    "admin.clinic": "Clinic",
    "admin.email": "Email",
    "admin.role": "Role",
    "admin.intakeUrl": "Intake URL",
    "admin.create": "Create",
    "admin.addStaffButton": "Add staff",
    "admin.active": "Active",
    "admin.inactive": "Inactive",
    "admin.activate": "Activate",
    "admin.deactivate": "Deactivate",
    "admin.status.clinicCreated": "Clinic created.",
    "admin.status.staffAdded": "Staff added.",
    "admin.status.staffUpdated": "Staff status updated.",
    "admin.error": "Could not save the admin change. Check the fields and try again.",
    "language.label": "Language",
    "home.kicker": "PetCura",
    "home.title": "Clinic ClientOps foundation",
    "home.badge.whatsapp": "WhatsApp-native",
    "home.badge.ai": "Staff-approved AI",
    "home.badge.exports": "PMS-friendly exports",
    "home.hero.title":
      "One operational layer for owner requests, replies, and follow-ups.",
    "home.hero.body":
      "This scaffold proves the first PetCura path: owner intake, clinic inbox, request detail, Supabase-ready data contracts, and AI safety boundaries.",
    "home.workflow.1": "Owner sends WhatsApp or web intake",
    "home.workflow.2": "AI suggests category, summary, and risk flags",
    "home.workflow.3": "Staff confirms urgency and replies",
    "home.workflow.4": "Reminder or PMS export closes the loop",
    "home.status.kicker": "Foundation status",
    "home.status.title": "Ready for Sprint 1",
    "home.status.supabaseReady": "Supabase env set",
    "home.status.envPending": "Env pending",
    "home.metric.demoRequests": "Demo requests",
    "home.metric.responseTarget": "Pilot response target",
    "home.metric.callReduction": "Call reduction target",
    "home.metric.safety": "Safety target",
    "home.metric.zeroIncidents": "0 incidents",
    "home.next":
      "Next slice: replace demo data with live Supabase requests, staff auth, and clinic-scoped RLS.",
    "intake.badge": "Owner web fallback",
    "intake.title": "Create a request",
    "intake.description":
      "Use this form when WhatsApp is not convenient. Your clinic will review the request and reply in your preferred language.",
    "intake.ownerName": "Your name",
    "intake.phone": "Phone number",
    "intake.petName": "Pet name",
    "intake.petSpecies": "Species",
    "intake.petSpeciesPlaceholder": "Cat, dog, rabbit...",
    "intake.category": "Request type",
    "intake.message": "What is happening?",
    "intake.messagePlaceholder":
      "Tell the clinic what changed, when it started, and what you have already tried.",
    "intake.attachments": "Photo/video attachments will be enabled with Supabase Storage.",
    "intake.disclaimer":
      "PetCura structures requests for clinic staff. It does not provide diagnosis or emergency medical advice.",
    "intake.submit": "Submit request",
    "intake.submitting": "Submitting...",
    "intake.successTitle": "Request sent",
    "intake.successBody": "Your request is now in the clinic inbox.",
    "intake.caseId": "Case ID",
    "intake.error": "Could not submit the request. Check the fields and try again.",
    "inbox.kicker": "Clinic dashboard",
    "inbox.title": "ClientOps inbox",
    "inbox.liveBadge": "Live Supabase data",
    "inbox.empty": "Inbox is clear.",
    "inbox.translation": "translation",
    "inbox.streams.all": "All",
    "inbox.streams.urgent": "Urgent",
    "inbox.streams.today": "Today",
    "inbox.streams.week": "This week",
    "inbox.streams.routine": "Routine",
    "inbox.streams.mine": "Mine",
    "inbox.streams.unassigned": "Unassigned",
    "inbox.view.list": "List",
    "inbox.view.board": "Board",
    "inbox.density.comfortable": "Comfortable",
    "inbox.density.compact": "Compact",
    "inbox.kbd.help": "Keyboard shortcuts",
    "inbox.kbd.navigate": "Navigate threads",
    "inbox.kbd.resolve": "Mark resolved",
    "inbox.kbd.assign": "Assign to me",
    "inbox.kbd.reply": "Focus reply",
    "inbox.kbd.translate": "Toggle translation",
    "inbox.kbd.command": "Open command palette",
    "inbox.kbd.shortcuts": "Show shortcuts",
    "inbox.cmdk.placeholder": "Search threads, owners, pets, or run a command…",
    "inbox.cmdk.empty": "No matches.",
    "inbox.cmdk.threads": "Threads",
    "inbox.cmdk.streams": "Streams",
    "inbox.cmdk.actions": "Actions",
    "inbox.cmdk.appearance": "Appearance",
    "inbox.cmdk.openThread": "Open thread",
    "inbox.cmdk.filterStream": "Filter · {stream}",
    "inbox.cmdk.themeLight": "Switch to light theme",
    "inbox.cmdk.themeDark": "Switch to dark theme",
    "inbox.cmdk.themeSystem": "Match system theme",
    "inbox.cmdk.resolveCurrent": "Resolve focused thread",
    "inbox.cmdk.assignCurrent": "Assign focused thread to me",
    "inbox.theme.label": "Theme",
    "inbox.theme.light": "Light",
    "inbox.theme.dark": "Dark",
    "inbox.theme.system": "System",
    "inbox.toast.sent": "Sent",
    "inbox.toast.resolved": "Resolved",
    "inbox.toast.assigned": "Assigned to you",
    "inbox.toast.rejected": "Dismissed",
    "inbox.kbdSheet.title": "Keyboard shortcuts",
    "inbox.kbdSheet.close": "Close",
    "inbox.assigned.you": "you",
    "inbox.unassigned": "—",
    "inbox.search": "Search",
    "request.owner": "Owner",
    "request.pet": "Pet",
    "request.status": "Status",
    "request.note": "Note",
    "request.reminder": "Reminder",
    "request.reply": "Reply",
    "request.urgency": "Urgency",
    "request.category": "Category",
    "request.channel": "Channel",
    "request.aiSummary": "AI summary",
    "request.draft": "draft",
    "request.aiNotice":
      "AI output is advisory until staff review is stored in `ai_outputs`.",
    "request.conversation": "Conversation",
    "request.timeline": "Request timeline",
    "request.internalNotes": "Internal notes",
    "request.events": "Events",
    "request.noSummary": "No AI summary has been generated yet.",
    "request.export": "Export",
    "request.actions": "Staff actions",
    "request.assigned": "Assigned",
    "request.unassigned": "Unassigned",
    "request.you": "you",
    "request.save": "Save",
    "request.assign": "Assign",
    "request.replyToOwner": "Reply to owner",
    "request.replyPlaceholder": "Write the message the owner should receive.",
    "request.sendReply": "Send reply",
    "request.addInternalNote": "Add internal note",
    "request.notePlaceholder": "Add context that only clinic staff can see.",
    "request.saveNote": "Save note",
    "request.actionSaved": "Action saved.",
    "request.actionError": "Could not save the action. Check the fields and try again."
  },
  et: {
    "nav.back": "Tagasi",
    "nav.inbox": "Postkast",
    "nav.ownerIntake": "Omaniku pöördumine",
    "nav.clinicInbox": "Kliiniku postkast",
    "auth.login": "Töötaja sisselogimine",
    "auth.logout": "Logi välja",
    "auth.email": "Töö e-post",
    "auth.sendLink": "Saada sisselogimislink",
    "auth.checkEmail": "Kontrolli e-posti turvalise sisselogimislingi jaoks.",
    "auth.noMembership":
      "See konto ei ole veel seotud aktiivse kliinikuga.",
    "auth.invalidEmail": "Sisesta kehtiv töö e-post.",
    "auth.rateLimited":
      "Sisselogimislinke küsiti liiga palju. Oota mõni minut ja proovi uuesti.",
    "auth.emailNotAuthorized":
      "Supabase Auth kasutab veel vaikimisi e-posti saatjat, seega ei ole see aadress lubatud. Seadista kohandatud SMTP enne kliiniku töötajate kutsumist.",
    "auth.loginError": "Sisselogimislinki ei saanud saata. Proovi uuesti.",
    "nav.admin": "Admin",
    "admin.kicker": "Platvormi seadistus",
    "admin.title": "Kliiniku algseadistus",
    "admin.description":
      "Loo kliinikuid, lisa töötajaid ja kopeeri kliinikupõhiseid pöördumise URL-e ilma Supabase'i käsitsi muutmata.",
    "admin.superAdmin": "Superadmin",
    "admin.createClinic": "Loo kliinik",
    "admin.addStaff": "Lisa töötaja",
    "admin.clinics": "Kliinikud",
    "admin.staff": "Töötajad",
    "admin.name": "Nimi",
    "admin.slug": "Slug",
    "admin.country": "Riik",
    "admin.timezone": "Ajavöönd",
    "admin.locale": "Keel",
    "admin.clinic": "Kliinik",
    "admin.email": "E-post",
    "admin.role": "Roll",
    "admin.intakeUrl": "Pöördumise URL",
    "admin.create": "Loo",
    "admin.addStaffButton": "Lisa töötaja",
    "admin.active": "Aktiivne",
    "admin.inactive": "Mitteaktiivne",
    "admin.activate": "Aktiveeri",
    "admin.deactivate": "Deaktiveeri",
    "admin.status.clinicCreated": "Kliinik loodud.",
    "admin.status.staffAdded": "Töötaja lisatud.",
    "admin.status.staffUpdated": "Töötaja staatus uuendatud.",
    "admin.error": "Admini muudatust ei saanud salvestada. Kontrolli välju ja proovi uuesti.",
    "language.label": "Keel",
    "home.kicker": "PetCura",
    "home.title": "Kliiniku ClientOps alus",
    "home.badge.whatsapp": "WhatsAppi-põhine",
    "home.badge.ai": "Töötaja kinnitatud AI",
    "home.badge.exports": "PMS-i sõbralik eksport",
    "home.hero.title":
      "Üks töökiht omanike pöördumiste, vastuste ja järeltegevuste jaoks.",
    "home.hero.body":
      "See alus näitab PetCura esimest teekonda: omaniku pöördumine, kliiniku postkast, pöördumise detailvaade, Supabase'i andmelepingud ja AI turvapiirid.",
    "home.workflow.1": "Omanik saadab WhatsAppi või veebivormi kaudu pöördumise",
    "home.workflow.2": "AI pakub kategooriat, kokkuvõtet ja riskimärke",
    "home.workflow.3": "Töötaja kinnitab kiireloomulisuse ja vastab",
    "home.workflow.4": "Meeldetuletus või PMS-i eksport sulgeb protsessi",
    "home.status.kicker": "Aluse seis",
    "home.status.title": "Valmis Sprint 1 jaoks",
    "home.status.supabaseReady": "Supabase'i env on seadistatud",
    "home.status.envPending": "Env puudub",
    "home.metric.demoRequests": "Demopöördumised",
    "home.metric.responseTarget": "Piloodi vastamisaja eesmärk",
    "home.metric.callReduction": "Kõnede vähendamise eesmärk",
    "home.metric.safety": "Turvaeesmärk",
    "home.metric.zeroIncidents": "0 intsidenti",
    "home.next":
      "Järgmine osa: asendada demodata Supabase'i pärispöördumiste, töötaja autentimise ja kliinikupõhise RLS-iga.",
    "intake.badge": "Omaniku veebivorm",
    "intake.title": "Loo pöördumine",
    "intake.description":
      "Kasuta seda vormi, kui WhatsApp ei sobi. Kliinik vaatab pöördumise üle ja vastab sinu eelistatud keeles.",
    "intake.ownerName": "Sinu nimi",
    "intake.phone": "Telefoninumber",
    "intake.petName": "Lemmiku nimi",
    "intake.petSpecies": "Liik",
    "intake.petSpeciesPlaceholder": "Kass, koer, küülik...",
    "intake.category": "Pöördumise tüüp",
    "intake.message": "Mis toimub?",
    "intake.messagePlaceholder":
      "Kirjelda, mis muutus, millal see algas ja mida oled juba proovinud.",
    "intake.attachments": "Foto/video lisamine aktiveeritakse Supabase Storage'iga.",
    "intake.disclaimer":
      "PetCura struktureerib pöördumised kliiniku töötajatele. See ei anna diagnoosi ega erakorralist meditsiinilist nõu.",
    "intake.submit": "Saada pöördumine",
    "intake.submitting": "Saadan...",
    "intake.successTitle": "Pöördumine saadetud",
    "intake.successBody": "Sinu pöördumine on nüüd kliiniku postkastis.",
    "intake.caseId": "Juhtumi ID",
    "intake.error": "Pöördumist ei saanud saata. Kontrolli välju ja proovi uuesti.",
    "inbox.kicker": "Kliiniku töölaud",
    "inbox.title": "ClientOps postkast",
    "inbox.liveBadge": "Supabase'i pärisandmed",
    "inbox.empty": "Postkast on tühi.",
    "inbox.translation": "tõlge",
    "inbox.streams.all": "Kõik",
    "inbox.streams.urgent": "Kiire",
    "inbox.streams.today": "Täna",
    "inbox.streams.week": "Sel nädalal",
    "inbox.streams.routine": "Rutiin",
    "inbox.streams.mine": "Minu omad",
    "inbox.streams.unassigned": "Määramata",
    "inbox.view.list": "Loend",
    "inbox.view.board": "Tahvel",
    "inbox.density.comfortable": "Avaram",
    "inbox.density.compact": "Tihe",
    "inbox.kbd.help": "Klahvikombinatsioonid",
    "inbox.kbd.navigate": "Liigu vestluste vahel",
    "inbox.kbd.resolve": "Märgi lahendatuks",
    "inbox.kbd.assign": "Määra endale",
    "inbox.kbd.reply": "Fookus vastusele",
    "inbox.kbd.translate": "Lülita tõlge",
    "inbox.kbd.command": "Ava käsupalett",
    "inbox.kbd.shortcuts": "Näita klahvikombinatsioone",
    "inbox.cmdk.placeholder": "Otsi vestlusi, omanikke, lemmikuid või käivita käsk…",
    "inbox.cmdk.empty": "Vasteid ei leitud.",
    "inbox.cmdk.threads": "Vestlused",
    "inbox.cmdk.streams": "Vood",
    "inbox.cmdk.actions": "Tegevused",
    "inbox.cmdk.appearance": "Välimus",
    "inbox.cmdk.openThread": "Ava vestlus",
    "inbox.cmdk.filterStream": "Filtreeri · {stream}",
    "inbox.cmdk.themeLight": "Lülita heledale teemale",
    "inbox.cmdk.themeDark": "Lülita tumedale teemale",
    "inbox.cmdk.themeSystem": "Kasuta süsteemi teemat",
    "inbox.cmdk.resolveCurrent": "Lahenda fookuses olev vestlus",
    "inbox.cmdk.assignCurrent": "Määra fookuses olev vestlus endale",
    "inbox.theme.label": "Teema",
    "inbox.theme.light": "Hele",
    "inbox.theme.dark": "Tume",
    "inbox.theme.system": "Süsteem",
    "inbox.toast.sent": "Saadetud",
    "inbox.toast.resolved": "Lahendatud",
    "inbox.toast.assigned": "Määratud sinule",
    "inbox.toast.rejected": "Tagasilükatud",
    "inbox.kbdSheet.title": "Klahvikombinatsioonid",
    "inbox.kbdSheet.close": "Sulge",
    "inbox.assigned.you": "sina",
    "inbox.unassigned": "—",
    "inbox.search": "Otsi",
    "request.owner": "Omanik",
    "request.pet": "Lemmik",
    "request.status": "Staatus",
    "request.note": "Märkus",
    "request.reminder": "Meeldetuletus",
    "request.reply": "Vasta",
    "request.urgency": "Kiireloomulisus",
    "request.category": "Kategooria",
    "request.channel": "Kanal",
    "request.aiSummary": "AI kokkuvõte",
    "request.draft": "mustand",
    "request.aiNotice":
      "AI väljund on abistav, kuni töötaja ülevaatus salvestatakse tabelisse `ai_outputs`.",
    "request.conversation": "Vestlus",
    "request.timeline": "Pöördumise ajajoon",
    "request.internalNotes": "Sisemärkmed",
    "request.events": "Sündmused",
    "request.noSummary": "AI kokkuvõtet ei ole veel loodud.",
    "request.export": "Ekspordi",
    "request.actions": "Töötaja tegevused",
    "request.assigned": "Määratud",
    "request.unassigned": "Määramata",
    "request.you": "sina",
    "request.save": "Salvesta",
    "request.assign": "Määra",
    "request.replyToOwner": "Vasta omanikule",
    "request.replyPlaceholder": "Kirjuta sõnum, mille omanik saab.",
    "request.sendReply": "Saada vastus",
    "request.addInternalNote": "Lisa sisemärge",
    "request.notePlaceholder": "Lisa kontekst, mida näevad ainult kliiniku töötajad.",
    "request.saveNote": "Salvesta märge",
    "request.actionSaved": "Tegevus salvestatud.",
    "request.actionError": "Tegevust ei saanud salvestada. Kontrolli välju ja proovi uuesti."
  },
  ru: {
    "nav.back": "Назад",
    "nav.inbox": "Входящие",
    "nav.ownerIntake": "Запрос владельца",
    "nav.clinicInbox": "Входящие клиники",
    "auth.login": "Вход для сотрудников",
    "auth.logout": "Выйти",
    "auth.email": "Рабочая почта",
    "auth.sendLink": "Отправить magic link",
    "auth.checkEmail": "Проверьте почту для безопасной ссылки входа.",
    "auth.noMembership":
      "Эта учетная запись еще не связана с активной клиникой.",
    "auth.invalidEmail": "Введите корректную рабочую почту.",
    "auth.rateLimited":
      "Запрошено слишком много ссылок входа. Подождите несколько минут и попробуйте снова.",
    "auth.emailNotAuthorized":
      "Supabase Auth все еще использует стандартную отправку писем, поэтому этот адрес не разрешен. Настройте custom SMTP перед приглашением сотрудников клиники.",
    "auth.loginError": "Не удалось отправить ссылку входа. Попробуйте еще раз.",
    "nav.admin": "Админ",
    "admin.kicker": "Настройка платформы",
    "admin.title": "Запуск клиники",
    "admin.description":
      "Создавайте клиники, добавляйте сотрудников и копируйте ссылки приема без ручного редактирования Supabase.",
    "admin.superAdmin": "Суперадмин",
    "admin.createClinic": "Создать клинику",
    "admin.addStaff": "Добавить сотрудника",
    "admin.clinics": "Клиники",
    "admin.staff": "Сотрудники",
    "admin.name": "Название",
    "admin.slug": "Slug",
    "admin.country": "Страна",
    "admin.timezone": "Часовой пояс",
    "admin.locale": "Язык",
    "admin.clinic": "Клиника",
    "admin.email": "Почта",
    "admin.role": "Роль",
    "admin.intakeUrl": "Ссылка приема",
    "admin.create": "Создать",
    "admin.addStaffButton": "Добавить",
    "admin.active": "Активен",
    "admin.inactive": "Отключен",
    "admin.activate": "Активировать",
    "admin.deactivate": "Отключить",
    "admin.status.clinicCreated": "Клиника создана.",
    "admin.status.staffAdded": "Сотрудник добавлен.",
    "admin.status.staffUpdated": "Статус сотрудника обновлен.",
    "admin.error": "Не удалось сохранить изменение. Проверьте поля и попробуйте снова.",
    "language.label": "Язык",
    "home.kicker": "PetCura",
    "home.title": "Основа ClientOps для клиники",
    "home.badge.whatsapp": "WhatsApp-first",
    "home.badge.ai": "AI с подтверждением сотрудника",
    "home.badge.exports": "Экспорт для PMS",
    "home.hero.title":
      "Единый операционный слой для запросов владельцев, ответов и последующих действий.",
    "home.hero.body":
      "Эта основа показывает первый путь PetCura: запрос владельца, входящие клиники, карточка запроса, контракты данных Supabase и границы безопасности AI.",
    "home.workflow.1": "Владелец отправляет запрос через WhatsApp или веб-форму",
    "home.workflow.2": "AI предлагает категорию, краткое резюме и признаки риска",
    "home.workflow.3": "Сотрудник подтверждает срочность и отвечает",
    "home.workflow.4": "Напоминание или экспорт в PMS закрывает процесс",
    "home.status.kicker": "Статус основы",
    "home.status.title": "Готово к Sprint 1",
    "home.status.supabaseReady": "Supabase env настроен",
    "home.status.envPending": "Env ожидает настройки",
    "home.metric.demoRequests": "Демо-запросы",
    "home.metric.responseTarget": "Цель ответа в пилоте",
    "home.metric.callReduction": "Цель снижения звонков",
    "home.metric.safety": "Цель безопасности",
    "home.metric.zeroIncidents": "0 инцидентов",
    "home.next":
      "Следующий шаг: заменить демо-данные реальными запросами Supabase, добавить вход сотрудников и RLS по клиникам.",
    "intake.badge": "Веб-форма владельца",
    "intake.title": "Создать запрос",
    "intake.description":
      "Используйте эту форму, если WhatsApp неудобен. Клиника рассмотрит запрос и ответит на предпочитаемом языке.",
    "intake.ownerName": "Ваше имя",
    "intake.phone": "Номер телефона",
    "intake.petName": "Имя питомца",
    "intake.petSpecies": "Вид",
    "intake.petSpeciesPlaceholder": "Кошка, собака, кролик...",
    "intake.category": "Тип запроса",
    "intake.message": "Что происходит?",
    "intake.messagePlaceholder":
      "Опишите, что изменилось, когда началось и что вы уже пробовали.",
    "intake.attachments": "Фото/видео вложения будут включены через Supabase Storage.",
    "intake.disclaimer":
      "PetCura структурирует запросы для сотрудников клиники. Сервис не ставит диагноз и не дает экстренные медицинские советы.",
    "intake.submit": "Отправить запрос",
    "intake.submitting": "Отправка...",
    "intake.successTitle": "Запрос отправлен",
    "intake.successBody": "Ваш запрос теперь во входящих клиники.",
    "intake.caseId": "ID обращения",
    "intake.error": "Не удалось отправить запрос. Проверьте поля и попробуйте снова.",
    "inbox.kicker": "Панель клиники",
    "inbox.title": "ClientOps входящие",
    "inbox.liveBadge": "Реальные данные Supabase",
    "inbox.empty": "Входящие пусты.",
    "inbox.translation": "перевод",
    "inbox.streams.all": "Все",
    "inbox.streams.urgent": "Срочно",
    "inbox.streams.today": "Сегодня",
    "inbox.streams.week": "Неделя",
    "inbox.streams.routine": "Рутина",
    "inbox.streams.mine": "Мои",
    "inbox.streams.unassigned": "Без назначения",
    "inbox.view.list": "Список",
    "inbox.view.board": "Доска",
    "inbox.density.comfortable": "Просторно",
    "inbox.density.compact": "Компактно",
    "inbox.kbd.help": "Клавиатурные сокращения",
    "inbox.kbd.navigate": "Навигация по запросам",
    "inbox.kbd.resolve": "Отметить решённым",
    "inbox.kbd.assign": "Назначить себе",
    "inbox.kbd.reply": "Перейти к ответу",
    "inbox.kbd.translate": "Переключить перевод",
    "inbox.kbd.command": "Открыть палитру команд",
    "inbox.kbd.shortcuts": "Показать сокращения",
    "inbox.cmdk.placeholder": "Поиск запросов, владельцев, питомцев или команда…",
    "inbox.cmdk.empty": "Совпадений нет.",
    "inbox.cmdk.threads": "Запросы",
    "inbox.cmdk.streams": "Потоки",
    "inbox.cmdk.actions": "Действия",
    "inbox.cmdk.appearance": "Оформление",
    "inbox.cmdk.openThread": "Открыть запрос",
    "inbox.cmdk.filterStream": "Фильтр · {stream}",
    "inbox.cmdk.themeLight": "Светлая тема",
    "inbox.cmdk.themeDark": "Тёмная тема",
    "inbox.cmdk.themeSystem": "Системная тема",
    "inbox.cmdk.resolveCurrent": "Решить текущий запрос",
    "inbox.cmdk.assignCurrent": "Назначить текущий запрос себе",
    "inbox.theme.label": "Тема",
    "inbox.theme.light": "Светлая",
    "inbox.theme.dark": "Тёмная",
    "inbox.theme.system": "Системная",
    "inbox.toast.sent": "Отправлено",
    "inbox.toast.resolved": "Решено",
    "inbox.toast.assigned": "Назначено вам",
    "inbox.toast.rejected": "Отклонено",
    "inbox.kbdSheet.title": "Клавиатурные сокращения",
    "inbox.kbdSheet.close": "Закрыть",
    "inbox.assigned.you": "вы",
    "inbox.unassigned": "—",
    "inbox.search": "Поиск",
    "request.owner": "Владелец",
    "request.pet": "Питомец",
    "request.status": "Статус",
    "request.note": "Заметка",
    "request.reminder": "Напоминание",
    "request.reply": "Ответить",
    "request.urgency": "Срочность",
    "request.category": "Категория",
    "request.channel": "Канал",
    "request.aiSummary": "AI-резюме",
    "request.draft": "черновик",
    "request.aiNotice":
      "AI-результат является вспомогательным, пока проверка сотрудника не сохранена в `ai_outputs`.",
    "request.conversation": "Разговор",
    "request.timeline": "Хронология запроса",
    "request.internalNotes": "Внутренние заметки",
    "request.events": "События",
    "request.noSummary": "AI-резюме еще не создано.",
    "request.export": "Экспорт",
    "request.actions": "Действия сотрудника",
    "request.assigned": "Назначено",
    "request.unassigned": "Не назначено",
    "request.you": "вы",
    "request.save": "Сохранить",
    "request.assign": "Назначить",
    "request.replyToOwner": "Ответ владельцу",
    "request.replyPlaceholder": "Напишите сообщение, которое получит владелец.",
    "request.sendReply": "Отправить ответ",
    "request.addInternalNote": "Добавить внутреннюю заметку",
    "request.notePlaceholder": "Добавьте контекст, видимый только сотрудникам клиники.",
    "request.saveNote": "Сохранить заметку",
    "request.actionSaved": "Действие сохранено.",
    "request.actionError": "Не удалось сохранить действие. Проверьте поля и попробуйте снова."
  }
} satisfies Record<SupportedLocale, Record<string, string>>;

export type CopyKey = keyof (typeof uiCopy)[typeof defaultLocale];

export function createTranslator(locale: SupportedLocale) {
  return (key: CopyKey) => uiCopy[locale][key] ?? uiCopy[defaultLocale][key];
}

export function getRequestCategoryLabel(
  category: keyof typeof requestCategoryLabels.en,
  locale: SupportedLocale
) {
  return requestCategoryLabels[locale][category];
}

export function getRequestStatusLabel(
  status: keyof typeof requestStatusLabels.en,
  locale: SupportedLocale
) {
  return requestStatusLabels[locale][status];
}

export function getUrgencyLabel(
  urgency: keyof typeof urgencyLabels.en,
  locale: SupportedLocale
) {
  return urgencyLabels[locale][urgency];
}

export function getChannelLabel(
  channel: keyof typeof channelLabels.en,
  locale: SupportedLocale
) {
  return channelLabels[locale][channel];
}

export function getSenderLabel(
  sender: keyof typeof senderLabels.en,
  locale: SupportedLocale
) {
  return senderLabels[locale][sender];
}
