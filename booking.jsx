/* global React */
const { useState, useEffect } = React;

/* =====================================================
   TVR Booking UI Kit · components
   ===================================================== */

/* ----------- Bookings store (prototype, localStorage) -----------
   Persists confirmed bookings in the customer's own browser. This is enough
   to prevent ONE customer from double-booking themselves, and to demo the
   conflict-blocking UX. It is NOT a real reservation system — two different
   customers in different browsers will not see each other's bookings.
   For real availability you need a backend (Firebase, Supabase, etc.).

   Schema in localStorage:
     { [trailerId]: [{ id, pickup, dropoff, name, bookedAt }] }
*/
const BOOKINGS_KEY = "tvr_bookings_v1";
const Bookings = {
  load() {
    try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "{}"); }
    catch (e) { return {}; }
  },
  save(obj) {
    try { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(obj)); } catch (e) {}
  },
  forTrailer(trailerId) {
    const all = Bookings.load();
    return all[trailerId] || [];
  },
  add(trailerId, b) {
    const all = Bookings.load();
    all[trailerId] = (all[trailerId] || []).concat([b]);
    Bookings.save(all);
  },
  clear() { Bookings.save({}); },
  // Returns the conflicting booking if any, else null. Range [pickup, dropoff]
  // overlaps existing [a, b] iff pickup <= b && dropoff >= a.
  conflict(trailerId, pickup, dropoff) {
    if (!trailerId || !pickup || !dropoff) return null;
    for (const r of Bookings.forTrailer(trailerId)) {
      if (pickup <= r.dropoff && dropoff >= r.pickup) return r;
    }
    return null;
  },
};
// Expose for debugging (run `TVR_Bookings.clear()` in DevTools to wipe).
window.TVR_Bookings = Bookings;

function useWindowWidth() {
  const [w, setW] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function calcRental(trailer, days) {
  if (!trailer || !days) return 0;
  const weeks = Math.floor(days / 7);
  const extra = days % 7;
  if (!weeks || !trailer.weekly) return trailer.daily * days;
  return weeks * trailer.weekly + extra * trailer.daily;
}

function rentalLabel(trailer, days) {
  const weeks = Math.floor(days / 7);
  const extra = days % 7;
  if (!weeks || !trailer?.weekly) return "Rental · " + days + "d";
  if (extra === 0) return weeks === 1 ? "Rental · 1 week" : "Rental · " + weeks + " weeks";
  return "Rental · " + weeks + "wk + " + extra + "d";
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDate(s) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}

/* ----------- Primitives ----------- */
function BkButton({ variant = "primary", children, onClick, disabled, full, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    height: 48, padding: "0 32px", border: 0,
    font: '700 14px/1 "Inter", system-ui, sans-serif',
    letterSpacing: "0.5px", cursor: disabled ? "not-allowed" : "pointer",
    width: full ? "100%" : "auto",
    transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
    whiteSpace: "nowrap",
  };
  const variants = {
    primary:   { background: disabled ? "#d6d6d6" : "#1568be", color: disabled ? "#6b6b6b" : "#fff" },
    secondary: { background: "#fff", color: "#262626", border: "1px solid #cccccc" },
    onDark:    { background: "transparent", color: "#fff", border: "1px solid #fff" },
    ghost:     { background: "transparent", color: "#262626" },
  };
  return <button style={{...base, ...variants[variant]}} onClick={onClick} disabled={disabled} {...rest}>{children}</button>;
}

function Field({ label, hint, error, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 10 }}>{label}</div>
      {children}
      {hint && !error && <div style={{ font: '400 11px/1.4 "Inter", sans-serif', color: "#6b6b6b", marginTop: 6, letterSpacing: "0.3px" }}>{hint}</div>}
      {error && <div style={{ font: '400 11px/1.4 "Inter", sans-serif', color: "#dc2626", marginTop: 6, letterSpacing: "0.3px" }}>{error}</div>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text", min, max }) {
  return (
    <input value={value || ""} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} type={type}
      min={min} max={max}
      style={{
        display: "block", width: "100%", height: 48, padding: "14px 16px",
        background: "#fff", color: "#262626", border: "1px solid #e6e6e6", borderRadius: 0,
        font: '300 16px/1.55 "Inter", sans-serif', outline: "none",
      }}
      onFocus={e => e.target.style.borderColor = "#262626"}
      onBlur={e => e.target.style.borderColor = "#e6e6e6"}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value || ""} onChange={e => onChange?.(e.target.value)}
      style={{
        display: "block", width: "100%", height: 48, padding: "0 16px",
        background: "#fff", color: "#262626", border: "1px solid #e6e6e6", borderRadius: 0,
        font: '300 16px/1 "Inter", sans-serif', outline: "none",
        appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23262626' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
      }}>
      <option value="" disabled>Select…</option>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

/* ----------- Top bar + Stepper ----------- */
function TopBar() {
  const isMobile = useWindowWidth() < 768;
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64, padding: isMobile ? "0 16px" : "0 32px",
      background: "#fff", borderBottom: "1px solid #e6e6e6",
      position: "sticky", top: 0, zIndex: 60,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 28, height: 2.5, background: "#b5212b" }}/>
        <span style={{ font: '800 16px/1 "Barlow Condensed", "Arial Narrow", Arial, sans-serif', fontStyle: "italic", color: "#1568be", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tennessee Valley Rentals</span>
        <span style={{ font: '400 13px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "1px", textTransform: "uppercase", marginLeft: 4, paddingLeft: 12, borderLeft: "1px solid #e6e6e6" }}>Booking</span>
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 24, font: '400 13px/1 "Inter", sans-serif', color: "#6b6b6b" }}>
          <span>Need help? <span style={{ color: "#262626", fontWeight: 700 }}>(321) 765-3077</span></span>
        </div>
      )}
    </header>
  );
}

