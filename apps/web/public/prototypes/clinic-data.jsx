// Realistic Estonian veterinary mock data

const STAFF = {
  LK: { id: "LK", name: "Liis Kallavus", role: "Vet" },
  JR: { id: "JR", name: "Janar Reinvald", role: "Vet" },
  MP: { id: "MP", name: "Marek Põld", role: "Tech" },
  AS: { id: "AS", name: "Anna Sokolova", role: "Reception" },
};

const REQUESTS = [
  {
    id: "req_8412",
    pet: { name: "Mira", species: "Border Collie", age: "4y", weight: "18kg", spayed: true, lastVisit: "12 Apr 2026", colour: "tricolor" },
    owner: { name: "Kask Pille", phone: "+372 555 0188", email: "pille.kask@hot.ee", locale: "et" },
    status: "waiting_staff",
    urgency: "today",
    category: "lameness",
    elapsed: "12m",
    elapsedAbsolute: "09:02",
    assignee: "LK",
    presence: ["LK"],
    attach: 1,
    attachKind: "video",
    preview: "Limps on back-left leg since this morning. Still eating.",
    sourceLang: "et",
    aiConfidence: 0.78,
    messages: [
      { kind: "owner", at: "09:02", text: "Tere! Mira lonkab täna hommikul tagumist vasakut jalga. Söömas käib. Saatsin pildi.", translation: { lang: "en", text: "Hi! Mira has been limping on her back-left leg since this morning. Still eating. I sent a photo." }, attach: ["video"] },
      { kind: "system", at: "09:03", text: "Auto-translated to EN · cached · whisper-v3" },
      { kind: "note", at: "09:04", actor: "JR", text: "Looks like a sprain, not a fracture. Booked observation slot at 14:00." },
    ],
    aiSummary: "Lameness, back-left, ~4h onset. Owner reports normal eating and demeanor. Video shows mild swelling above the carpus, no visible wound. No prior lameness history.",
    timeline: [
      { at: "09:02", actor: "system", text: "Created via WhatsApp (et)" },
      { at: "09:03", actor: "AI", text: "category → lameness · conf 0.91" },
      { at: "09:04", actor: "JR", text: "Internal note added" },
      { at: "09:06", actor: "AI", text: "Summary generated · v3 · conf 0.78" },
      { at: "09:08", actor: "LK", text: "Assigned to LK" },
      { at: "09:11", actor: "LK", text: "Status → waiting_staff" },
    ],
  },
  {
    id: "req_8413",
    pet: { name: "Reks", species: "German Shepherd", age: "7y", weight: "32kg", spayed: false, lastVisit: "06 Mar 2026" },
    owner: { name: "Saar Mart", phone: "+372 555 0211", email: "msaar@gmail.com", locale: "et" },
    status: "new", urgency: "now", category: "bleeding", elapsed: "2m", assignee: null, presence: [],
    attach: 2, attachKind: "image",
    preview: "Cut on front paw, bleeding for 20 minutes. Photo attached.",
    sourceLang: "et", aiConfidence: 0.92,
  },
  {
    id: "req_8414",
    pet: { name: "Tipu", species: "Maine Coon", age: "2y", weight: "5.2kg" },
    owner: { name: "Ivanov Vladimir", phone: "+372 555 0233", locale: "ru" },
    status: "waiting_owner", urgency: "routine", category: "vaccination", elapsed: "42m", assignee: "JR", presence: [],
    attach: 0, preview: "Asked about timing for second FVRCP booster.", sourceLang: "ru", aiConfidence: 0.88,
  },
  {
    id: "req_8415",
    pet: { name: "Kasper", species: "Maine Coon", age: "9y", weight: "6.8kg" },
    owner: { name: "Tamm Kati", phone: "+372 555 0244", locale: "et" },
    status: "waiting_owner", urgency: "routine", category: "refill", elapsed: "1h", assignee: "LK", presence: [],
    attach: 0, preview: "Refill request for chronic thyroid medication.", sourceLang: "et", aiConfidence: 0.95,
  },
  {
    id: "req_8416",
    pet: { name: "Pelmen", species: "Pug", age: "3y", weight: "9kg" },
    owner: { name: "Petrova Anna", phone: "+372 555 0250", locale: "ru" },
    status: "new", urgency: "today", category: "skin", elapsed: "3m", assignee: null, presence: ["MP"],
    attach: 3, attachKind: "image", preview: "Red patches on belly. Itching for 2 days. 3 photos.", sourceLang: "ru", aiConfidence: 0.81,
  },
  {
    id: "req_8417",
    pet: { name: "Muki", species: "Labrador", age: "6y", weight: "31kg" },
    owner: { name: "Lepp Andres", phone: "+372 555 0260", locale: "et" },
    status: "new", urgency: "routine", category: "diet", elapsed: "5m", assignee: null, presence: [],
    attach: 0, preview: "Question about transitioning to senior food.", sourceLang: "et", aiConfidence: 0.94,
  },
  {
    id: "req_8418",
    pet: { name: "Roosa", species: "Pointer", age: "5y", weight: "22kg" },
    owner: { name: "Mägi Triin", phone: "+372 555 0271", locale: "et" },
    status: "waiting_staff", urgency: "today", category: "post-op", elapsed: "2h", assignee: "JR", presence: [],
    attach: 1, attachKind: "image", preview: "Post-spay check — incision looks slightly red, photo attached.", sourceLang: "et", aiConfidence: 0.84,
  },
  {
    id: "req_8419",
    pet: { name: "Bublik", species: "Cocker Spaniel", age: "11y", weight: "13kg" },
    owner: { name: "Kuznetsov Sergei", phone: "+372 555 0282", locale: "ru" },
    status: "resolved", urgency: "routine", category: "follow-up", elapsed: "yesterday", assignee: "LK", presence: [],
    attach: 0, preview: "Thank you, ear cleaning helped — no more scratching.", sourceLang: "ru", aiConfidence: 0.97,
  },
  {
    id: "req_8420",
    pet: { name: "Lumi", species: "Husky", age: "2y", weight: "24kg" },
    owner: { name: "Saaremaa Liis", phone: "+372 555 0299", locale: "et" },
    status: "new", urgency: "routine", category: "behaviour", elapsed: "8m", assignee: null, presence: [],
    attach: 0, preview: "Lumi is anxious in the car — any advice?", sourceLang: "et", aiConfidence: 0.86,
  },
  {
    id: "req_8421",
    pet: { name: "Susi", species: "Irish Wolfhound", age: "8y", weight: "55kg" },
    owner: { name: "Tõnisson Kalev", phone: "+372 555 0312", locale: "et" },
    status: "waiting_owner", urgency: "today", category: "appointment", elapsed: "4h", assignee: "MP", presence: [],
    attach: 0, preview: "Scheduling annual blood panel — confirmed Thu 14 May 10:30.", sourceLang: "et", aiConfidence: 0.99,
  },
  {
    id: "req_8422",
    pet: { name: "Nuki", species: "Jack Russell", age: "1y", weight: "7kg" },
    owner: { name: "Aas Heli", phone: "+372 555 0331", locale: "et" },
    status: "resolved", urgency: "routine", category: "vaccination", elapsed: "yesterday", assignee: "JR", presence: [],
    attach: 0, preview: "Vaccination confirmation sent.", sourceLang: "et", aiConfidence: 0.98,
  },
];

