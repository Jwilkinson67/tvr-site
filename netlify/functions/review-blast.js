/**
 * TVR Review Blast — Netlify Function
 * GET  ?action=list  → returns completed bookings eligible for review SMS
 * POST               → sends review SMS to selected booking IDs
 *
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, TWILIO_ACCOUNT_SID,
 *           TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, ADMIN_SECRET
 */

const { createClient } = require("@supabase/supabase-js");
const twilio = require("twilio");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const REVIEW_URL = "https://g.page/r/CWniJIMNhoVzEAI/review";
const SMS_BODY = `Tennessee Valley Rentals: Thanks for renting with us! We'd love to hear about your experience — leave us a quick Google review and get $10 off your next rental (just show us the review at pickup): ${REVIEW_URL}`;

function authError() {
  return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
}

exports.handler = async (event) => {
  const secret = event.headers["x-admin-secret"] || event.headers["authorization"]?.replace("Bearer ", "");
  if (!secret || secret !== process.env.ADMIN_SECRET) return authError();

  // ── GET: list eligible bookings ─────────────────────────────────────────
  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_phone, trailer_name, trailer_id, pickup, dropoff, deposit_amount, refund_amount, refunded_at, review_sms_sent")
      .not("refunded_at", "is", null)
      .order("refunded_at", { ascending: false });

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || []),
    };
  }

  // ── POST: send SMS blast ─────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    let ids;
    try {
      ({ ids } = JSON.parse(event.body || "{}"));
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    if (!Array.isArray(ids) || ids.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No IDs provided" }) };
    }

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, customer_name, customer_phone, review_sms_sent")
      .in("id", ids);

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const results = { sent: [], skipped: [], failed: [] };

    for (const booking of bookings) {
      if (!booking.customer_phone) { results.skipped.push(booking.id); continue; }
      if (booking.review_sms_sent)  { results.skipped.push(booking.id); continue; }

      try {
        await client.messages.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: booking.customer_phone,
          body: SMS_BODY,
        });
        await supabase.from("bookings").update({ review_sms_sent: true }).eq("id", booking.id);
        results.sent.push(booking.id);
      } catch (e) {
        console.error(`Review SMS failed for ${booking.id}:`, e.message);
        results.failed.push(booking.id);
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
