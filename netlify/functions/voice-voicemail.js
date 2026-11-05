/**
 * TVR Voice Voicemail — Netlify Function
 * <Record> action callback from voice-status.js, fired after the caller
 * leaves a voicemail. Texts the owner a link to the recording and texts
 * the caller the missed-call SMS.
 *
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER,
 *           OWNER_CELL_NUMBER
 */

const twilio = require("twilio");
const { rawBody, verifyTwilioRequest } = require("./lib/twilio-webhook");

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params = new URLSearchParams(body);
  const recordingUrl = params.get("RecordingUrl");
  const caller = params.get("From");
  const duration = params.get("RecordingDuration") || "0";

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const tvrNumber = process.env.TWILIO_PHONE_NUMBER;
  const ownerCell = process.env.OWNER_CELL_NUMBER;

  if (recordingUrl && parseInt(duration) > 1) {
    // Text owner the voicemail link
    if (ownerCell) {
      try {
        await client.messages.create({
          from: tvrNumber,
          to: ownerCell,
          body: `TVR voicemail from ${caller}:\n${recordingUrl}`,
        });
      } catch (e) {
        console.error("Voicemail owner SMS failed:", e);
      }
    }

    // Text caller the missed-call SMS
    if (caller) {
      try {
        await client.messages.create({
          from: tvrNumber,
          to: caller,
          body: "Sorry we missed your call! This is Tennessee Valley Rentals. Feel free to text us here with any questions, or reserve your trailer online in under 2 minutes at rentwithTVR.com!",
        });
      } catch (e) {
        console.error("Voicemail caller SMS failed:", e);
      }
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/xml" },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Salli-Neural">Thank you for your message. We'll get back to you shortly. Goodbye.</Say>
</Response>`,
  };
};
