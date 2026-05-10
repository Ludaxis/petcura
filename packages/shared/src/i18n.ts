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
    WhatsApp: "WhatsApp",
    Web: "Web"
  },
  et: {
    WhatsApp: "WhatsApp",
    Web: "Veeb"
  },
  ru: {
    WhatsApp: "WhatsApp",
    Web: "Веб"
  }
} as const;

export type RequestChannel = keyof typeof channelLabels.en;

export const senderLabels = {
  en: {
    Owner: "Owner",
    "AI intake": "AI intake",
    Staff: "Staff"
  },
  et: {
    Owner: "Omanik",
    "AI intake": "AI vastuvõtt",
    Staff: "Töötaja"
  },
  ru: {
    Owner: "Владелец",
    "AI intake": "AI-прием",
    Staff: "Сотрудник"
  }
} as const;

export type MessageSender = keyof typeof senderLabels.en;

export const uiCopy = {
  en: {
    "nav.back": "Back",
    "nav.inbox": "Inbox",
    "nav.ownerIntake": "Owner intake",
    "nav.clinicInbox": "Clinic inbox",
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
    "intake.category": "Request type",
    "intake.message": "What is happening?",
    "intake.messagePlaceholder":
      "Tell the clinic what changed, when it started, and what you have already tried.",
    "intake.attachments": "Photo/video attachments will be enabled with Supabase Storage.",
    "intake.disclaimer":
      "PetCura structures requests for clinic staff. It does not provide diagnosis or emergency medical advice.",
    "intake.submitDisabled": "Submit once Supabase is connected",
    "inbox.kicker": "Clinic dashboard",
    "inbox.title": "ClientOps inbox",
    "inbox.demoBadge": "Demo data until Supabase live requests are connected",
    "inbox.translation": "translation",
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
    "request.export": "Export"
  },
  et: {
    "nav.back": "Tagasi",
    "nav.inbox": "Postkast",
    "nav.ownerIntake": "Omaniku pöördumine",
    "nav.clinicInbox": "Kliiniku postkast",
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
    "intake.category": "Pöördumise tüüp",
    "intake.message": "Mis toimub?",
    "intake.messagePlaceholder":
      "Kirjelda, mis muutus, millal see algas ja mida oled juba proovinud.",
    "intake.attachments": "Foto/video lisamine aktiveeritakse Supabase Storage'iga.",
    "intake.disclaimer":
      "PetCura struktureerib pöördumised kliiniku töötajatele. See ei anna diagnoosi ega erakorralist meditsiinilist nõu.",
    "intake.submitDisabled": "Saada, kui Supabase on ühendatud",
    "inbox.kicker": "Kliiniku töölaud",
    "inbox.title": "ClientOps postkast",
    "inbox.demoBadge": "Demodata kuni Supabase'i pärispöördumised on ühendatud",
    "inbox.translation": "tõlge",
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
    "request.export": "Ekspordi"
  },
  ru: {
    "nav.back": "Назад",
    "nav.inbox": "Входящие",
    "nav.ownerIntake": "Запрос владельца",
    "nav.clinicInbox": "Входящие клиники",
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
    "intake.category": "Тип запроса",
    "intake.message": "Что происходит?",
    "intake.messagePlaceholder":
      "Опишите, что изменилось, когда началось и что вы уже пробовали.",
    "intake.attachments": "Фото/видео вложения будут включены через Supabase Storage.",
    "intake.disclaimer":
      "PetCura структурирует запросы для сотрудников клиники. Сервис не ставит диагноз и не дает экстренные медицинские советы.",
    "intake.submitDisabled": "Отправить после подключения Supabase",
    "inbox.kicker": "Панель клиники",
    "inbox.title": "ClientOps входящие",
    "inbox.demoBadge": "Демо-данные до подключения реальных запросов Supabase",
    "inbox.translation": "перевод",
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
    "request.export": "Экспорт"
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
