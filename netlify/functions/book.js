/**
 * TVR Booking API — Netlify Function
 *
 * Actions (JSON body):
 *   { action: "availability", trailerId }
 *   { action: "coupon", code }
 *   { action: "book", trailerId, trailerName, pickup, dropoff, days,
 *              paymentMethodId, depositAmount, couponCode,
 *              sessionId, docPaths: { license, insurance },
 *              customer: { name, email, phone, tow, hitch, purpose, pickupNote } }
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      sk_live_…
 *   SUPABASE_URL           https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY   service_role key
 *   RESEND_API_KEY         re_…
 *   OWNER_EMAIL            your email address
 *   BOOKING_SECRET         random secret for signing approve/decline tokens
 *   SITE_URL               https://rentwithtvr.com
 *   ADMIN_COUPON_CODE      your test coupon code
 *   CARGO_LOCKBOX_CODE     (optional) set when lockbox is installed
 *   HAULER_LOCKBOX_CODE    (optional) set when lockbox is installed
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
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function ok(body)         { return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) }; }
function err(status, msg) { return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }

/* ── Signed token for approve/decline links ─────────────────────────────── */
function makeToken(action, bookingId) {
  return crypto
    .createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${bookingId}`)
    .digest("hex");
}

/* ── Resend email ───────────────────────────────────────────────────────── */
async function sendEmail({ to, subject, html }) {
  // Use a custom from address once rentwithtvr.com is verified in Resend.
  // Until then, onboarding@resend.dev works without domain verification.
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
  if (!res.ok) throw new Error(await res.text());
}

/* ── Owner notification email ───────────────────────────────────────────── */
function ownerEmail({ booking, docUrls, approveUrl, declineUrl }) {
  const docRows = [
    docUrls.license   ? `<tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:130px;">Driver's License</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;"><a href="${docUrls.license}" style="color:#1568be;">View document →</a></td></tr>` : "",
    docUrls.insurance ? `<tr><td style="padding:10px 14px;font-weight:700;">Insurance</td><td style="padding:10px 14px;"><a href="${docUrls.insurance}" style="color:#1568be;">View document →</a></td></tr>` : "",
  ].join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;color:#262626;">
<div style="max-width:600px;margin:0 auto;background:#fff;">

  <div style="background:#1568be;padding:24px 32px;">
    <div style="color:#fff;font-size:22px;font-weight:700;">New Booking Request</div>
    <div style="color:#a8c8f0;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Tennessee Valley Rentals</div>
  </div>

  <div style="background:#f4f6f9;border-left:6px solid #b5212b;padding:20px 32px;">
    <div style="font-size:20px;font-weight:700;">${booking.trailer_name} · ${booking.pickup} → ${booking.dropoff}</div>
    <div style="font-size:14px;color:#3c3c3c;margin-top:4px;">${booking.days || "?"} day rental · $${booking.deposit_amount} authorized on card (not yet charged)</div>
  </div>

  <div style="padding:32px;">

    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Customer Info</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;width:130px;">Name</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.customer_name}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Email</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;"><a href="mailto:${booking.customer_email}" style="color:#1568be;">${booking.customer_email}</a></td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Phone</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;"><a href="tel:${booking.customer_phone}" style="color:#1568be;">${booking.customer_phone}</a></td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Tow Vehicle</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.tow_vehicle || "—"}</td></tr>
      <tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Hitch Class</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.hitch_class || "—"}</td></tr>
      ${booking.trip_purpose ? `<tr><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-weight:700;">Trip Purpose</td><td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">${booking.trip_purpose}</td></tr>` : ""}
      ${booking.pickup_note ? `<tr><td style="padding:10px 14px;font-weight:700;">Pickup Note</td><td style="padding:10px 14px;">${booking.pickup_note}</td></tr>` : ""}
    </table>

    ${docRows ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr style="background:#f4f6f9;"><td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;">Documents to Review</td></tr>
      ${docRows}
    </table>` : `<p style="color:#b88017;background:#fff8e6;padding:12px 16px;border-left:3px solid #b88017;margin-bottom:28px;">No documents were uploaded with this booking.</p>`}

    <div style="margin:32px 0;text-align:center;">
      <a href="${approveUrl}" style="background:#1568be;color:#fff;padding:16px 36px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;margin-right:12px;">✓ Approve Booking</a>
      <a href="${declineUrl}" style="background:#b5212b;color:#fff;padding:16px 36px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">✕ Decline</a>
    </div>

    <p style="color:#6b6b6b;font-size:12px;text-align:center;margin:0;">Booking ID: ${booking.id} · The $${booking.deposit_amount} is authorized but not captured until you click Approve.</p>
  </div>

