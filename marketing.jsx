/* global React */
/* Reads all copy + fleet from window.TVR_CONTENT — edit content.js to change text or add trailers. */
const { useState } = React;
const C = () => window.TVR_CONTENT;

/* ----------- Primitives ----------- */
function MkButton({ variant = "primary", children, onClick, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 48, padding: "0 32px", border: 0,
    font: '700 14px/1 "Inter", system-ui, sans-serif',
    letterSpacing: "0.5px", cursor: "pointer",
    transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
    whiteSpace: "nowrap"
  };
  const variants = {
    primary: { background: "#1568be", color: "#fff" },
    secondary: { background: "#fff", color: "#262626", border: "1px solid #cccccc" },
    onDark: { background: "transparent", color: "#fff", border: "1px solid #fff" }
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} {...rest}>{children}</button>;
}

function UpperLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: 0, padding: 0, cursor: "pointer",
      font: '700 13px/1.3 "Inter", system-ui, sans-serif',
      letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626"
    }}>{children} ›</button>);

}

/* ----------- Image slot wrapper (drag-and-drop persistent photos) ----------- */
function PhotoSlot({ id, src, scale = 1, placeholder = "Drop a photo", style, plateStyle, fit = "contain" }) {
  // Renders an <image-slot> with a fallback src; user can drop a new image onto it
  // and it persists in localStorage under `id`.
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", ...plateStyle }}>
      <image-slot
        id={id}
        src={src}
        fit={fit}
        shape="rounded"
        radius="0"
        placeholder={placeholder}
        style={{ display: "block", transform: `scale(${scale})`, transformOrigin: "center center", ...style }} />
      
    </div>);

}

/* ----------- Top nav ----------- */
function TopNav({ route, setRoute }) {
  const c = C();
  const items = [
  ...c.fleet.map((t) => ({ id: t.id, label: t.navLabel || t.name })),
  { id: "booking", label: c.nav.reserveLabel }];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 72, padding: "0 32px",
      background: "#fff", borderBottom: "1px solid #e6e6e6"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <a onClick={() => setRoute("home")} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <img src="assets/tvr-logo-primary.png" alt="TVR Tennessee Valley Rentals" style={{ height: 44, objectFit: "cover", width: "80px" }} />
        </a>
        <nav style={{ display: "flex", gap: 32 }}>
          {items.map((i) =>
          <a key={i.id} onClick={() => setRoute(i.id)} style={{
            cursor: "pointer",
            font: '400 14px/1.4 "Inter", sans-serif',
            letterSpacing: "0.3px",
            color: route === i.id ? "#1568be" : "#262626",
            fontWeight: route === i.id ? 700 : 400
          }}>{i.label}</a>
          )}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ font: '400 12px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "0.5px" }}>{c.brand.phone}</span>
        <MkButton onClick={() => setRoute("booking")}>{c.nav.reserveLabel}</MkButton>
      </div>
    </header>);

}

/* ----------- Hero ----------- */
function HeroDark({ setRoute }) {
  const c = C();
  const h = c.hero;
  const firstId = c.fleet[0]?.id || "home";
  return (
    <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
      <div style={{ padding: "80px 80px 80px 96px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 1, background: "#b5212b" }} />
            {h.kicker}
          </div>
          <h1 style={{ font: '700 72px/1.05 "Inter", sans-serif', margin: 0, color: "#262626" }}>
            {h.titleLine1}<br />{h.titleLine2}
          </h1>
          <p style={{ font: '300 18px/1.55 "Inter", sans-serif', color: "#3c3c3c", maxWidth: 480, marginTop: 24, marginBottom: 32 }}>
            {h.body}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <MkButton onClick={() => setRoute("booking")}>{h.primaryCta}</MkButton>
            <MkButton variant="secondary" onClick={() => setRoute(firstId)}>{h.secondaryCta}</MkButton>
          </div>
        </div>
        <PhotoSlot id="hero-photo" src={h.photo} placeholder="Drop a hero photo"
        plateStyle={{ background: "#fff", padding: 16 }}
        style={{ width: "100%", height: 400 }} />
      </div>
    </section>);

}

/* ----------- Fleet card ----------- */
function FleetCard({ trailer, onSpecs }) {
  return (
    <article style={{ background: "#fff", padding: 0, display: "flex", flexDirection: "column" }}>
      <PhotoSlot id={`detail-${trailer.id}`} src={trailer.photo} scale={trailer.photoScale || 1}
      placeholder={`Drop a photo of the ${trailer.name}`}
      plateStyle={{ background: "#f4f6f9", aspectRatio: "16 / 10", overflow: "hidden" }}
      style={{ width: "85%", height: "100%" }} />
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ font: '700 24px/1.25 "Inter", sans-serif', margin: 0, color: "#262626" }}>{trailer.name}</h3>
        {trailer.subheading &&
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#1568be", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 18, height: 1, background: "#b5212b" }} />
            {trailer.subheading}
          </div>
        }
        <p style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c", margin: 0, minHeight: 44 }}>{trailer.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px solid #e6e6e6" }}>
          <div>
            <div style={{ font: '700 18px/1 "Inter", sans-serif', color: "#262626" }}>${trailer.daily}<span style={{ font: '300 14px/1 "Inter", sans-serif', color: "#6b6b6b" }}> / day</span></div>
          </div>
          <UpperLink onClick={onSpecs}>View specs</UpperLink>
        </div>
      </div>
    </article>);

}

