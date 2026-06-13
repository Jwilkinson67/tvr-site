/* global React */
/* Reads all copy + fleet from window.TVR_CONTENT — edit content.js to change text or add trailers. */
const { useState } = React;
const C = () => window.TVR_CONTENT;

function useWindowWidth() {
  const [w, setW] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

/* ----------- Primitives ----------- */
function MkButton({ variant = "primary", children, onClick, style, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 48, padding: "0 32px", border: 0, borderRadius: 0,
    WebkitAppearance: "none", appearance: "none",
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
  return <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick} {...rest}>{children}</button>;
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
function PhotoSlot({ id, src, scale = 1, placeholder = "Drop a photo", style, plateStyle, fit = "contain", position }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", ...plateStyle }}>
      <image-slot
        id={id}
        src={src}
        fit={fit}
        shape="rounded"
        radius="0"
        position={position}
        placeholder={placeholder}
        style={{ display: "block", transform: `scale(${scale})`, transformOrigin: "center center", ...style }} />
      
    </div>);

}

/* ----------- Top nav ----------- */
function TopNav({ route, setRoute }) {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  const items = [
  ...c.fleet.map((t) => ({ id: t.id, label: t.navLabel || t.name }))];

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: isMobile ? 60 : 72, padding: isMobile ? "0 16px" : "0 32px",
      background: "#fff", borderBottom: "1px solid #e6e6e6"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <a onClick={() => setRoute("home")} style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, cursor: "pointer", textDecoration: "none" }}>
          <span style={{ width: isMobile ? 28 : 40, height: 2.5, background: "#b5212b", flexShrink: 0 }} />
          <span style={{
            font: `800 ${isMobile ? "15px" : "19px"}/1 "Barlow Condensed", "Arial Narrow", Arial, sans-serif`,
            fontStyle: "italic", color: "#1568be", letterSpacing: "0.5px", textTransform: "uppercase",
          }}>Tennessee Valley Rentals LLC</span>
        </a>
        {!isMobile && (
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
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {!isMobile && <span style={{ font: '400 12px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "0.5px" }}>{c.brand.phone}</span>}
        <MkButton onClick={() => setRoute("booking")} style={isMobile ? { height: 36, padding: "0 18px", fontSize: "13px" } : { background: "#1568be", color: "#fff", border: 0, height: 44, padding: "0 28px", fontSize: "15px", fontWeight: 800, letterSpacing: "0.8px" }}>{c.nav.reserveLabel}</MkButton>
      </div>
    </header>);

}

/* ----------- Hero ----------- */
function HeroDark({ setRoute }) {
  const c = C();
  const h = c.hero;
  const isMobile = useWindowWidth() < 768;
  const firstId = c.fleet[0]?.id || "home";

  if (isMobile) {
    return (
      <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
        <PhotoSlot id="hero-photo" src={h.photo} placeholder="Drop a hero photo"
          plateStyle={{ background: "#f4f6f9" }}
          position="center 65%"
          style={{ width: "100%", height: 200 }} />
        <div style={{ padding: "32px 24px 40px 32px" }}>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 20, height: 1, background: "#b5212b" }} />
            {h.kicker}
          </div>
          <h1 style={{ font: '700 38px/1.05 "Inter", sans-serif', margin: 0, color: "#262626" }}>
            {h.titleLine1}<br />{h.titleLine2}
          </h1>
          <p style={{ font: '300 15px/1.6 "Inter", sans-serif', color: "#3c3c3c", marginTop: 16, marginBottom: 28 }}>
            {h.body}
          </p>
          <MkButton onClick={() => setRoute("booking")}>{h.primaryCta}</MkButton>
        </div>
      </section>
    );
  }

  return (
    <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
      <div style={{
        padding: "56px 80px 56px 96px",
        display: "grid", gridTemplateColumns: "1.1fr 1fr",
        gap: 48, alignItems: "center"
      }}>
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
          </div>
        </div>
        <PhotoSlot id="hero-photo" src={h.photo} placeholder="Drop a hero photo"
          plateStyle={{ background: "#fff", padding: 0 }}
          style={{ width: "100%", height: 300 }} />
      </div>
    </section>
  );

}

/* ----------- Fleet card ----------- */
function FleetCard({ trailer, onSpecs }) {
  return (
    <article style={{ background: "#fff", padding: 0, display: "flex", flexDirection: "column" }}>
      <PhotoSlot id={`detail-${trailer.id}`} src={trailer.photo} scale={trailer.photoScale || 1}
      placeholder={`Drop a photo of the ${trailer.name}`}
      plateStyle={{ aspectRatio: "16 / 10", overflow: "hidden" }}
      style={{ width: "100%", height: "100%" }} />
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
          <UpperLink onClick={onSpecs}>More details</UpperLink>
        </div>
      </div>
    </article>);

}

/* ----------- Fleet grid ----------- */
function FleetGrid({ setRoute }) {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  const cols = isMobile ? 1 : Math.min(c.fleet.length, 3);
  return (
    <section style={{ padding: isMobile ? "48px 16px" : "80px 80px", background: "#fff" }}>
      <header style={{ display: "flex", alignItems: isMobile ? "flex-start" : "end", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", marginBottom: isMobile ? 24 : 48, gap: isMobile ? 8 : 0 }}>
        <h2 style={{ font: `700 ${isMobile ? "32px" : "48px"}/1.1 "Inter", sans-serif`, margin: 0, color: "#262626" }}>{c.fleetSection.heading}</h2>
        <UpperLink onClick={() => setRoute("booking")}>{c.fleetSection.link}</UpperLink>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 32 }}>
        {c.fleet.map((t) => <FleetCard key={t.id} trailer={t} onSpecs={() => setRoute(t.id)} />)}
      </div>
    </section>);

}

/* ----------- Spec grid ----------- */
function SpecGrid({ specs }) {
  const isMobile = useWindowWidth() < 640;
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : `repeat(${specs.length}, 1fr)`, borderTop: "1px solid #e6e6e6", borderBottom: "1px solid #e6e6e6" }}>
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
  const isMobile = useWindowWidth() < 768;
  const [activeIdx, setActiveIdx] = React.useState(0);
  const t = c.fleet.find((x) => x.id === trailerId);
  if (!t) {
    return <section style={{ padding: 80 }}><p>Trailer not found. <a onClick={() => setRoute("home")}>Back</a></p></section>;
  }

  const extras = t.photoExtra
    ? (Array.isArray(t.photoExtra) ? t.photoExtra : [t.photoExtra])
    : [];
  const photos = [
    { src: t.photo, id: `detail-${t.id}`, label: "Main", scale: t.photoScale || 1 },
    ...extras.map((src, i) => ({ src, id: `detail-${t.id}-extra-${i}`, label: `Photo ${i + 2}`, scale: 1 })),
  ];
  const active = photos[activeIdx] || photos[0];

  return (
    <article>
      <section style={{ position: "relative", background: "#fff", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
        <div style={{
          padding: isMobile ? "48px 24px 48px 32px" : "80px 80px 80px 96px",
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 48, alignItems: "center"
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: "#b5212b" }} />
              {t.kickerLong}
            </div>
            <h1 style={{ font: `700 ${isMobile ? "30px" : "40px"}/1.05 "Inter", sans-serif`, margin: 0, color: "#262626" }}>{t.name}</h1>
            {t.subheading &&
            <div style={{ font: '700 13px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#1568be", marginTop: 14, display: "inline-flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 1, background: "#b5212b" }} />
                {t.subheading}
              </div>
            }
            <p style={{ font: `300 ${isMobile ? "16px" : "18px"}/1.55 "Inter", sans-serif`, color: "#3c3c3c", marginTop: 24, marginBottom: 32 }}>{t.detailTagline || t.tagline}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MkButton onClick={() => setRoute("booking")}>Reserve · ${t.daily}/day</MkButton>
              <MkButton variant="secondary" onClick={() => setRoute("home")}>← Back</MkButton>
            </div>
          </div>

          {/* Photo gallery */}
          <div style={{ minWidth: 0 }}>
            <PhotoSlot id={active.id} src={active.src} scale={active.scale}
              placeholder={`Drop a photo of the ${t.name}`}
              plateStyle={{ background: "transparent" }}
              style={{ width: "100%", height: isMobile ? 220 : 360 }} />
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
                {photos.map((p, i) => (
                  <button key={i} onClick={() => setActiveIdx(i)} style={{
                    width: isMobile ? 60 : 72, height: isMobile ? 48 : 56,
                    padding: 0, cursor: "pointer", flexShrink: 0,
                    border: `2px solid ${activeIdx === i ? "#1568be" : "#e0e0e0"}`,
                    borderRadius: 2, overflow: "hidden", background: "#f4f6f9",
                    transition: "border-color 120ms",
                  }}>
                    <img src={p.src} alt={p.label}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "40px 16px" : "80px 80px", background: "#fff" }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 24 }}>SPECIFICATIONS</div>
        <SpecGrid specs={t.specs} />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? 24 : 48, marginTop: isMobile ? 40 : 80 }}>
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
  const isMobile = useWindowWidth() < 768;
  return (
    <section style={{ padding: isMobile ? "48px 16px 48px 24px" : "80px 80px", background: "#f4f6f9", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
      <header style={{ marginBottom: isMobile ? 32 : 56, paddingLeft: isMobile ? 0 : 16 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, height: 1, background: "#b5212b" }} />
          {c.termsBand.kicker}
        </div>
        <h2 style={{ font: `700 ${isMobile ? "32px" : "48px"}/1.1 "Inter", sans-serif`, margin: 0, color: "#262626" }}>{c.termsBand.heading}</h2>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 24, paddingLeft: isMobile ? 0 : 16 }}>
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

/* ----------- How it works ----------- */
function HowItWorksBand() {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  const h = c.howItWorks;
  if (!h) return null;
  return (
    <section style={{ background: "#fff", padding: isMobile ? "56px 24px" : "80px 80px" }}>
      <header style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16 }}>
          {h.kicker}
        </div>
        <h2 style={{ font: `700 ${isMobile ? "32px" : "48px"}/1.1 "Inter", sans-serif`, margin: 0, color: "#262626" }}>{h.heading}</h2>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: isMobile ? 32 : 24, maxWidth: 1100, marginInline: "auto" }}>
        {h.steps.map(function(step, i) {
          return (
            <div key={i} style={{ borderTop: "3px solid #1568be", paddingTop: 24 }}>
              <div style={{ font: '700 48px/1 "Inter", sans-serif', color: "#e6e6e6", marginBottom: 16 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 style={{ font: '700 18px/1.3 "Inter", sans-serif', color: "#262626", margin: "0 0 10px" }}>{step.title}</h3>
              <p style={{ font: '300 14px/1.65 "Inter", sans-serif', color: "#3c3c3c", margin: 0 }}>{step.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------- FAQ ----------- */
function FAQBand() {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  const faq = c.faq;
  if (!faq) return null;
  return (
    <section style={{ background: "#fff", padding: isMobile ? "56px 24px 56px 32px" : "80px 80px 80px 96px" }}>
      <header style={{ marginBottom: isMobile ? 32 : 56 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, height: 1, background: "#b5212b" }} />
          {faq.kicker}
        </div>
        <h2 style={{ font: `700 ${isMobile ? "32px" : "48px"}/1.1 "Inter", sans-serif`, margin: 0, color: "#262626" }}>{faq.heading}</h2>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 0 : "0 48px" }}>
        {faq.items.map(function(item, i) {
          return (
            <div key={i} style={{ borderTop: "1px solid #e6e6e6", padding: "28px 0" }}>
              <h3 style={{ font: '700 17px/1.3 "Inter", sans-serif', color: "#262626", margin: "0 0 10px" }}>{item.q}</h3>
              <p style={{ font: '300 15px/1.65 "Inter", sans-serif', color: "#3c3c3c", margin: 0 }}>{item.a}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------- Pre-footer CTA ----------- */
function CTABand({ setRoute }) {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  return (
    <section style={{ position: "relative", background: "#f4f6f9", padding: isMobile ? "48px 24px" : "80px 80px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 64, height: 4, background: "#b5212b" }} />
      <h2 style={{ font: `700 ${isMobile ? "28px" : "36px"}/1.15 "Inter", sans-serif`, margin: 0, color: "#262626", maxWidth: 760, marginInline: "auto" }}>
        {c.ctaBand.line1}<br />{c.ctaBand.line2}
      </h2>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <MkButton onClick={() => setRoute("booking")}>{c.ctaBand.cta}</MkButton>
      </div>
    </section>);

}

/* ----------- Location Band ----------- */
function LocationBand() {
  const isMobile = useWindowWidth() < 768;
  return (
    <section style={{ background: "#fff", padding: isMobile ? "48px 24px" : "72px 80px" }}>
      <div style={{
        maxWidth: 1100, marginInline: "auto",
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 32 : 64, alignItems: "center"
      }}>
        {/* Map */}
        <div style={{ borderRadius: 4, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.10)", lineHeight: 0 }}>
          <img
            src="assets/assetsmap-pickup-area.png.png"
            alt="TVR pickup area map"
            style={{ width: "100%", height: isMobile ? 260 : 360, objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        {/* Text */}
        <div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 1, background: "#b5212b" }} />
            Pickup Location
          </div>
          <h2 style={{ font: `700 ${isMobile ? "26px" : "32px"}/1.15 "Inter", sans-serif`, margin: "0 0 16px", color: "#262626" }}>
            Easy Access from the Chattanooga Area
          </h2>
          <p style={{ font: '400 16px/1.65 "Inter", sans-serif', color: "#3c3c3c", margin: "0 0 16px" }}>
            Tennessee Valley Rentals LLC is located just 5 minutes from US Hwy 74 / Exit 178, making pickup easy from Chattanooga, Ooltewah, Cleveland, Hixson, Soddy Daisy, and surrounding areas.
          </p>
          <p style={{ font: '400 14px/1.6 "Inter", sans-serif', color: "#6b6b6b", margin: 0, padding: "12px 16px", borderLeft: "3px solid #b5212b", background: "#f9f9f9" }}>
            For security and privacy, the exact pickup address will be provided after booking is confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------- Reviews Band ----------- */
function GoogleLogo({ size }) {
  size = size || 16;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function ReviewStars({ count }) {
  count = count || 5;
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[0,1,2,3,4].map(function(i) {
        return <span key={i} style={{ color: i < count ? "#f5a623" : "#ddd", fontSize: 14 }}>&#9733;</span>;
      })}
    </div>
  );
}

function ReviewCard({ review }) {
  const initials = review.name.split(" ").map(function(w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
  const colors = ["#1568be", "#b5212b", "#3c7a3c", "#7c3c7a", "#b87014"];
  const colorIdx = review.name.charCodeAt(0) % colors.length;

  return (
    <div style={{ background: "#fff", border: "1px solid #e6e6e6", display: "flex", flexDirection: "column" }}>
      {review.photo && (
        <div style={{ width: "100%", flexShrink: 0, borderBottom: "1px solid #e6e6e6", overflow: "hidden" }}>
          <img
            src={review.photo}
            alt={review.name + "'s rental photo"}
            style={{ width: "100%", height: "auto", display: "block" }}
            onError={function(e) { e.target.parentNode.style.display = "none"; }}
          />
        </div>
      )}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
            background: colors[colorIdx],
            display: "flex", alignItems: "center", justifyContent: "center",
            font: '700 14px/1 "Inter", sans-serif', color: "#fff",
          }}>{initials}</div>
          <div>
            <div style={{ font: '700 14px/1.2 "Inter", sans-serif', color: "#262626" }}>{review.name}</div>
            <div style={{ font: '400 11px/1 "Inter", sans-serif', color: "#9a9a9a", marginTop: 3 }}>{review.date}</div>
          </div>
        </div>
        <ReviewStars count={review.stars} />
        <p style={{ font: '300 14px/1.7 "Inter", sans-serif', color: "#3c3c3c", margin: 0, flex: 1 }}>"{review.text}"</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, font: '400 11px/1 "Inter", sans-serif', color: "#9a9a9a" }}>
          <GoogleLogo size={13} />
          Posted on Google
        </div>
      </div>
    </div>
  );
}

function ReviewsBand() {
  const c = C();
  const isMobile = useWindowWidth() < 768;

  const reviews = c.reviews || [];
  const gUrl = c.googleReviewUrl || "#";
  const cols = Math.min(reviews.length, 3) || 1;

  return (
    <section style={{ position: "relative", background: "#f4f6f9", padding: isMobile ? "56px 24px 56px 32px" : "80px 80px 80px 96px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: isMobile ? "flex-start" : "flex-end",
        justifyContent: "space-between", flexDirection: isMobile ? "column" : "row",
        gap: 24, marginBottom: isMobile ? 32 : 48,
      }}>
        <div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#b5212b", marginBottom: 12, display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 2, background: "#b5212b", display: "inline-block" }} />
            CUSTOMER REVIEWS
          </div>
          <h2 style={{ font: `700 ${isMobile ? "28px" : "38px"}/1.15 "Inter", sans-serif`, margin: 0, color: "#181818" }}>
            What renters are saying
          </h2>
          <p style={{ font: '400 15px/1.6 "Inter", sans-serif', color: "#6b6b6b", margin: "10px 0 0" }}>
            Verified Google reviews from real TVR customers.
          </p>
        </div>

        {/* Overall rating chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#f4f6f9", border: "1px solid #e6e6e6", padding: "16px 24px", flexShrink: 0 }}>
          <div style={{ font: '800 42px/1 "Inter", sans-serif', color: "#262626" }}>5.0</div>
          <div>
            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
              {[1,2,3,4,5].map(function(i) { return <span key={i} style={{ color: "#f5a623", fontSize: 18 }}>&#9733;</span>; })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, font: '400 12px/1 "Inter", sans-serif', color: "#6b6b6b" }}>
              <GoogleLogo size={16} />
              Google &middot; {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      {reviews.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
          gap: isMobile ? 16 : 24,
          marginBottom: isMobile ? 32 : 40,
        }}>
          {reviews.map(function(r, i) { return <ReviewCard key={i} review={r} />; })}
        </div>
      )}

      {/* Leave a review CTA */}
      <div style={{
        background: "#1568be",
        padding: isMobile ? "32px 24px" : "40px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 24, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ font: `700 ${isMobile ? "18px" : "22px"}/1.2 "Inter", sans-serif`, color: "#fff", marginBottom: 6 }}>
            Had a great experience? Let us know.
          </div>
          <div style={{ font: '400 14px/1.5 "Inter", sans-serif', color: "#a8c8f0" }}>
            Reviews help local customers find TVR. It only takes 30 seconds on Google.
          </div>
        </div>
        <a href={gUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "#fff", color: "#262626",
          font: '700 14px/1 "Inter", sans-serif', letterSpacing: "0.5px",
          padding: "16px 28px", textDecoration: "none", flexShrink: 0,
        }}>
          <GoogleLogo size={20} />
          Leave a Google Review
        </a>
      </div>

    </section>
  );
}

/* ----------- Footer ----------- */
function Footer() {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  const colHead = { font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 };
  const btn = { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e6e6e6", padding: "10px 16px", textDecoration: "none", font: '700 12px/1 "Inter", sans-serif', color: "#262626", letterSpacing: "0.5px" };
  return (
    <footer style={{ background: "#fff", padding: isMobile ? "48px 24px" : "64px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 1fr 1fr", gap: isMobile ? 40 : 40, alignItems: "start" }}>

        {/* Logo */}
        <div>
          <img src="assets/tvr-logo-transparent.png" alt="Tennessee Valley Rentals LLC"
            style={{ height: 110, width: "auto", display: "block" }} />
        </div>

        {/* Contact — first column */}
        <div>
          <div style={colHead}>Contact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href={`tel:${c.brand.phone}`} style={btn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {c.brand.phone}
            </a>
            <a href={`mailto:${c.brand.email}`} style={btn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              {c.brand.email}
            </a>
          </div>
        </div>

        {/* Connect With Us */}
        <div>
          <div style={colHead}>Connect With Us</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="https://www.facebook.com/rentwithTVR/" target="_blank" rel="noopener noreferrer" style={btn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Facebook
            </a>
            <a href="https://g.page/r/CWniJIMNhoVzEAI/review" target="_blank" rel="noopener noreferrer" style={btn}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Review
            </a>
          </div>
        </div>

        {/* Documents */}
        <div>
          <div style={colHead}>Documents</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a href="assets/TVR-Rental-Agreement.pdf" target="_blank" rel="noopener" style={btn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Rental Agreement
            </a>
            <a href="assets/TVR-Renter-Insurance-FAQ.pdf" target="_blank" rel="noopener" style={btn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              Renter Insurance FAQ
            </a>
          </div>
        </div>

      </div>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e6e6e6", display: "flex", justifyContent: "space-between", font: '300 12px/1 "Inter", sans-serif', color: "#9a9a9a" }}>
        <span>{c.brand.yearFooter}</span>
        <span>{c.brand.city}</span>
      </div>
    </footer>);

}

window.MK = { TopNav, HeroDark, FleetGrid, FleetDetail, HowItWorksBand, PickupBand, FAQBand, CTABand, LocationBand, ReviewsBand, Footer, Button: MkButton };