// Inbox views with filters
const VIEWS = [
  { id: "my-open", label: "My open", filter: (r, me="LK") => r.assignee === me && r.status !== "resolved" },
  { id: "unassigned", label: "Unassigned", filter: r => !r.assignee && r.status !== "resolved" },
  { id: "urgent", label: "Urgent", filter: r => (r.urgency === "now" || r.urgency === "critical") && r.status !== "resolved" },
  { id: "today", label: "Today", filter: r => r.urgency === "today" && r.status !== "resolved" },
  { id: "all-open", label: "All open", filter: r => r.status !== "resolved" },
  { id: "resolved", label: "Resolved", filter: r => r.status === "resolved" },
];

// Reminders
const REMINDERS = [
  { id: "rem_001", pet: "Mira", owner: "Kask Pille", title: "Re-check lameness", scheduledAt: "Mon 12 May · 14:00", channel: "whatsapp", state: "scheduled", createdBy: "LK" },
  { id: "rem_002", pet: "Kasper", owner: "Tamm Kati", title: "Thyroid refill due", scheduledAt: "Tue 13 May · 09:00", channel: "whatsapp", state: "sent", createdBy: "LK" },
  { id: "rem_003", pet: "Tipu", owner: "Ivanov V.", title: "FVRCP booster #2", scheduledAt: "Wed 14 May · 10:30", channel: "whatsapp", state: "acknowledged", createdBy: "JR" },
  { id: "rem_004", pet: "Roosa", owner: "Mägi T.", title: "Suture removal", scheduledAt: "Wed 14 May · 16:00", channel: "sms", state: "scheduled", createdBy: "JR" },
  { id: "rem_005", pet: "Bublik", owner: "Kuznetsov S.", title: "Ear-clean follow-up", scheduledAt: "Thu 15 May · 11:00", channel: "whatsapp", state: "snoozed", createdBy: "LK" },
  { id: "rem_006", pet: "Susi", owner: "Tõnisson K.", title: "Annual blood panel", scheduledAt: "Thu 14 May · 10:30", channel: "whatsapp", state: "scheduled", createdBy: "MP" },
  { id: "rem_007", pet: "Lumi", owner: "Saaremaa L.", title: "Behavioural consult call", scheduledAt: "Fri 09 May · 13:00", channel: "whatsapp", state: "completed", createdBy: "LK" },
  { id: "rem_008", pet: "Pelmen", owner: "Petrova A.", title: "Skin re-check", scheduledAt: "Mon 05 May · 15:00", channel: "whatsapp", state: "missed", createdBy: "MP" },
];

Object.assign(window, { STAFF, REQUESTS, VIEWS, REMINDERS });
