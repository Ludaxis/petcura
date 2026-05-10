/* global React, DCSection, DCArtboard, DCPostIt */

// ===== Token swatches =====
const PALETTE_B = [
  { name: "ink",      val: "#29261b", note: "Body text" },
  { name: "ink-2",    val: "#4d4738", note: "Secondary" },
  { name: "muted",    val: "#847e6b", note: "Meta" },
  { name: "muted-2",  val: "#a39b86", note: "Disabled" },
  { name: "paper",    val: "#f6f4ef", note: "Surface" },
  { name: "soft",     val: "#ede9df", note: "Soft surface" },
  { name: "line",     val: "#e2dccc", note: "Border" },
  { name: "primary",  val: "#4a6b3f", note: "Sage · CTA" },
  { name: "p-soft",   val: "#e2ead6", note: "Selected row" },
  { name: "amber",    val: "#b07d2c", note: "Today / warning" },
  { name: "red",      val: "#a64a3c", note: "Urgent" },
  { name: "green",    val: "#4a6b3f", note: "Resolved" },
];
const PALETTE_B_DARK = [
  { name: "ink",      val: "#ece8de" },
  { name: "ink-2",    val: "#c9c4b6" },
  { name: "muted",    val: "#8a8270" },
  { name: "paper",    val: "#1c1a16" },
  { name: "soft",     val: "#221f19" },
  { name: "line",     val: "#2a2620" },
  { name: "primary",  val: "#87a87f" },
  { name: "p-soft",   val: "#1f2a1d" },
  { name: "amber",    val: "#d4a872" },
  { name: "red",      val: "#d49080" },
  { name: "green",    val: "#9bb892" },
];

const TYPE_SCALE = [
  { name: "Display L", size: 48, weight: 600, tracking: -0.02 },
  { name: "Display M", size: 32, weight: 600, tracking: -0.015 },
  { name: "Title",     size: 24, weight: 600, tracking: -0.015 },
  { name: "Heading",   size: 18, weight: 600, tracking: -0.01 },
  { name: "Body",      size: 14, weight: 400, tracking: -0.005 },
  { name: "Body sm",   size: 13, weight: 400, tracking: -0.005 },
  { name: "Caption",   size: 11, weight: 500, tracking: 0 },
  { name: "Mono",      size: 11, weight: 500, tracking: 0.04, mono: true },
];

// ===== Iframe artboard (embeds another file with hash params) =====
function Iframe({ src, width, height, scale = 1 }) {
  const innerW = Math.round(width / scale);
  const innerH = Math.round(height / scale);
  return (
    <div style={{ width, height, overflow: "hidden", position: "relative", background: "#0a0a0a" }}>
      <iframe
        src={src}
        style={{
          width: innerW, height: innerH,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: "#fff",
        }}
        title={src}
      />
    </div>
  );
}

