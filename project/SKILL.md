---
name: tvr-design
description: Use this skill to generate well-branded interfaces and assets for TVR (Tennessee Valley Rentals), the Chattanooga, TN trailer rental service. Includes design tokens, fonts, real logo + fleet photography, and React UI kits for the marketing site and the booking flow (search → docs upload → e-sign → payment → confirmation). Use for production code OR throwaway prototypes / mocks.
user-invocable: true
---

# TVR · Design System Skill

This skill contains everything you need to make pixel-correct TVR interfaces. **Always start by reading `README.md`** — it carries the full content-fundamentals, visual-foundations, and iconography rules. Then explore the other files.

## Quick orientation

| Need this | Open this |
|---|---|
| Color tokens, type scale, spacing, radii | `colors_and_type.css` |
| Brand voice, casing, tone | `README.md` § Content Fundamentals |
| Surface rotation, animation, borders | `README.md` § Visual Foundations |
| Icon system + sizes | `README.md` § Iconography |
| Logos | `assets/tvr-logo-primary.png` (transparent: `assets/tvr-logo-primary-transparent.png`) · `assets/tvr-logo-mark.png` |
| Fleet photography | `assets/fleet/cargo-8x16.png`, `assets/fleet/hauler-8x20.png`, `assets/fleet/yard-tractor-hauler.png` |
| Marketing site components | `ui_kits/marketing/components.jsx` |
| Booking flow components | `ui_kits/booking/components.jsx` |

## Cardinal rules

1. **Navy is the only action color.** TVR Red is **accent only** — for the logo flag, vertical sashes on the left edge of feature bands, horizontal section dividers, and the inline rule before brand kicker labels. Never use red as a primary CTA fill.
2. **Light-only.** No dark hero bands, no dark CTA strips. Surface palette: `#ffffff` (canvas), `#fafafa` (card plate), `#f7f7f7` (footer). The original analysis specified a dark navy hero surface — **dropped**.
3. **0px corners.** Every button, card, input, chip, tile is rectangular. The only round shape is the circular monogram on a square plate, and icon-button hit-targets.
4. **700 / 300 type contrast.** Inter 700 for display + buttons + nav; Inter Light 300 for body. Weight 500 is absent. 400 lives only in caption + nav-link.
5. **No shadows, no gradients, no emoji.** Depth comes from color-block contrast and photography. Status uses dot indicators or icons.
6. **Voice: operator-grade.** Sentence case for headlines; UPPERCASE+1.5px-tracking for inline links and kicker labels only. No superlatives, no exclamations.
7. **Tennessee three-stars motif is brand-locked** — do not redraw, recolor, or reuse the stars outside the supplied logo.

## When invoked

If the user asks you to use this skill without other guidance:

1. Ask what they want to build (marketing page? a single booking screen? an email? a confirmation document? signage?). Ask for screens, scope, fidelity.
2. Ask any follow-ups: target viewport, must-have copy, real customer data vs placeholders.
3. Build static HTML artifacts in a sensible folder, copying any logo/fleet assets you need into the artifact's folder. Reference `colors_and_type.css` for tokens, OR inline-copy the CSS variables into a `<style>` block if the artifact must be standalone.
4. If working on production code, you can lift the React components directly from `ui_kits/<product>/components.jsx`.

Don't invent new components, new colors, or new spacing values — extend what's documented.

## Known substitutions

- **Inter** is a substitute for the brand's intended geometric display face. Swap to the licensed face when available; the 700/300 contrast is the non-negotiable part.
- **Lucide icons** (1.5px stroke, square caps, 24×24) are the substitute icon system. Swap to a custom icon set when available.
