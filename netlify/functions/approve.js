/**
 * TVR Approve — Netlify Function
 * Called when the owner clicks Approve or Decline in the booking notification email.
 * Verifies a signed token, then captures or cancels the Stripe PaymentIntent,
 * updates Supabase, and sends the appropriate email to the customer.
 *
 * URL shape:  /.netlify/functions/approve?action=approve&id=TVR-XXX&token=abc123
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* ── Security: sign/verify approve and decline tokens ──────────────────── */
function makeToken(action, bookingId) {
  return crypto
    .createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${bookingId}`)
    .digest("hex");
}

/* ── Resend email helper ────────────────────────────────────────────────── */
async function sendEmail({ to, subject, html }) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Tennessee Valley Rentals <${from}>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

/* ── Lockbox code by trailer ────────────────────────────────────────────── */
function lockboxCode(trailerId) {
  if (trailerId === "cargo")  return process.env.CARGO_LOCKBOX_CODE  || null;
  if (trailerId === "hauler") return process.env.HAULER_LOCKBOX_CODE || null;
  return null;
}

/* ── Email templates ────────────────────────────────────────────────────── */
function customerConfirmationEmail(booking) {
  const firstName = (booking.customer_name || "").split(" ")[0] || "there";
  const code = lockboxCode(booking.trailer_id);
  const lockboxLine = code
    ? `<p style="font-size:18px;margin:8px 0;"><strong>Lockbox code: <span style="color:#1568be;">${code}</span></strong></p>`
    : `<p style="margin:8px 0;">We'll text you the lockbox code before your pickup date.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <!-- Header -->
  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Tennessee Valley Rentals</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Booking Confirmed</div>
  </div>

  <!-- Hero -->
  <div style="background:#f4f6f9;border-left:6px solid #b5212b;padding:28px 32px;">
    <div style="font-size:28px;font-weight:700;color:#262626;line-height:1.2;">You're all set, ${firstName}!</div>
    <div style="font-size:15px;color:#3c3c3c;margin-top:8px;">Your booking has been approved and your deposit has been processed.</div>
  </div>

  <div style="padding:32px;">

    <!-- Booking summary -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;">
        <td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Booking Summary</td>
      </tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:130px;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name || booking.trailer_id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Pickup date</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Return date</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.dropoff}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Booking ID</td><td style="padding:10px 14px;font-family:monospace;color:#1568be;">${booking.id}</td></tr>
    </table>

    <!-- Pickup details -->
    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">Pickup Details</div>
      <p style="margin:0 0 8px;"><strong>Address:</strong> 4217 Shady Oak Dr, Ooltewah TN 37363</p>
      <p style="margin:0 0 12px;color:#3c3c3c;">Your trailer will be staged and ready on the street — no waiting around.</p>
      ${lockboxLine}
    </div>

    <!-- What to bring -->
    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">What to Bring</div>
      <ul style="margin:0;padding-left:20px;color:#3c3c3c;line-height:2;">
        <li>Valid driver's license</li>
        <li>Proof of insurance covering the trailer you're towing</li>
        <li>Your tow vehicle with the hitch you listed at checkout</li>
      </ul>
    </div>

    <!-- What to expect -->
    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">What to Expect</div>
      <p style="margin:0 0 10px;color:#3c3c3c;line-height:1.6;">The trailer will be on the street ready to hook up. Please do a quick walk-around before you leave and let us know immediately if you spot any pre-existing damage so it's on record.</p>
      <p style="margin:0;color:#3c3c3c;line-height:1.6;">When you return the trailer, leave it where you picked it up. Your <strong>$${booking.deposit_amount} deposit</strong> will be refunded after inspection — typically within 3–5 business days.</p>
    </div>

    <!-- Return -->
    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">Returning the Trailer</div>
      <p style="margin:0;color:#3c3c3c;line-height:1.6;">Return to <strong>4217 Shady Oak Dr, Ooltewah TN 37363</strong> by your agreed return date of <strong>${booking.dropoff}</strong>. You have a 4-hour grace period. Late returns are charged at the daily rate.</p>
    </div>

    <!-- Questions -->
    <div style="background:#f4f6f9;padding:20px;border-radius:0;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Questions?</div>
      <div style="font-size:16px;font-weight:700;color:#262626;">Call or text (321) 765-3077</div>
      <div style="font-size:13px;color:#6b6b6b;margin-top:4px;">We're local and always happy to help.</div>
    </div>

    <!-- Rental agreement -->
    <div style="border-top:1px solid #e6e6e6;padding-top:24px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:16px;">Your Signed Rental Agreement</div>
      <div style="background:#f4f6f9;padding:20px;font-size:13px;line-height:1.7;color:#3c3c3c;">
        <p style="margin:0 0 12px;"><strong>§1. Term</strong> — Each rental period starts when the customer signs this rental contract. The customer will be charged an additional fee at the daily rate for any extra time until the trailer is returned, with a four-hour grace period beyond the agreed return time.</p>
        <p style="margin:0 0 12px;"><strong>§2. Customer Liability</strong> — The customer is responsible for the rental fee and all damage to the trailer. A refundable deposit is held against minor damage and returned at the return inspection.</p>
        <p style="margin:0 0 12px;"><strong>§3. Towing Vehicle Requirements</strong> — The towing vehicle must be in good working condition with the correct trailer light wiring. The customer must not exceed towing limits in their vehicle's owner's manual.</p>
        <p style="margin:0 0 12px;"><strong>§4. License &amp; Insurance</strong> — The customer must present a valid driver's license and proof of insurance covering whatever the vehicle is towing. The towing vehicle must have valid and up-to-date tags.</p>
        <p style="margin:0 0 12px;"><strong>§5. Cancellation</strong> — Cancel 24 hours before pickup for a full refund. Inside 24 hours, the deposit is forfeit.</p>
        <p style="margin:0;"><strong>§6. Governing Law</strong> — This agreement is governed by the laws of the State of Tennessee. Any dispute will be resolved in Hamilton County, TN.</p>
      </div>
      <p style="font-size:12px;color:#6b6b6b;margin-top:12px;">Signed by: <strong>${booking.customer_name}</strong> · Date: ${booking.pickup}</p>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#f6f7f9;padding:20px 32px;border-top:1px solid #e6e6e6;">
    <div style="font-size:12px;color:#6b6b6b;line-height:1.6;">
      Tennessee Valley Rentals · Ooltewah, TN · (321) 765-3077<br>
      Booking ID: ${booking.id}
    </div>
  </div>

