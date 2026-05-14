import type {
  IntakeQuestionOutput,
  IntakeRoutingSuggestion,
  IntakeServiceIntent
} from "@petcura/ai";
import type {
  RequestCategory,
  RequestUrgency,
  SupportedLocale
} from "@petcura/shared";

export type EmergencyDetection = {
  triggered: boolean;
  riskFlags: string[];
  matchedTerms: string[];
};

export type ClinicOpenStatus = "open" | "closed" | "unknown";

export type ClinicOpenState = {
  status: ClinicOpenStatus;
  checkedAt: string;
  reason: "regular_hours" | "holiday" | "no_hours" | "invalid_timezone";
};

export type ClinicHoursRow = {
  weekday: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
};

export type ClinicHolidayRow = {
  holiday_date: string;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

export type EmergencyPolicyText = {
  emergencyPhone?: string | null;
  afterHoursPhone?: string | null;
  emergencyUrl?: string | null;
  instructions?: string | null;
  afterHoursInstructions?: string | null;
};

export type EmergencyBanner = {
  title: string;
  body: string;
  phone: string | null;
  url: string | null;
  isAfterHours: boolean;
};

const emergencyTerms: Array<{
  pattern: RegExp;
  flag: string;
  term: string;
}> = [
  { pattern: /\b(can'?t|cannot|not)\s+(breathe|breath)\b/i, flag: "breathing difficulty", term: "cannot breathe" },
  { pattern: /\b(breathing\s+(hard|difficulty|problem)|gasping|choking)\b/i, flag: "breathing difficulty", term: "breathing difficulty" },
  { pattern: /\b(collapse|collapsed|unconscious|faint(ed|ing)?)\b/i, flag: "collapse or unconsciousness", term: "collapse" },
  { pattern: /\b(seizure|seizing|convulsion)\b/i, flag: "seizure", term: "seizure" },
  { pattern: /\b(poison|toxin|rat\s+poison|ate\s+chocolate|chocolate|xylitol|antifreeze)\b/i, flag: "possible toxin ingestion", term: "toxin" },
  { pattern: /\b(hit\s+by\s+(a\s+)?car|traffic accident|car accident)\b/i, flag: "trauma", term: "hit by car" },
  { pattern: /\b(heavy\s+bleeding|bleeding\s+a\s+lot|blood\s+everywhere|hemorrhage)\b/i, flag: "heavy bleeding", term: "heavy bleeding" },
  { pattern: /\b(bloat|swollen\s+(belly|abdomen)|distended\s+(belly|abdomen))\b/i, flag: "possible bloat", term: "bloat" },
  { pattern: /\b(can'?t|cannot|not)\s+(pee|urinate|pass\s+urine)\b/i, flag: "urination blockage", term: "cannot urinate" },
  { pattern: /\b(eye\s+(injury|trauma)|eye\s+out|proptosis)\b/i, flag: "eye injury", term: "eye injury" },
  { pattern: /\b(ei\s+hinga|hingamisrask|lämb|kokku\s+kuk|krambi|mürg|šokolaad|sokolaad|verejooks|auto\s+alla|ei\s+pissi|punnis\s+kõht)\b/i, flag: "emergency language", term: "et-emergency" },
  { pattern: /\b(не\s+дыш|задых|судорог|обморок|без\s+созн|отрав|шоколад|кровотеч|машин|не\s+моч|вздут)\b/i, flag: "emergency language", term: "ru-emergency" }
];

const servicePatterns: Array<{
  intent: IntakeServiceIntent;
  pattern: RegExp;
}> = [
  {
    intent: "grooming",
    pattern: /\b(groom|grooming|bath|trim|nail|claw|hooldus|küün|pesu|груминг|стриж|когт)\b/i
  },
  {
    intent: "delivery",
    pattern: /\b(deliver|delivery|courier|bring\s+(food|medicine)|home\s+drop|kojuvedu|tarne|достав)\b/i
  },
  {
    intent: "walking",
    pattern: /\b(walk|walking|dog\s+walker|jalut|выгул)\b/i
  },
  {
    intent: "boarding",
    pattern: /\b(boarding|hotel|sitting|keep\s+(my|our)\s+(pet|dog|cat)|pet\s+sitter|hoi(d|u)|hotell|передерж|отель)\b/i
  }
];

export function detectEmergencyLanguage(text: string): EmergencyDetection {
  const normalized = text.trim();
  const matches = emergencyTerms.filter(({ pattern }) =>
    pattern.test(normalized)
  );
  const riskFlags = Array.from(new Set(matches.map((match) => match.flag)));
  const matchedTerms = Array.from(new Set(matches.map((match) => match.term)));

  return {
    triggered: matches.length > 0,
    riskFlags,
    matchedTerms
  };
}

export function detectServiceIntent(
  text: string,
  category: RequestCategory
): IntakeServiceIntent {
  const matched = servicePatterns.find(({ pattern }) => pattern.test(text));
  if (matched) return matched.intent;

  if (category === "appointment") return "appointment";
  if (category === "refill") return "refill";
  if (category === "follow_up") return "follow_up";
  if (category === "admin") return "admin";
  return "medical";
}

export function categoryForServiceIntent(
  intent: IntakeServiceIntent,
  fallback: RequestCategory
): RequestCategory {
  if (intent === "appointment" || intent === "grooming") return "appointment";
  if (intent === "refill") return "refill";
  if (intent === "follow_up") return "follow_up";
  if (
    intent === "admin" ||
    intent === "delivery" ||
    intent === "walking" ||
    intent === "boarding" ||
    intent === "other"
  ) {
    return "admin";
  }
  return fallback;
}

export function routingForIntent({
  emergency,
  serviceIntent,
  category
}: {
  emergency: boolean;
  serviceIntent: IntakeServiceIntent;
  category: RequestCategory;
}): IntakeRoutingSuggestion {
  if (emergency) return "on_call";
  if (serviceIntent === "grooming") return "grooming";
  if (category === "medical_question" || category === "follow_up") return "vet";
  if (category === "refill") return "tech";
  return "reception";
}

export function urgencySuggestionForRules({
  emergency,
  category
}: {
  emergency: boolean;
  category: RequestCategory;
}): RequestUrgency {
  if (emergency) return "high";
  if (category === "medical_question") return "medium";
  return "low";
}

export function fallbackIntakeOutput({
  ownerName,
  petName,
  petSpecies,
  category,
  message,
  locale,
  emergency
}: {
  ownerName: string;
  petName: string;
  petSpecies: string;
  category: RequestCategory;
  message: string;
  locale: SupportedLocale;
  emergency: EmergencyDetection;
}): IntakeQuestionOutput {
  const serviceIntent = detectServiceIntent(message, category);
  const categorySuggestion = categoryForServiceIntent(serviceIntent, category);
  const routingSuggestion = routingForIntent({
    emergency: emergency.triggered,
    serviceIntent,
    category: categorySuggestion
  });
  const urgencySuggestion = urgencySuggestionForRules({
    emergency: emergency.triggered,
    category: categorySuggestion
  });
  const missingFields = [
    petSpecies.trim() ? null : "pet_species",
    message.trim().length < 30 ? "details" : null
  ].filter((value): value is string => value !== null);
  const clarifyingQuestions = emergency.triggered
    ? localizedEmergencyQuestions(locale)
    : localizedClarifyingQuestions(locale, categorySuggestion, serviceIntent);

  return {
    categorySuggestion,
    serviceIntent,
    routingSuggestion,
    urgencySuggestion,
    emergencySignal: emergency.triggered,
    riskFlags: emergency.riskFlags,
    missingFields,
    clarifyingQuestions,
    handoffSummary: `${ownerName} reports for ${petName || "their pet"} (${petSpecies || "unknown species"}): ${message}`.slice(0, 900),
    confidence: emergency.triggered ? 0.72 : 0.58,
    safetyNotes: [
      "advisory_only",
      "staff_review_required",
      "no_diagnosis_no_prescription"
    ]
  };
}

export function computeClinicOpenState({
  now = new Date(),
  timezone,
  hours,
  holidays
}: {
  now?: Date;
  timezone: string;
  hours: ClinicHoursRow[];
  holidays: ClinicHolidayRow[];
}): ClinicOpenState {
  const checkedAt = now.toISOString();
  const parts = getLocalDateTimeParts(now, timezone);

  if (!parts) {
    return { status: "unknown", checkedAt, reason: "invalid_timezone" };
  }

  const holiday = holidays.find(
    (row) => row.holiday_date === parts.isoDate
  );
  if (holiday) {
    if (holiday.is_closed || !holiday.opens_at || !holiday.closes_at) {
      return { status: "closed", checkedAt, reason: "holiday" };
    }
    return {
      status: isWithinWindow(parts.minutes, holiday.opens_at, holiday.closes_at)
        ? "open"
        : "closed",
      checkedAt,
      reason: "holiday"
    };
  }

  const todaysHours = hours.filter((row) => row.weekday === parts.weekday);
  if (todaysHours.length === 0) {
    return { status: "unknown", checkedAt, reason: "no_hours" };
  }

  if (todaysHours.every((row) => row.is_closed)) {
    return { status: "closed", checkedAt, reason: "regular_hours" };
  }

  return {
    status: todaysHours.some(
      (row) =>
        !row.is_closed && isWithinWindow(parts.minutes, row.opens_at, row.closes_at)
    )
      ? "open"
      : "closed",
    checkedAt,
    reason: "regular_hours"
  };
}

export function buildEmergencyBanner({
  locale,
  emergency,
  openState,
  policy
}: {
  locale: SupportedLocale;
  emergency: EmergencyDetection;
  openState: ClinicOpenState;
  policy: EmergencyPolicyText | null;
}): EmergencyBanner | null {
  if (!emergency.triggered) return null;

  const isAfterHours = openState.status === "closed";
  const localized = emergencyBannerCopy[locale] ?? emergencyBannerCopy.en;
  const policyBody = isAfterHours
    ? policy?.afterHoursInstructions || policy?.instructions
    : policy?.instructions;

  return {
    title: localized.title,
    body: policyBody?.trim() || (isAfterHours ? localized.afterHoursBody : localized.body),
    phone:
      (isAfterHours ? policy?.afterHoursPhone : policy?.emergencyPhone) ||
      policy?.emergencyPhone ||
      null,
    url: policy?.emergencyUrl || null,
    isAfterHours
  };
}

function localizedClarifyingQuestions(
  locale: SupportedLocale,
  category: RequestCategory,
  intent: IntakeServiceIntent
) {
  if (locale === "et") {
    if (intent === "grooming") {
      return [
        "Millist hooldust soovid?",
        "Kas lemmikul on nahaprobleeme või muid tervisemuresid?"
      ];
    }
    return [
      "Millal see algas?",
      "Kas söömine, joomine või käitumine on muutunud?"
    ];
  }

  if (locale === "ru") {
    if (intent === "grooming") {
      return [
        "Какая услуга по уходу нужна?",
        "Есть ли проблемы с кожей или другие симптомы?"
      ];
    }
    return [
      "Когда это началось?",
      "Изменились ли аппетит, питье или поведение?"
    ];
  }

  if (category === "refill") {
    return [
      "Which medication do you need refilled?",
      "How many days of medication are left?"
    ];
  }

  if (intent === "grooming") {
    return [
      "What grooming service would you like?",
      "Are there any skin issues or medical concerns we should note?"
    ];
  }

  return [
    "When did this start?",
    "Has eating, drinking, bathroom use, or behavior changed?"
  ];
}

function localizedEmergencyQuestions(locale: SupportedLocale) {
  if (locale === "et") {
    return ["Kas lemmik on praegu teadvusel ja hingab?", "Kas saad kohe kliinikusse või erakorralisse vastuvõttu helistada?"];
  }
  if (locale === "ru") {
    return ["Питомец сейчас в сознании и дышит?", "Можете ли вы сразу позвонить в клинику или дежурную клинику?"];
  }
  return [
    "Is your pet conscious and breathing right now?",
    "Can you call the clinic or emergency provider now?"
  ];
}

const emergencyBannerCopy: Record<
  SupportedLocale,
  { title: string; body: string; afterHoursBody: string }
> = {
  en: {
    title: "Possible emergency",
    body: "This may need urgent veterinary care. Call the clinic now if your pet is unstable or getting worse.",
    afterHoursBody:
      "The clinic may be closed. Call the clinic or an emergency veterinary provider now if your pet is unstable or getting worse."
  },
  et: {
    title: "Võimalik erakorraline juhtum",
    body: "See võib vajada kiiret veterinaarabi. Helista kohe kliinikusse, kui lemmiku seisund on ebastabiilne või halveneb.",
    afterHoursBody:
      "Kliinik võib olla suletud. Helista kohe kliinikusse või erakorralise abi pakkujale, kui lemmiku seisund on ebastabiilne või halveneb."
  },
  ru: {
    title: "Возможная экстренная ситуация",
    body: "Это может требовать срочной ветеринарной помощи. Позвоните в клинику сейчас, если состояние питомца нестабильно или ухудшается.",
    afterHoursBody:
      "Клиника может быть закрыта. Позвоните в клинику или дежурную ветеринарную службу сейчас, если состояние питомца нестабильно или ухудшается."
  }
};

function getLocalDateTimeParts(now: Date, timezone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });
    const parts = Object.fromEntries(
      formatter.formatToParts(now).map((part) => [part.type, part.value])
    );
    const weekday = weekdayMap[parts.weekday ?? ""];
    const hour = Number(parts.hour);
    const minute = Number(parts.minute);

    if (
      weekday === undefined ||
      !parts.year ||
      !parts.month ||
      !parts.day ||
      !Number.isFinite(hour) ||
      !Number.isFinite(minute)
    ) {
      return null;
    }

    return {
      isoDate: `${parts.year}-${parts.month}-${parts.day}`,
      weekday,
      minutes: hour * 60 + minute
    };
  } catch {
    return null;
  }
}

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

function parseTimeToMinutes(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function isWithinWindow(minutes: number, opensAt: string, closesAt: string) {
  const opens = parseTimeToMinutes(opensAt);
  const closes = parseTimeToMinutes(closesAt);
  if (opens === null || closes === null || opens === closes) return false;
  if (opens < closes) {
    return minutes >= opens && minutes < closes;
  }
  return minutes >= opens || minutes < closes;
}
