/**
 * TVR Extra Charge API — Netlify Function
 *
 * POST body actions:
 *   { action: "list" }                                          → recent bookings
 *   { action: "charge", bookingId, amountDollars, reason }      → off-session charge
 *
 * Auth: x-admin-secret header must match BOOKING_SECRET env var.
 *
 * Required env vars (shared with book.js / approve.js):
 *   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY,
 *   RESEND_API_KEY, OWNER_EMAIL, BOOKING_SECRET,
 *   RESEND_FROM_EMAIL (optional)
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

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

function customerChargeEmail(booking, amountDollars, reason, paymentIntentId) {
  const firstName = (booking.customer_name || "").split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:620px;margin:0 auto;background:#fff;">

  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Tennessee Valley Rentals LLC</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Additional Charge — Payment Receipt</div>
  </div>

  <div style="background:#f4f6f9;border-left:6px solid #b5212b;padding:28px 32px;">
    <div style="font-size:22px;font-weight:700;color:#262626;">Hi ${firstName},</div>
    <div style="font-size:15px;color:#3c3c3c;margin-top:8px;">An additional charge has been applied to your card on file for your TVR trailer rental. See details below.</div>
  </div>

  <div style="padding:32px;">

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Charge Details</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:160px;">Booking ID</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:monospace;color:#1568be;">${booking.id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Rental period</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup} → ${booking.dropoff}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Reason</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${reason}</td></tr>
      <tr style="background:#f4f6f9;"><td style="padding:12px 14px;font-weight:700;font-size:16px;">Amount Charged</td><td style="padding:12px 14px;font-weight:700;font-size:16px;color:#b5212b;">$${(+amountDollars).toFixed(2)}</td></tr>
    </table>

    <div style="background:#f4f6f9;padding:20px;margin-bottom:8px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Questions about this charge?</div>
      <div style="font-size:16px;font-weight:700;color:#262626;">Call or text (321) 765-3077</div>
      <div style="font-size:13px;color:#6b6b6b;margin-top:4px;">info@rentwithtvr.com</div>
    </div>

  </div>

  <div style="background:#f6f7f9;padding:20px 32px;border-top:1px solid #e6e6e6;">
    <div style="font-size:12px;color:#6b6b6b;line-height:1.6;">
      Tennessee Valley Rentals LLC · Ooltewah, TN · (321) 765-3077<br>
      Stripe ref: ${paymentIntentId}
    </div>
  </div>

</div>
</body>
</html>`;
}

function ownerChargeEmail(booking, amountDollars, reason, paymentIntentId) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Extra Charge Processed ✓</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Tennessee Valley Rentals LLC</div>
  </div>

  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Charge Summary</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:160px;">Booking ID</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:monospace;">${booking.id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Customer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.customer_name} · <a href="mailto:${booking.customer_email}" style="color:#1568be;">${booking.customer_email}</a></td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Reason</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${reason}</td></tr>
      <tr style="background:#f4f6f9;"><td style="padding:12px 14px;font-weight:700;font-size:15px;">Amount Charged</td><td style="padding:12px 14px;font-weight:700;font-size:15px;color:#1568be;">$${(+amountDollars).toFixed(2)}</td></tr>
    </table>
    <p style="color:#9a9a9a;font-size:12px;margin-top:24px;">Stripe Payment Intent: <span style="font-family:monospace;">${paymentIntentId}</span></p>
  </div>

</div>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS, body: "" };

  // Admin auth
  const secret = (event.headers["x-admin-secret"] || "").trim();
  if (!secret || secret !== (process.env.BOOKING_SECRET || "dev-secret")) {
    return err(401, "Unauthorized.");
  }

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return err(400, "Invalid JSON body.");
  }

  // ── list recent bookings ──────────────────────────────────────────────────
  if (body.action === "list") {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, trailer_name, customer_name, customer_email, customer_phone, pickup, dropoff, total_charged, status, stripe_customer_id, stripe_payment_method_id")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) { console.error("Supabase list error:", error); return err(500, "Could not load bookings."); }
    return ok({ bookings: data || [] });
  }

  // ── charge extra ──────────────────────────────────────────────────────────
  if (body.action === "charge") {
    const { bookingId, amountDollars, reason } = body;
    if (!bookingId || !amountDollars || !reason) {
      return err(400, "bookingId, amountDollars, and reason are required.");
    }
    const amount = parseFloat(amountDollars);
    if (isNaN(amount) || amount <= 0 || amount > 10000) {
      return err(400, "Amount must be between $0.01 and $10,000.");
    }

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (lookupErr || !booking) return err(404, "Booking not found.");
    if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) {
      return err(400, "No saved payment method for this booking. Coupon bookings cannot be charged this way.");
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        customer: booking.stripe_customer_id,
        payment_method: booking.stripe_payment_method_id,
        payment_method_types: ["card"],
        off_session: true,
        confirm: true,
        description: `TVR extra charge — ${bookingId} — ${reason}`,
        receipt_email: booking.customer_email,
        metadata: { booking_id: bookingId, reason },
      });
    } catch (stripeErr) {
      console.error("Stripe extra charge error:", stripeErr);
      if (stripeErr.code === "authentication_required") {
        return err(402, "Card requires additional authentication. Contact the customer to collect payment another way.");
      }
      return err(402, stripeErr.message || "Card was declined.");
    }

    try {
      await Promise.all([
        sendEmail({
          to: booking.customer_email,
          subject: `Additional charge — TVR rental ${bookingId}`,
          html: customerChargeEmail(booking, amount, reason, paymentIntent.id),
        }),
        sendEmail({
          to: process.env.OWNER_EMAIL,
          subject: `Extra charge processed — ${booking.customer_name} — $${amount.toFixed(2)}`,
          html: ownerChargeEmail(booking, amount, reason, paymentIntent.id),
        }),
      ]);
    } catch (emailErr) {
      console.error("Email failed after successful charge:", emailErr);
    }

    return ok({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount,
      customer: booking.customer_name,
      email: booking.customer_email,
    });
  }

  return err(400, `Unknown action: ${body.action}`);
};