// ===== Token cards =====
function TokenCard() {
  return (
    <div style={cardStyle}>
      <SectionLabel>Color · Direction B · Light</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 28 }}>
        {PALETTE_B.map(c => (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ background: c.val, height: 56, borderRadius: 6, border: "1px solid #e2dccc" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#29261b" }}>{c.name}</span>
              <span style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#847e6b" }}>{c.val}</span>
              {c.note && <span style={{ fontSize: 10, color: "#a39b86" }}>{c.note}</span>}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Color · Direction B · Dark</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: 12, background: "#1c1a16", borderRadius: 8 }}>
        {PALETTE_B_DARK.map(c => (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ background: c.val, height: 48, borderRadius: 6, border: "1px solid #2a2620" }} />
            <span style={{ fontSize: 10.5, fontWeight: 600, color: "#ece8de" }}>{c.name}</span>
            <span style={{ fontSize: 9.5, fontFamily: "JetBrains Mono", color: "#8a8270" }}>{c.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeCard() {
  return (
    <div style={cardStyle}>
      <SectionLabel>Type · Montserrat + JetBrains Mono</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {TYPE_SCALE.map(t => (
          <div key={t.name} style={{ display: "grid", gridTemplateColumns: "120px 1fr 100px", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 11, color: "#847e6b", fontFamily: "JetBrains Mono" }}>{t.name}</span>
            <span style={{
              fontSize: t.size, fontWeight: t.weight,
              letterSpacing: `${t.tracking}em`,
              fontFamily: t.mono ? "JetBrains Mono" : "Montserrat",
              color: "#29261b",
              lineHeight: 1.15,
            }}>
              The quick brown fox
            </span>
            <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono", color: "#a39b86" }}>
              {t.size}/{t.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrinciplesCard() {
  const items = [
    { n: "P1", t: "Inbox-first, board on demand", d: "List view by default — five-column kanban toggle for batch sweeps." },
    { n: "P2", t: "AI is a draft, never a decision", d: "Every AI artifact ships with source span, confidence, accept/edit/reject — and is never sent without staff confirmation." },
    { n: "P3", t: "Trilingual by default", d: "EE / EN / RU surface as first-class. Translation is one tap, never a separate flow." },
    { n: "P4", t: "Keyboard-equal-to-mouse", d: "Every staff action is reachable via shortcut. ⌘K is the spine." },
    { n: "P5", t: "Audit-grade trace", d: "Every send, edit, and AI use is logged with actor + locale + raw input. Compliance is built in, not bolted on." },
    { n: "P6", t: "Minutes saved, not screens added", d: "If a surface costs more time than it saves, it does not ship." },
  ];
  return (
    <div style={cardStyle}>
      <SectionLabel>Design principles</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 4 }}>
        {items.map(p => (
          <div key={p.n} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#4a6b3f", fontWeight: 600 }}>{p.n}</span>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "#29261b", letterSpacing: "-0.01em" }}>{p.t}</span>
            <span style={{ fontSize: 12.5, color: "#4d4738", lineHeight: 1.5 }}>{p.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsCard() {
  return (
    <div style={cardStyle}>
      <SectionLabel>Component primitives</SectionLabel>

      <Group title="Status pills">
        <span style={pill("#e2ead6", "#4a6b3f")}>new</span>
        <span style={pill("#f5e7c8", "#b07d2c")}>waiting · staff</span>
        <span style={pill("#ede9df", "#847e6b")}>waiting · owner</span>
        <span style={pill("#d9e6cc", "#3a5530")}>resolved</span>
        <span style={pill("#f3dfd8", "#a64a3c")}>urgent</span>
      </Group>

      <Group title="Buttons">
        <button style={btn("primary")}>Send reply</button>
        <button style={btn("secondary")}>Save draft</button>
        <button style={btn("ghost")}>Cancel</button>
      </Group>

      <Group title="Urgency dots">
        <span style={dot("#a64a3c")} title="Urgent" />
        <span style={dot("#b07d2c")} title="Today" />
        <span style={dot("#847e6b")} title="This week" />
        <span style={dot("#a39b86")} title="Routine" />
      </Group>

      <Group title="Inputs">
        <input style={inputStyle} placeholder="Search threads, owners, pets…" />
      </Group>

      <Group title="AI suggestion card">
        <div style={{
          background: "#e2ead6",
          border: "1px solid #c8d4b9",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12.5, color: "#29261b",
          width: "100%", lineHeight: 1.45,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{
              width: 14, height: 14, background: "#4a6b3f", color: "#f6f4ef",
              borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700,
            }}>✦</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 600, color: "#3a5530", letterSpacing: 0.04 }}>SUGGESTED REPLY · EE → EE</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#847e6b" }}>conf 0.86</span>
          </div>
          "Tere Liis! Soovitan tuua Lumi täna kell 14:00. Toite ja liiva muutus võib olla allergia põhjus…"
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button style={btn("primary", "sm")}>Accept</button>
            <button style={btn("secondary", "sm")}>Edit</button>
            <button style={btn("ghost", "sm")}>Reject</button>
          </div>
        </div>
      </Group>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10.5, color: "#847e6b", fontFamily: "JetBrains Mono", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.05 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>{children}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontFamily: "JetBrains Mono", color: "#847e6b",
      textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600,
      marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #ece6d6",
    }}>{children}</div>
  );
}

const cardStyle = {
  width: "100%", height: "100%",
  background: "#f6f4ef", padding: 28,
  fontFamily: "Montserrat, system-ui, sans-serif",
  color: "#29261b", overflow: "auto",
  letterSpacing: "-0.005em",
};

const pill = (bg, fg) => ({
  background: bg, color: fg,
  fontFamily: "JetBrains Mono",
  fontSize: 10.5, fontWeight: 600,
  padding: "3px 10px", borderRadius: 4,
  letterSpacing: 0.02,
});

const dot = (color) => ({
  display: "inline-block",
  width: 10, height: 10, borderRadius: "50%",
  background: color, marginRight: 14,
});

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #e2dccc", borderRadius: 8,
  background: "#f6f4ef", color: "#29261b",
  fontSize: 13, fontFamily: "Montserrat",
  outline: "none",
};

const btn = (kind, size) => {
  const base = {
    fontFamily: "Montserrat", fontWeight: 500,
    fontSize: size === "sm" ? 11.5 : 13,
    padding: size === "sm" ? "5px 10px" : "9px 14px",
    borderRadius: size === "sm" ? 5 : 7,
    border: "1px solid transparent", cursor: "pointer",
  };
  if (kind === "primary") return { ...base, background: "#4a6b3f", color: "#f6f4ef" };
  if (kind === "secondary") return { ...base, background: "#f6f4ef", color: "#29261b", borderColor: "#e2dccc" };
  return { ...base, background: "transparent", color: "#847e6b" };
};

// ===== Hero / cover artboard =====
function CoverCard() {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "linear-gradient(160deg, #f6f4ef 0%, #ede9df 50%, #d9e6cc 100%)",
      padding: "72px 64px", display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: "Montserrat", color: "#29261b",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -60, width: 380, height: 380,
        borderRadius: "50%", background: "radial-gradient(circle, #4a6b3f22, transparent 70%)",
      }} />
      <div>
        <div style={{
          fontFamily: "JetBrains Mono", fontSize: 11, color: "#847e6b",
          letterSpacing: 0.08, textTransform: "uppercase", marginBottom: 14,
        }}>PetCura · Foundation review · v1.0 · May 2026</div>
        <h1 style={{
          fontSize: 72, fontWeight: 700, letterSpacing: "-0.025em",
          margin: 0, lineHeight: 1.02,
        }}>The WhatsApp-native<br/>ClientOps inbox<br/><span style={{ color: "#4a6b3f", fontWeight: 600 }}>for vet clinics.</span></h1>
        <p style={{
          fontSize: 18, color: "#4d4738", maxWidth: 540, marginTop: 22, lineHeight: 1.4,
        }}>Direction B (warm sage) — locked. Two surfaces, three locales, one keyboard-first inbox.</p>
      </div>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        <Stat n="2" l="surfaces" />
        <Stat n="3" l="locales" />
        <Stat n="2" l="themes" />
        <Stat n="6" l="principles" />
        <Stat n="4" l="urgency tiers" />
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em", color: "#29261b", lineHeight: 1 }}>{n}</span>
      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#847e6b", textTransform: "uppercase", letterSpacing: 0.06 }}>{l}</span>
    </div>
  );
}

// ===== Surface preview tiles =====
function SurfaceTile({ title, locale, body }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#f6f4ef", padding: 22,
      fontFamily: "Montserrat", color: "#29261b",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#847e6b", letterSpacing: 0.04 }}>{locale}</span>
      </div>
      <div style={{ flex: 1, fontSize: 12.5, color: "#4d4738", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{body}</div>
    </div>
  );
}

window.PetCuraDC = {
  TokenCard, TypeCard, PrinciplesCard, ComponentsCard, CoverCard, Iframe, SurfaceTile,
};
