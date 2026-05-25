# TVR · Marketing UI Kit

The customer-facing marketing site. The visitor learns there are two trailers, sees specs, and is funneled into the booking app.

## Screens

1. **Home** — dark navy hero band, fleet 2-up grid, location strip, pre-footer CTA, footer.
2. **Fleet detail** — full spec page for one trailer (cargo or hauler).
3. **Location** — Chattanooga yard hours + map placeholder.

## Components (in `components.jsx`)

- `TopNav` — sticky 64px white nav with wordmark + menu + reserve CTA
- `HeroDark` — dark navy hero band; full-bleed trailer + headline + CTAs
- `FleetCard` — model card with photo plate + title + tag + "VIEW SPECS ›"
- `SpecGrid` — 4-up hairline-divided spec row
- `FeatureBand` — light feature card with photo + headline
- `CTABand` — dark pre-footer CTA strip
- `Footer` — soft-grey 4-column footer
- `Button` — primary / secondary / on-dark variants

Open `index.html`. The TopNav links route between Home / Fleet / Location.
