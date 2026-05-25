/* ============================================================
   TVR CONTENT — EDIT EVERYTHING HERE
   ============================================================

   This file is the single source of truth for the prototype.
   Edit text in quotes; add a trailer by adding an entry to fleet[].

   Photos can ALSO be replaced visually: just drag-and-drop a new
   image onto any photo placeholder in the running prototype.
   The drop persists across reloads (stored locally per slot id).

   ============================================================ */

window.TVR_CONTENT = {

  /* ---------- Brand ---------- */
  brand: {
    phone:    "(321) 765-3077",
    email:    "info@rentwithtvr.com",
    city:     "Chattanooga, TN",
    yearFooter: "© 2026 Tennessee Valley Rentals, LLC",
  },

  /* ---------- Marketing · top nav ----------
     Items beyond fleet entries (which are auto-added). */
  nav: {
    reserveLabel: "Reserve",
  },

  /* ---------- Marketing · hero ---------- */
  hero: {
    kicker:        "TENNESSEE VALLEY RENTALS · CHATTANOOGA",
    titleLine1:    "Your Cargo,",
    titleLine2:    "Our Equipment.",
    body:          "Reserve online and pick up today. Support local with simple trailer rentals, no upsells or hassle.",
    primaryCta:    "Book Today",
    secondaryCta:  "View fleet",
    photo:         "assets/fleet/yard-tractor-hauler.png", // fallback if no drop
  },

  /* ---------- Marketing · fleet section heading ---------- */
  fleetSection: {
    heading: "The fleet",
    link:    "Reserve a trailer",
  },

  /* ============================================================
     FLEET — add a new trailer by appending a new object below.
     All marketing pages, the booking step, the nav and the order
     summary read from this array.
     ============================================================ */
  fleet: [
    {
      id:        "cargo",
      kicker:    "Spartan",
      name:      "Enclosed Cargo 7 × 14",
      navLabel:  "Enclosed Cargo 14ft",
      subheading:"7ft x 14ft, 6000lbs",
      tagline:   "Secure, weather-protected enclosed trailer perfect for moving, storage, and keeping your items protected. Includes straps, a dolly, and an adjustable hitch for an easy pickup-and-go rental.",
      detailTagline: "Dry, lockable, ramp-equipped. Built for moves and freight in any weather.",
      photo:     "assets/fleet/cargo-8x16.png",
      photoScale: 1,        // visual zoom inside the card / summary plate
      daily:     120,
      weekly:    600,
      deposit:   200,
      kickerLong:"Spartan",
      kickerBooking: "Spartan · 6,000 lb GVWR",
      specs: [
        { v: "7 × 14",  u: "Dimensions (ft)" },
        { v: "6,000 lb",  u: "GVWR" },
        { v: "Tandem",    u: "Axle config" },
        { v: '6\'6"',     u: "Interior height" },
      ],
    },
    {
      id:        "hauler",
      kicker:    "Liberty",
      name:      "Car Hauler / Equipment 7 × 20",
      navLabel:  "Car Hauler / Equipment 20ft",
      subheading:"7ft x 20ft, 9000lbs",
      tagline:   "Heavy-duty open-deck car hauler with loading ramps, perfect for vehicles, ATVs, equipment, and project hauls. Includes a toolbox with various straps, a 12K winch, and a roadside kit for a smoother, more prepared rental.",
      detailTagline: "Oversized Winch, Loading ramp, Car Straps Included. Vehicles, ATVs, equipment up to 9,000 lb.",
      photo:     "assets/fleet/hauler-8x20.png",
      photoScale: 1,
      daily:     100,
      weekly:    500,
      deposit:   150,
      kickerLong:"Liberty",
      kickerBooking: "Liberty · 9,000 lb GVWR",
      specs: [
        { v: "7 × 20", u: "Dimensions (ft)" },
        { v: "9,000 lb", u: "GVWR" },
        { v: "Tandem",   u: "Axle config" },
        { v: '82"',      u: "Deck width" },
      ],
    },

    /* ---- HOW TO ADD A NEW TRAILER ----
       Copy the block above, change every field, give it a unique `id`,
       and the prototype picks it up everywhere — nav, fleet grid,
       detail page, booking dropdown, order summary.

       For the photo: either set `photo` to a file in assets/fleet/,
       OR leave the existing path and just drag-and-drop your photo
       onto the placeholder in the running page. ------------------ */
  ],

  /* ---------- Marketing · rental terms band ---------- */
  termsBand: {
    kicker:  "RENTAL TERMS",
    heading: "The rules of the road.",
    items: [
      { title: "The Rental Period",
        body:  "Each rental period starts when the customer signs the rental contract. The customer will be charged an additional fee for any extra time until the trailer is returned." },
      { title: "Customer Liability",
        body:  "The customer is responsible for the rental fee and all damage to the trailer. The contract signed at the time of rental details liability." },
      { title: "Towing Vehicle Requirements",
        body:  "The towing vehicle must be in good working condition with the correct trailer light wiring to match the trailer being rented. The customer must not exceed the towing limits specified in the towing vehicle's owner's manual." },
      { title: "License / Insurance Requirement",
        body:  "The customer must present a valid driver's license and proof of insurance coverage — including proof that the insurance covers whatever the vehicle is towing. Towing vehicle must have valid and up-to-date tags before renting." },
    ],
  },

  /* ---------- Marketing · pre-footer CTA ---------- */
  ctaBand: {
    line1: "Pick a date. Pick a trailer.",
    line2: "We'll have it ready.",
    cta:   "Reserve now",
  },

  /* ---------- Marketing · footer ---------- */
  footer: {
    blurb: "Tennessee Valley Rentals — trailer rental operation based in Chattanooga, TN. Pickup details sent with your confirmation.",
    columns: [],
  },

  /* ---------- Booking · misc copy ---------- */
  booking: {
    backToSite:   "Back to TVR.com",
    secureNote:   "Secure booking · est. 3 min",
    headerLabel:  "Booking",
    helpPrefix:   "Need help?",
    taxRate:      0.0925,
  },
};
