/**
 * TVR Voice Whisper — Netlify Function
 * Called by Twilio when the owner answers a forwarded call. Plays the
 * caller's recorded intro back to the owner, then asks them to press 1
 * to connect or hang up to decline. Callers never hear this.
 *
 * Also handles the <Gather> action when the owner presses a digit.
 *
 * Env vars: TWILIO_AUTH_TOKEN
 */

const { rawBody, verifyTwilioRequest, escapeXml } = require("./lib/twilio-webhook");

exports.handler = async (event) => {
  const body = rawBody(event);
  if (!verifyTwilioRequest(event, body)) {
    return { statusCode: 403, body: "Forbidden" };
  }

  const params = new URLSearchParams(body);
  const digits = params.get("Digits");
  const qs = event.queryStringParameters || {};
  const recUrl = qs.rec ? decodeURIComponent(qs.rec) : null;

  // Owner pressed a digit — connect or hang up
  if (digits !== null) {
    if (digits === "1") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/xml" },
        body: `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/xml" },
      body: `<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>`,
    };
  }

  // Initial whisper — play recording then ask owner to accept
  const host = event.headers["x-forwarded-host"] || event.headers.host;
  const gatherAction = `https://${host}/.netlify/functions/voice-whisper${recUrl ? `?rec=${encodeURIComponent(recUrl)}` : ""}`;

  let twiml;
  if (recUrl) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">TVR call.</Say>
  <Play>${escapeXml(recUrl)}</Play>
  <Gather numDigits="1" action="${escapeXml(gatherAction)}" method="POST" timeout="10">
    <Say voice="Polly.Joanna">Press 1 to connect, or hang up to decline.</Say>
  </Gather>
  <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${escapeXml(gatherAction)}" method="POST" timeout="10">
    <Say voice="Polly.Joanna">TVR call. Press 1 to connect, or hang up to decline.</Say>
  </Gather>
  <Hangup/>
</Response>`;
  }

  return { statusCode: 200, headers: { "Content-Type": "text/xml" }, body: twiml };
};