</div>
</body>
</html>`;
}

function customerDeclineEmail(booking) {
  const firstName = (booking.customer_name || "").split(" ")[0] || "there";
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Tennessee Valley Rentals</div>
  </div>
  <div style="padding:32px;">
    <h2 style="margin:0 0 16px;">Hi ${firstName},</h2>
    <p style="color:#3c3c3c;line-height:1.6;margin:0 0 16px;">Unfortunately we're unable to approve your booking request for the <strong>${booking.trailer_name || booking.trailer_id}</strong> on <strong>${booking.pickup}</strong>.</p>
    <p style="color:#3c3c3c;line-height:1.6;margin:0 0 24px;">Your card has <strong>not been charged</strong> — the authorization hold will be released automatically within 5–7 business days depending on your bank.</p>
    <p style="color:#3c3c3c;line-height:1.6;margin:0 0 24px;">If you have questions or would like to discuss an alternative arrangement, please reach out:</p>
    <div style="background:#f4f6f9;padding:20px;margin-bottom:24px;">
      <div style="font-size:16px;font-weight:700;">(321) 765-3077</div>
      <div style="font-size:13px;color:#6b6b6b;">Call or text anytime</div>
    </div>
    <p style="color:#6b6b6b;font-size:13px;">Tennessee Valley Rentals · Ooltewah, TN</p>
  </div>
</div>
</body>
</html>`;
}

/* ── HTML response page (shown in browser when owner clicks the link) ───── */
function htmlPage(title, message, isSuccess) {
  const color = isSuccess ? "#1568be" : "#b5212b";
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · TVR</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:480px;width:100%;background:#fff;padding:48px;text-align:center;">
  <div style="width:56px;height:56px;background:${color};display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="square">
      ${isSuccess ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
    </svg>
  </div>
  <h1 style="font-size:28px;margin:0 0 12px;color:#262626;">${title}</h1>
  <p style="color:#3c3c3c;line-height:1.6;margin:0;">${message}</p>
</div>
</body>
</html>`,
  };
}

/* ── Main handler ───────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  const { action, id, token } = event.queryStringParameters || {};

  if (!action || !id || !token) {
    return htmlPage("Invalid link", "This link is missing required parameters.", false);
  }

  // Verify signed token — prevents anyone from guessing approve/decline URLs
  const expected = makeToken(action, id);
  if (token !== expected) {
    return htmlPage("Invalid link", "This link is invalid or has already been used.", false);
  }

  // Load booking from Supabase
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) {
    return htmlPage("Not found", "Booking not found — it may have already been processed.", false);
  }

  if (booking.status && booking.status !== "pending") {
    return htmlPage(
      "Already processed",
      `This booking was already ${booking.status}. No changes made.`,
      booking.status === "approved"
    );
  }

  // ── Approve ──────────────────────────────────────────────────────────────
  if (action === "approve") {
    try {
      await stripe.paymentIntents.capture(booking.payment_intent_id);
    } catch (e) {
      console.error("Stripe capture failed:", e);
      return htmlPage("Payment error", `Could not capture payment: ${e.message}. Check Stripe dashboard.`, false);
    }

    await supabase.from("bookings").update({ status: "approved" }).eq("id", id);

    try {
      await sendEmail({
        to: booking.customer_email,
        subject: `Your TVR rental is confirmed — ${booking.trailer_name || booking.trailer_id}, ${booking.pickup}`,
        html: customerConfirmationEmail(booking),
      });
    } catch (e) {
      console.error("Customer email failed:", e);
    }

    return htmlPage(
      "Booking approved!",
      `${booking.customer_name}'s booking (${booking.trailer_name || booking.trailer_id}, ${booking.pickup} → ${booking.dropoff}) has been approved and $${booking.deposit_amount} captured. A confirmation email has been sent to ${booking.customer_email}.`,
      true
    );
  }

  // ── Decline ──────────────────────────────────────────────────────────────
  if (action === "decline") {
    try {
      await stripe.paymentIntents.cancel(booking.payment_intent_id);
    } catch (e) {
      console.error("Stripe cancel failed:", e);
      return htmlPage("Payment error", `Could not cancel authorization: ${e.message}. Check Stripe dashboard.`, false);
    }

    await supabase.from("bookings").update({ status: "declined" }).eq("id", id);

    try {
      await sendEmail({
        to: booking.customer_email,
        subject: "Update on your TVR rental request",
        html: customerDeclineEmail(booking),
      });
    } catch (e) {
      console.error("Customer decline email failed:", e);
    }

    return htmlPage(
      "Booking declined",
      `${booking.customer_name}'s booking has been declined and the authorization released. They've been notified at ${booking.customer_email}.`,
      false
    );
  }

  return htmlPage("Unknown action", "Unknown action — no changes made.", false);
};
