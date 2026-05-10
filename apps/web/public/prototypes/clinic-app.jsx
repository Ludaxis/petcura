/* global React, ReactDOM, REQUESTS, STAFF, VIEWS, REMINDERS,
   IInbox, IBell, IChart, ISettings, ISearch, IPlus, IUser, ITag, ICheck,
   IRefresh, IX, IEdit, ISend, IPaperclip, IClock, ITranslate, IFile, IArrowL,
   IPanel, IList, IBoard, IFilter, ISort, IMore, IFlag, ISparkle,
   TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSelect, useTweaks */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ======================================================
// Tweaks defaults
// ======================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "B",
  "theme": "light",
  "viewport": "auto",
  "showShortcuts": true,
  "presence": true,
  "translate": false
}/*EDITMODE-END*/;

const VIEWPORT_PRESETS = {
  auto:    { w: null,  h: null,  label: "Fit window" },
  desktop: { w: 1320, h: 820,  label: "Desktop · 1320" },
  tablet:  { w: 820,  h: 1080, label: "Tablet · 820" },
  phone:   { w: 390,  h: 760,  label: "Phone · 390" },
};

// ======================================================
// Helpers
// ======================================================
const cls = (...xs) => xs.filter(Boolean).join(" ");
const STATUS_LABEL = {
  new: "new",
  waiting_staff: "waiting · staff",
  waiting_owner: "waiting · owner",
  resolved: "resolved",
};
const URGENCY_LABEL = { routine: "routine", today: "today", now: "now", critical: "critical" };

function StatusPill({ status, urgency }) {
  if (urgency === "now" || urgency === "critical") {
    return (
      <span className={cls("pill", urgency === "critical" ? "urgent-critical" : "urgent-now")}>
        <span className="dot" />{urgency}
      </span>
    );
  }
  if (urgency === "today") {
    return <span className="pill urgent-today"><span className="dot" />today</span>;
  }
  const cn = status === "waiting_staff" ? "waiting-staff" :
             status === "waiting_owner" ? "waiting-owner" :
             status === "resolved"      ? "resolved" : "new";
  return <span className={cls("pill", cn)}>{STATUS_LABEL[status]}</span>;
}

function Avatar({ id, size = "md" }) {
  const s = STAFF[id];
  if (!s) return <span className={cls("avatar", "empty", size === "sm" && "sm")}>—</span>;
  return <span className={cls("avatar", size === "sm" && "sm", size === "lg" && "lg")} title={s.name}>{id}</span>;
}

// ======================================================
// Sidebar
// ======================================================
function Sidebar({ activeView, onView, mode, counts, onCmd }) {
  return (
    <aside className={cls("sidebar", mode === "tablet" && "mini")}>
      <div className="sidebar-head">
        <div className="logo">P</div>
        <div className="clinic-meta">
          <span className="name">PetCura</span>
          <span className="tag">Tartu Loomakliinik</span>
        </div>
      </div>

      <div className="sidebar-section">
        <button className="nav-item" onClick={onCmd}>
          <ISearch className="icon" />
          <span className="label-text">Search</span>
          <span className="count keys"><kbd>⌘K</kbd></span>
        </button>
      </div>

      <div className="sidebar-section">
        <div className="label">Inbox</div>
        <button className={cls("nav-item", activeView.startsWith("v:") === false && activeView === "inbox" && "active")}>
          <IInbox className="icon" />
          <span className="label-text">Inbox</span>
          <span className="count">{counts.allOpen}</span>
        </button>
        <div className="nav-sub">
          {VIEWS.map(v => (
            <button key={v.id}
              className={cls("nav-item", activeView === `v:${v.id}` && "active")}
              onClick={() => onView(`v:${v.id}`)}
            >
              <span className="label-text">{v.label}</span>
              <span className="count">{counts[v.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <button className={cls("nav-item", activeView === "reminders" && "active")} onClick={() => onView("reminders")}>
          <IBell className="icon" />
          <span className="label-text">Reminders</span>
          <span className="count">{REMINDERS.filter(r => r.state === "scheduled").length}</span>
        </button>
        <button className="nav-item">
          <IChart className="icon" />
          <span className="label-text">Reports</span>
        </button>
        <button className="nav-item">
          <ISettings className="icon" />
          <span className="label-text">Settings</span>
        </button>
      </div>

      <div className="sidebar-foot">
        <Avatar id="LK" size="lg" />
        <div className="name-block">
          <div style={{ fontWeight: 500, fontSize: 12, color: "var(--ink)" }}>Liis Kallavus</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted-2)" }}>vet · LK</div>
        </div>
      </div>
    </aside>
  );
}

function BottomNav({ activeView, onView, counts }) {
  const tabs = [
    { id: "v:my-open", label: "Inbox", Icon: IInbox, badge: counts["my-open"] },
    { id: "v:urgent", label: "Urgent", Icon: IFlag, badge: counts.urgent },
    { id: "reminders", label: "Reminders", Icon: IBell, badge: 0 },
    { id: "settings", label: "More", Icon: IMore, badge: 0 },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onView(t.id)} className={cls(activeView === t.id && "active")} style={{ position: "relative" }}>
          <t.Icon className="icon" />
          <span>{t.label}</span>
          {t.badge > 0 && <span className="badge">{t.badge}</span>}
        </button>
      ))}
    </nav>
  );
}

