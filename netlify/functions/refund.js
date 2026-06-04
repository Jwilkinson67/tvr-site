/**
 * TVR Refund — Netlify Function
 * Handles deposit refunds after trailer return. Accessed via signed link
 * from the approval success page.
 *
 * GET  /.netlify/functions/refund?id=TVR-XXX&token=abc  → show refund form
 * POST /.netlify/functions/refund                        → process refund
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendReviewEmail(booking) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Thank You for Renting with TVR!</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Tennessee Valley Rentals</div>
  </div>

  <div style="padding:32px;">
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Hi ${booking.customer_name},</p>
    <p style="font-size:15px;line-height:1.6;color:#3c3c3c;margin:0 0 24px;">
      Thanks for renting the ${booking.trailer_name || booking.trailer_id}! We hope everything went smoothly and that the trailer served you well.
    </p>
    <p style="font-size:15px;line-height:1.6;color:#3c3c3c;margin:0 0 32px;">
      If you had a great experience, we'd really appreciate a quick Google review — it helps other customers find us and only takes a minute!
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="https://g.page/r/CWniJIMNhoVzEAI/review"
        style="background:#1568be;color:#fff;padding:16px 36px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
        ⭐ Leave Us a Google Review
      </a>
    </div>

    <p style="font-size:13px;color:#6b6b6b;line-height:1.6;margin:32px 0 0;padding-top:24px;border-top:1px solid #e6e6e6;">
      Have feedback or questions? Reply to this email or call us anytime.<br>
      — Tennessee Valley Rentals
    </p>
  </div>

</div>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Tennessee Valley Rentals <${from}>`,
      to: booking.customer_email,
      subject: "Thanks for renting with TVR — leave us a review!",
      html,
    }),
  });
}

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
  // ── GET: Show refund form ───────────────────────────────────────────────
  if (event.httpMethod === "GET") {
    const { id, token } = event.queryStringParameters || {};

    if (!id || !token || token !== makeToken("refund", id)) {
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

    if (booking.refunded_at) {
      return page("Already refunded", `
        <div style="text-align:center;">
          <h2 style="color:#1568be;margin:0 0 12px;">Deposit already refunded</h2>
          <p style="color:#3c3c3c;">$${booking.refund_amount} was refunded on ${new Date(booking.refunded_at).toLocaleDateString("en-US", { dateStyle: "long" })}.</p>
          ${booking.refund_note ? `<p style="color:#6b6b6b;font-style:italic;">"${booking.refund_note}"</p>` : ""}
        </div>
      `);
    }

    if (booking.status !== "approved") {
      return page("Not available", `<h2 style="color:#b5212b;">This booking has not been approved yet.</h2>`);
    }

    const depositAmount = booking.deposit_amount || 0;
    const actionUrl = `/.netlify/functions/refund`;

    return page("Release Deposit", `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:48px;height:48px;background:#1568be;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="square"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h1 style="font-size:26px;margin:0 0 8px;color:#262626;">Release Deposit</h1>
        <p style="color:#6b6b6b;margin:0;">${booking.customer_name} &mdash; ${booking.trailer_name || booking.trailer_id}</p>
        <p style="color:#6b6b6b;margin:4px 0 0;">${booking.pickup} &rarr; ${booking.dropoff}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="background:#f4f6f9;">
          <td style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;" colspan="2">Booking Summary</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;font-size:13px;">Rental</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;">$${booking.rental_amount || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;font-size:13px;">Tax</td>
          <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;">$${booking.tax_amount || "—"}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;font-weight:700;font-size:13px;">Deposit collected</td>
          <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1568be;">$${depositAmount}</td>
        </tr>
      </table>

      <form method="POST" action="${actionUrl}">
        <input type="hidden" name="id" value="${id}">
        <input type="hidden" name="token" value="${token}">

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#262626;margin-bottom:8px;">
            Refund amount
          </label>
          <input type="number" name="refundAmount" value="${depositAmount}" min="0" max="${depositAmount}" step="0.01" required
            style="width:100%;height:48px;padding:0 16px;border:1px solid #e6e6e6;font-size:18px;font-weight:700;color:#1568be;box-sizing:border-box;outline:none;">
          <div style="font-size:11px;color:#6b6b6b;margin-top:6px;">Reduce this amount for any damages or missing items (max $${depositAmount})</div>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#262626;margin-bottom:8px;">
            Notes (optional)
          </label>
          <textarea name="note" placeholder="e.g. $50 deducted for missing strap set" rows="3"
            style="width:100%;padding:12px 16px;border:1px solid #e6e6e6;font-size:14px;color:#262626;box-sizing:border-box;resize:vertical;outline:none;font-family:Arial,sans-serif;"></textarea>
        </div>

        <button type="submit"
          style="width:100%;height:52px;background:#1568be;color:#fff;border:0;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">
          Issue Refund &rarr;
        </button>
      </form>
    `);
  }

  // ── POST: Process refund ────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    const params = new URLSearchParams(event.body || "");
    const id = params.get("id");
    const token = params.get("token");
    const refundAmount = parseFloat(params.get("refundAmount") || "0");
    const note = params.get("note") || "";

    if (!id || !token || token !== makeToken("refund", id)) {
      return page("Invalid", `<h2 style="color:#b5212b;">Invalid or expired link.</h2>`);
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return page("Not found", `<h2 style="color:#b5212b;">Booking not found.</h2>`);
    }

    if (booking.refunded_at) {
      return page("Already refunded", `<h2 style="color:#b5212b;">This deposit has already been refunded.</h2>`);
    }

    const maxRefund = booking.deposit_amount || 0;
    const amount = Math.min(Math.max(0, refundAmount), maxRefund);

    if (amount > 0) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: Math.round(amount * 100),
          reason: "requested_by_customer",
          metadata: { booking_id: id, note: note || "" },
        });
      } catch (e) {
        console.error("Stripe refund failed:", e);
        return page("Refund error", `<h2 style="color:#b5212b;">Refund failed: ${e.message}</h2><p>Check the Stripe dashboard to process manually.</p>`);
      }
    }

    await supabase.from("bookings").update({
      refund_amount: amount,
      refund_note: note,
      refunded_at: new Date().toISOString(),
      status: "completed",
    }).eq("id", id);

    // Send review request email (non-fatal)
    try { await sendReviewEmail(booking); } catch (e) { console.error("Review email failed:", e); }

    const deducted = maxRefund - amount;

    return page("Refund issued", `
      <div style="text-align:center;">
        <div style="width:56px;height:56px;background:#22c55e;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 style="font-size:28px;margin:0 0 12px;color:#262626;">Refund issued</h1>
        <p style="color:#3c3c3c;line-height:1.6;margin:0 0 8px;">
          <strong>$${amount.toFixed(2)}</strong> refunded to ${booking.customer_name}.
          ${deducted > 0 ? `<br><strong>$${deducted.toFixed(2)} withheld</strong> for damages/fees.` : ""}
        </p>
        ${note ? `<p style="color:#6b6b6b;font-style:italic;margin:0;">"${note}"</p>` : ""}
        <p style="color:#9a9a9a;font-size:12px;margin-top:16px;">Funds typically appear in the customer's account within 5–10 business days.</p>
      </div>
    `);
  }

  return { statusCode: 405, body: "Method not allowed" };
};
