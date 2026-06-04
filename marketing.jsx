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
          }}>Tennessee Valley Rentals</span>
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
          style={{ width: "100%", height: 260 }} />
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
      plateStyle={{ background: "#ebebeb", aspectRatio: "16 / 10", overflow: "hidden" }}
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
          <UpperLink onClick={onSpecs}>View specs</UpperLink>
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
  const t = c.fleet.find((x) => x.id === trailerId);
  if (!t) {
    return <section style={{ padding: 80 }}><p>Trailer not found. <a onClick={() => setRoute("home")}>Back</a></p></section>;
  }
  return (
    <article>
      <section style={{ position: "relative", background: "#ebebeb", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }} />
        <div style={{
          padding: isMobile ? "48px 24px 48px 32px" : "80px 80px 80px 96px",
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 48, alignItems: "center"
        }}>
          <div>
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
            <p style={{ font: `300 ${isMobile ? "16px" : "18px"}/1.55 "Inter", sans-serif`, color: "#3c3c3c", marginTop: 24, marginBottom: 32, maxWidth: 460 }}>{t.detailTagline || t.tagline}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MkButton onClick={() => setRoute("booking")}>Reserve · ${t.daily}/day</MkButton>
              <MkButton variant="secondary" onClick={() => setRoute("home")}>← Back</MkButton>
            </div>
          </div>
          <PhotoSlot id={`detail-${t.id}`} src={t.photo} scale={t.photoScale || 1}
          placeholder={`Drop a photo of the ${t.name}`}
          plateStyle={{ background: "#ebebeb" }}
          style={{ width: "100%", height: isMobile ? 220 : 360 }} />
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
            Tennessee Valley Rentals is located just 5 minutes from US Hwy 74 / Exit 178, making pickup easy from Chattanooga, Ooltewah, Cleveland, Hixson, Soddy Daisy, and surrounding areas.
          </p>
          <p style={{ font: '400 14px/1.6 "Inter", sans-serif', color: "#6b6b6b", margin: 0, padding: "12px 16px", borderLeft: "3px solid #b5212b", background: "#f9f9f9" }}>
            For security and privacy, the exact pickup address will be provided after booking is confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------- Footer ----------- */
function Footer() {
  const c = C();
  const isMobile = useWindowWidth() < 768;
  return (
    <footer style={{ background: "#f6f7f9", padding: isMobile ? "48px 24px" : "64px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: isMobile ? 32 : 48 }}>
        <div>
          <img src="assets/tvr-logo-primary-transparent.png" alt="TVR" style={{ height: 48, marginBottom: 24, width: "auto", mixBlendMode: "multiply" }} />
          <p style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#6b6b6b", maxWidth: 320 }}>
            {c.footer.blurb}
          </p>
          <div style={{ marginTop: 16, height: 2, width: 64, background: "#b5212b" }} />
        </div>
        <div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 }}>Contact</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href={`tel:${c.brand.phone}`} style={{ font: '300 14px/1 "Inter", sans-serif', color: "#3c3c3c", textDecoration: "none" }}>{c.brand.phone}</a>
            <a href={`mailto:${c.brand.email}`} style={{ font: '300 14px/1 "Inter", sans-serif', color: "#3c3c3c", textDecoration: "none" }}>{c.brand.email}</a>
          </div>
          <div style={{ marginTop: 24 }}>
            <a
              href="https://g.page/r/CWniJIMNhoVzEAI/review"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#fff", border: "1px solid #e6e6e6",
                padding: "10px 16px", textDecoration: "none",
                font: '700 12px/1 "Inter", sans-serif', color: "#262626",
                letterSpacing: "0.5px",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Leave us a Google Review
            </a>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e6e6e6", display: "flex", justifyContent: "space-between", font: '300 12px/1 "Inter", sans-serif', color: "#6b6b6b" }}>
        <span>{c.brand.yearFooter}</span>
        <span>{c.brand.city}</span>
      </div>
    </footer>);

}

window.MK = { TopNav, HeroDark, FleetGrid, FleetDetail, PickupBand, CTABand, LocationBand, Footer, Button: MkButton };