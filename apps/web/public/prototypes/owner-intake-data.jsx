/* global window */
// Owner intake — mock conversation + form steps

// WhatsApp conversation: owner Liis writes about her cat Lumi.
// AI bot ("PetCura") replies in same language (Estonian → English shown below).
const WA_THREAD = [
  { from: "owner", time: "9:42", body: "Tere! Lumi sügeleb juba paar päeva. Kõhul on punased plekid. Saatsin kolm pilti." },
  { from: "owner", time: "9:42", attach: ["IMG_8841.jpg", "IMG_8842.jpg", "IMG_8843.jpg"] },
  { from: "bot",   time: "9:42", body: "Tere Liis! Ma olen PetCura — kliiniku assistent. Edastan teie sõnumi tiimile. Enne seda paar küsimust, et arst saaks paremini ette valmistada.", system: "PetCura · auto-reply" },
  { from: "bot",   time: "9:43", body: "Kas Lumi sööb ja joob normaalselt?", q: "appetite" },
  { from: "owner", time: "9:43", body: "Jah, sööb hästi. Aga kraabib palju." },
  { from: "bot",   time: "9:43", body: "Kas olete viimase kuu jooksul vahetanud toitu, šampooni või liiva?", q: "exposure" },
  { from: "owner", time: "9:44", body: "Vahetasime liiva nädal aega tagasi." },
  { from: "bot",   time: "9:44", body: "Selge. Kas Lumi on praegu valus või rahutu — kas teie hinnangul see on kiireloomuline?", q: "urgency", chips: ["Kiire", "Sama päev", "Sel nädalal"] },
  { from: "owner", time: "9:44", body: "Sama päev." },
  { from: "bot",   time: "9:45", body: "Aitäh, Liis. Edastasin lugu Dr. Kasele. Saate vastuse 15 minuti jooksul. Kui Lumi muutub rahutuks, saatke uus sõnum.", system: "Triaged · skin · same-day · routed to Dr. Kask" },
];

// English translations (toggle on)
const WA_TRANSLATIONS = {
  0: "Hi! Lumi has been itching for a couple of days. Red patches on her belly. I sent three photos.",
  3: "Hi Liis! I'm PetCura — the clinic assistant. I'll forward your message to the team. First a few questions so the vet can prepare.",
  4: "Is Lumi eating and drinking normally?",
  5: "Yes, eating well. But scratching a lot.",
  6: "Have you changed food, shampoo or litter in the last month?",
  7: "We changed the litter a week ago.",
  8: "Got it. Is Lumi in pain or restless right now — would you say this is urgent?",
  9: "Same day.",
  10: "Got it. Is Lumi in pain or restless right now — would you say this is urgent?",
  11: "Same day.",
  12: "Thanks Liis. Forwarded to Dr. Kask. You'll hear back within 15 minutes. If Lumi gets distressed, send a new message.",
};

// Web intake — multi-step form
const WEB_STEPS = [
  {
    id: "pet",
    title: "Tell us about your pet",
    subtitle: "We'll match this to their record if they're already registered.",
    fields: [
      { id: "petName", label: "Pet's name", value: "Lumi", type: "text" },
      { id: "species", label: "Species", value: "Cat", type: "select", options: ["Dog", "Cat", "Rabbit", "Bird", "Other"] },
      { id: "age",     label: "Age", value: "4 years", type: "text" },
      { id: "registered", label: "Already a client?", value: "Yes", type: "segmented", options: ["Yes", "No", "Not sure"] },
    ],
  },
  {
    id: "issue",
    title: "What's going on?",
    subtitle: "A short description in your own words. We'll structure it for you.",
    fields: [
      { id: "summary", label: "Describe the issue", value: "Itching for 2 days, red patches on belly. We changed litter a week ago.", type: "textarea" },
      { id: "duration", label: "How long?", value: "2 days", type: "chips", options: ["Today", "1–3 days", "Week+", "Chronic"] },
      { id: "urgency", label: "How urgent?", value: "Same day", type: "chips", options: ["Emergency", "Same day", "This week", "Routine"] },
    ],
    aiBlock: {
      title: "AI suggestion",
      body: "Likely category: skin / allergy. Asking 2 follow-ups would help the vet prepare faster — proceed to next step?",
    },
  },
  {
    id: "photos",
    title: "Add photos (optional)",
    subtitle: "Skin, eyes, mouth, gait — whatever shows the issue best. Up to 6.",
    fields: [
      { id: "photos", type: "uploader", value: ["IMG_8841.jpg", "IMG_8842.jpg", "IMG_8843.jpg"] },
    ],
  },
  {
    id: "contact",
    title: "How should we reach you?",
    subtitle: "We'll send updates via WhatsApp. SMS fallback if needed.",
    fields: [
      { id: "name", label: "Your name", value: "Liis Saaremaa", type: "text" },
      { id: "phone", label: "Phone", value: "+372 5123 4567", type: "text" },
      { id: "channel", label: "Preferred channel", value: "WhatsApp", type: "segmented", options: ["WhatsApp", "SMS", "Phone call"] },
      { id: "lang", label: "Language", value: "Eesti", type: "segmented", options: ["Eesti", "English", "Русский"] },
    ],
  },
];

const WEB_REVIEW = {
  pet: "Lumi · Cat · 4 years · existing client",
  issue: "Skin · Same day · 2 days duration",
  summary: "Itching for 2 days, red patches on belly. Changed litter a week ago.",
  photos: 3,
  contact: "Liis Saaremaa · +372 5123 4567 · WhatsApp · Eesti",
};

Object.assign(window, { WA_THREAD, WA_TRANSLATIONS, WEB_STEPS, WEB_REVIEW });
