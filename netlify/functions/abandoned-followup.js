/**
 * TVR Abandoned Follow-up — Netlify Scheduled Function
 * Runs every 3 hours. Finds partial bookings created 2–24 hours ago
 * that were never completed and haven't received a follow-up SMS yet,
 * then texts each customer a nudge to finish their booking.
 *
 * Schedule set in netlify.toml:
 *   [functions."abandoned-followup"]
 *     schedule = "0 */3 * * *"
 *
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY,
 *           TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async () => {
  const now = new Date();
  const twoHoursAgo   = new Date(now - 2  * 60 * 60 * 1000).toISOString();
  const twentyFourAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data: partials, error } = await supabase
    .from("partial_bookings")
    .select("id, customer_name, customer_phone, customer_email, trailer_name, pickup, dropoff")
    .eq("completed", false)
    .eq("follow_up_sent", false)
    .gte("created_at", twentyFourAgo)
    .lte("created_at", twoHoursAgo);

  if (error) {
    console.error("partial_bookings query failed:", error);
    return { statusCode: 500 };
  }

  if (!partials?.length) {
    console.log("No abandoned bookings to follow up.");
    return { statusCode: 200 };
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.error("Missing Twilio env vars");
    return { statusCode: 500 };
  }

  const client = twilio(sid, token);

  for (const partial of partials) {
    if (!partial.customer_phone) {
      console.log(`No phone for ${partial.customer_email}, skipping.`);
      continue;
    }

    try {
      await client.messages.create({
        from,
        to: partial.customer_phone,
        body: "Hey! This is Tennessee Valley Rentals. It looks like you started a booking but didn't finish. Reserve your trailer here: rentwithtvr.com",
      });
      await supabase
        .from("partial_bookings")
        .update({ follow_up_sent: true })
        .eq("id", partial.id);
      console.log(`Follow-up sent to ${partial.customer_phone} (${partial.customer_email})`);
    } catch (e) {
      console.error(`Failed to send follow-up to ${partial.customer_phone}:`, e.message);
    }
  }

  return { statusCode: 200 };
};
