/**
 * One-shot SMS test — remove after confirming it works.
 * URL: https://rentwithtvr.com/.netlify/functions/test-sms?secret=tvr-test
 */

const twilio = require("twilio");

exports.handler = async (event) => {
  if ((event.queryStringParameters?.secret) !== "tvr-test") {
    return { statusCode: 403, body: "Forbidden" };
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;
  const to    = process.env.OWNER_CELL_NUMBER;

  if (!sid || !token || !from || !to) {
    return { statusCode: 500, body: "Missing Twilio env vars." };
  }

  const body = [
    `Tennessee Valley Rentals | Booking Confirmed!`,
    ``,
    `Pickup Address: 4217 Shady Oak Dr, Ooltewah TN 37363`,
    `Lockbox Location: Black lockbox on mailbox`,
    `Lockbox Code: 3020`,
    ``,
    `Once the trailer is connected, please use the link below to take pickup photos before leaving.`,
    `https://rentwithtvr.com/p/TEST123/pickup`,
    ``,
    `Thank you for choosing TVR!`,
  ].join("\n");

  try {
    const msg = await twilio(sid, token).messages.create({ from, to, body });
    return { statusCode: 200, body: `SMS sent! SID: ${msg.sid}` };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
