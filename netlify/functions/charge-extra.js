/**
 * TVR Admin & Customer Actions — Netlify Function
 *
 * PUBLIC actions (token-gated, no admin secret):
 *   get-agreement, sign-agreement, upload-doc-token,
 *   create-payment-link, confirm-manual-payment
 *
 * ADMIN actions (x-admin-secret header required):
 *   list, charge, record-refund, upload-doc,
 *   agreement-link, approve-booking, create-manual-booking
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
  return crypto.createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${id}`).digest("hex");
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
    <div style="background:#f4f6f9;padding:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Questions about this charge?</div>
      <div style="font-size:16px;font-weight:700;color:#262626;">Call or text (423) 395-1377</div>
      <div style="font-size:13px;color:#6b6b6b;margin-top:4px;">info@rentwithtvr.com</div>
    </div>
  </div>
  <div style="background:#f6f7f9;padding:20px 32px;border-top:1px solid #e6e6e6;">
    <div style="font-size:12px;color:#6b6b6b;line-height:1.6;">Tennessee Valley Rentals LLC · Ooltewah, TN · (423) 395-1377<br>Stripe ref: ${paymentIntentId}</div>
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

function ownerManualPendingEmail(booking) {
  const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">Manual Booking Ready to Approve</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Tennessee Valley Rentals LLC</div>
  </div>
  <div style="padding:32px;">
    <p style="margin:0 0 20px;color:#3c3c3c;font-size:14px;line-height:1.6;">Documents, rental agreement, and payment have all been submitted. The card is <strong>authorized but NOT charged</strong> — open the dashboard to approve.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:160px;">Booking ID</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:monospace;color:#1568be;">${booking.id}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Customer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.customer_name} · ${booking.customer_email}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Dates</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup} → ${booking.dropoff}</td></tr>
      <tr style="background:#f4f6f9;"><td style="padding:12px 14px;font-weight:700;font-size:15px;">Auth Hold</td><td style="padding:12px 14px;font-weight:700;font-size:15px;color:#1568be;">$${(+booking.total_charged).toFixed(2)}</td></tr>
    </table>
    <a href="${siteUrl}/admin-dashboard.html" style="display:block;background:#155a30;color:#fff;padding:14px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;">Open Dashboard to Approve &rarr;</a>
  </div>
</div></body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS, body: "" };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return err(400, "Invalid JSON body.");
  }

  // ── PUBLIC: token-gated, no admin secret needed ───────────────────────────

  // get booking details for agreement page
  if (body.action === "get-agreement") {
    const { bookingId, token } = body;
    if (!bookingId || !token) return err(400, "bookingId and token are required.");
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, trailer_name, pickup, dropoff, deposit_amount, rental_amount, tax_amount, total_charged, status, renter_signature, signed_at, doc_paths, payment_intent_id")
      .eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    if (booking.renter_signature) {
      return ok({ alreadySigned: true, signedBy: booking.renter_signature, signedAt: booking.signed_at, booking });
    }
    return ok({ booking });
  }

  // save customer signature
  if (body.action === "sign-agreement") {
    const { bookingId, token, signature } = body;
    if (!bookingId || !token || !signature) return err(400, "bookingId, token, and signature are required.");
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");
    if (signature.trim().length < 2) return err(400, "Please enter your full name.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, trailer_name, pickup, dropoff, status, payment_intent_id")
      .eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    const signedAt = new Date().toISOString();
    await supabase.from("bookings").update({ renter_signature: signature.trim(), signed_at: signedAt }).eq("id", bookingId);

    // Only send signature confirmation email for non-manual bookings (manual bookings
    // get their confirmation after payment + approval)
    if (booking.status !== "manual-pending") {
      try {
        const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `Tennessee Valley Rentals LLC <${from}>`,
            to: booking.customer_email,
            subject: `Rental agreement signed — ${booking.trailer_name}, ${booking.pickup}`,
            html: `<p style="font-family:Arial,sans-serif;color:#262626;">Hi ${(booking.customer_name||"").split(" ")[0]||"there"},</p>
<p style="font-family:Arial,sans-serif;color:#3c3c3c;margin-top:12px;">This confirms your rental agreement for <strong>${booking.trailer_name}</strong> (${booking.pickup} → ${booking.dropoff}) has been signed electronically.</p>
<p style="font-family:Arial,sans-serif;color:#3c3c3c;margin-top:12px;"><strong>Signed by:</strong> ${signature.trim()}<br><strong>Date:</strong> ${new Date(signedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}<br><strong>Booking ID:</strong> ${bookingId}</p>
<p style="font-family:Arial,sans-serif;color:#6b6b6b;font-size:12px;margin-top:24px;">Tennessee Valley Rentals LLC · Ooltewah, TN · (423) 395-1377</p>`,
          }),
        });
      } catch (e) { console.error("Signature confirmation email failed:", e); }
    }

    return ok({ success: true, signedAt, needsPayment: booking.status === "manual-pending" && !booking.payment_intent_id });
  }

  // upload document via agreement token
  if (body.action === "upload-doc-token") {
    const { bookingId, token, docId, filename, mimeType, file } = body;
    if (!bookingId || !token || !docId || !filename || !mimeType || !file) {
      return err(400, "bookingId, token, docId, filename, mimeType, and file are required.");
    }
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings").select("id, session_id, doc_paths").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    const sessionId = booking.session_id || bookingId;
    const safeName  = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path      = `docs/${sessionId}/${docId}-${safeName}`;
    const buffer    = Buffer.from(file, "base64");

    const { error: uploadErr } = await supabase.storage
      .from("rental-docs").upload(path, buffer, { contentType: mimeType, upsert: true });
    if (uploadErr) { console.error("Storage upload error:", uploadErr); return err(500, uploadErr.message || "Upload failed."); }

    const newDocPaths = { ...(booking.doc_paths || {}), [docId]: path };
    await supabase.from("bookings").update({ doc_paths: newDocPaths }).eq("id", bookingId);

    return ok({ success: true, path });
  }

  // save customer contact info (collected on the sign-agreement page)
  if (body.action === "save-contact-info") {
    const { bookingId, token, customerEmail, customerPhone } = body;
    if (!bookingId || !token) return err(400, "bookingId and token are required.");
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      return err(400, "A valid email address is required.");
    }
    if (!customerPhone || customerPhone.trim().length < 7) {
      return err(400, "A phone number is required.");
    }

    const { data: booking } = await supabase.from("bookings").select("id").eq("id", bookingId).maybeSingle();
    if (!booking) return err(404, "Booking not found.");

    await supabase.from("bookings").update({
      customer_email: customerEmail.trim(),
      customer_phone: (customerPhone || "").trim(),
    }).eq("id", bookingId);

    return ok({ success: true });
  }

  // create Stripe Checkout session with manual capture (card authorized, not charged)
  if (body.action === "create-payment-link") {
    const { bookingId, token } = body;
    if (!bookingId || !token) return err(400, "bookingId and token are required.");
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_email, trailer_name, pickup, dropoff, rental_amount, tax_amount, deposit_amount, payment_intent_id, status")
      .eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    if (booking.payment_intent_id) return ok({ alreadyPaid: true });

    const rental  = Math.round(parseFloat(booking.rental_amount || 0) * 100);
    const tax     = Math.round(parseFloat(booking.tax_amount || 0) * 100);
    const deposit = Math.round(parseFloat(booking.deposit_amount || 0) * 100);
    if (rental <= 0 || deposit <= 0) return err(400, "Invalid booking amounts.");

    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");

    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `${booking.trailer_name} Rental`, description: `${booking.pickup} → ${booking.dropoff}` },
          unit_amount: rental,
        },
        quantity: 1,
      },
    ];
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "TN Sales Tax (9.25%)", description: "Applied to rental only" },
          unit_amount: tax,
        },
        quantity: 1,
      });
    }
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Refundable Deposit", description: "Returned after inspection" },
        unit_amount: deposit,
      },
      quantity: 1,
    });

    const checkoutParams = {
      mode: "payment",
      customer_creation: "always",
      line_items: lineItems,
    };
    if (booking.customer_email) checkoutParams.customer_email = booking.customer_email;

    const session = await stripe.checkout.sessions.create({
      ...checkoutParams,
      payment_intent_data: {
        capture_method: "manual",
        description: `TVR manual booking — ${booking.trailer_name} — ${booking.pickup}`,
        receipt_email: booking.customer_email,
      },
      success_url: `${siteUrl}/booking-pay-success.html?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}&token=${token}`,
      cancel_url:  `${siteUrl}/sign-agreement.html?id=${bookingId}&token=${token}`,
    });

    return ok({ url: session.url });
  }

  // confirm payment authorization and update existing booking
  if (body.action === "confirm-manual-payment") {
    const { sessionId, bookingId, token } = body;
    if (!sessionId || !bookingId || !token) return err(400, "sessionId, bookingId, and token are required.");
    if (token !== makeToken("agreement", bookingId)) return err(401, "Invalid or expired link.");

    const { data: existing } = await supabase
      .from("bookings").select("id, payment_intent_id, status").eq("id", bookingId).maybeSingle();
    if (!existing) return err(404, "Booking not found.");
    if (existing.payment_intent_id) return ok({ alreadyConfirmed: true, bookingId });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent.payment_method"],
      });
    } catch (e) {
      return err(400, "Invalid session ID.");
    }

    if (session.payment_status !== "paid") return err(402, "Payment not completed.");

    const pi = session.payment_intent;
    const pm = pi?.payment_method;
    const stripeCustomerId = session.customer || "";
    let stripePaymentMethodId = typeof pm === "string" ? pm : (pm?.id || "");

    if (stripeCustomerId && !stripePaymentMethodId) {
      try {
        const methods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: "card", limit: 1 });
        if (methods.data.length) stripePaymentMethodId = methods.data[0].id;
      } catch (_) {}
    }

    const { error: updateErr } = await supabase.from("bookings").update({
      payment_intent_id:        pi?.id || "",
      stripe_customer_id:       stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
      status: "pending",
    }).eq("id", bookingId);

    if (updateErr) {
      console.error("confirm-manual-payment update failed:", updateErr);
      return err(500, "Payment authorized but booking update failed. Contact support.");
    }

    try {
      const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
      if (booking) {
        await sendEmail({
          to: process.env.OWNER_EMAIL,
          subject: `Manual booking ready to approve — ${booking.trailer_name} — ${booking.pickup}`,
          html: ownerManualPendingEmail(booking),
        });
      }
    } catch (e) {
      console.error("Owner notification failed:", e);
    }

    return ok({ success: true, bookingId });
  }

  // ── ADMIN: x-admin-secret required ────────────────────────────────────────
  const adminSec = (event.headers["x-admin-secret"] || "").trim();
  if (!adminSec || adminSec !== (process.env.BOOKING_SECRET || "dev-secret")) {
    return err(401, "Unauthorized.");
  }

  // generate agreement link for a booking
  if (body.action === "agreement-link") {
    const { bookingId } = body;
    if (!bookingId) return err(400, "bookingId is required.");
    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
    return ok({ url: `${siteUrl}/b/${bookingId}` });
  }

  // generate pickup or return photo link (short URL)
  if (body.action === "photo-link") {
    const { bookingId, type } = body;
    if (!bookingId) return err(400, "bookingId is required.");
    if (!["pickup", "return"].includes(type)) return err(400, "type must be pickup or return.");
    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
    return ok({ url: `${siteUrl}/p/${bookingId}/${type}` });
  }

  // approve booking and capture payment
  if (body.action === "approve-booking") {
    const { bookingId } = body;
    if (!bookingId) return err(400, "bookingId is required.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings").select("*").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    if (booking.payment_intent_id && !booking.payment_intent_id.startsWith("COUPON-")) {
      try {
        await stripe.paymentIntents.capture(booking.payment_intent_id);
      } catch (captureErr) {
        if (captureErr.code === "charge_expired_for_capture") {
          return err(402, "Payment authorization has expired (7-day limit). Collect payment another way before approving.");
        }
        // payment_intent_unexpected_state = already captured (Checkout session); continue
        console.warn("Capture note:", captureErr.code, captureErr.message);
      }
    }

    const { error: updateErr } = await supabase
      .from("bookings").update({ status: "approved" }).eq("id", bookingId);
    if (updateErr) { console.error("Approve error:", updateErr); return err(500, "Could not approve booking."); }

    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
    const pickupPhotoUrl = `${siteUrl}/.netlify/functions/photos?type=pickup&id=${bookingId}&token=${makeToken("photos-pickup", bookingId)}`;
    const returnPhotoUrl = `${siteUrl}/.netlify/functions/photos?type=return&id=${bookingId}&token=${makeToken("photos-return", bookingId)}`;

    const firstName = (booking.customer_name || "").split(" ")[0] || "there";
    try {
      await sendEmail({
        to: booking.customer_email,
        subject: `Your TVR rental is confirmed — ${booking.trailer_name}, ${booking.pickup}`,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:620px;margin:0 auto;background:#fff;">
  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Tennessee Valley Rentals LLC</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Booking Confirmed</div>
  </div>
  <div style="background:#f0f9f4;border-left:6px solid #155a30;padding:28px 32px;">
    <div style="font-size:22px;font-weight:700;">Hi ${firstName},</div>
    <div style="font-size:15px;color:#3c3c3c;margin-top:8px;">Your rental is confirmed! See details below and use the links to upload your required photos.</div>
  </div>
  <div style="padding:32px;">
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Rental Details</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:160px;">Booking ID</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-family:monospace;color:#1568be;">${bookingId}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trailer</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trailer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Pickup</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.pickup}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Return</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.dropoff}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Deposit</td><td style="padding:10px 14px;">$${(+booking.deposit_amount).toFixed(2)} refundable after inspection</td></tr>
    </table>
    <div style="background:#f4f6f9;border:1px solid #e6e6e6;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">Required Photos</div>
      <p style="font-size:14px;color:#3c3c3c;margin:0 0 16px;line-height:1.5;">Please photograph the trailer at pickup and again when you return it.</p>
      <a href="${pickupPhotoUrl}" style="display:block;background:#1568be;color:#fff;padding:14px 20px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;margin-bottom:8px;">Upload Pickup Photos &rarr;</a>
      <a href="${returnPhotoUrl}" style="display:block;background:#6b7280;color:#fff;padding:14px 20px;text-decoration:none;font-weight:700;font-size:14px;text-align:center;">Upload Return Photos &rarr;</a>
    </div>
    <div style="background:#f4f6f9;padding:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:8px;">Questions?</div>
      <div style="font-size:16px;font-weight:700;">Call or text (423) 395-1377</div>
      <div style="font-size:13px;color:#6b6b6b;margin-top:4px;">info@rentwithtvr.com</div>
    </div>
  </div>
  <div style="background:#f6f7f9;padding:20px 32px;border-top:1px solid #e6e6e6;">
    <div style="font-size:12px;color:#6b6b6b;">Tennessee Valley Rentals LLC · Ooltewah, TN · (423) 395-1377</div>
  </div>
</div></body></html>`,
      });
    } catch (emailErr) {
      console.error("Approval email failed:", emailErr);
    }

    return ok({ success: true, bookingId });
  }

  // create a manual booking (dates blocked immediately, customer gets a link)
  if (body.action === "create-manual-booking") {
    const { customerName, customerEmail, customerPhone, trailerName, pickup, dropoff, rentalAmount, depositAmount } = body;
    if (!customerName || !trailerName || !pickup || !dropoff || !rentalAmount || !depositAmount) {
      return err(400, "customerName, trailerName, pickup, dropoff, rentalAmount, and depositAmount are required.");
    }
    const rental  = parseFloat(rentalAmount);
    const deposit = parseFloat(depositAmount);
    if (isNaN(rental) || rental <= 0 || isNaN(deposit) || deposit <= 0) {
      return err(400, "Amounts must be greater than $0.");
    }

    const pickupDate  = new Date(pickup + "T12:00:00");
    const dropoffDate = new Date(dropoff + "T12:00:00");
    const days = Math.max(1, Math.round((dropoffDate - pickupDate) / (1000 * 60 * 60 * 24)) + 1);

    const TAX_RATE = 0.0925;
    const tax = Math.round(rental * TAX_RATE * 100) / 100;

    const bookingId = "TVR-" + Date.now().toString(36).toUpperCase();
    const bookingRow = {
      id: bookingId,
      status: "manual-pending",
      trailer_id: trailerName.toLowerCase().replace(/\s+/g, "-"),
      trailer_name: trailerName,
      pickup, dropoff, days,
      customer_name:  customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone || "",
      rental_amount:  rental,
      deposit_amount: deposit,
      tax_amount:     tax,
      total_charged:  rental + tax + deposit,
    };

    const { error: insertErr } = await supabase.from("bookings").insert(bookingRow);
    if (insertErr) { console.error("create-manual-booking error:", insertErr); return err(500, "Could not create booking."); }

    const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
    const customerUrl = `${siteUrl}/b/${bookingId}`;

    return ok({ bookingId, customerUrl });
  }

  // cancel a booking and release any Stripe authorization
  if (body.action === "cancel-booking") {
    const { bookingId } = body;
    if (!bookingId) return err(400, "bookingId is required.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings").select("*").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    if (booking.payment_intent_id && !booking.payment_intent_id.startsWith("COUPON-")) {
      try {
        await stripe.paymentIntents.cancel(booking.payment_intent_id);
      } catch (cancelErr) {
        console.warn("PI cancel note:", cancelErr.code, cancelErr.message);
      }
    }

    const { error: updateErr } = await supabase
      .from("bookings").update({ status: "declined" }).eq("id", bookingId);
    if (updateErr) return err(500, "Could not cancel booking.");

    return ok({ success: true, bookingId });
  }

  // list recent bookings
  if (body.action === "list") {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, trailer_name, customer_name, customer_email, customer_phone, pickup, dropoff, total_charged, deposit_amount, rental_amount, tax_amount, status, stripe_customer_id, stripe_payment_method_id")
      .order("pickup", { ascending: false })
      .limit(200);
    if (error) { console.error("Supabase list error:", error); return err(500, "Could not load bookings."); }
    return ok({ bookings: data || [] });
  }

  // charge card on file
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
      .from("bookings").select("*").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");
    if (!booking.stripe_customer_id || !booking.stripe_payment_method_id) {
      return err(400, "No saved payment method for this booking.");
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

    return ok({ success: true, paymentIntentId: paymentIntent.id, amount, customer: booking.customer_name, email: booking.customer_email });
  }

  // record a refund (issue in Stripe first, then call this)
  if (body.action === "record-refund") {
    const { bookingId, refundAmountDollars } = body;
    if (!bookingId || !refundAmountDollars) {
      return err(400, "bookingId and refundAmountDollars are required.");
    }
    const refund = parseFloat(refundAmountDollars);
    if (isNaN(refund) || refund <= 0) return err(400, "Invalid refund amount.");

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings").select("id, total_charged").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    const newTotal = Math.max(0, parseFloat(booking.total_charged || 0) - refund);
    const { error: updateErr } = await supabase
      .from("bookings").update({ total_charged: newTotal }).eq("id", bookingId);
    if (updateErr) { console.error("Supabase update error:", updateErr); return err(500, "Could not update booking."); }

    return ok({ success: true, bookingId, newTotal });
  }

  // upload document as admin
  if (body.action === "upload-doc") {
    const { bookingId, docId, filename, mimeType, file } = body;
    if (!bookingId || !docId || !filename || !mimeType || !file) {
      return err(400, "bookingId, docId, filename, mimeType, and file are required.");
    }

    const { data: booking, error: lookupErr } = await supabase
      .from("bookings").select("id, session_id, doc_paths").eq("id", bookingId).single();
    if (lookupErr || !booking) return err(404, "Booking not found.");

    const sessionId = booking.session_id || bookingId;
    const safeName  = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path      = `docs/${sessionId}/${docId}-${safeName}`;
    const buffer    = Buffer.from(file, "base64");

    const { error: uploadErr } = await supabase.storage
      .from("rental-docs").upload(path, buffer, { contentType: mimeType, upsert: true });
    if (uploadErr) { console.error("Storage upload error:", uploadErr); return err(500, uploadErr.message || "Upload failed."); }

    const newDocPaths = { ...(booking.doc_paths || {}), [docId]: path };
    await supabase.from("bookings").update({ doc_paths: newDocPaths }).eq("id", bookingId);

    return ok({ success: true, path });
  }

  return err(400, `Unknown action: ${body.action}`);
};
