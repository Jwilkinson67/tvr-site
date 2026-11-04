/**
 * TVR Voice Status — Netlify Function
 * <Dial> action callback from voice-screen.js, fired after the forwarded
 * call ends. If the owner answered, texts the caller a thank-you. If the
 * call was missed or declined, plays a voicemail prompt — the recording
 * is handled by voice-voicemail.js which texts the owner the link and
 * sends the customer the missed-call SMS.
 *
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

const twilio = require("twilio");
const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

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

  if (!missed && caller) {
    // Call was answered — send thank-you SMS
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    try {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: caller,
        body: "Thanks for calling Tennessee Valley Rentals! Let us know if you have any questions or book online anytime at rentwithtvr.com.",
      });
    } catch (e) {
      console.error("Post-call SMS failed:", e);
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    };
  }

  // Call was missed or declined — offer voicemail
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const voicemailUrl = `https://${host}/.netlify/functions/voice-voicemail`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're unavailable right now. Leave a message after the tone and we'll get back to you shortly.</Say>
  <Record maxLength="60" action="${escapeXml(voicemailUrl)}" playBeep="true" timeout="5" />
  <Say voice="Polly.Joanna">We didn't receive a message. Feel free to call back or book online at rentwithtvr.com.</Say>
</Response>`;

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