// ======================================================
// Inbox
// ======================================================
function InboxRow({ r, selected, onSelect, compact, showPresence }) {
  const RowEl = (
    <div className={cls("row", compact && "compact", selected && "selected")} onClick={onSelect}>
      <span className={cls("urgency-dot", r.urgency)} title={URGENCY_LABEL[r.urgency]} />
      {!compact && <StatusPill status={r.status} urgency={r.urgency} />}
      {!compact ? (
        <span className="preview">
          <span className="pet">{r.pet.name}</span>
          <span className="sep">·</span>
          <span className="owner">{r.owner.name}</span>
          <span className="sep">·</span>
          {r.preview}
          {r.attach > 0 && <span className="attach">📎 {r.attach}</span>}
          <span className="ai-tag">{r.category}</span>
        </span>
      ) : (
        <div className="stack">
          <div className="row-line-1">
            <span className="pet">{r.pet.name}</span>
            <StatusPill status={r.status} urgency={r.urgency} />
          </div>
          <span className="preview">
            <span className="owner">{r.owner.name}</span>
            <span className="sep">·</span>
            {r.preview}
          </span>
        </div>
      )}
      {!compact && <Avatar id={r.assignee} size="sm" />}
      <span className="meta">{r.elapsed}</span>
      {!compact && (
        <span className="quick" onClick={e => e.stopPropagation()}>
          <button className="btn icon sm" data-tip="Assign · A"><IUser size={13} /></button>
          <button className="btn icon sm" data-tip="Resolve · E"><ICheck size={13} /></button>
        </span>
      )}
      {showPresence && r.presence.length > 0 && <span className="presence" title={`${STAFF[r.presence[0]].name} viewing`} />}
    </div>
  );
  return RowEl;
}

function Inbox({ rows, selectedId, onSelect, viewLabel, mode, showPresence }) {
  const compact = mode !== "desktop";
  return (
    <div className="inbox">
      {rows.map(r => (
        <InboxRow key={r.id} r={r}
          selected={r.id === selectedId}
          onSelect={() => onSelect(r.id)}
          compact={compact}
          showPresence={showPresence}
        />
      ))}
      {rows.length === 0 && (
        <div className="empty">
          <div className="e-title">No requests in {viewLabel}.</div>
          <div className="e-body">When messages come in via WhatsApp or web intake, they'll land here.</div>
          <div className="e-act"><button className="btn sm">Show all statuses</button></div>
        </div>
      )}
    </div>
  );
}

function InboxToolbar({ viewLabel, count, layout, onLayout, mode }) {
  return (
    <div className="toolbar">
      <span className="title">{viewLabel}</span>
      <span className="count">{count}</span>
      <div className="spacer" />
      {mode === "desktop" && (
        <div className="search">
          <ISearch size={14} />
          <input placeholder="Search requests, pets, owners…" />
          <span className="shortcut">/</span>
        </div>
      )}
      <button className="btn sm" data-tip="Filters"><IFilter size={13} /></button>
      <button className="btn sm" data-tip="Sort"><ISort size={13} /></button>
      {mode === "desktop" && (
        <div className="seg">
          <button className={cls(layout === "list" && "active")} onClick={() => onLayout("list")}><IList size={13} /> List</button>
          <button className={cls(layout === "board" && "active")} onClick={() => onLayout("board")}><IBoard size={13} /> Board</button>
        </div>
      )}
    </div>
  );
}

