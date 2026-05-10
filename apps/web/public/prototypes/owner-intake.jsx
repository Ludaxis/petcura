/* global React, ReactDOM, WA_THREAD, WA_TRANSLATIONS, WEB_STEPS, WEB_REVIEW,
   TweaksPanel, TweakSection, TweakRadio, TweakToggle, useTweaks */

const { useState, useMemo } = React;
const cls = (...a) => a.filter(Boolean).join(" ");

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "channel": "whatsapp",
  "theme": "light",
  "translate": true,
  "step": 1
}/*EDITMODE-END*/;

// ====================================================
// WhatsApp owner experience
// ====================================================
function WAStatusBar() {
  return (
    <div className="wa-status">
      <span className="time">9:45</span>
      <span className="right">
        <span className="dots">●●●●</span>
        <span className="net">5G</span>
        <span className="bat">87%</span>
      </span>
    </div>
  );
}

function WAHeader() {
  return (
    <div className="wa-head">
      <button className="wa-back" aria-label="Back">‹</button>
      <div className="wa-avatar" aria-hidden>P</div>
      <div className="wa-title">
        <div className="name">PetCura · Tartu klinik</div>
        <div className="sub">online · vastab tavaliselt 2 min jooksul</div>
      </div>
      <button className="wa-icon" aria-label="Call">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5a2 2 0 012-2h1.5a1 1 0 01.96.73l.7 2.45a1 1 0 01-.27 1L7.2 8.2a10 10 0 004.6 4.6l1-.7a1 1 0 011-.26l2.45.7a1 1 0 01.73.95V15a2 2 0 01-2 2A12 12 0 013 5z" stroke="currentColor" strokeWidth="1.4"/></svg>
      </button>
    </div>
  );
}

function WABubble({ m, idx, translate }) {
  if (m.system) {
    return (
      <div className="wa-system">
        <span>{m.system}</span>
      </div>
    );
  }
  const isOwner = m.from === "owner";
  const tx = translate && WA_TRANSLATIONS[idx];
  return (
    <div className={cls("wa-row", isOwner ? "owner" : "bot")}>
      <div className="wa-bubble">
        {!isOwner && <div className="wa-bot-name">PetCura</div>}
        {m.body && <div className="wa-text">{m.body}</div>}
        {tx && <div className="wa-tx"><span className="wa-tx-label">EN</span>{tx}</div>}
        {m.attach && (
          <div className="wa-attach-grid">
            {m.attach.map((a, i) => (
              <div key={i} className="wa-photo">
                <div className="wa-photo-stripe" />
                <span className="wa-photo-name">{a}</span>
              </div>
            ))}
          </div>
        )}
        {m.chips && (
          <div className="wa-chips">
            {m.chips.map(c => <button key={c} className="wa-chip">{c}</button>)}
          </div>
        )}
        <div className="wa-meta">
          <span>{m.time}</span>
          {isOwner && <span className="wa-ticks">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

function WAComposer() {
  return (
    <div className="wa-composer">
      <button className="wa-icon-btn" aria-label="Add">+</button>
      <div className="wa-input">Sõnum</div>
      <button className="wa-icon-btn" aria-label="Mic">🎤</button>
    </div>
  );
}

function WhatsApp({ translate }) {
  return (
    <div className="wa-frame">
      <WAStatusBar />
      <WAHeader />
      <div className="wa-thread">
        <div className="wa-day">Today</div>
        {WA_THREAD.map((m, i) => (
          <WABubble key={i} m={m} idx={i} translate={translate} />
        ))}
        <div className="wa-typing">
          <span /><span /><span />
        </div>
      </div>
      <WAComposer />
    </div>
  );
}

// ====================================================
// Web intake form — stepped
// ====================================================
function StepDots({ count, current }) {
  return (
    <div className="step-dots" role="progressbar" aria-valuemin={1} aria-valuemax={count} aria-valuenow={current + 1}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cls("dot", i === current && "active", i < current && "done")} />
      ))}
    </div>
  );
}

