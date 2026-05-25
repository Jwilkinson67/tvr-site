/* global React */
const { useState } = React;

/* ----------- Primitives ----------- */
function Button({ variant = "primary", children, onClick, ...rest }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 48, padding: "0 32px", border: 0,
    font: '700 14px/1 "Inter", system-ui, sans-serif',
    letterSpacing: "0.5px", cursor: "pointer",
    transition: "background-color 120ms ease-out, color 120ms ease-out, border-color 120ms ease-out",
    whiteSpace: "nowrap",
  };
  const variants = {
    primary:   { background: "#1568be", color: "#fff" },
    secondary: { background: "#fff", color: "#262626", border: "1px solid #cccccc" },
    onDark:    { background: "transparent", color: "#fff", border: "1px solid #fff" },
  };
  return <button style={{...base, ...variants[variant]}} onClick={onClick} {...rest}>{children}</button>;
}

function UpperLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", border: 0, padding: 0, cursor: "pointer",
      font: '700 13px/1.3 "Inter", system-ui, sans-serif',
      letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626",
    }}>{children} ›</button>
  );
}

/* ----------- Top nav ----------- */
function TopNav({ route, setRoute }) {
  const items = [
    { id: "cargo", label: "Enclosed Cargo 8.5 × 16" },
    { id: "hauler", label: "Car Hauler / Equipment 8.5 × 20" },
    { id: "booking", label: "Reserve" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 72, padding: "0 32px",
      background: "#fff", borderBottom: "1px solid #e6e6e6",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <a onClick={() => setRoute("home")} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <img src="../../assets/tvr-logo-primary.png" alt="TVR Tennessee Valley Rentals" style={{ height: 44, width: "auto" }}/>
        </a>
        <nav style={{ display: "flex", gap: 32 }}>
          {items.map(i => (
            <a key={i.id} onClick={() => setRoute(i.id)} style={{
              cursor: "pointer",
              font: '400 14px/1.4 "Inter", sans-serif',
              letterSpacing: "0.3px",
              color: route === i.id ? "#1568be" : "#262626",
              fontWeight: route === i.id ? 700 : 400,
            }}>{i.label}</a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ font: '400 12px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "0.5px" }}>(321) 765-3077</span>
        <Button onClick={() => setRoute("booking")}>Reserve</Button>
      </div>
    </header>
  );
}

/* ----------- Hero (light, soft-grey plate with red sash) ----------- */
function HeroDark({ setRoute }) {
  return (
    <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
      {/* Red 6px sash on the left edge */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }}/>
      <div style={{ padding: "80px 80px 80px 96px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 1, background: "#b5212b" }}/>
            TENNESSEE VALLEY RENTALS · CHATTANOOGA
          </div>
          <h1 style={{ font: '700 72px/1.05 "Inter", sans-serif', margin: 0, color: "#262626" }}>
            Your Cargo,<br/>Our Equipment.
          </h1>
          <p style={{ font: '300 18px/1.55 "Inter", sans-serif', color: "#3c3c3c", maxWidth: 480, marginTop: 24, marginBottom: 32 }}>
            Reserve online and we'll send the pickup details with your confirmation. No upsells, no fleet of forty — just two well-maintained trailers, hitched and ready.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Button onClick={() => setRoute("booking")}>Reserve</Button>
            <Button variant="secondary" onClick={() => setRoute("cargo")}>View fleet</Button>
          </div>
        </div>
        <div style={{ background: "#fff", padding: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src="../../assets/fleet/yard-tractor-hauler.png" alt="" style={{ width: "100%", height: "auto", display: "block" }}/>
        </div>
      </div>
    </section>
  );
}

/* ----------- Fleet card ----------- */
function FleetCard({ trailer, onSpecs, onReserve }) {
  return (
    <article style={{ background: "#fff", padding: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#f4f6f9", aspectRatio: "16 / 10", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src={trailer.photo} alt="" style={{ width: "85%", transform: trailer.id === "hauler" ? "scale(1.18)" : "none", transformOrigin: "center center" }}/>
      </div>
      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ font: '700 10px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b" }}>{trailer.kicker}</div>
        <h3 style={{ font: '700 24px/1.25 "Inter", sans-serif', margin: 0, color: "#262626" }}>{trailer.name}</h3>
        <p style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c", margin: 0, minHeight: 44 }}>{trailer.tagline}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px solid #e6e6e6" }}>
          <div>
            <div style={{ font: '700 18px/1 "Inter", sans-serif', color: "#262626" }}>{trailer.price}<span style={{ font: '300 14px/1 "Inter", sans-serif', color: "#6b6b6b" }}> / day</span></div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <UpperLink onClick={onSpecs}>View specs</UpperLink>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ----------- Fleet grid ----------- */
function FleetGrid({ setRoute }) {
  const fleet = [
    { id: "cargo", kicker: "Enclosed cargo", name: "Enclosed Cargo 8.5 × 16", tagline: "Dry, lockable, ideal for moves and freight up to 7,000 lb GVWR.", photo: "../../assets/fleet/cargo-8x16.png", price: "$125" },
    { id: "hauler", kicker: "Open car hauler", name: "Car Hauler / Equipment 8.5 × 20", tagline: "Open deck with loading ramp. Vehicles, ATVs, equipment up to 9,990 lb.", photo: "../../assets/fleet/hauler-8x20.png", price: "$110" },
  ];
  return (
    <section style={{ padding: "80px 80px", background: "#fff" }}>
      <header style={{ display: "flex", alignItems: "end", justifyContent: "space-between", marginBottom: 48 }}>
        <h2 style={{ font: '700 48px/1.1 "Inter", sans-serif', margin: 0, color: "#262626" }}>The fleet</h2>
        <UpperLink onClick={() => setRoute("booking")}>Reserve a trailer</UpperLink>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {fleet.map(t => <FleetCard key={t.id} trailer={t} onSpecs={() => setRoute(t.id)} onReserve={() => setRoute("booking")}/>)}
      </div>
    </section>
  );
}

/* ----------- Spec grid ----------- */
function SpecGrid({ specs }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${specs.length}, 1fr)`, borderTop: "1px solid #e6e6e6", borderBottom: "1px solid #e6e6e6" }}>
      {specs.map((s, i) => (
        <div key={i} style={{
          padding: "32px 24px", display: "flex", flexDirection: "column", gap: 8,
          borderRight: i < specs.length - 1 ? "1px solid #e6e6e6" : "0",
        }}>
          <div style={{ font: '700 32px/1.15 "Inter", sans-serif', color: "#262626" }}>{s.v}</div>
          <div style={{ font: '700 11px/1 "Inter", sans-serif', color: "#6b6b6b", letterSpacing: "1.5px", textTransform: "uppercase" }}>{s.u}</div>
        </div>
      ))}
    </div>
  );
}

/* ----------- Fleet detail page ----------- */
function FleetDetail({ trailerId, setRoute }) {
  const data = {
    cargo:  { name: "Enclosed Cargo 8.5 × 16", kicker: "Enclosed cargo trailer", price: "$125", weekly: "$425",
              tagline: "Dry, lockable, ramp-equipped. Built for moves and freight in any weather.",
              photo: "../../assets/fleet/cargo-8x16.png",
              specs: [
                { v: "8.5 × 16", u: "Dimensions (ft)" },
                { v: "7,000 lb", u: "GVWR" },
                { v: "Tandem", u: "Axle config" },
                { v: '6"6\'', u: "Interior height" },
              ] },
    hauler: { name: "Car Hauler / Equipment 8.5 × 20", kicker: "Open car hauler trailer", price: "$110", weekly: "$550",
              tagline: "Loading ramp, stake pockets, tie-down rails. Vehicles, ATVs, equipment up to 9,990 lb.",
              photo: "../../assets/fleet/hauler-8x20.png",
              specs: [
                { v: "8.5 × 20", u: "Dimensions (ft)" },
                { v: "9,990 lb", u: "GVWR" },
                { v: "Tandem", u: "Axle config" },
                { v: "82\"", u: "Deck width" },
              ] },
  }[trailerId];

  return (
    <article>
      <section style={{ position: "relative", background: "#f4f6f9", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: "#b5212b" }}/>
        <div style={{ padding: "80px 80px 80px 96px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 24, height: 1, background: "#b5212b" }}/>
              {data.kicker}
            </div>
            <h1 style={{ font: '700 64px/1.05 "Inter", sans-serif', margin: 0, color: "#262626" }}>{data.name}</h1>
            <p style={{ font: '300 18px/1.55 "Inter", sans-serif', color: "#3c3c3c", marginTop: 24, marginBottom: 32, maxWidth: 460 }}>{data.tagline}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <Button onClick={() => setRoute("booking")}>Reserve · {data.price}/day</Button>
              <Button variant="secondary" onClick={() => setRoute("home")}>Back to fleet</Button>
            </div>
          </div>
          <div style={{ background: "#fff", padding: 16 }}>
            <img src={data.photo} alt="" style={{ width: "100%", height: "auto", display: "block" }}/>
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 80px", background: "#fff" }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 24 }}>SPECIFICATIONS</div>
        <SpecGrid specs={data.specs}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48, marginTop: 80 }}>
          {[
            { t: "Daily rate", v: data.price + "/day", note: "24-hour rental period" },
            { t: "Weekly rate", v: data.weekly + "/wk", note: "7 consecutive days" },
            { t: "Deposit", v: "$200", note: "Refunded at return" },
          ].map((c, i) => (
            <div key={i} style={{ borderTop: "1px solid #1568be", paddingTop: 16 }}>
              <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b6b6b", marginBottom: 12 }}>{c.t}</div>
              <div style={{ font: '700 32px/1.15 "Inter", sans-serif', color: "#262626", marginBottom: 6 }}>{c.v}</div>
              <div style={{ font: '300 14px/1.55 "Inter", sans-serif', color: "#3c3c3c" }}>{c.note}</div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

/* ----------- (Location section intentionally removed — pickup is sent privately during booking) ----------- */

/* ----------- Rental Terms band (4 navy cards · replaces former PickupBand) ----------- */
function PickupBand() {
  const terms = [
    {
      title: "The Rental Period",
      body: "Each rental period starts when the customer signs the rental contract. The customer will be charged an additional fee for any extra time until the trailer is returned.",
    },
    {
      title: "Customer Liability",
      body: "The customer is responsible for the rental fee and all damage to the trailer. The contract signed at the time of rental details liability.",
    },
    {
      title: "Towing Vehicle Requirements",
      body: "The towing vehicle must be in good working condition with the correct trailer light wiring to match the trailer being rented. The customer must not exceed the towing limits specified in the towing vehicle's owner's manual.",
    },
    {
      title: "License / Insurance Requirement",
      body: "The customer must present a valid driver's license and proof of insurance coverage — including proof that the insurance covers whatever the vehicle is towing. Towing vehicle must have valid and up-to-date tags before renting.",
    },
  ];
  const Asterisk = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#b5212b" aria-hidden="true">
      <path d="M12 2 L13.6 9.3 L20.6 6.6 L15.9 12.4 L21.9 16.7 L14.5 17.1 L15.6 24 L12 18.7 L8.4 24 L9.5 17.1 L2.1 16.7 L8.1 12.4 L3.4 6.6 L10.4 9.3 Z"/>
    </svg>
  );
  return (
    <section style={{ padding: "80px 80px", background: "#fff" }}>
      <header style={{ marginBottom: 40 }}>
        <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "2px", textTransform: "uppercase", color: "#1568be", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 24, height: 1, background: "#b5212b" }}/>
          RENTAL TERMS
        </div>
        <h2 style={{ font: '700 48px/1.1 "Inter", sans-serif', margin: 0, color: "#262626" }}>The rules of the road.</h2>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {terms.map((t, i) => (
          <article key={i} style={{
            background: "#1568be", color: "#fff",
            padding: 32, borderRadius: 12,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <Asterisk/>
            <h3 style={{ font: '700 22px/1.3 "Inter", sans-serif', margin: 0, color: "#fff" }}>{t.title}</h3>
            <p style={{ font: '300 15px/1.6 "Inter", sans-serif', color: "#dcdfeb", margin: 0 }}>{t.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ----------- Pre-footer CTA (light, red sash) ----------- */
function CTABand({ setRoute }) {
  return (
    <section style={{ position: "relative", background: "#f4f6f9", padding: "80px 80px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 64, height: 4, background: "#b5212b" }}/>
      <h2 style={{ font: '700 36px/1.15 "Inter", sans-serif', margin: 0, color: "#262626", maxWidth: 760, marginInline: "auto" }}>
        Pick a date. Pick a trailer.<br/>We'll have it on the hitch when you pull in.
      </h2>
      <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
        <Button onClick={() => setRoute("booking")}>Reserve now</Button>
      </div>
    </section>
  );
}

/* ----------- Footer ----------- */
function Footer() {
  const cols = [
    { h: "Fleet", links: ["Enclosed Cargo 8.5 × 16", "Car Hauler / Equipment 8.5 × 20", "Compare"] },
    { h: "Booking", links: ["Reserve", "My reservation", "Cancellation policy"] },
    { h: "Legal", links: ["Rental agreement", "Insurance terms", "Privacy"] },
  ];
  return (
    <footer style={{ background: "#f6f7f9", padding: "64px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48 }}>
        <div>
          <img src="../../assets/tvr-logo-primary.png" alt="TVR" style={{ height: 48, marginBottom: 24 }}/>
          <p style={{ font: '300 13px/1.55 "Inter", sans-serif', color: "#6b6b6b", maxWidth: 320 }}>
            Tennessee Valley Rentals — a two-trailer operation based in Chattanooga, TN. Pickup details sent with your confirmation.
          </p>
          <div style={{ marginTop: 16, height: 2, width: 64, background: "#b5212b" }}/>
        </div>
        {cols.map(c => (
          <div key={c.h}>
            <div style={{ font: '700 11px/1 "Inter", sans-serif', letterSpacing: "1.5px", textTransform: "uppercase", color: "#262626", marginBottom: 16 }}>{c.h}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {c.links.map(l => <li key={l}><a style={{ font: '300 14px/1 "Inter", sans-serif', color: "#3c3c3c" }}>{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #e6e6e6", display: "flex", justifyContent: "space-between", font: '300 12px/1 "Inter", sans-serif', color: "#6b6b6b" }}>
        <span>© 2026 Tennessee Valley Rentals, LLC</span>
        <span>Chattanooga, TN</span>
      </div>
    </footer>
  );
}

/* ----------- Booking redirect (placeholder back to booking kit) ----------- */
function BookingHandoff({ setRoute }) {
  return (
    <section style={{ padding: "80px 80px", background: "#fff", textAlign: "center" }}>
      <h2 style={{ font: '700 32px/1.15 "Inter", sans-serif', color: "#262626", margin: 0 }}>Booking flow lives in the booking kit</h2>
      <p style={{ font: '300 16px/1.55 "Inter", sans-serif', color: "#3c3c3c", margin: "16px auto 32px", maxWidth: 480 }}>
        Open <code style={{ font: '700 13px/1 monospace', background: "#f6f7f9", padding: "4px 8px" }}>ui_kits/booking/index.html</code> to step through the search → docs → e-sign flow.
      </p>
      <Button onClick={() => setRoute("home")}>Back to home</Button>
    </section>
  );
}

window.MK = { TopNav, HeroDark, FleetGrid, FleetDetail, PickupBand, CTABand, Footer, BookingHandoff, Button };
