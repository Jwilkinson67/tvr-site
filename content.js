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
    photo:         "assets/fleet/hero 2 compressed.jpg", // fallback if no drop
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
      photo:     "assets/fleet/Spartan-enclosed-14ft.jpg.png",
      photoExtra: [
        "assets/fleet/Spartan-enclosed-back-14ft.jpg",
        "assets/fleet/Spartan-enclosed-14ft-3.jpg",
        "assets/fleet/Spartan-enclosed-14ft-4.jpg",
        "assets/fleet/Spartan-enclosed-14ft-5.jpg",
        "assets/fleet/Spartan-enclosed-14ft-6.jpg",
      ],
      photoScale: 1,        // visual zoom inside the card / summary plate
      daily:     110,
      weekly:    600,
      deposit:   100,
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
      subheading:"7ft x 20ft, holds up to 7,000lbs",
      tagline:   "Heavy-duty open-deck car hauler with loading ramps, perfect for vehicles, ATVs, equipment, and project hauls. Holds loads up to 7,000 lbs. Includes a toolbox with various straps, a 12K winch, and a roadside kit for a smoother, more prepared rental.",
      detailTagline: "Oversized Winch, Loading ramp, Car Straps Included. Vehicles, ATVs, equipment — loads up to 7,000 lb.",
      photo:     "assets/fleet/Liberty-car-hauler-20ft.jpg",
      photoExtra: [
        "assets/fleet/Liberty-car-hauler-front-20ft.jpg",
        "assets/fleet/Liberty-car-hauler-ramps-20ft.jpg",
        "assets/fleet/Liberty-car-hauler-winch-20ft.jpg",
        "assets/fleet/Liberty-car-hauler-straps-20ft.jpg",
      ],
      photoScale: 1,
      daily:     100,
      weekly:    550,
      deposit:   100,
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

  /* ---------- Marketing · How it works ---------- */
  howItWorks: {
    kicker:  "HOW IT WORKS",
    heading: "Simple from start to finish.",
    steps: [
      { title: "Book online",         body: "Pick your trailer and dates, fill out your info, and upload your license and insurance. Takes about 3 minutes." },
      { title: "We review & approve", body: "We verify your documents and approve your booking within 1–2 hours. You'll get a confirmation email with pickup details." },
      { title: "Pick up your trailer",body: "Come to our Ooltewah location, sign the rental contract, and you're on your way." },
      { title: "Return when done",    body: "Drop off the trailer when you're finished. No hassle, no upsells." },
    ],
  },

  /* ---------- Marketing · FAQ ---------- */
  faq: {
    kicker:  "FAQ",
    heading: "Common questions.",
    items: [
      { q: "What do I need to rent a trailer?",
        a:  "A valid driver's license, proof of insurance covering your tow vehicle, and a vehicle capable of towing. We verify everything before approving your booking." },
      { q: "What size hitch ball do I need?",
        a:  "Both trailers require a 2 5/16\" hitch ball. You'll also need a 7-way trailer plug and a brake controller on your tow vehicle." },
      { q: "Where do I pick up the trailer?",
        a:  "Pickup is in Ooltewah, TN. The exact address is sent with your confirmation email once your booking is approved." },
      { q: "How far in advance do I need to book?",
        a:  "Same-day bookings are available — we typically approve requests within 1–2 hours. Reserve online anytime." },
      { q: "What if I need the trailer longer than planned?",
        a:  "Call or text us at (321) 765-3077. Additional days are charged at the daily rate." },
      { q: "Do you deliver?",
        a:  "Yes, delivery is available in the Chattanooga area for an additional fee. Contact us to arrange." },
    ],
  },

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
    blurb: "Tennessee Valley Rentals LLC — trailer rental operation based in Chattanooga, TN. Serving Chattanooga, Ooltewah, Cleveland, and surrounding areas. Pickup details sent with your confirmation.",
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

  /* ---------- Reviews ---------- */
  reviews: [
    {
      name: "Aaron N.",
      date: "June 5, 2026",
      stars: 5,
      text: "Professional good communication very nice trailer all the right equipment. Would rent many times from this company.",
      photo: "assets/aaron-n.jpg",
    },
    {
      name: "Ben and Tara Wolfe",
      date: "June 11, 2026",
      stars: 5,
      text: "Great communication and easy booking system. I prefer to support small businesses. I had a great experience and will definitely rent from them again.",
      photo: null,
    },
    {
      name: "Markie Dilbeck",
      date: "June 11, 2026",
      stars: 5,
      text: "I rented the cargo trailer for a move. They delivered the trailer to me and picked it back up when I was done. Having the straps and dolly included was a huge help. The trailer was clean. I'd definitely rent from them again!",
      photo: "assets/Markie.jpg.jpg",
    },
  ],
  googleReviewUrl: "https://g.page/r/CWniJIMNhoVzEAI/review",

};
