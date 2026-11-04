/**
 * TVR Voice Screen — Netlify Function
 * <Record> action callback from voice.js. Receives the caller's recording,
 * then dials the owner with a whisper that plays it back before connecting.
 *
 * Env vars: TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, OWNER_CELL_NUMBER
 */

const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params = new URLSearchParams(body);
  const recordingUrl = params.get("RecordingUrl");

  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const actionUrl = `https://${host}/.netlify/functions/voice-status`;
  const whisperBase = `https://${host}/.netlify/functions/voice-whisper`;
  const whisperUrl = recordingUrl
    ? `${whisperBase}?rec=${encodeURIComponent(recordingUrl)}`
    : whisperBase;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Please hold while we connect you.</Say>
  <Dial timeout="20" action="${escapeXml(actionUrl)}" method="POST" callerId="${escapeXml(process.env.TWILIO_PHONE_NUMBER)}">
    <Number url="${escapeXml(whisperUrl)}" method="POST">${escapeXml(process.env.OWNER_CELL_NUMBER)}</Number>
  </Dial>
</Response>`;

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