</div>
</body>
</html>`;
}

/* ── Generate signed document URLs (7-day expiry) ───────────────────────── */
async function signedDocUrls(docPaths) {
  const urls = {};
  for (const [key, path] of Object.entries(docPaths || {})) {
    if (!path) continue;
    const { data } = await supabase.storage
      .from("rental-docs")
      .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
    if (data?.signedUrl) urls[key] = data.signedUrl;
  }
  return urls;
}

/* ── Main handler ───────────────────────────────────────────────────────── */
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS, body: "" };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return err(400, "Invalid JSON body.");
  }

  // ── coupon validation ─────────────────────────────────────────────────────
  if (body.action === "coupon") {
    const adminCode = process.env.ADMIN_COUPON_CODE;
    return ok({ valid: !!(adminCode && body.code === adminCode) });
  }

  // ── availability ──────────────────────────────────────────────────────────
  if (body.action === "availability") {
    const { trailerId } = body;
    if (!trailerId) return err(400, "trailerId required.");
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("bookings")
      .select("id, pickup, dropoff")
      .eq("trailer_id", trailerId)
      .gte("dropoff", today)
      .not("status", "in", '("cancelled","declined")');
    if (error) { console.error("Supabase availability error:", error); return err(500, "Could not load availability."); }
    return ok({ bookings: data || [] });
  }

  // ── book ──────────────────────────────────────────────────────────────────
  if (body.action === "book") {
    const {
      trailerId, trailerName, pickup, dropoff, days,
      paymentMethodId, rentalAmount, taxAmount, depositAmount, totalAmount, couponCode,
      sessionId, docPaths,
      customer,
    } = body;

    // Admin coupon overrides charge to $1
    const adminCode = process.env.ADMIN_COUPON_CODE;
    const couponValid = adminCode && couponCode === adminCode;
    const chargeAmount = couponValid ? 1 : (totalAmount || depositAmount);

    if (!trailerId || !pickup || !dropoff || !paymentMethodId || !chargeAmount) {
      return err(400, "Missing required booking fields.");
    }
    if (!customer?.name || !customer?.email) {
      return err(400, "Customer name and email required.");
    }
    if (pickup > dropoff) return err(400, "Pickup must be before dropoff.");

    // Authoritative conflict check
    const { data: conflicts, error: conflictErr } = await supabase
      .from("bookings")
      .select("pickup, dropoff")
      .eq("trailer_id", trailerId)
      .lte("pickup", dropoff)
      .gte("dropoff", pickup)
      .not("status", "in", '("cancelled","declined")');

    if (conflictErr) { console.error("Conflict check error:", conflictErr); return err(500, "Could not verify availability."); }
    if (conflicts && conflicts.length > 0) {
      return err(409, `That trailer is already booked for those dates (${conflicts[0].pickup} – ${conflicts[0].dropoff}).`);
    }

    // Create Stripe Customer and save card for future charges
    let stripeCustomerId = null;
    let stripePaymentMethodId = paymentMethodId;
    try {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        phone: customer.phone || undefined,
        metadata: { trailer_id: trailerId, pickup, dropoff },
      });
      await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomer.id });
      stripeCustomerId = stripeCustomer.id;
    } catch (custErr) {
      console.error("Stripe customer creation failed (non-fatal):", custErr);
    }

    // Authorize card — manual capture so charge only happens on owner approval
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(chargeAmount * 100),
        currency: "usd",
        customer: stripeCustomerId || undefined,
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        capture_method: "manual",
        confirm: true,
        description: `TVR deposit — ${trailerId} ${pickup} → ${dropoff}`,
        receipt_email: customer.email,
        metadata: {
          trailer_id: trailerId,
          pickup,
          dropoff,
          customer_name: customer.name,
          customer_phone: customer.phone || "",
        },
      });
    } catch (stripeErr) {
      console.error("Stripe error:", stripeErr);
      return err(402, stripeErr.message || "Card was declined.");
    }

    if (!["requires_capture", "succeeded"].includes(paymentIntent.status)) {
      return err(402, `Payment status: ${paymentIntent.status}. Please try again.`);
    }

    // Save booking to Supabase
    const bookingId = "TVR-" + Date.now().toString(36).toUpperCase();
    const bookingRow = {
      id: bookingId,
      trailer_id: trailerId,
      trailer_name: trailerName || trailerId,
      pickup,
      dropoff,
      days: days || null,
      status: "pending",
      session_id: sessionId || null,
      doc_paths: docPaths || null,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || "",
      customer_address: customer.address || "",
      customer_city: customer.city || "",
      customer_state_zip: customer.stateZip || "",
      dl_number: customer.dlNumber || "",
      tow_plate: customer.towPlate || "",
      insurance_company: customer.insuranceCompany || "",
      policy_number: customer.policyNumber || "",
      tow_vehicle: customer.tow || "",
      hitch_class: [customer.hitch, customer.brakeController ? `7-way/brake: ${customer.brakeController}` : ""].filter(Boolean).join(" | "),
      trip_purpose: customer.purpose || "",
      pickup_note: customer.pickupNote || "",
      renter_signature: customer.signature || "",
      signed_at: new Date().toISOString(),
      payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: stripePaymentMethodId,
      rental_amount: couponValid ? 0 : (rentalAmount || 0),
      tax_amount: couponValid ? 0 : (taxAmount || 0),
      deposit_amount: couponValid ? 1 : (depositAmount || chargeAmount),
      total_charged: chargeAmount,
    };

    const { error: insertErr } = await supabase.from("bookings").insert(bookingRow);
    if (insertErr) {
      // Payment authorized but DB write failed — log for manual recovery
      console.error("BOOKING SAVE FAILED — MANUAL ATTENTION NEEDED", {
        bookingId, paymentIntentId: paymentIntent.id, insertErr,
      });
    }

    // Generate signed document URLs and send owner notification
    try {
      const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
      const fnBase = `${siteUrl}/.netlify/functions/approve`;
      const approveUrl = `${fnBase}?action=approve&id=${bookingId}&token=${makeToken("approve", bookingId)}`;
      const declineUrl = `${fnBase}?action=decline&id=${bookingId}&token=${makeToken("decline", bookingId)}`;
      const docUrls = await signedDocUrls(docPaths);

      await sendEmail({
        to: process.env.OWNER_EMAIL,
        subject: `New booking — ${trailerName || trailerId} — ${pickup}`,
        html: ownerEmail({ booking: bookingRow, docUrls, approveUrl, declineUrl }),
      });
    } catch (emailErr) {
      // Don't fail the booking if email fails — just log it
      console.error("Owner notification email failed:", emailErr);
    }

    return ok({ success: true, bookingId });
  }

  return err(400, `Unknown action: ${body.action}`);
};
