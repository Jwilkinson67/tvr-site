/**
 * TVR Pickup Reminder — Netlify Scheduled Function
 * Runs at 8am ET daily. Texts approved customers whose pickup is today
 * with the lockbox code and pickup photo link.
 *
 * Schedule set in netlify.toml:
 *   [functions."pickup-reminder"]
 *     schedule = "0 13 * * *"   (1pm UTC = 8am EST / 9am EDT)
 */

const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function lockboxCode(trailerId) {
  if (trailerId === "cargo")  return process.env.CARGO_LOCKBOX_CODE  || null;
  if (trailerId === "hauler") return process.env.HAULER_LOCKBOX_CODE || null;
  return null;
}

exports.handler = async () => {
  const todayET = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, trailer_id, trailer_name, customer_phone, pickup")
    .eq("status", "approved")
    .eq("pickup", todayET);

  if (error) {
    console.error("Supabase query failed:", error);
    return { statusCode: 500 };
  }

  if (!bookings?.length) {
    console.log("No pickups today:", todayET);
    return { statusCode: 200 };
  }

  const sid    = process.env.TWILIO_ACCOUNT_SID;
  const token  = process.env.TWILIO_AUTH_TOKEN;
  const from   = process.env.TWILIO_PHONE_NUMBER;
  const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");

  if (!sid || !token || !from) {
    console.error("Missing Twilio env vars");
    return { statusCode: 500 };
  }

  const client = twilio(sid, token);

  for (const booking of bookings) {
    if (!booking.customer_phone) continue;

    // Skip if already sent today (tracked in sms_relay)
    const reminderId = `pickup_reminder:${booking.id}`;
    const { data: existing } = await supabase
      .from("sms_relay")
      .select("id")
      .eq("id", reminderId)
      .maybeSingle();
    if (existing) {
      console.log(`Reminder already sent for ${booking.id}`);
      continue;
    }

    const code = lockboxCode(booking.trailer_id);
    const photoUrl = `${siteUrl}/p/${booking.id}/pickup`;
    const body = [
      `Good morning! Your TVR trailer is ready for pickup today.`,
      ``,
      `Address: 4217 Shady Oak Dr, Ooltewah TN 37363`,
      `Lockbox: Black lockbox on mailbox`,
      code ? `Code: ${code}` : null,
      ``,
      `Once connected, please take pickup photos before leaving:`,
      photoUrl,
    ].filter(l => l !== null).join("\n");

    try {
      await client.messages.create({ from, to: booking.customer_phone, body });
      await supabase.from("sms_relay").upsert({ id: reminderId, customer_phone: booking.customer_phone });
      console.log(`Reminder sent for ${booking.id} to ${booking.customer_phone}`);
    } catch (e) {
      console.error(`Failed to send reminder for ${booking.id}:`, e.message);
    }
  }

  return { statusCode: 200 };
};
