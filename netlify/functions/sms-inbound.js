/**
 * TVR SMS Inbound — Netlify Function
 * Twilio webhook for "A message comes in" on the TVR business line.
 * Auto-replies to the customer and forwards the text to the owner's
 * cell. No two-way relay yet — the owner calls/texts the customer back
 * directly from their own phone to continue the conversation.
 *
 * Twilio console: Phone Numbers → your number → Messaging Configuration →
 * "A message comes in" → Webhook (HTTP POST) →
 * https://rentwithtvr.com/.netlify/functions/sms-inbound
 *
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
 *           OWNER_CELL_NUMBER
 */

const twilio = require("twilio");
const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params = new URLSearchParams(body);
  const from = params.get("From");
  const text = params.get("Body") || "";

  const ownerCell = process.env.OWNER_CELL_NUMBER;
  if (ownerCell && from) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: ownerCell,
        body: `TVR text from ${from}: ${text}`.slice(0, 1500),
      });
    } catch (e) {
      console.error("Owner forward SMS failed:", e);
    }
  }

  const reply = "Thanks for texting Tennessee Valley Rentals! We'll get back to you shortly — or book online anytime at https://rentwithtvr.com.";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>${escapeXml(reply)}</Message></Response>`;

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
