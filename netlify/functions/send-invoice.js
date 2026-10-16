/**
 * TVR Manual Invoice / Payment Request — Netlify Function
 *
 * POST body actions:
 *   { action: "create-link", customerName, customerEmail, customerPhone,
 *              trailerName, pickup, dropoff, days,
 *              rentalAmount, depositAmount }
 *     → Creates a Stripe Checkout Session and returns { url, sessionId }
 *
 *   { action: "confirm", sessionId }
 *     → Retrieves completed session, saves booking to Supabase, returns booking
 *
 * Auth: x-admin-secret required for create-link. confirm is public (called
 * from success page) but validates session status server-side.
 *
 * Required env vars (shared with book.js):
 *   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
 *   RESEND_API_KEY, OWNER_EMAIL, BOOKING_SECRET, SITE_URL,
 *   RESEND_FROM_EMAIL (optional)
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-admin-secret",
  "Content-Type": "application/json",
};

function ok(body)         { return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) }; }
function err(status, msg) { return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }

function makeToken(action, id) {
  const secret = process.env.BOOKING_SECRET || "dev-secret";
  return crypto.createHmac("sha256", secret).update(`${action}:${id}`).digest("hex");
}

async function sendEmail({ to, subject, html }) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: `Tennessee Valley Rentals LLC <${from}>`, to, subject, html }),
  });
  if (!res.ok) throw new Error(await res.text());
}

function ownerNotifyEmail(booking) {
  const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
  const fnBase  = `${siteUrl}/.netlify/functions/approve`;
  const approveUrl = `${fnBase}?action=approve&id=${booking.id}&token=${makeToken("approve", booking.id)}`;
  const declineUrl = `${fnBase}?action=decline&id=${booking.id}&token=${makeToken("decline", booking.id)}`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Manual Booking Paid ✓</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Tennessee Valley Rentals LLC</div>
  </div>
  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Booking Details</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:160px;">Booking ID</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:monospace;color:#1568be;">${booking.id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Customer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.customer_name} · <a href="mailto:${booking.customer_email}" style="color:#1568be;">${booking.customer_email}</a></td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Phone</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.customer_phone || "—"}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Dates</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup} → ${booking.dropoff}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Rental</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">$${(+booking.rental_amount).toFixed(2)}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Deposit</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">$${(+booking.deposit_amount).toFixed(2)}</td></tr>
      <tr style="background:#f4f6f9;"><td style="padding:12px 14px;font-weight:700;font-size:15px;">Total Charged</td><td style="padding:12px 14px;font-weight:700;font-size:15px;color:#1568be;">$${(+booking.total_charged).toFixed(2)}</td></tr>
    </table>
    <div style="display:flex;gap:12px;">
      <a href="${approveUrl}" style="flex:1;display:block;background:#155a30;color:#fff;padding:14px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;">Approve Booking →</a>
      <a href="${declineUrl}" style="flex:1;display:block;background:#b5212b;color:#fff;padding:14px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;">Decline</a>
    </div>
  </div>
</div></body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS, body: "" };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return err(400, "Invalid JSON body.");
  }

  // ── create payment link ───────────────────────────────────────────────────
  if (body.action === "create-link") {
    const secret = (event.headers["x-admin-secret"] || "").trim();
    if (!secret || secret !== (process.env.BOOKING_SECRET || "dev-secret")) {
      return err(401, "Unauthorized.");
    }

    const { customerName, customerEmail, customerPhone, trailerName, pickup, dropoff, days, rentalAmount, depositAmount } = body;
    if (!customerName || !customerEmail || !trailerName || !pickup || !dropoff || !rentalAmount || !depositAmount) {
      return err(400, "customerName, customerEmail, trailerName, pickup, dropoff, rentalAmount, and depositAmount are required.");
    }

    const rental  = Math.round(parseFloat(rentalAmount) * 100);
    const deposit = Math.round(parseFloat(depositAmount) * 100);
    if (rental <= 0 || deposit <= 0) return err(400, "Amounts must be greater than $0.");

    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${trailerName} Rental`, description: `${pickup} → ${dropoff} (${days || "?"} day${days === 1 ? "" : "s"})` },
            unit_amount: rental,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Refundable Deposit", description: "Returned after inspection" },
            unit_amount: deposit,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: "off_session",
        description: `TVR manual booking — ${trailerName} — ${pickup}`,
        receipt_email: customerEmail,
      },
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || "",
        trailer_name: trailerName,
        pickup,
        dropoff,
        days: String(days || ""),
        rental_amount: String(rentalAmount),
        deposit_amount: String(depositAmount),
      },
      success_url: `${siteUrl}/booking-pay-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/`,
    });

    return ok({ url: session.url, sessionId: session.id });
  }

  // ── confirm payment and create booking ────────────────────────────────────
  if (body.action === "confirm") {
    const { sessionId } = body;
    if (!sessionId) return err(400, "sessionId is required.");

    // Check if already confirmed
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (existing) return ok({ alreadyConfirmed: true, bookingId: existing.id });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent.payment_method"],
      });
    } catch (e) {
      return err(400, "Invalid session ID.");
    }

    if (session.payment_status !== "paid") {
      return err(402, "Payment not completed.");
    }

    const meta = session.metadata || {};
    const pi   = session.payment_intent;
    const pm   = pi?.payment_method;

    // Resolve stripe_customer_id and stripe_payment_method_id
    const stripeCustomerId = session.customer || "";
    let stripePaymentMethodId = typeof pm === "string" ? pm : (pm?.id || "");

    // If payment method isn't on the PI, look it up from the customer
    if (stripeCustomerId && !stripePaymentMethodId) {
      try {
        const methods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: "card", limit: 1 });
        if (methods.data.length) stripePaymentMethodId = methods.data[0].id;
      } catch (_) {}
    }

    const bookingId = "TVR-" + Date.now().toString(36).toUpperCase();
    const bookingRow = {
      id: bookingId,
      session_id: sessionId,
      trailer_id: meta.trailer_name?.toLowerCase().replace(/\s+/g, "-") || "manual",
      trailer_name: meta.trailer_name || "Manual Booking",
      pickup:   meta.pickup || "",
      dropoff:  meta.dropoff || "",
      days:     meta.days ? parseInt(meta.days) : null,
      status:   "pending",
      customer_name:  meta.customer_name || "",
      customer_email: meta.customer_email || "",
      customer_phone: meta.customer_phone || "",
      rental_amount:  parseFloat(meta.rental_amount || 0),
      tax_amount:     0,
      deposit_amount: parseFloat(meta.deposit_amount || 0),
      total_charged:  (session.amount_total || 0) / 100,
      payment_intent_id:        pi?.id || "",
      stripe_customer_id:       stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
    };

    const { error: insertErr } = await supabase.from("bookings").insert(bookingRow);
    if (insertErr) {
      console.error("Manual booking save failed:", insertErr);
      return err(500, "Payment received but booking record failed to save. Contact support.");
    }

    try {
      await sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: `Manual booking paid — ${meta.trailer_name} — ${meta.pickup}`,
        html: ownerNotifyEmail(bookingRow),
      });
    } catch (e) {
      console.error("Owner email failed:", e);
    }

    return ok({ success: true, bookingId });
  }

  return err(400, `Unknown action: ${body.action}`);
};
