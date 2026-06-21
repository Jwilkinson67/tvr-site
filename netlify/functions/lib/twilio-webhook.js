/**
 * Shared helpers for Twilio webhook functions (voice.js, voice-status.js,
 * sms-inbound.js). Not deployed as its own function — Netlify only
 * registers top-level files in netlify/functions/ as functions.
 */

const twilio = require("twilio");

function rawBody(event) {
  return event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");
}

// Confirms a webhook request really came from Twilio (not a forged POST
// trying to trigger free SMS sends at TVR's expense).
function verifyTwilioRequest(event, body) {
  const signature = event.headers["x-twilio-signature"];
  if (!signature) return false;
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const url = `https://${host}${event.path}`;
  const params = Object.fromEntries(new URLSearchParams(body));
  return twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params);
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  }[c]));
}

module.exports = { rawBody, verifyTwilioRequest, escapeXml };