// ======================================================
// Detail
// ======================================================
function MessageBubble({ m, sourceLang, translateMode }) {
  if (m.kind === "system") {
    return <div className="msg system"><div className="msg-bubble">{m.text}</div></div>;
  }
  if (m.kind === "note") {
    return (
      <div className="note">
        <div className="note-head">
          <span>internal note</span>
          <span style={{ color: "var(--muted-2)" }}>· {m.actor} · {m.at}</span>
        </div>
        {m.text}
      </div>
    );
  }
  const fromStaff = m.kind === "staff";
  return (
    <div className={cls("msg", fromStaff ? "from-staff" : "from-owner")}>
      <Avatar id={fromStaff ? "LK" : null} size="sm" />
      <div>
        <div className="msg-bubble">
          {m.text}
          {m.attach && (
            <div className="msg-attach">
              {m.attach.map((_, i) => <div key={i} className="img" />)}
            </div>
          )}
          {translateMode && m.translation && (
            <div className="msg-translate">
              <span className="lang-tag">{m.translation.lang.toUpperCase()}</span>
              {m.translation.text}
            </div>
          )}
        </div>
        <div className="msg-meta">
          <span>{fromStaff ? "you" : "Owner"}</span>
          <span>·</span>
          <span>{m.at}</span>
          {!fromStaff && m.translation && (
            <span style={{ color: "var(--primary)", cursor: "pointer" }} title="Toggle translation">
              · {sourceLang.toUpperCase()} → EN
            </span>
          )}
          {fromStaff && <span className="delivered">· delivered</span>}
        </div>
      </div>
    </div>
  );
}

function AICard({ kind, title, body, conf, version, onAccept, onEdit, onRegen, onReject, dismissed }) {
  if (dismissed) return null;
  const tone = conf >= 0.7 ? "" : conf >= 0.4 ? "amber" : "muted";
  return (
    <div className={cls("ai-card", tone)}>
      <div className="ai-head">
        <span className="pip" />
        <span className="title">{title}</span>
        <span className="meta mono">{version} · conf {conf.toFixed(2)}</span>
      </div>
      <div className="ai-body">{body}</div>
      <div className="ai-actions">
        <button className="btn sm primary" onClick={onAccept}><ICheck size={13} /> Accept <kbd>A</kbd></button>
        <button className="btn sm" onClick={onEdit}><IEdit size={13} /> Edit</button>
        <button className="btn sm" onClick={onRegen}><IRefresh size={13} /> Regenerate</button>
        <button className="btn sm ghost" onClick={onReject} data-tip="Reject"><IX size={13} /></button>
      </div>
    </div>
  );
}

function Thread({ req, translateAll }) {
  const msgs = req.messages || [];
  return (
    <div className="thread">
      <div className="thread-divider">{req.elapsedAbsolute || req.elapsed} ago · {req.sourceLang?.toUpperCase()}</div>
      {msgs.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, padding:"40px 16px", color:"var(--muted)", textAlign:"center", gap:6 }}>
          <div style={{ color:"var(--ink-2)", fontWeight:500, fontSize:13 }}>No messages yet</div>
          <div style={{ fontSize:12.5, maxWidth:260 }}>{req.preview}</div>
        </div>
      ) : msgs.map((m, i) => (
        <MessageBubble key={i} m={m} sourceLang={req.sourceLang} translateMode={translateAll || (m.kind === "owner")} />
      ))}
    </div>
  );
}

function ReplyBar({ aiDraft, onAccept, onSend }) {
  const [val, setVal] = useState(aiDraft || "");
  useEffect(() => { if (aiDraft) setVal(aiDraft); }, [aiDraft]);
  return (
    <div className="reply-bar">
      <textarea className="reply-textarea" value={val} onChange={e => setVal(e.target.value)} placeholder="Reply to Kask Pille…" />
      <div className="reply-actions">
        <button className="btn sm ghost" data-tip="Attach"><IPaperclip size={13} /></button>
        <button className="btn sm ghost" data-tip="Translate"><ITranslate size={13} /></button>
        <button className="btn sm" onClick={onAccept}><ISparkle size={13} /> Insert AI draft</button>
        <span className="spacer" />
        <button className="btn sm" data-tip="Mark resolved · E"><ICheck size={13} /> Resolved <kbd>E</kbd></button>
        <button className="btn primary sm" onClick={onSend}>
          <ISend size={13} /> Send <kbd>⌘⏎</kbd>
        </button>
      </div>
    </div>
  );
}

