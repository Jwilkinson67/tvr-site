/**
 * TVR Charge — Netlify Function
 * Charges a customer's saved card for additional fees (extra days, damages, etc.)
 *
 * GET  /.netlify/functions/charge?id=TVR-XXX&token=abc  → show charge form
 * POST /.netlify/functions/charge                        → process charge
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function makeToken(action, bookingId) {
  return crypto
    .createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${bookingId}`)
    .digest("hex");
}

function page(title, body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · TVR</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:520px;width:100%;background:#fff;padding:48px;">${body}</div>
</body>
</html>`,
  };
}

exports.handler = async (event) => {
  // ── GET: Show charge form ───────────────────────────────────────────────
  if (event.httpMethod === "GET") {
    const { id, token } = event.queryStringParameters || {};

    if (!id || !token || token !== makeToken("charge", id)) {
      return page("Invalid link", `<h2 style="color:#b5212b;">Invalid or expired link.</h2>`);
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return page("Not found", `<h2 style="color:#b5212b;">Booking not found.</h2>`);
    }

    if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) {
      return page("No card on file", `
        <h2 style="color:#b5212b;">No saved card for this booking.</h2>
        <p style="color:#3c3c3c;">This booking was made before card-saving was enabled. Use a Stripe payment link instead.</p>
      `);
    }

    // Show last 4 digits of saved card
    let cardLast4 = "";
    try {
      const pm = await stripe.paymentMethods.retrieve(booking.stripe_payment_method_id);
      cardLast4 = pm.card?.last4 ? ` ending in ${pm.card.last4}` : "";
    } catch (e) { /* non-fatal */ }

    return page("Charge Card on File", `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#1568be;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="square"><rect x="1" y="4" width="22" height="16" rx="0"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        </div>
        <h1 style="font-size:24px;margin:0 0 8px;color:#262626;">Charge Card on File</h1>
        <p style="color:#6b6b6b;margin:0;">${booking.customer_name} &mdash; ${booking.trailer_name || booking.trailer_id}</p>
        <p style="color:#6b6b6b;margin:4px 0 0;">${booking.pickup} &rarr; ${booking.dropoff}</p>
        <p style="color:#9a9a9a;font-size:13px;margin:8px 0 0;">Card on file${cardLast4}</p>
      </div>

      <form method="POST" action="/.netlify/functions/charge">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="token" value="${token}">

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#262626;margin-bottom:8px;">Amount</label>
          <input type="number" name="amount" placeholder="0.00" min="0.01" step="0.01" required
            style="width:100%;height:48px;padding:0 16px;border:1px solid #e6e6e6;font-size:22px;font-weight:700;color:#1568be;box-sizing:border-box;outline:none;">
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#262626;margin-bottom:8px;">Reason</label>
          <input type="text" name="reason" placeholder="e.g. Extra day, Damaged ramp" required
            style="width:100%;height:48px;padding:0 16px;border:1px solid #e6e6e6;font-size:14px;color:#262626;box-sizing:border-box;outline:none;">
          <div style="font-size:11px;color:#6b6b6b;margin-top:6px;">This will appear on the customer's card statement and receipt email.</div>
        </div>

        <button type="submit"
          style="width:100%;height:52px;background:#1568be;color:#fff;border:0;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
          Charge Card &rarr;
        </button>
      </form>
    `);
  }

  // ── POST: Process charge ────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    const params = new URLSearchParams(event.body || "");
    const id     = params.get("id");
    const token  = params.get("token");
    const amount = parseFloat(params.get("amount") || "0");
    const reason = params.get("reason") || "";

    if (!id || !token || token !== makeToken("charge", id)) {
      return page("Invalid", `<h2 style="color:#b5212b;">Invalid or expired link.</h2>`);
    }

    if (!amount || amount <= 0) {
      return page("Invalid amount", `<h2 style="color:#b5212b;">Please enter a valid amount.</h2>`);
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return page("Not found", `<h2 style="color:#b5212b;">Booking not found.</h2>`);
    }

    if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) {
      return page("No card on file", `<h2 style="color:#b5212b;">No saved card for this booking.</h2>`);
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        customer: booking.stripe_customer_id,
        payment_method: booking.stripe_payment_method_id,
        payment_method_types: ["card"],
        confirm: true,
        off_session: true,
        description: `TVR — ${reason} — ${booking.id}`,
        receipt_email: booking.customer_email,
        metadata: { booking_id: id, reason },
      });
    } catch (e) {
      console.error("Stripe charge failed:", e);
      if (e.code === "authentication_required") {
        return page("Authentication required", `
          <h2 style="color:#b5212b;">Card requires customer authentication.</h2>
          <p style="color:#3c3c3c;">This card requires the customer to approve the charge. Please send them a Stripe payment link for $${amount.toFixed(2)}.</p>
        `);
      }
      return page("Charge failed", `<h2 style="color:#b5212b;">Charge failed: ${e.message}</h2><p>Check the Stripe dashboard to process manually.</p>`);
    }

    // Log the additional charge in Supabase
    const existingCharges = booking.additional_charges || [];
    await supabase.from("bookings").update({
      additional_charges: [...existingCharges, {
        amount,
        reason,
        payment_intent_id: paymentIntent.id,
        charged_at: new Date().toISOString(),
      }],
    }).eq("id", id);

    return page("Charge successful", `
      <div style="text-align:center;">
        <div style="width:56px;height:56px;background:#22c55e;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style="font-size:28px;margin:0 0 12px;color:#262626;">Charge successful</h1>
        <p style="color:#3c3c3c;line-height:1.6;margin:0 0 8px;">
          <strong>$${amount.toFixed(2)}</strong> charged to ${booking.customer_name}'s card on file.
        </p>
        <p style="color:#6b6b6b;font-style:italic;margin:0 0 16px;">"${reason}"</p>
        <p style="color:#9a9a9a;font-size:12px;">A receipt was sent to ${booking.customer_email}.</p>
      </div>
    `);
  }

  return { statusCode: 405, body: "Method not allowed" };
};