/* ----------- Fleet grid ----------- */
function FleetGrid({ setRoute }) {
  const c = C();
  const cols = Math.min(c.fleet.length, 3); // 1–3 trailers single row, else wrap
  return (
    <section style={{ padding: "80px 80px", background: "#fff" }}>
      <header style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 48 }}>
        <h2 style={{ font: '700 48px/1.1 "Inter", sans-serif', margin: 0, color: "#262626" }}>{c.fleetSection.heading}</h2>
        <UpperLink onClick={() => setRoute("booking")}>{c.fleetSection.link}</UpperLink>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 32 }}>
        {c.fleet.map((t) => <FleetCard key={t.id} trailer={t} onSpecs={() => setRoute(t.id)} />)}
      </div>
    </section>);

}

/* ----------- Spec grid ----------- */
function SpecGrid({ specs }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${specs.length}, 1fr)`, borderTop: "1px solid #e6e6e6", borderBottom: "1px solid #e6e6e6" }}>
      {specs.map((s, i) =>
      <div key={i} style={{
        padding: "32px 24px", display: "flex", flexDirection: "column", gap: 8,
        borderRight: i < specs.length - 1 ? "1px solid #e6e6e6" : "0"
      }}>
          <div style={{ font: '700 32px/1.15 "Inter", sans-serif', color: "#262626" }}>{s.v}</div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "1.5px", textTransform: "uppercase" }}>{s.u}</div>
        </div>
      )}
    </div>);

}

/* ----------- Fleet detail page ----------- */
function FleetDetail({ trailerId, setRoute }) {
  const c = C();
  const t = c.fleet.find((x) => x.id === trailerId);
  if (!t) {
    return <section style={{ padding: 80 }}><p>Trailer not found. <a onClick={() => setRoute("home")}>Back</a></p></section>;
  }
  return (
    <article>
      <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
        <div style={{ padding: "80px 80px 80px 96px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: "#b5212b" }} />
              {t.kickerLong}
            </div>
            <h1 style={{ font: '700 40px/1.05 "Inter", sans-serif', margin: 0, color: "#262626" }}>{t.name}</h1>
            {t.subheading &&
            <div style={{ font: '700 13px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#1568be", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 1, background: "#b5212b" }} />
                {t.subheading}
              </div>
            }
            <p style={{ font: '300 18px/1.55 "Inter", sans-serif', color: "#3c3c3c", marginTop: 24, marginBottom: 32, maxWidth: 460 }}>{t.detailTagline || t.tagline}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <MkButton onClick={() => setRoute("booking")}>Reserve · ${t.daily}/day</MkButton>
              <MkButton variant="secondary" onClick={() => setRoute("home")}> ›</MkButton>
            </div>
          </div>
          <PhotoSlot id={`detail-${t.id}`} src={t.photo} scale={t.photoScale || 1}
          placeholder={`Drop a photo of the ${t.name}`}
          plateStyle={{ background: "#fff", padding: 16 }}
          style={{ width: "100%", height: 360 }} />
        </div>
      </section>

      <section style={{ padding: "80px 80px", background: "#fff" }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 24 }}>SPECIFICATIONS</div>
        <SpecGrid specs={t.specs} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48, marginTop: 80 }}>
          {[
          { t: "Daily rate", v: `$${t.daily}/day`, note: "24-hour rental period" },
          { t: "Weekly rate", v: `$${t.weekly}/week`, note: "7 consecutive days" },
          { t: "Deposit", v: `$${t.deposit}`, note: "Refunded at return" }].
          map((c, i) =>
          <div key={i} style={{ borderTop: "1px solid #1568be", paddingTop: 16 }}>
              <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 12 }}>{c.t}</div>
              <div style={{ font: '700 32px/1.15 "Inter", sans-serif', color: "#262626", marginBottom: 6 }}>{c.v}</div>
              <div style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>{c.note}</div>
            </div>
          )}
        </div>
      </section>
    </article>);

}

/* ----------- Rental Terms band ----------- */
function PickupBand() {
  const c = C();
  return (
    <section style={{ padding: "80px 80px", background: "#f4f6f9", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
      <header style={{ marginBottom: 56, paddingLeft: 16 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, height: 1, background: "#b5212b" }} />
          {c.termsBand.kicker}
        </div>
        <h2 style={{ font: '700 48px/1.1 "Inter", sans-serif', margin: 0, color: "#262626" }}>{c.termsBand.heading}</h2>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, paddingLeft: 16 }}>
        {c.termsBand.items.map((t, i) =>
        <article key={i} style={{
          background: "#fff",
          padding: "32px 36px",
          display: "grid",
          gridTemplateColumns: "64px 1fr",
          gap: 24,
          alignItems: "start",
          borderTop: "3px solid #1568be"
        }}>
            <div style={{
            font: '700 56px/1 "Inter", sans-serif',
            color: "#1568be"
          }}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3 style={{ font: '700 20px/1.3 "Inter", sans-serif', margin: 0, color: "#262626", marginBottom: 12 }}>{t.title}</h3>
              <p style={{ font: '300 15px/1.65 "Inter", sans-serif', color: "#3c3c3c", margin: 0 }}>{t.body}</p>
            </div>
          </article>
        )}
      </div>
    </section>);

}

/* ----------- Pre-footer CTA ----------- */
function CTABand({ setRoute }) {
  const c = C();
  return (
    <section style={{ position: "relative", background: "#f4f6f9", padding: "80px 80px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 64, height: 4, background: "#b5212b" }} />
      <h2 style={{ font: '700 36px/1.15 "Inter", sans-serif', margin: 0, color: "#262626", maxWidth: 760, marginInline: "auto" }}>
        {c.ctaBand.line1}<br />{c.ctaBand.line2}
      </h2>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <MkButton onClick={() => setRoute("booking")}>{c.ctaBand.cta}</MkButton>
      </div>
    </section>);

}

/* ----------- Footer ----------- */
function Footer() {
  const c = C();
  // Drop columns that have neither a header nor any links
  const cols = c.footer.columns.filter((col) => col.h || col.links && col.links.length);
  return (
    <footer style={{ background: "#f6f7f9", padding: "64px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: `2fr repeat(${cols.length}, 1fr)`, gap: 48 }}>
        <div>
          <img src="assets/tvr-logo-primary.png" alt="TVR" style={{ height: 48, marginBottom: 24, objectFit: "cover", width: "100px" }} />
          <p style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#6b6b6b", maxWidth: 320 }}>
            {c.footer.blurb}
          </p>
          <div style={{ marginTop: 16, height: 2, width: 64, background: "#b5212b" }} />
        </div>
        {cols.map((col, i) =>
        <div key={i}>
            {col.h && <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 }}>{col.h}</div>}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {col.links.map((l) => <li key={l}><a style={{ font: '300 14px/1 "Inter", sans-serif', color: "#3c3c3c" }}>{l}</a></li>)}
            </ul>
          </div>
        )}
      </div>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e6e6e6", display: "flex", justifyContent: "space-between", font: '300 12px/1 "Inter", sans-serif', color: "#6b6b6b" }}>
        <span>{c.brand.yearFooter}</span>
        <span>{c.brand.city}</span>
      </div>
    </footer>);

}

window.MK = { TopNav, HeroDark, FleetGrid, FleetDetail, PickupBand, CTABand, Footer, Button: MkButton };