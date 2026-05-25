# TVR · Booking UI Kit

The customer booking flow. End-to-end: pick a trailer → choose dates → enter customer info → upload ID + insurance → e-sign rental agreement → pay deposit → confirmation.

## Screens (click-thru)

1. **Search / dates** — pick trailer + start & end dates, optional pickup-time note
2. **Customer info** — name, email, phone, tow vehicle
3. **Documents** — upload driver's license + insurance certificate
4. **Rental agreement** — read + sign (typed name + checkbox)
5. **Payment** — card details + deposit summary
6. **Confirmation** — reservation # + pickup details

The flow uses a sticky right-rail order summary on desktop. State persists across steps via simple local state.

## Components (in `components.jsx`)

- `BookingShell` — top bar with stepper + content + summary rail
- `Stepper` — 7-step horizontal progress with current/done/pending states
- `OrderSummary` — sticky rail showing trailer + dates + line items + total
- `Field`, `FieldRow`, `Select` — form primitives
- `UploadRow` — file upload with dashed border + status states
- `AgreementBlock` — agreement copy + signature input + checkbox
- `Confirmation` — success card with reservation #

Open `index.html` and click through. The "Continue" button at each step routes forward.