function Stepper({ steps, current }) {
  const isMobile = useWindowWidth() < 640;
  return (
    <nav style={{
      display: "grid", gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
      background: "#fff", borderBottom: "1px solid #e6e6e6",
    }}>
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "pending";
        return (
          <div key={i} style={{
            padding: isMobile ? "12px 4px" : "20px 16px",
            borderBottom: state === "active" ? "2px solid #1568be" : "2px solid transparent",
            display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: 12,
          }}>
            <span style={{
              width: 24, height: 24, flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: state === "done" ? "#1568be" : state === "active" ? "#262626" : "#fff",
              color: state === "pending" ? "#9a9a9a" : "#fff",
              border: state === "pending" ? "1px solid #cccccc" : "0",
              font: '700 11px/1 "Inter", sans-serif',
            }}>{state === "done" ? "✓" : i + 1}</span>
            {!isMobile && (
              <span style={{
                font: '700 11px/1.3 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase",
                color: state === "pending" ? "#9a9a9a" : "#262626",
              }}>{s}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ----------- Order Summary (sticky rail) ----------- */
function OrderSummary({ state }) {
  const trailer = TRAILERS[state.trailerId];
  const days = state.days || 1;
  const rental = trailer ? calcRental(trailer, days) : 0;
  const subtotal = rental;
  const tax = Math.round(subtotal * 0.0925);
  const deposit = trailer?.deposit || 200;
  const total = subtotal + tax + deposit;

  return (
    <aside style={{
      position: "sticky", top: 144, alignSelf: "start",
      background: "#fff", padding: 24, border: "1px solid #e6e6e6",
    }}>
      <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 }}>Reservation summary</div>
      {trailer ? (
        <div style={{ background: "#f4f6f9", padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14, overflow: "hidden" }}>
          <img src={trailer.photo} alt="" style={{ width: 80, height: 60, objectFit: "contain", transform: `scale(${trailer.photoScale || 1})`, transformOrigin: "center center" }}/>
          <div>
            <div style={{ font: '700 14px/1.3 "Inter", sans-serif', color: "#262626" }}>{trailer.name}</div>
            <div style={{ font: '300 12px/1.4 "Inter", sans-serif', color: "#6b6b6b", marginTop: 2 }}>{trailer.kicker}</div>
          </div>
        </div>
      ) : (
        <div style={{ background: "#f4f6f9", padding: 24, marginBottom: 16, font: '400 12px/1.4 "Inter", sans-serif', color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center" }}>No trailer selected</div>
      )}

      <div style={{ display: "grid", gap: 10, paddingBottom: 16, borderBottom: "1px solid #e6e6e6" }}>
        <SummaryRow k="Pickup" v={state.pickup || "—"}/>
        <SummaryRow k="Return" v={state.dropoff || "—"}/>
        <SummaryRow k="Duration" v={days + " day" + (days !== 1 ? "s" : "")}/>
      </div>

      <div style={{ display: "grid", gap: 8, padding: "16px 0", borderBottom: "1px solid #e6e6e6" }}>
        <PriceRow k={rentalLabel(trailer, days)} v={rental ? "$" + rental : "—"}/>
        <PriceRow k="Tax (9.25%)" v={subtotal ? "$" + tax : "—"}/>
        <PriceRow k="Refundable deposit" v={"$" + deposit}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 16 }}>
        <span style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626" }}>Charged today</span>
        <span style={{ font: '700 24px/1 "Inter", sans-serif', color: "#262626" }}>${total}</span>
      </div>
    </aside>
  );
}

function SummaryRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span style={{ font: '700 10px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b" }}>{k}</span>
      <span style={{ font: '300 13px/1.4 "Inter", sans-serif', color: "#262626", textAlign: "right" }}>{v}</span>
    </div>
  );
}
function PriceRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ font: '300 14px/1 "Inter", sans-serif', color: "#3c3c3c" }}>{k}</span>
      <span style={{ font: '300 14px/1 "Inter", sans-serif', color: "#262626" }}>{v}</span>
    </div>
  );
}

/* ----------- Trailer data — derived from window.TVR_CONTENT.fleet ----------- */
/* TRAILERS is a Proxy that always reflects the current content.js fleet list,
   so adding a trailer there flows through to the booking flow automatically. */
const TRAILERS = new Proxy({}, {
  get(_, key) {
    const fleet = (window.TVR_CONTENT && window.TVR_CONTENT.fleet) || [];
    if (key === Symbol.iterator || key === "length") return undefined;
    const t = fleet.find(x => x.id === key);
    return t ? { id: t.id, name: t.name, kicker: t.kickerBooking || t.kicker,
                 photo: t.photo, daily: t.daily, weekly: t.weekly, deposit: t.deposit,
                 photoScale: t.photoScale || 1 } : undefined;
  },
  ownKeys() { return ((window.TVR_CONTENT && window.TVR_CONTENT.fleet) || []).map(t => t.id); },
  getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
});
// Helper used inside the trailer-picker step
function listTrailers() {
  const fleet = (window.TVR_CONTENT && window.TVR_CONTENT.fleet) || [];
  return fleet.map(t => ({ id: t.id, name: t.name, kicker: t.kickerBooking || t.kicker,
                           photo: t.photo, daily: t.daily, weekly: t.weekly, photoScale: t.photoScale || 1 }));
}

