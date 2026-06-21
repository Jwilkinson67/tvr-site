/**
 * TVR Voice — Netlify Function
 * Twilio webhook for "A call comes in" on the TVR business line.
 * Forwards the call to the owner's cell; if it's not picked up, the
 * <Dial> action callback (voice-status.js) sends the caller an auto-text.
 *
 * Twilio console: Phone Numbers → your number → Voice Configuration →
 * "A call comes in" → Webhook (HTTP POST) →
 * https://rentwithtvr.com/.netlify/functions/voice
 *
 * Env vars: TWILIO_AUTH_TOKEN, OWNER_CELL_NUMBER
 */

const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const actionUrl = `https://${host}/.netlify/functions/voice-status`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thanks for calling Tennessee Valley Rentals. Please hold while we connect you.</Say>
  <Dial timeout="20" action="${escapeXml(actionUrl)}" method="POST">
    <Number>${escapeXml(process.env.OWNER_CELL_NUMBER)}</Number>
  </Dial>
</Response>`;

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