function Field({ f }) {
  if (f.type === "text") {
    return (
      <label className="field">
        <span className="field-label">{f.label}</span>
        <input className="input" defaultValue={f.value} />
      </label>
    );
  }
  if (f.type === "textarea") {
    return (
      <label className="field">
        <span className="field-label">{f.label}</span>
        <textarea className="input textarea" rows={4} defaultValue={f.value} />
      </label>
    );
  }
  if (f.type === "select") {
    return (
      <label className="field">
        <span className="field-label">{f.label}</span>
        <div className="select-wrap">
          <select className="input" defaultValue={f.value}>
            {f.options.map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="select-caret">▾</span>
        </div>
      </label>
    );
  }
  if (f.type === "segmented" || f.type === "chips") {
    const [val, setVal] = useState(f.value);
    return (
      <div className="field">
        <span className="field-label">{f.label}</span>
        <div className={cls("seg", f.type === "chips" && "chips")}>
          {f.options.map(o => (
            <button key={o} className={cls("seg-opt", o === val && "active")} onClick={() => setVal(o)}>{o}</button>
          ))}
        </div>
      </div>
    );
  }
  if (f.type === "uploader") {
    return (
      <div className="field">
        <div className="uploader">
          <div className="up-grid">
            {f.value.map((p, i) => (
              <div key={i} className="up-tile">
                <div className="up-stripe" />
                <span className="up-name">{p}</span>
              </div>
            ))}
            <button className="up-add">
              <span className="up-plus">+</span>
              <span>Add photo</span>
            </button>
          </div>
          <div className="up-hint">Up to 6 photos · jpg, png, heic · 12MB each</div>
        </div>
      </div>
    );
  }
  return null;
}

function Web({ step, setStep }) {
  const totalSteps = WEB_STEPS.length + 1; // +1 for review
  const isReview = step === WEB_STEPS.length;
  const s = WEB_STEPS[step];

  return (
    <div className="web-frame">
      <header className="web-head">
        <div className="brand">
          <div className="brand-mark">P</div>
          <span className="brand-name">PetCura</span>
        </div>
        <div className="web-clinic">Tartu klinik</div>
      </header>

      <main className="web-main">
        <StepDots count={totalSteps} current={step} />

        {!isReview ? (
          <>
            <h1 className="web-title">{s.title}</h1>
            <p className="web-sub">{s.subtitle}</p>

            <div className="web-fields">
              {s.fields.map(f => <Field key={f.id} f={f} />)}
            </div>

            {s.aiBlock && (
              <div className="ai-card">
                <div className="ai-head">
                  <span className="ai-spark">✦</span>
                  <span>{s.aiBlock.title}</span>
                </div>
                <p>{s.aiBlock.body}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="web-title">Review and send</h1>
            <p className="web-sub">We'll forward this to the clinic team. They'll reply via WhatsApp.</p>

            <ul className="review">
              <li>
                <span className="r-label">Pet</span>
                <span className="r-val">{WEB_REVIEW.pet}</span>
              </li>
              <li>
                <span className="r-label">Issue</span>
                <span className="r-val">{WEB_REVIEW.issue}</span>
              </li>
              <li>
                <span className="r-label">In your words</span>
                <span className="r-val">{WEB_REVIEW.summary}</span>
              </li>
              <li>
                <span className="r-label">Photos</span>
                <span className="r-val">{WEB_REVIEW.photos} attached</span>
              </li>
              <li>
                <span className="r-label">Contact</span>
                <span className="r-val">{WEB_REVIEW.contact}</span>
              </li>
            </ul>

            <div className="ai-card success">
              <div className="ai-head"><span className="ai-spark">✓</span><span>Estimated triage</span></div>
              <p>Skin · Same day · routed to Dr. Kask. You'll hear back within 15 minutes.</p>
            </div>
          </>
        )}
      </main>

      <footer className="web-foot">
        {step > 0 && <button className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
        <div style={{ flex: 1 }} />
        {!isReview ? (
          <button className="btn-primary" onClick={() => setStep(step + 1)}>Continue</button>
        ) : (
          <button className="btn-primary">Send to clinic</button>
        )}
      </footer>
    </div>
  );
}

// ====================================================
// App
// ====================================================
function PhoneFrame({ children }) {
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
      <div className="phone-home" />
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [step, setStep] = useState(tweaks.step ?? 1);

  return (
    <div data-theme={tweaks.theme} className="stage">
      <div className="stage-inner">
        {tweaks.channel === "both" ? (
          <div className="dual">
            <div className="dual-col">
              <div className="dual-tag">WhatsApp</div>
              <PhoneFrame><WhatsApp translate={tweaks.translate} /></PhoneFrame>
            </div>
            <div className="dual-col">
              <div className="dual-tag">Web intake</div>
              <PhoneFrame><Web step={step} setStep={setStep} /></PhoneFrame>
            </div>
          </div>
        ) : tweaks.channel === "whatsapp" ? (
          <PhoneFrame><WhatsApp translate={tweaks.translate} /></PhoneFrame>
        ) : (
          <PhoneFrame><Web step={step} setStep={setStep} /></PhoneFrame>
        )}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Channel">
          <TweakRadio label="Show" value={tweaks.channel} onChange={v => setTweak("channel", v)}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "web", label: "Web" },
              { value: "both", label: "Side by side" },
            ]} />
        </TweakSection>
        <TweakSection title="Theme">
          <TweakRadio label="Theme" value={tweaks.theme} onChange={v => setTweak("theme", v)}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
        </TweakSection>
        <TweakSection title="WhatsApp">
          <TweakToggle label="Show English translation" value={tweaks.translate} onChange={v => setTweak("translate", v)} />
        </TweakSection>
        <TweakSection title="Web intake">
          <TweakRadio label="Step" value={String(step)} onChange={v => setStep(Number(v))}
            options={[
              { value: "0", label: "1 · Pet" },
              { value: "1", label: "2 · Issue" },
              { value: "2", label: "3 · Photos" },
              { value: "3", label: "4 · Contact" },
              { value: "4", label: "5 · Review" },
            ]} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
