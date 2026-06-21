/**
 * TVR Voice Status — Netlify Function
 * <Dial> action callback from voice.js, fired after the forwarded call
 * ends. If the owner didn't pick up, texts the caller so a missed call
 * doesn't become a missed booking.
 *
 * Set automatically as the `action` URL by voice.js — nothing to
 * configure in the Twilio console for this one.
 *
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

const twilio = require("twilio");
const { rawBody, verifyTwilioRequest } = require("./lib/twilio-webhook");

const MISSED = new Set(["no-answer", "busy", "failed", "canceled"]);

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params = new URLSearchParams(body);
  const dialStatus = params.get("DialCallStatus");
  const caller = params.get("From");
  const missed = MISSED.has(dialStatus);

  if (missed && caller) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: caller,
        body: "Sorry we missed your call! This is Tennessee Valley Rentals — book online in under 2 min: https://rentwithtvr.com or call us back anytime.",
      });
    } catch (e) {
      console.error("Missed-call SMS failed:", e);
    }
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>${missed ? '<Say voice="Polly.Joanna">Sorry we missed you. We just sent you a text.</Say>' : ""}</Response>`;

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
