# TVR Design System

**Tennessee Valley Rentals** — a Chattanooga, TN trailer rental service. Customers reserve a trailer online, upload ID + insurance, sign the rental agreement, and pay — all from one booking flow.

The two-vehicle fleet:

- **Enclosed Cargo 8.5×16** — enclosed cargo trailer (moving, deliveries, dry storage in transit) · $125/day
- **Car Hauler / Equipment 8.5×20** — open car hauler trailer (vehicle transport, ATVs, equipment) · $110/day

The design system carries a **measured, corporate-utility tone**: engineered surfaces, rectangular geometry, deep navy framing, and a single high-saturation blue for every primary CTA. It is intentionally restrained — this is a *dealership/operator* dialect, not a consumer-leisure one. The customer is renting industrial equipment; the interface should feel like the equipment.

The visual DNA is adapted from a corporate-automotive analysis (engineered precision, 0px corner radii, heavy display weight against thin body, dark hero bands over light canvas). Brand-specific motorsport elements (e.g. tri-color motorsport stripes) are intentionally **excluded** — TVR is a working trailer yard, not a racetrack.

## Sources & Inputs

- **Brand brief** (provided in chat): two-trailer fleet, Chattanooga TN, booking + payments + ID/insurance upload + e-sign rental agreement.
- **Logo + fleet photos** (uploaded by user in iteration 1): the primary TVR logo (italic blue wordmark + red Tennessee three-stars flag + "TRAILER RENTALS" lockup), a square monogram crop, and product photography of the cargo and hauler trailers + a yard shot of an F-150 towing the hauler with a tractor loaded.
- **Design vocabulary**: corporate-automotive (engineered precision, 0px corner radii, heavy display weight against thin body, dark hero bands over light canvas). The original written analysis specified a cobalt blue (#1C69D4); **this was overridden** by the brand's actual navy + red palette once the logo was uploaded.
- No codebase, Figma, or live URL was attached.

## Index

| File / Folder | Purpose |
|---|---|
| `README.md` | This file — context, content + visual + iconography fundamentals |
| `SKILL.md` | Cross-compatible skill manifest for Claude Code |
| `colors_and_type.css` | All design tokens — colors, type scale, spacing, radii. Import this anywhere. |
| `fonts/` | Font files (Inter — substitute for the licensed corporate-automotive face) |
| `assets/` | Logos, marks, fleet-photo placeholders, icon references |
| `preview/` | Design System preview cards (rendered in the Design System tab) |
| `ui_kits/marketing/` | Marketing site UI kit (home, fleet, location) |
| `ui_kits/booking/` | Booking-app UI kit (search → checkout → uploads → e-sign) |

## Content Fundamentals

**Voice.** Direct, plainspoken, operator-grade. TVR is not a lifestyle brand — it is a working yard with two trailers. Copy reads like the front-desk attendant: factual, helpful, no hype.

- ✅ "Reserve the 8.5×20. We'll have it on the hitch when you pull in."
- ❌ "Unlock the freedom of the open road with America's premier hauling experience™."

**Pronouns.** "You" for the customer; "we" / "TVR" for the company. Never "us" in CTAs ("Reserve" not "Reserve with us"). First person plural is reserved for human-touch moments (the FAQ, the agreement language).

**Casing.**
- **Sentence case** for headlines, sub-heads, paragraphs, and field labels: *"Pick your trailer"*, *"Driver's license"*.
- **UPPERCASE + 1.5px tracking** for inline secondary links and category tabs only: *"VIEW SPECS ›"*, *"FLEET"*, *"BOOKING"*. This is the editorial signature — used sparingly.
- **Title Case** is avoided. It reads marketing-y; the brand voice is operator-grade.

**Numerals.** Trailer dimensions are written as `8.5×16` and `8.5×20` (multiplication sign U+00D7, no spaces). Prices are `$85/day`, never "Eighty-five dollars per day." Dates are `Apr 18, 2026`. Times are `3:00 PM`.

**Emoji.** Never. Not in copy, not in UI labels, not in confirmation emails. Status uses dot indicators (●) or icons from the icon set instead.

**Vibe.** Reads like a small Tennessee equipment yard that takes deposits seriously. Confident, brief, no exclamation points, no superlatives. The product *is* the equipment; the copy gets out of the way.

**Specific examples**
- Hero: "Two trailers. One yard. Reserve online, pick up in Chattanooga."
- CTA: "Reserve" / "Continue" / "Pay deposit"
- Empty state: "No reservations yet. Pick a trailer to get started."
- Error: "We couldn't read that file. Try a clearer photo of the ID."
- Confirmation: "Reservation #4218 confirmed. Pickup Apr 18, 9:00 AM."

## Visual Foundations

**Surface rotation.** Light system only. The page rhythm is: **white canvas (#ffffff) → soft card plate (#fafafa) → white → light feature band → red-sash divider → soft footer (#f7f7f7).** Never two consecutive bands of the same surface mode. Depth comes from this rotation + the red accent sash, not from dark backgrounds and not from shadow.

**Color.** **TVR Navy** (`--tvr-navy` / #1F3A82) is the action color — every primary CTA, every brand kicker label, the active state on nav. **TVR Red** (`--tvr-red` / #D02020) is the secondary accent: it appears in the logo flag (the three-stars motif), as a 6px vertical sash on the left edge of feature bands, as a 4px horizontal divider between page sections, and as a 24px inline rule before brand kicker labels. Red is **never the primary CTA fill** — reserved for accent only. Greys are warm-neutral. Semantic colors (success/warning/error) are restricted to system feedback — they never decorate. The dark-navy surface (#1A2129) from the original analysis is **not used** in this system.

**Type.** A two-cut system: **Inter 700** for display + buttons + nav, **Inter 300** for body + descriptive copy. Weight 500 is **absent**. Weight 400 only appears in caption and nav-link contexts. The heavy/light contrast is the editorial signature.

**Spacing.** 8px base unit. Section rhythm is **80px** padding for every major editorial band — tighter than the marketing default of 96–120px. Card internal padding is **24px**. Form field height is 48px.

**Backgrounds.** No gradients. No patterns. No illustrations. Backgrounds are **solid light blocks** — white (#ffffff), card soft (#fafafa), or footer soft (#f7f7f7). The marketing hero carries large fleet photography on a soft-grey plate. Photography is shot on neutral / overcast / warm-tungsten — never blue-cast, never high-saturation.

**Animation.** Restrained. State changes are 120ms `ease-out` for opacity/background, 200ms for layout shifts. **No bounces, no springs, no parallax.** Hover on a primary button: background shifts to `--tvr-blue-active` (#14266b). Hover on a card: nothing — the cursor change is the only affordance, optionally a thin underline appears under the title. Press: 80ms darken, no scale.

**Borders.** 1px hairline (`#e6e6e6`) for the default; 1px hairline-strong (`#cccccc`) for emphasized boundaries (input outline on rest); 2px solid `--tvr-navy` for the selected configurator tile. Never dashed, never dotted.

**Shadows.** **None.** The system has no shadow scale. Depth comes from color-block contrast and photographic subject.

**Capsules vs. protection gradients.** Neither. Buttons and chips sit on flat surface; there are no scrim gradients behind text-over-photo. When text sits on a hero photo, the photo is composed dark enough at the type's location that no scrim is needed — or a solid color-block band carries the text.

**Transparency / blur.** Avoided. No backdrop-filter, no frosted glass. The sticky top nav is fully opaque white.

**Layout fixed elements.** Top nav (64px, sticky, opaque white). Inside the booking flow: a fixed bottom price summary on mobile, a sticky right-rail order summary on desktop. No floating chat bubble. No cookie banner persists after dismiss.

**Imagery vibe.** Warm, slightly desaturated, overcast-Tennessee light. Trailer photos shot 3/4 angle, full silhouette, on neutral concrete or grass. Aluminum bodies render bright but not chrome-blown. No grain effect, no duotone, no lifestyle staging with humans posing.

**Corner radii.** Binary scale: **0px for everything**, 9999px (circular) only for icon buttons and avatar marks. There is no 4px / 8px / 12px middle ground in production use; those tokens exist in `colors_and_type.css` only for edge cases (a single mobile-collapse card, a rare modal corner).

**Card recipe.** White (`#ffffff`) background, 0px radius, 24px padding, no border, no shadow. The photo plate inside is `#fafafa` (soft grey) and runs edge-to-edge to the card edges. Title sits below in Inter 700 18px; tagline in Inter 300 14px; inline link "VIEW SPECS ›" in UPPERCASE 13px.

## Iconography

**System.** **Lucide** (`https://unpkg.com/lucide@latest/dist/umd/lucide.js` — CDN-loaded). Stroke-based, 1.5px stroke weight, 24×24 default canvas, square line caps. The stroke weight aligns with the rectangular geometry — it reads as *technical drawing*, not friendly-rounded.

This is a **substitution** — no proprietary icon set was provided. Lucide was chosen for: (1) stroke style that pairs with engineered/utility branding, (2) coverage of every icon TVR needs (trailer, hitch, calendar, upload, signature, dollar, map-pin), (3) CDN availability with no license cost. **Flag to user:** swap in a custom icon set if/when one becomes available.

**Sizes.** 16px (inline with body text), 20px (in buttons and inputs), 24px (in nav and cards), 32px (in empty states and section heads). All on 4px grid.

**Color.** Icons inherit `currentColor`. They render `--tvr-ink` (#262626) on light, `--tvr-on-dark` (#ffffff) on dark. Active state shifts to `--tvr-blue`. Disabled to `--tvr-muted-soft`.

**Emoji.** **Never.** Not in UI, not in copy, not in confirmation emails. Use a Lucide icon or a unicode bullet (●, ›, →).

**Unicode characters.** A small set is allowed:
- `×` (U+00D7) in dimensions: *8.5×16*
- `›` (U+203A) at the end of inline links: *VIEW SPECS ›*
- `●` (U+25CF) as a status dot
- `→` (U+2192) in directional cues (rare)

**Logos & marks.** The primary lockup is `assets/tvr-logo-primary.png` — italic navy "TVR" wordmark with the red Tennessee three-stars flag and "TRAILER RENTALS" subtitle. Pair with `assets/tvr-logo-primary-transparent.png` on the dark navy hero band (background removed). The square monogram crop is `assets/tvr-logo-mark.png` (and `tvr-logo-mark-transparent.png`) — used as the favicon, app icon, and avatar. The original generated SVG placeholders (`tvr-wordmark.svg`, `tvr-mark.svg`) are retained for fallback only — prefer the real PNGs.

**Tennessee three-stars motif.** The three white stars in the red flag are the [Tennessee state flag](https://en.wikipedia.org/wiki/Flag_of_Tennessee) symbol: the three grand divisions (East, Middle, West). Treat this as a **brand-locked motif** — do not recolor, redraw, or reuse the stars outside the logo without explicit permission.

**Fleet photography.** `assets/fleet/cargo-8x16.png` (black enclosed cargo trailer, 3/4 angle, white background), `assets/fleet/hauler-8x20.png` (open car hauler, 3/4 angle, white background), and `assets/fleet/yard-tractor-hauler.png` (lifestyle shot — F-150 towing the hauler with a tractor loaded, sky background). The white-background studio shots are ideal for the model-card photo plate (#fafafa); the yard shot is the lead hero image.

---

*Built from a written design analysis without a live codebase, Figma, or photography. Iterate from here.*
