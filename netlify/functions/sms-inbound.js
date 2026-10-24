/**
 * TVR SMS Inbound — Netlify Function
 * Two-way relay between customers and the owner via the TVR Twilio number.
 *
 * Customer texts TVR → forwarded to owner with customer name (if booked),
 *   customer saved as active, auto-reply sent to customer.
 *
 * Owner texts TVR → relayed to active customer.
 *   To target a specific number: start message with "+1XXXXXXXXXX your message"
 *
 * Twilio console: Phone Numbers → your number → Messaging Configuration →
 * "A message comes in" → Webhook (HTTP POST) →
 * https://rentwithtvr.com/.netlify/functions/sms-inbound
 *
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
 *           OWNER_CELL_NUMBER, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");
const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function twimlReply(msg) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(msg)}</Message></Response>`,
  };
}

function emptyTwiml() {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
  };
}

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params   = new URLSearchParams(body);
  const from     = params.get("From");
  const text     = (params.get("Body") || "").trim();
  const ownerCell = process.env.OWNER_CELL_NUMBER;
  const tvrNumber = process.env.TWILIO_PHONE_NUMBER;
  const client   = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // ── Owner is replying through the TVR number ──────────────────────────────
  if (from === ownerCell) {
    // Check if message starts with a phone number: "+1XXXXXXXXXX message"
    const phonePrefix = text.match(/^(\+1\d{10})\s+([\s\S]+)/);
    let targetPhone, outboundText;

    if (phonePrefix) {
      targetPhone  = phonePrefix[1];
      outboundText = phonePrefix[2].trim();
      // Set this number as the new active customer
      await supabase.from("sms_relay").upsert({ id: "active", customer_phone: targetPhone });
    } else {
      // Send to last active customer
      const { data } = await supabase.from("sms_relay").select("customer_phone").eq("id", "active").single();
      targetPhone  = data?.customer_phone;
      outboundText = text;
    }

    if (!targetPhone) {
      return twimlReply("No active conversation. Start your message with the customer's number: +1XXXXXXXXXX your message");
    }

    try {
      await client.messages.create({ from: tvrNumber, to: targetPhone, body: outboundText });
    } catch (e) {
      console.error("Relay to customer failed:", e);
      return twimlReply(`Failed to send to ${targetPhone}: ${e.message}`);
    }

    return emptyTwiml();
  }

  // ── Customer (or anyone) texting the TVR number ───────────────────────────

  // Look up name in bookings
  let customerName = null;
  try {
    const { data } = await supabase
      .from("bookings")
      .select("customer_name")
      .eq("customer_phone", from)
      .order("signed_at", { ascending: false })
      .limit(1)
      .single();
    customerName = data?.customer_name || null;
  } catch {}

  // Save as active customer
  try {
    await supabase.from("sms_relay").upsert({ id: "active", customer_phone: from });
  } catch (e) {
    console.error("sms_relay upsert failed:", e);
  }

  // Forward to owner
  if (ownerCell) {
    const label = customerName ? `${customerName} (${from})` : from;
    try {
      await client.messages.create({
        from: tvrNumber,
        to: ownerCell,
        body: `TVR | ${label}:\n${text}`.slice(0, 1500),
      });
    } catch (e) {
      console.error("Owner forward failed:", e);
    }
  }

  // Auto-reply to customer
  const reply = "Thanks for texting Tennessee Valley Rentals! We'll get back to you shortly — or book online anytime at https://rentwithtvr.com.";
  return twimlReply(reply);
};
