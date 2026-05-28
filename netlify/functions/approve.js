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
function customerConfirmationEmail(booking, approvedAt) {
  const firstName = (booking.customer_name || "").split(" ")[0] || "there";
  const code = lockboxCode(booking.trailer_id);
  const lockboxLine = code
    ? `<p style="font-size:18px;margin:8px 0;"><strong>Lockbox code: <span style="color:#1568be;">${code}</span></strong></p>`
    : `<p style="margin:8px 0;">We'll text you the lockbox code before your pickup date.</p>`;
  const approvedDate = new Date(approvedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
  const signedDate = booking.signed_at
    ? new Date(booking.signed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })
    : booking.pickup;

  const terms = [
    ["§1. Definitions", "Agreement means this form and all rental documents. You/your/renter means the customer, authorized renter, and anyone responsible for charges. We/us/our means Tennessee Valley Rentals LLC. Authorized Driver means only drivers approved on this Agreement. Loss of Use means our lost rental time during repair or replacement, calculated at the daily rental rate. Diminished Value means any reduction in value after damage or loss."],
    ["§2. Rental, Indemnity and Warranties", "This is a trailer rental contract. We may repossess the trailer at any time without prior notice if it is abandoned, overdue, or used in violation of law or this Agreement. You agree to indemnify and hold us harmless from claims, liability, costs, and attorney fees arising from this rental or your use of the trailer. The trailer is rented as-is, with no express, implied, or apparent warranties."],
    ["§3. Condition and Return", "You must return the trailer to the agreed location by the agreed date and time, in the same condition received except ordinary wear. It is your responsibility before departure to inspect the trailer for its safety and condition."],
    ["§4. Damage, Loss, Theft and Reporting", "You are responsible for all damage to, loss of, or theft of the trailer and equipment, whether or not you are at fault, including weather, road conditions, vandalism, recovery, storage, Loss of Use, Diminished Value, and reasonable administrative expenses. You must report accidents, theft, damage, or loss to us and police within 24 hours."],
    ["§5. Equipment / Replacement Cost", "You acknowledge receiving the listed equipment and replacement costs. If any listed item is lost, stolen, damaged, or not returned, you agree to pay the listed replacement cost or cost of actual repair, whichever is greater."],
    ["§6. Tow Vehicle and Cargo Responsibility", "You are solely responsible for confirming that your tow vehicle is legally and mechanically capable of towing the trailer and load, and for safe loading, weight distribution, balancing, and securing all cargo."],
    ["§7. Prohibited Uses", "Prohibited uses include: transporting hazardous or illegal materials; transporting people; driving under the influence; use by anyone not listed as an Authorized Driver; use outside the continental United States; overloading; continued use when damage is likely; or intent to criminally conceal, confiscate, or modify the trailer without written permission."],
    ["§8. Charges", "You agree to pay on demand all amounts due, including rental time, taxes, citations, towing, storage, recovery, collection costs, attorney fees, and a cleaning fee up to $500 if returned substantially less clean than rented. Early returns do not create a refund unless agreed in writing."],
    ["§9. Deposit and Payment Authorization", "We may apply your deposit to any amounts owed. You authorize us to charge your payment method on file for amounts owed under this Agreement, including charges discovered after return."],
    ["§10. Late Return", "Late returns are charged at the daily rental rate for each additional day or partial day, plus documented loss, expense, or reservation impact."],
    ["§11. Cancellation, Rescheduling, No-Show", "Cancellation, rescheduling, and no-show charges are governed by the booking terms provided at reservation. Deposits or prepaid amounts may be applied to late cancellation fees."],
    ["§12. GPS Tracking", "The trailer may have GPS or other tracking technology. You consent to tracking during the rental period and agree not to remove, tamper with, disable, or obscure any device."],
    ["§13. Insurance", "You represent that you have valid automobile liability insurance and any required coverage for towing and using the trailer. Providing insurance information does not mean we verified coverage or accepted responsibility for any loss."],
    ["§14. Modifications / Entire Agreement", "No item can be waived or modified except in writing signed by both parties. This Agreement is the entire agreement between you and us regarding this rental."],
    ["§15. Waiver and Severability", "Our waiver of any breach is not a waiver of any additional breach or future performance. Accepting payment or not exercising a right does not waive any provision. You release us from consequential, special, or punitive damages related to this rental or reservation. If any provision is void or unenforceable, the remaining provisions stay valid and enforceable."],
    ["§16. Governing Law and Venue", "This Agreement is governed by Tennessee law. Any dispute shall be handled in the appropriate Tennessee court in the county where Tennessee Valley Rentals LLC principally operates."],
    ["§17. Acknowledgment", "By signing, you confirm that the information provided is accurate, you have read and reviewed this Agreement, you had the opportunity to ask questions before signing, and you agree to be bound by its terms."],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:620px;margin:0 auto;background:#fff;">

  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Tennessee Valley Rentals</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Booking Confirmed</div>
  </div>

  <div style="background:#f4f6f9;border-left:6px solid #b5212b;padding:28px 32px;">
    <div style="font-size:28px;font-weight:700;color:#262626;line-height:1.2;">You're all set, ${firstName}!</div>
    <div style="font-size:15px;color:#3c3c3c;margin-top:8px;">Your booking has been approved and your deposit has been processed.</div>
  </div>

  <div style="padding:32px;">

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Booking Summary</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:140px;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name || booking.trailer_id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Pickup date</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Return date</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.dropoff}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Booking ID</td><td style="padding:10px 14px;font-family:monospace;color:#1568be;">${booking.id}</td></tr>
    </table>

    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">Pickup Details</div>
      <p style="margin:0 0 8px;"><strong>Address:</strong> 4217 Shady Oak Dr, Ooltewah TN 37363</p>
      <p style="margin:0 0 12px;color:#3c3c3c;">Your trailer will be staged and ready on the street.</p>
      ${lockboxLine}
    </div>

    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">What to Bring</div>
      <ul style="margin:0;padding-left:20px;color:#3c3c3c;line-height:2;">
        <li>Valid driver's license</li>
        <li>Proof of insurance covering the trailer you're towing</li>
        <li>Your tow vehicle with the hitch you listed at checkout</li>
      </ul>
    </div>

    <div style="border-top:3px solid #1568be;padding-top:20px;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">Returning the Trailer</div>
      <p style="margin:0;color:#3c3c3c;line-height:1.6;">Return to <strong>4217 Shady Oak Dr, Ooltewah TN 37363</strong> by <strong>${booking.dropoff}</strong>. You have a 4-hour grace period. Late returns are charged at the daily rate. Your <strong>$${booking.deposit_amount} deposit</strong> will be refunded after inspection — typically 3–5 business days.</p>
    </div>

    <div style="background:#f4f6f9;padding:20px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Questions?</div>
      <div style="font-size:16px;font-weight:700;color:#262626;">Call or text (321) 765-3077</div>
    </div>

    <!-- EXECUTED RENTAL AGREEMENT -->
    <div style="border:2px solid #262626;margin-bottom:32px;">
      <div style="background:#262626;padding:14px 20px;text-align:center;">
        <div style="color:#fff;font-size:16px;font-weight:700;letter-spacing:1px;">TENNESSEE VALLEY RENTALS LLC</div>
        <div style="color:#a8c8f0;font-size:12px;margin-top:4px;">4217 Shady Oak Dr, Ooltewah, TN 37363 · 321-765-3077 · info@rentwithtvr.com</div>
        <div style="color:#fff;font-size:13px;font-weight:700;margin-top:8px;letter-spacing:2px;text-transform:uppercase;">TRAILER RENTAL AGREEMENT — EXECUTED COPY</div>
      </div>

      <div style="padding:20px;">

        <!-- Customer Info -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #ccc;">
          <tr style="background:#f4f6f9;"><td colspan="4" style="padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Customer Information</td></tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;width:100px;">Full Name</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;" colspan="3">${booking.customer_name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Address</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.customer_address || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;width:100px;">City / State / ZIP</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.customer_city || "—"} ${booking.customer_state_zip || ""}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Phone</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.customer_phone}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Email</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.customer_email}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Driver's License #</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.dl_number || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Tow Vehicle Plate #</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.tow_plate || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Insurance Company</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.insurance_company || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Policy #</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.policy_number || "—"}</td>
          </tr>
        </table>

        <!-- Rental Terms -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1px solid #ccc;">
          <tr style="background:#f4f6f9;"><td colspan="4" style="padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Rental Terms</td></tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Trailer</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.trailer_name || booking.trailer_id}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Days</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.days || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Check-Out Date</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.pickup}</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Check-In Date</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;">${booking.dropoff}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:11px;font-weight:700;color:#6b6b6b;">Deposit</td>
            <td style="padding:8px 12px;border:1px solid #e6e6e6;font-size:13px;" colspan="3">$${booking.deposit_amount}</td>
          </tr>
        </table>

        <!-- Terms & Conditions -->
        <div style="border:1px solid #ccc;margin-bottom:16px;">
          <div style="background:#f4f6f9;padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Terms &amp; Conditions</div>
          <div style="padding:12px;font-size:12px;line-height:1.7;color:#3c3c3c;">
            ${terms.map(([h, b]) => `<p style="margin:0 0 8px;"><strong>${h}</strong> — ${b}</p>`).join("")}
          </div>
        </div>

        <!-- Signatures -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
          <tr style="background:#f4f6f9;"><td colspan="2" style="padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Signatures</td></tr>
          <tr>
            <td style="padding:16px;border:1px solid #e6e6e6;width:50%;">
              <div style="font-size:11px;font-weight:700;color:#6b6b6b;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Renter Signature</div>
              <div style="font-size:22px;color:#1568be;font-style:italic;font-family:Georgia,serif;border-bottom:1px solid #262626;padding-bottom:6px;min-height:32px;">${booking.renter_signature || booking.customer_name}</div>
              <div style="font-size:11px;color:#6b6b6b;margin-top:6px;">${booking.customer_name} · Signed ${signedDate}</div>
              <div style="font-size:10px;color:#9a9a9a;margin-top:4px;">E-signature valid under the ESIGN Act</div>
            </td>
            <td style="padding:16px;border:1px solid #e6e6e6;width:50%;">
              <div style="font-size:11px;font-weight:700;color:#6b6b6b;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">TVR Representative</div>
              <div style="font-size:22px;color:#1568be;font-style:italic;font-family:Georgia,serif;border-bottom:1px solid #262626;padding-bottom:6px;min-height:32px;">Tennessee Valley Rentals LLC</div>
              <div style="font-size:11px;color:#6b6b6b;margin-top:6px;">Tennessee Valley Rentals LLC · Approved ${approvedDate}</div>
              <div style="font-size:10px;color:#9a9a9a;margin-top:4px;">Authorized by booking approval action</div>
            </td>
          </tr>
        </table>

        <p style="font-size:11px;color:#9a9a9a;margin:12px 0 0;text-align:center;">Booking ID: ${booking.id} · Keep this email as your copy of the executed agreement.</p>
      </div>
    </div>

  </div>

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
      const approvedAt = new Date().toISOString();
      await sendEmail({
        to: booking.customer_email,
        subject: `Your TVR rental is confirmed — ${booking.trailer_name || booking.trailer_id}, ${booking.pickup}`,
        html: customerConfirmationEmail(booking, approvedAt),
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