function SidePane({ req, onClose, stack }) {
  const [showAll, setShowAll] = useState(false);
  const tl = req.timeline || [];
  const visible = showAll ? tl : tl.slice(-3);
  return (
    <aside className="side-pane">
      <div className="side-block">
        <div className="lbl">
          <span>Pet</span>
          {!stack && <button className="icon-btn-bare" onClick={onClose} data-tip="Close pane · ⌘]"><IX size={13} /></button>}
        </div>
        <div className="pet-card">
          <div className="pet-img" />
          <div className="pet-meta">
            <div className="name">{req.pet.name}</div>
            <div className="sub">{req.pet.species} · {req.pet.age} · {req.pet.weight}</div>
            {req.pet.lastVisit && <div className="last">Last visit · {req.pet.lastVisit}</div>}
          </div>
        </div>
      </div>

      <div className="side-block">
        <div className="lbl">Owner</div>
        <div className="kv">
          <div className="k">Name</div><div className="v">{req.owner.name}</div>
          <div className="k">Phone</div><div className="v mono">{req.owner.phone}</div>
          {req.owner.email && (<><div className="k">Email</div><div className="v mono">{req.owner.email}</div></>)}
          <div className="k">Locale</div><div className="v mono">{req.owner.locale}</div>
        </div>
      </div>

      {req.aiSummary && (
        <div className="side-block">
          <AICard
            title="AI summary"
            body={req.aiSummary}
            conf={req.aiConfidence}
            version="haiku-4.5 · v3"
          />
        </div>
      )}

      <div className="side-block">
        <div className="lbl"><span>Timeline</span><span className="mono" style={{ fontSize: 10, color: "var(--muted-2)" }}>{tl.length} events</span></div>
        <div className="timeline">
          {visible.map((e, i) => (
            <div key={i} className="tl">
              <div className="when">{e.at}</div>
              <div className="what"><span className="actor">{e.actor}</span> · {e.text}</div>
            </div>
          ))}
          {tl.length > 3 && (
            <button className="btn ghost sm" onClick={() => setShowAll(s => !s)} style={{ alignSelf: "flex-start", marginTop: 4 }}>
              {showAll ? "Show recent" : `Show all (${tl.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="side-block">
        <div className="lbl"><span>Compliance</span></div>
        <div className="kv">
          <div className="k">Audit log</div>
          <div className="v"><a href="#" style={{ color: "var(--primary)", fontWeight: 500 }}>View ↗</a></div>
          <div className="k">Export</div>
          <div className="v"><a href="#" style={{ color: "var(--ink-2)" }}>PDF · CSV</a></div>
        </div>
        <div className="usage">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>AI usage · this month</span>
            <span>64% / cap</span>
          </div>
          <div className="bar"><span style={{ width: "64%" }} /></div>
        </div>
      </div>
    </aside>
  );
}

function Detail({ req, onBack, mode, paneCollapsed, onTogglePane, translateAll, onToggleTranslate }) {
  const [aiDraft, setAiDraft] = useState("");
  const stack = mode !== "desktop" || paneCollapsed === false ? false : false;
  const isStacked = mode === "tablet" || mode === "mobile";

  return (
    <div className="detail">
      {(mode === "tablet" || mode === "mobile") ? (
        <div className="detail-mobile-head">
          <button className="icon-btn-bare" onClick={onBack}><IArrowL size={14} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{req.pet.name}</span>
            <span style={{ color: "var(--muted)", fontSize: 12 }}>· {req.owner.name}</span>
          </div>
          <span style={{ flex: 1 }} />
          <StatusPill status={req.status} urgency={req.urgency} />
        </div>
      ) : (
        <div className="detail-head">
          <div className="crumbs">
            <span>Inbox</span>
            <span style={{ color: "var(--muted-2)" }}>/</span>
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{req.pet.name}</span>
            <span style={{ color: "var(--muted)" }}>· {req.owner.name}</span>
            <span className="id">{req.id}</span>
          </div>
          <span style={{ flex: 1 }} />
          <StatusPill status={req.status} urgency={req.urgency} />
          <button className="btn sm ghost" onClick={onToggleTranslate} data-tip="Toggle translation · T">
            <ITranslate size={13} /> {translateAll ? "Original" : "Translate"}
          </button>
          <button className="btn sm ghost" data-tip="More"><IMore size={14} /></button>
          <button className="btn sm ghost" onClick={onTogglePane} data-tip="Toggle pane · ⌘]">
            <IPanel size={14} />
          </button>
        </div>
      )}

      <div className={cls("detail-body", paneCollapsed && "collapsed", isStacked && "stack")}>
        <div className="thread-pane">
          <Thread req={req} translateAll={translateAll} />
          <ReplyBar
            aiDraft={aiDraft}
            onAccept={() => setAiDraft("Tere Pille! Mira tundub kergelt nikastuse all — broneerisin täna 14:00 vaatluse. Hoidke teda rahulikult, vältige hüppamist. Helistage kohe, kui valu süveneb.")}
            onSend={() => setAiDraft("")}
          />
        </div>
        {(!paneCollapsed || isStacked) && <SidePane req={req} onClose={onTogglePane} stack={isStacked} />}
      </div>
    </div>
  );
}

// ======================================================
// Reminders surface
// ======================================================
const REM_LABEL = {
  scheduled: "scheduled", sent: "sent", acknowledged: "acked",
  completed: "completed", missed: "missed", snoozed: "snoozed",
};
const REM_TONE = {
  scheduled: "waiting-staff", sent: "waiting-owner", acknowledged: "waiting-staff",
  completed: "resolved", missed: "urgent-now", snoozed: "urgent-today",
};

function Reminders({ mode }) {
  const compact = mode !== "desktop";
  return (
    <div className="inbox" style={{ borderRight: 0 }}>
      <div className="toolbar">
        <span className="title">Reminders</span>
        <span className="count">{REMINDERS.length}</span>
        <span className="spacer" />
        <button className="btn sm primary"><IPlus size={13} /> New <kbd>N</kbd></button>
      </div>
      {REMINDERS.map(r => (
        <div key={r.id} className={cls("row", compact && "compact")}>
          <span className={cls("urgency-dot", r.state === "missed" ? "now" : r.state === "snoozed" ? "today" : "routine")} />
          {!compact && <span className={cls("pill", REM_TONE[r.state])}>{REM_LABEL[r.state]}</span>}
          {!compact ? (
            <span className="preview">
              <span className="pet">{r.pet}</span>
              <span className="sep">·</span>
              <span className="owner">{r.owner}</span>
              <span className="sep">·</span>
              {r.title}
              <span className="ai-tag">{r.channel}</span>
            </span>
          ) : (
            <div className="stack">
              <div className="row-line-1">
                <span className="pet">{r.pet}</span>
                <span className={cls("pill", REM_TONE[r.state])}>{REM_LABEL[r.state]}</span>
              </div>
              <span className="preview">{r.title}</span>
            </div>
          )}
          {!compact && <Avatar id={r.createdBy} size="sm" />}
          <span className="meta mono">{r.scheduledAt}</span>
          {!compact && <span />}
        </div>
      ))}
    </div>
  );
}

// ======================================================
// Command palette
// ======================================================
const COMMANDS = [
  { cat: "Go", label: "Inbox · My open", keys: ["G", "I"] },
  { cat: "Go", label: "Reminders", keys: ["G", "R"] },
  { cat: "Go", label: "Reports", keys: ["G", "P"] },
  { cat: "Go", label: "Settings", keys: ["G", "S"] },
  { cat: "Action", label: "Reply", keys: ["R"] },
  { cat: "Action", label: "Assign…", keys: ["A"] },
  { cat: "Action", label: "Set urgency…", keys: ["U"] },
  { cat: "Action", label: "Create reminder", keys: ["M"] },
  { cat: "Action", label: "Mark resolved", keys: ["E"] },
  { cat: "Action", label: "Toggle translation", keys: ["T"] },
  { cat: "View", label: "Switch to board", keys: ["⌘", "⇧", "B"] },
  { cat: "View", label: "Toggle right pane", keys: ["⌘", "]"] },
  { cat: "View", label: "Show shortcuts", keys: ["?"] },
];

function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  useEffect(() => { if (open) setQ(""); setActive(0); }, [open]);
  if (!open) return null;
  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(q.toLowerCase()) || c.cat.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd" onClick={e => e.stopPropagation()}>
        <div className="cmd-input">
          <ISearch size={16} />
          <input autoFocus placeholder="Type a command or search…" value={q} onChange={e => { setQ(e.target.value); setActive(0); }}
            onKeyDown={e => {
              if (e.key === "ArrowDown") { setActive(a => Math.min(a + 1, filtered.length - 1)); e.preventDefault(); }
              if (e.key === "ArrowUp")   { setActive(a => Math.max(a - 1, 0)); e.preventDefault(); }
              if (e.key === "Escape") onClose();
            }} />
          <kbd>esc</kbd>
        </div>
        <div className="cmd-list">
          {filtered.map((c, i) => (
            <div key={i} className={cls("cmd-item", i === active && "active")} onMouseEnter={() => setActive(i)}>
              <span className="label-cat">{c.cat}</span>
              <span>{c.label}</span>
              <span className="ks">{c.keys.map((k, j) => <kbd key={j}>{k}</kbd>)}</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, color: "var(--muted)", fontSize: 13, textAlign: "center" }}>No matches.</div>}
        </div>
      </div>
    </div>
  );
}

// ======================================================
// App root
// ======================================================
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const t = { tweaks, setTweak };
  const [activeView, setActiveView] = useState("v:my-open");
  const [selectedId, setSelectedId] = useState("req_8412");
  const [mobileScreen, setMobileScreen] = useState("list"); // 'list' | 'detail'
  const [paneCollapsed, setPaneCollapsed] = useState(false);
  const [layout, setLayout] = useState("list");
  const [translateAll, setTranslateAll] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Apply direction + theme to body
  useEffect(() => {
    document.body.dataset.direction = t.tweaks.direction;
    document.body.dataset.theme = t.tweaks.theme;
  }, [t.tweaks.direction, t.tweaks.theme]);

  // Mode resolution: viewport tweak wins, else from window width
  const [winW, setWinW] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setWinW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const vp = VIEWPORT_PRESETS[t.tweaks.viewport];
  const effW = vp.w || winW;
  const mode = effW < 720 ? "mobile" : effW < 1100 ? "tablet" : "desktop";

  // Show a one-shot presence collision toast
  useEffect(() => {
    if (!t.tweaks.presence) return;
    const id = setTimeout(() => {
      setToasts([{ id: 1, dot: "amber", text: "Janar opened this request 4s ago." }]);
      setTimeout(() => setToasts([]), 4500);
    }, 2200);
    return () => clearTimeout(id);
  }, [selectedId, t.tweaks.presence]);

  // Filter rows
  const view = useMemo(() => {
    if (activeView === "reminders") return null;
    const v = VIEWS.find(x => `v:${x.id}` === activeView);
    return v || VIEWS[0];
  }, [activeView]);

  const rows = useMemo(() => {
    if (!view) return [];
    return REQUESTS.filter(r => view.filter(r));
  }, [view]);

  const counts = useMemo(() => {
    const c = { allOpen: REQUESTS.filter(r => r.status !== "resolved").length };
    VIEWS.forEach(v => c[v.id] = REQUESTS.filter(r => v.filter(r)).length);
    return c;
  }, []);

  const selected = REQUESTS.find(r => r.id === selectedId) || REQUESTS[0];

  const onSelect = (id) => {
    setSelectedId(id);
    if (mode === "mobile" || mode === "tablet") setMobileScreen("detail");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const on = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmdOpen(o => !o); return;
      }
      if (e.key === "/") { e.preventDefault(); /* focus search ideally */ return; }
      if (e.key === "?") { setCmdOpen(true); return; }
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const i = rows.findIndex(r => r.id === selectedId);
        const n = rows[Math.min(i + 1, rows.length - 1)];
        if (n) onSelect(n.id);
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const i = rows.findIndex(r => r.id === selectedId);
        const n = rows[Math.max(i - 1, 0)];
        if (n) onSelect(n.id);
      }
      if (e.key === "t") setTranslateAll(s => !s);
      if (e.key === "e") {
        setToasts([{ id: Date.now(), dot: "green", text: "Marked resolved · undo" }]);
        setTimeout(() => setToasts([]), 2400);
      }
      if (e.key === "]" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPaneCollapsed(c => !c); }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [rows, selectedId]);

  const main = (
    <div className={cls("app", mode === "tablet" && "tablet", mode === "mobile" && "mobile")}>
      {mode !== "mobile" && (
        <Sidebar activeView={activeView} onView={(v) => { setActiveView(v); if (mode === "mobile") setMobileScreen("list"); }} mode={mode} counts={counts} onCmd={() => setCmdOpen(true)} />
      )}

      {activeView === "reminders" ? (
        <div className="main no-detail">
          <Reminders mode={mode} />
        </div>
      ) : (
        <div className={cls(
          "main",
          mode === "tablet" && "tablet",
          mode === "mobile" && "mobile",
          (mode === "tablet" || mode === "mobile") && (mobileScreen === "list" ? "" : "detail-open"),
          mode === "desktop" && paneCollapsed === false && false
        )} style={
          mode === "desktop"
            ? { gridTemplateColumns: paneCollapsed ? "1fr 0" : "1fr 0" }
            : undefined
        }>
          {(mode === "desktop" || mobileScreen === "list") && (
            <>
              <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: mode === "desktop" ? "1px solid var(--line)" : "0" }}>
                <InboxToolbar viewLabel={view ? view.label : "Inbox"} count={rows.length} layout={layout} onLayout={setLayout} mode={mode} />
                <Inbox rows={rows} selectedId={selectedId} onSelect={onSelect} viewLabel={view?.label || "this view"} mode={mode} showPresence={t.tweaks.presence} />
              </div>
            </>
          )}
          {mode === "desktop" && (
            <Detail req={selected} mode={mode} paneCollapsed={false} onTogglePane={() => setPaneCollapsed(c => !c)}
              translateAll={translateAll} onToggleTranslate={() => setTranslateAll(s => !s)} />
          )}
          {(mode === "tablet" || mode === "mobile") && mobileScreen === "detail" && (
            <Detail req={selected} mode={mode} onBack={() => setMobileScreen("list")} paneCollapsed={false}
              translateAll={translateAll} onToggleTranslate={() => setTranslateAll(s => !s)} />
          )}
        </div>
      )}

      {mode === "mobile" && (
        <BottomNav
          activeView={activeView}
          onView={v => { setActiveView(v); setMobileScreen("list"); }}
          counts={counts}
        />
      )}
    </div>
  );

  // Viewport simulator wrapper
  const wrap = vp.w
    ? (
      <div className="viewport-shell">
        <div className="device" style={{ width: vp.w, height: vp.h }}>
          <div className="device-bar">
            <span className="dots"><span /><span /><span /></span>
            <span>{VIEWPORT_PRESETS[t.tweaks.viewport].label} · {t.tweaks.theme} · dir {t.tweaks.direction}</span>
            <span className="mono">{mode}</span>
          </div>
          <div className="device-body" style={{ height: vp.h - 26 }}>{main}</div>
        </div>
      </div>
    )
    : <div className="viewport-shell full"><div className="device full" style={{ width: "100%", height: "100%" }}><div className="device-body" style={{ height: "100%" }}>{main}</div></div></div>;

  return (
    <>
      {wrap}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <div className="toast-stack">
        {toasts.map(tt => (
          <div key={tt.id} className="toast">
            <span className={cls("dot", tt.dot)} />
            <span>{tt.text}</span>
          </div>
        ))}
      </div>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Direction">
          <TweakRadio label="Visual direction" value={t.tweaks.direction} onChange={v => t.setTweak("direction", v)}
            options={[{ value: "A", label: "A · Dense" }, { value: "B", label: "B · Warm" }]} />
        </TweakSection>
        <TweakSection title="Theme">
          <TweakRadio label="Theme" value={t.tweaks.theme} onChange={v => t.setTweak("theme", v)}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        </TweakSection>
        <TweakSection title="Viewport">
          <TweakSelect label="Simulate device" value={t.tweaks.viewport} onChange={v => t.setTweak("viewport", v)}
            options={[
              { value: "auto",    label: "Fit window" },
              { value: "desktop", label: "Desktop · 1320×820" },
              { value: "tablet",  label: "Tablet · 820×1080" },
              { value: "phone",   label: "Phone · 390×760" },
            ]} />
        </TweakSection>
        <TweakSection title="Behaviour">
          <TweakToggle label="Real-time presence dots" value={t.tweaks.presence} onChange={v => t.setTweak("presence", v)} />
          <TweakToggle label="Translate thread by default" value={t.tweaks.translate} onChange={v => t.setTweak("translate", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