/* ====================================================
   STEPS
   ==================================================== */

/* ---------- 1. Pick trailer + dates ---------- */
function StepTrailerDates({ state, setState, onNext }) {
  const today = todayISO();
  const isMobile = useWindowWidth() < 768;
  const [loadingAvail, setLoadingAvail] = React.useState(false);

  // When a trailer is selected, pull its booked ranges from the server and
  // merge them into localStorage so conflict detection sees real bookings.
  React.useEffect(() => {
    if (!state.trailerId) return;
    setLoadingAvail(true);
    fetch("/.netlify/functions/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "availability", trailerId: state.trailerId }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d || !d.bookings) return;
        // Merge server bookings into localStorage so conflict checks use real data.
        const all = Bookings.load();
        const existing = all[state.trailerId] || [];
        const existingIds = new Set(existing.map(b => b.id));
        const newOnes = d.bookings.filter(b => !existingIds.has(b.id));
        if (newOnes.length > 0) {
          all[state.trailerId] = [...existing, ...newOnes];
          Bookings.save(all);
        }
      })
      .catch(() => {}) // Silently fail if no backend (prototype mode)
      .finally(() => setLoadingAvail(false));
  }, [state.trailerId]);

  // Sanity-check the date range and surface any conflict with stored bookings.
  const dateOrderOk  = !state.pickup || !state.dropoff || state.pickup <= state.dropoff;
  const pickupPastOk = !state.pickup  || state.pickup  >= today;
  const conflict     = state.trailerId && dateOrderOk && pickupPastOk
    ? Bookings.conflict(state.trailerId, state.pickup, state.dropoff)
    : null;
  const valid = state.trailerId && state.pickup && state.dropoff &&
                dateOrderOk && pickupPastOk && !conflict;
  const bookedRanges = state.trailerId ? Bookings.forTrailer(state.trailerId) : [];
  return (
    <StepShell title="Pick a trailer and dates" kicker="STEP 1 · TRAILER & DATES">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {listTrailers().map(t => {
          const sel = state.trailerId === t.id;
          return (
            <button key={t.id} onClick={() => setState({...state, trailerId: t.id})} style={{
              textAlign: "left", padding: 0, background: "#fff", cursor: "pointer",
              border: sel ? "2px solid #1568be" : "1px solid #e6e6e6",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ background: "#f4f6f9", padding: 16, display: "flex", justifyContent: "center", alignItems: "center", height: 160, overflow: "hidden" }}>
                <img src={t.photo} alt="" style={{ width: "85%", height: "100%", objectFit: "contain", transform: `scale(${t.photoScale || 1})`, transformOrigin: "center center" }}/>
              </div>
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ font: '700 18px/1.3 "Inter", sans-serif', color: "#262626" }}>{t.name}</div>
                  <div style={{ font: '300 13px/1.4 "Inter", sans-serif', color: "#6b6b6b", marginTop: 4 }}>{t.kicker}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ font: '700 18px/1 "Inter", sans-serif', color: "#262626" }}>${t.daily}<span style={{ font: '300 12px/1 "Inter", sans-serif', color: "#6b6b6b" }}>/d</span></div>
                  {t.weekly && <div style={{ font: '300 12px/1.3 "Inter", sans-serif', color: "#6b6b6b", marginTop: 4 }}>${t.weekly}/wk</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isMobile ? (
        <div style={{ border: "1px solid #e6e6e6", marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "14px 16px", borderRight: "1px solid #e6e6e6" }}>
              <div style={{ font: '700 10px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 10 }}>Pickup date</div>
              <input type="date" min={today} value={state.pickup || ""}
                onChange={e => { const d = computeDays(e.target.value, state.dropoff); setState({...state, pickup: e.target.value, days: d}); }}
                style={{ border: 0, outline: "none", font: '300 15px/1.4 "Inter", sans-serif', color: "#262626", width: "100%", background: "transparent", padding: 0 }}
              />
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ font: '700 10px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 10 }}>Return date</div>
              <input type="date" min={state.pickup || today} value={state.dropoff || ""}
                onChange={e => { const d = computeDays(state.pickup, e.target.value); setState({...state, dropoff: e.target.value, days: d}); }}
                style={{ border: 0, outline: "none", font: '300 15px/1.4 "Inter", sans-serif', color: "#262626", width: "100%", background: "transparent", padding: 0 }}
              />
            </div>
          </div>
          {(state.pickup && !pickupPastOk) || (state.pickup && state.dropoff && !dateOrderOk) ? (
            <div style={{ padding: "8px 16px", background: "#fff2f2", borderTop: "1px solid #fecaca", font: '400 11px/1.4 "Inter", sans-serif', color: "#dc2626" }}>
              {!pickupPastOk ? "Pickup date can't be in the past." : "Return must be on or after pickup."}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
          <Field label="Pickup date" error={state.pickup && !pickupPastOk ? "Pickup date can't be in the past." : null}>
            <Input type="date" min={today} value={state.pickup} onChange={v => {
              const d = computeDays(v, state.dropoff);
              setState({...state, pickup: v, days: d});
            }}/>
          </Field>
          <Field label="Return date" error={state.pickup && state.dropoff && !dateOrderOk ? "Return must be on or after pickup." : null}>
            <Input type="date" min={state.pickup || today} value={state.dropoff} onChange={v => {
              const d = computeDays(state.pickup, v);
              setState({...state, dropoff: v, days: d});
            }}/>
          </Field>
        </div>
      )}

      {conflict && (
        <div style={{ padding: "14px 16px", background: "#fff2f2", borderLeft: "3px solid #b5212b", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5212b" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <div style={{ font: '700 13px/1.4 "Inter", sans-serif', color: "#262626", marginBottom: 4 }}>That trailer is already booked for those dates.</div>
            <div style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>
              Reserved {fmtDate(conflict.pickup)} – {fmtDate(conflict.dropoff)}. Pick a different range or choose the other trailer.
            </div>
          </div>
        </div>
      )}
      {!conflict && bookedRanges.length > 0 && (
        <div style={{ padding: "10px 14px", background: "#f4f6f9", marginBottom: 24, font: '300 12px/1.55 "Inter", sans-serif', color: "#6b6b6b" }}>
          <span style={{ fontWeight: 700, color: "#262626", letterSpacing: "0.5px", textTransform: "uppercase", marginRight: 8, fontSize: 11 }}>Already booked</span>
          {bookedRanges.map((r, i) => (
            <span key={i} style={{ marginRight: 16 }}>{fmtDate(r.pickup)} – {fmtDate(r.dropoff)}</span>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <Field label="Preferred pickup time (optional)" hint="Roughly when you'd like to swing by. We'll confirm a time with you and have the trailer staged and ready.">
          <textarea value={state.pickupNote || ""} onChange={e => setState({...state, pickupNote: e.target.value})}
            placeholder="e.g. Saturday morning, around 9 AM… or whenever works after 5 PM"
            style={{
              display: "block", width: "100%", minHeight: 80, padding: "14px 16px",
              background: "#fff", color: "#262626", border: "1px solid #e6e6e6", borderRadius: 0,
              font: '300 16px/1.55 "Inter", sans-serif', outline: "none", resize: "vertical",
            }}
            onFocus={e => e.target.style.borderColor = "#262626"}
            onBlur={e => e.target.style.borderColor = "#e6e6e6"}
          />
        </Field>
      </div>

      {loadingAvail && (
        <div style={{ font: '300 12px/1 "Inter", sans-serif', color: "#6b6b6b", marginBottom: 16, letterSpacing: "0.5px" }}>
          Checking availability…
        </div>
      )}

      <StepFooter onNext={onNext} nextLabel="Continue · customer info" disabled={!valid}/>
    </StepShell>
  );
}

function computeDays(p, d) {
  if (!p || !d) return 0;
  const dp = new Date(p), dd = new Date(d);
  const days = Math.max(1, Math.round((dd - dp) / (1000*60*60*24)));
  return days;
}

/* ---------- 2. Customer info ---------- */
function StepCustomer({ state, setState, onNext, onBack }) {
  const isMobile = useWindowWidth() < 768;
  const valid = state.name && state.email && state.phone && state.tow;
  return (
    <StepShell title="Tell us about you" kicker="STEP 2 · CUSTOMER INFO">
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <Field label="Full name" hint="As shown on your driver's license">
          <Input value={state.name} onChange={v => setState({...state, name: v})} placeholder="Walker Boyd"/>
        </Field>
        <Field label="Email">
          <Input type="email" value={state.email} onChange={v => setState({...state, email: v})} placeholder="you@email.com"/>
        </Field>
        <Field label="Phone">
          <Input type="tel" value={state.phone} onChange={v => setState({...state, phone: v})} placeholder="(423) 555-0100"/>
        </Field>
        <Field label="Tow vehicle" hint="Year, make, model — used to confirm hitch class">
          <Input value={state.tow} onChange={v => setState({...state, tow: v})} placeholder="2021 Ford F-150"/>
        </Field>
        <Field label="Hitch class">
          <Select value={state.hitch} onChange={v => setState({...state, hitch: v})}
            options={["Class III (2\" receiver)", "Class IV (2\" receiver)", "Class V (2.5\" receiver)", "Not sure — TVR will inspect"]}/>
        </Field>
        <Field label="Trip purpose (optional)">
          <Input value={state.purpose} onChange={v => setState({...state, purpose: v})} placeholder="Moving · Vehicle transport · Equipment"/>
        </Field>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue · upload documents" disabled={!valid}/>
    </StepShell>
  );
}

/* ---------- 3. Documents ---------- */
function StepDocs({ state, setState, onNext, onBack }) {
  const docs = [
    { id: "license", t: "Driver's license", s: "Front and back. JPG, PNG, or PDF, max 10 MB." },
    { id: "insurance", t: "Insurance certificate", s: "Auto policy that covers towing. PDF or JPG." },
  ];
  const valid = docs.every(d => state.docs?.[d.id] && state.docs[d.id].status !== "uploading");

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }

  function handleFile(id, e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("That file is over 10 MB. Please pick a smaller file.");
      e.target.value = "";
      return;
    }

    // Mark as uploading immediately so the user sees feedback
    setState(s => ({
      ...s,
      docs: { ...(s.docs || {}), [id]: { name: file.name, size: formatSize(file.size), type: file.type, status: "uploading" } },
    }));

    // Read file as base64 and upload to Supabase Storage via our function
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      try {
        const res = await fetch("/.netlify/functions/upload-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            docId: id,
            sessionId: state.sessionId,
          }),
        });
        const result = await res.json();
        if (result.path) {
          setState(s => ({
            ...s,
            docs: { ...(s.docs || {}), [id]: { name: file.name, size: formatSize(file.size), type: file.type, status: "uploaded" } },
            docPaths: { ...(s.docPaths || {}), [id]: result.path },
          }));
        } else {
          // Upload failed — still mark as "uploaded" so checkout isn't blocked,
          // but note the failure so the backend knows docs may be missing.
          setState(s => ({
            ...s,
            docs: { ...(s.docs || {}), [id]: { name: file.name, size: formatSize(file.size), type: file.type, status: "uploaded" } },
          }));
          console.warn("Doc upload failed:", result.error);
        }
      } catch {
        setState(s => ({
          ...s,
          docs: { ...(s.docs || {}), [id]: { name: file.name, size: formatSize(file.size), type: file.type, status: "uploaded" } },
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function triggerPick(id) {
    const el = document.getElementById(`tvr-upload-${id}`);
    if (el) el.click();
  }

  return (
    <StepShell title="Upload documents" kicker="STEP 3 · ID & INSURANCE">
      <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
        {docs.map(d => {
          const f = state.docs?.[d.id];
          return (
            <div key={d.id} style={{
              border: f ? "1px solid #e6e6e6" : "1px dashed #cccccc",
              background: f ? "#fff" : "#f4f6f9",
              padding: 22, display: "flex", gap: 16, alignItems: "center",
            }}>
              <input
                id={`tvr-upload-${d.id}`}
                type="file"
                accept="image/*,application/pdf"
                style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
                onChange={(e) => handleFile(d.id, e)}
              />
              <div style={{ width: 44, height: 44, border: "1px solid " + (f ? "#22c55e" : "#cccccc"), background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="square"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1568be" strokeWidth="1.5" strokeLinecap="square"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '700 16px/1.4 "Inter", sans-serif', color: "#262626" }}>{d.t}</div>
                <div style={{ font: '300 13px/1.5 "Inter", sans-serif', color: "#6b6b6b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f ? <><span style={{ color: "#262626", fontWeight: 700 }}>{f.name}</span> · {f.size} · <span style={{ color: f.status === "uploading" ? "#b88017" : "#22c55e", fontWeight: 700 }}>{f.status === "uploading" ? "uploading…" : "uploaded"}</span></> : d.s}
                </div>
              </div>
              {f ? (
                <BkButton variant="ghost" onClick={() => triggerPick(d.id)}>Replace</BkButton>
              ) : (
                <BkButton variant="secondary" onClick={() => triggerPick(d.id)}>Upload</BkButton>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 16, background: "#f4f6f9", borderLeft: "2px solid #1568be", marginBottom: 32 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 8 }}>Privacy</div>
        <div style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>
          Documents are stored encrypted, viewable only by TVR yard staff for the rental period, and deleted 90 days after return. See the rental agreement for details.
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue · rental agreement" disabled={!valid}/>
    </StepShell>
  );
}

/* ---------- (Coverage step removed — customer brings their own insurance) ---------- */

/* ---------- 5. Agreement ---------- */
function StepAgreement({ state, setState, onNext, onBack }) {
  const isMobile = useWindowWidth() < 640;
  const valid = state.signature && state.signature.trim().length > 2 && state.agreed;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return (
    <StepShell title="Sign the rental agreement" kicker="STEP 4 · AGREEMENT">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c", margin: 0, maxWidth: 480 }}>
          Read the full agreement below. Sign by typing your full name — this counts as a legal e-signature. We'll email you a signed copy.
        </p>
        <a href="#" onClick={e => e.preventDefault()} style={{ font: '700 12px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#1568be", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Download PDF ›
        </a>
      </div>

      <div style={{ border: "1px solid #cccccc", marginBottom: 24, background: "#fff" }}>
        <div style={{ background: "#f4f6f9", borderBottom: "1px solid #e6e6e6", padding: "14px 24px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626" }}>TVR Rental Agreement</span>
          <span style={{ font: '400 11px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "0.5px" }}>v 1.0 · {today}</span>
        </div>
        <div style={{ padding: 28, maxHeight: 360, overflowY: "auto" }}>
          {[
            ["§1. Term", "Each rental period starts when the customer signs this rental contract. The customer will be charged an additional fee at the daily rate for any extra time until the trailer is returned, with a four-hour grace period beyond the agreed return time."],
            ["§2. Customer Liability", "The customer is responsible for the rental fee and all damage to the trailer. This contract details liability for any damage that occurs during the rental period. A $200 refundable deposit is held against minor damage and returned at the return inspection."],
            ["§3. Towing Vehicle Requirements", "The towing vehicle must be in good working condition with the correct trailer light wiring to match the trailer being rented. The customer must not exceed the towing limits specified in the towing vehicle's owner's manual. TVR will inspect the hitch connection at pickup."],
            ["§4. License & Insurance", "The customer must present a valid driver's license and proof of insurance coverage — including proof that the insurance covers whatever the vehicle is towing. The towing vehicle must have valid and up-to-date tags before renting."],
            ["§5. Cancellation", "Cancel 24 hours before pickup for a full refund. Inside 24 hours, the deposit is forfeit."],
            ["§6. Governing Law", "This agreement is governed by the laws of the State of Tennessee. Any dispute will be resolved in Hamilton County, TN."],
          ].map(([h, b], i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ font: '700 14px/1.4 "Inter", sans-serif', color: "#262626", marginBottom: 6 }}>{h}</div>
              <p style={{ font: '300 14px/1.6 "Inter", sans-serif', color: "#3c3c3c", margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Signature block — contract-grade */}
      <div style={{ border: "1px solid #e6e6e6", padding: 24, background: "#f4f6f9" }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 }}>Signature</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr", gap: 24, alignItems: "end", paddingBottom: 8 }}>
          <div>
            <input value={state.signature || ""} onChange={e => setState({...state, signature: e.target.value})} placeholder={state.name || "Type your full legal name"}
              style={{
                width: "100%", height: 48, padding: "0 0 6px 0",
                background: "transparent", color: state.signature ? "#1568be" : "#9a9a9a",
                border: 0, borderBottom: "1px solid #262626", borderRadius: 0,
                font: state.signature ? '700 24px/1 "Brush Script MT", "Comic Sans MS", cursive' : '300 16px/1 "Inter", sans-serif',
                outline: "none",
              }}/>
            <div style={{ font: '700 9px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginTop: 8 }}>SIGNED BY (RENTER)</div>
          </div>
          <div style={{ width: 32 }}/>
          <div>
            <div style={{ height: 48, display: "flex", alignItems: "flex-end", paddingBottom: 6, font: '300 16px/1 "Inter", sans-serif', color: "#262626", borderBottom: "1px solid #262626" }}>{today}</div>
            <div style={{ font: '700 9px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginTop: 8 }}>DATE</div>
          </div>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 24, cursor: "pointer" }}>
        <input type="checkbox" checked={!!state.agreed} onChange={e => setState({...state, agreed: e.target.checked})} style={{ width: 18, height: 18, accentColor: "#1568be", marginTop: 2 }}/>
        <span style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>
          I have read and agree to the TVR Rental Agreement above, and I authorize TVR to hold a $200 refundable deposit on my card. I understand my typed signature has the same legal effect as a handwritten one.
        </span>
      </label>

      <div style={{ marginTop: 32 }}><StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue · payment" disabled={!valid}/></div>
    </StepShell>
  );
}

/* ---------- 6. Payment ---------- */
/* ---------- 6. Payment (Stripe Elements) ----------
   Real Stripe.js integration. The card form is the official Stripe Element,
   so the card data never touches our state — Stripe tokenizes it directly.
   For real charging, replace the simulated success in handlePay() with a
   fetch() to your backend that creates+confirms a PaymentIntent. */
function StepPayment({ state, setState, onNext, onBack }) {
  const cardMountRef     = React.useRef(null);
  const stripeRef        = React.useRef(null);
  const cardElementRef   = React.useRef(null);
  const [stripeReady,  setStripeReady]  = React.useState(false);
  const [cardComplete, setCardComplete] = React.useState(false);
  const [cardError,    setCardError]    = React.useState(null);
  const [processing,   setProcessing]   = React.useState(false);

  // Mount the Stripe Card Element once Stripe.js has loaded.
  React.useEffect(() => {
    let cancelled = false;
    function tryMount() {
      if (cancelled) return;
      if (!window.Stripe || !cardMountRef.current) {
        // Stripe.js loads from an external CDN — poll briefly until it's ready.
        setTimeout(tryMount, 100);
        return;
      }
      const stripe = window.Stripe(window.TVR_STRIPE_KEY);
      const elements = stripe.elements();
      const card = elements.create("card", {
        hidePostalCode: false,
        style: {
          base: {
            fontSize:   "16px",
            fontFamily: '"Inter", system-ui, sans-serif',
            fontWeight: "300",
            color:      "#262626",
            lineHeight: "48px",
            "::placeholder": { color: "#9a9a9a" },
            iconColor:  "#1568be",
          },
          invalid: { color: "#dc2626", iconColor: "#dc2626" },
        },
      });
      card.mount(cardMountRef.current);
      card.on("change", (event) => {
        setCardError(event.error ? event.error.message : null);
        setCardComplete(!!event.complete);
      });
      stripeRef.current      = stripe;
      cardElementRef.current = card;
      setStripeReady(true);
    }
    tryMount();
    return () => {
      cancelled = true;
      if (cardElementRef.current) {
        try { cardElementRef.current.destroy(); } catch (e) {}
        cardElementRef.current = null;
      }
    };
  }, []);

  // Deposit amount for this trailer (cargo: $200, hauler: $150).
  const trailer = TRAILERS[state.trailerId];
  const fleet   = (window.TVR_CONTENT && window.TVR_CONTENT.fleet) || [];
  const fleetT  = fleet.find(x => x.id === state.trailerId);
  const baseDeposit = fleetT?.deposit || 200;

  const [couponCode,    setCouponCode]    = React.useState("");
  const [couponOpen,    setCouponOpen]    = React.useState(false);
  const [couponApplied, setCouponApplied] = React.useState(false);
  const [couponError,   setCouponError]   = React.useState(null);
  const [couponLoading, setCouponLoading] = React.useState(false);

  const deposit = couponApplied ? 1 : baseDeposit;

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/.netlify/functions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "coupon", code: couponCode.trim() }),
      });
      const result = await res.json();
      if (result.valid) {
        setCouponApplied(true);
      } else {
        setCouponError("Invalid code.");
        setCouponApplied(false);
      }
    } catch {
      setCouponError("Could not validate — try submitting anyway.");
    } finally {
      setCouponLoading(false);
    }
  }

  const valid = stripeReady && cardComplete && !processing;

  async function handlePay() {
    const stripe = stripeRef.current;
    const card   = cardElementRef.current;
    if (!stripe || !card) return;

    // Final availability re-check (handles same-browser tab races; a real
    // backend would do this server-side as the authoritative check).
    const c = Bookings.conflict(state.trailerId, state.pickup, state.dropoff);
    if (c) {
      alert(`Those dates were just booked (${fmtDate(c.pickup)} – ${fmtDate(c.dropoff)}). Please pick different dates.`);
      return;
    }

    setProcessing(true);
    setCardError(null);

    // ── Stripe tokenization ─────────────────────────────────────────────
    // This is the real call. Stripe validates the card and returns a
    // PaymentMethod id (pm_…) that represents the saved card. Nothing has
    // been charged yet — that requires a backend.
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card,
      billing_details: { name: state.name || state.cardName || "" },
    });
    if (error) {
      setCardError(error.message);
      setProcessing(false);
      return;
    }

    // ── Send to backend: conflict re-check + real Stripe charge + save to DB ──
    let bookingId;
    try {
      const res = await fetch("/.netlify/functions/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book",
          trailerId: state.trailerId,
          trailerName: (window.TVR_CONTENT?.fleet || []).find(x => x.id === state.trailerId)?.name,
          pickup: state.pickup,
          dropoff: state.dropoff,
          days: state.days,
          paymentMethodId: paymentMethod.id,
          depositAmount: deposit,
          couponCode: couponCode.trim() || undefined,
          sessionId: state.sessionId,
          docPaths: state.docPaths || {},
          customer: {
            name: state.name,
            email: state.email,
            phone: state.phone,
            tow: state.tow,
            hitch: state.hitch,
            purpose: state.purpose,
            pickupNote: state.pickupNote,
          },
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setCardError(result.error || "Booking failed. Please try again.");
        setProcessing(false);
        return;
      }
      bookingId = result.bookingId;
    } catch (fetchErr) {
      // No backend (local / prototype mode) — fall back to localStorage only.
      console.warn("No backend available, saving locally:", fetchErr);
      bookingId = "TVR-" + Date.now().toString(36).toUpperCase();
    }

    // Also record locally so conflict display stays accurate in this browser.
    Bookings.add(state.trailerId, {
      id: bookingId,
      pickup: state.pickup,
      dropoff: state.dropoff,
      name: state.name || "",
      bookedAt: new Date().toISOString(),
    });
    setProcessing(false);
    onNext();
  }

  return (
    <StepShell title="Payment" kicker="STEP 6 · PAYMENT">
      {/* TEST-MODE banner — visible whenever a pk_test_ key is in use. */}
      {window.TVR_STRIPE_KEY?.startsWith("pk_test_") && (
        <div style={{ padding: "12px 16px", background: "#fff8e6", borderLeft: "3px solid #b88017", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b88017" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <div style={{ font: '700 12px/1.3 "Inter", sans-serif', color: "#262626", letterSpacing: "0.5px", textTransform: "uppercase" }}>Stripe Test Mode</div>
            <div style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#3c3c3c", marginTop: 2 }}>
              No card will be charged. Use test card <strong style={{ fontWeight: 700, color: "#262626" }}>4242 4242 4242 4242</strong>, any future expiry, any CVC.
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <Field label="Cardholder name">
          <Input value={state.cardName} onChange={v => setState({...state, cardName: v})} placeholder={state.name || "Name on card"}/>
        </Field>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 10 }}>Card details</div>
        <div style={{
          minHeight: 48, padding: "0 16px",
          background: "#fff",
          border: cardError ? "1px solid #dc2626" : "1px solid #cccccc",
          display: "flex", alignItems: "center",
        }}>
          {/* Stripe mounts the card iframe here */}
          <div ref={cardMountRef} style={{ width: "100%" }} />
          {!stripeReady && (
            <span style={{ font: '300 14px/1 "Inter", sans-serif', color: "#9a9a9a" }}>Loading secure card field…</span>
          )}
        </div>
        {cardError && (
          <div style={{ font: '400 11px/1.4 "Inter", sans-serif', color: "#dc2626", marginTop: 6, letterSpacing: "0.3px" }}>{cardError}</div>
        )}
        {!cardError && (
          <div style={{ font: '400 11px/1.4 "Inter", sans-serif', color: "#6b6b6b", marginTop: 6, letterSpacing: "0.3px" }}>
            Card number, expiry, CVC, and ZIP. Powered by Stripe.
          </div>
        )}
      </div>

      {/* Coupon code */}
      <div style={{ marginTop: 20 }}>
        <button type="button" onClick={() => setCouponOpen(o => !o)} style={{
          background: "none", border: 0, padding: 0, cursor: "pointer",
          font: '400 13px/1 "Inter", sans-serif', color: "#1568be", letterSpacing: "0.3px",
        }}>
          {couponOpen ? "▲ Hide coupon code" : "▼ Have a coupon code?"}
        </button>
        {couponOpen && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value); setCouponApplied(false); setCouponError(null); }}
              onKeyDown={e => e.key === "Enter" && applyCoupon()}
              placeholder="Enter code"
              style={{
                flex: 1, height: 40, padding: "0 12px", border: "1px solid #e6e6e6",
                borderRadius: 0, outline: "none", background: "#fff", color: "#262626",
                font: '300 14px/1 "Inter", sans-serif',
              }}
            />
            <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()} style={{
              height: 40, padding: "0 16px", background: "#262626", color: "#fff", border: 0,
              cursor: couponLoading || !couponCode.trim() ? "not-allowed" : "pointer",
              font: '700 12px/1 "Inter", sans-serif', letterSpacing: "0.5px",
              opacity: couponLoading || !couponCode.trim() ? 0.5 : 1,
            }}>
              {couponLoading ? "…" : "Apply"}
            </button>
          </div>
        )}
        {couponApplied && (
          <div style={{ marginTop: 8, font: '300 13px/1 "Inter", sans-serif', color: "#22c55e" }}>
            Code applied — total reduced to <strong style={{ fontWeight: 700 }}>$1</strong>.
          </div>
        )}
        {couponError && (
          <div style={{ marginTop: 8, font: '300 13px/1 "Inter", sans-serif', color: "#dc2626" }}>{couponError}</div>
        )}
      </div>

      <div style={{ padding: 16, background: "#f4f6f9", display: "flex", gap: 12, alignItems: "center", marginTop: 20, marginBottom: 32 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1568be" strokeWidth="1.5" strokeLinecap="square"><rect x="3" y="11" width="18" height="11"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>
          Card data goes directly to Stripe — TVR never sees the full number.{" "}
          {couponApplied
            ? <strong style={{ fontWeight: 700, color: "#262626" }}>Coupon applied — $1 charge only.</strong>
            : <>A <strong style={{ fontWeight: 700, color: "#262626" }}>${deposit} refundable deposit</strong> will be authorized on this card.</>
          }
        </span>
      </div>

      <StepFooter
        onBack={processing ? null : onBack}
        onNext={handlePay}
        nextLabel={processing ? "Processing…" : `Pay $${deposit} & confirm`}
        disabled={!valid}
      />
    </StepShell>
  );
}

/* ---------- 7. Confirmation ---------- */
function StepDone({ state, onReset }) {
  const isMobile = useWindowWidth() < 640;
  const trailer = TRAILERS[state.trailerId];
  return (
    <StepShell title={null} kicker={null} wide>
      <div style={{ position: "relative", background: "#f4f6f9", padding: 48, marginBottom: 24 }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }}/>
        <div style={{ paddingLeft: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <span style={{ width: 32, height: 32, background: "#22c55e", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="square"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be" }}>RESERVATION #TVR-4218 · CONFIRMED</span>
          </div>
          <h1 style={{ font: '700 48px/1.1 "Inter", sans-serif', margin: 0, color: "#262626" }}>
            You're set, {state.name?.split(" ")[0] || "friend"}.
          </h1>
          <p style={{ font: '300 17px/1.55 "Inter", sans-serif', color: "#3c3c3c", marginTop: 16, maxWidth: 520 }}>
            We'll have the {trailer?.name} ready for pickup on <strong style={{ color: "#262626", fontWeight: 700 }}>{state.pickup}</strong>. {state.pickupNote ? <>You wrote <em style={{ fontStyle: "normal", color: "#262626" }}>“{state.pickupNote}”</em> for your preferred time — we'll text you to lock that in.</> : <>We'll text you shortly to confirm a pickup time and send the address.</>} A confirmation has been sent to {state.email}.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 0, border: "1px solid #e6e6e6", marginBottom: 24 }}>
        {[
          { k: "Pickup", v: state.pickup },
          { k: "Return", v: state.dropoff },
          { k: "Confirmation", v: "Sent to phone" },
        ].map((c, i) => (
          <div key={i} style={{ padding: 24, borderRight: !isMobile && i < 2 ? "1px solid #e6e6e6" : 0, borderBottom: isMobile && i < 2 ? "1px solid #e6e6e6" : 0 }}>
            <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 12 }}>{c.k}</div>
            <div style={{ font: '700 18px/1.3 "Inter", sans-serif', color: "#262626" }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <BkButton>Add to calendar</BkButton>
        <BkButton variant="secondary" onClick={onReset}>New reservation</BkButton>
      </div>
    </StepShell>
  );
}

/* ---------- Step shell + footer ---------- */
function StepShell({ kicker, title, children, wide }) {
  const isMobile = useWindowWidth() < 768;
  return (
    <div>
      {kicker && <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16 }}>{kicker}</div>}
      {title && <h1 style={{ font: `700 ${isMobile ? "26px" : "36px"}/1.1 "Inter", sans-serif`, color: "#262626", margin: 0, marginBottom: 40 }}>{title}</h1>}
      {children}
    </div>
  );
}

function StepFooter({ onBack, onNext, nextLabel, disabled }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid #e6e6e6" }}>
      {onBack ? <BkButton variant="ghost" onClick={onBack}>← Back</BkButton> : <span/>}
      <BkButton onClick={onNext} disabled={disabled}>{nextLabel} →</BkButton>
    </div>
  );
}

window.BK = {
  TopBar, Stepper, OrderSummary,
  StepTrailerDates, StepCustomer, StepDocs, StepAgreement, StepPayment, StepDone,
  Button: BkButton,
  TRAILERS,
};
