/**
 * One-time preview: sends a sample booking SMS to the owner.
 * Delete this file after testing.
 * Hit: /.netlify/functions/test-sms-preview
 */
exports.handler = async () => {
  const twilio  = require("twilio");
  const sid     = process.env.TWILIO_ACCOUNT_SID;
  const token   = process.env.TWILIO_AUTH_TOKEN;
  const from    = process.env.TWILIO_PHONE_NUMBER;
  const to      = process.env.OWNER_CELL_NUMBER;

  if (!sid || !token || !from || !to) {
    return { statusCode: 500, body: "Missing Twilio env vars" };
  }

  const siteUrl   = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
  const approveUrl = `${siteUrl}/.netlify/functions/approve?action=approve&id=TVR-TEST&token=previewtoken`;
  const declineUrl = `${siteUrl}/.netlify/functions/approve?action=decline&id=TVR-TEST&token=previewtoken`;

  const body = [
    `New TVR booking request!`,
    `Jane Smith — Enclosed Cargo`,
    `Pickup: 2024-11-01  Return: 2024-11-03`,
    `Vehicle: 2021 Chevy Silverado`,
    `Trip: Moving to new apartment`,
    `Note: Will arrive around 9am`,
    ``,
    `License: ${siteUrl}/assets/sample-doc-link`,
    `Insurance: ${siteUrl}/assets/sample-doc-link`,
    ``,
    `Approve: ${approveUrl}`,
    `Decline: ${declineUrl}`,
  ].join("\n");

  try {
    await twilio(sid, token).messages.create({ from, to, body });
    return { statusCode: 200, body: "Preview SMS sent! Delete test-sms-preview.js when done." };
  } catch (e) {
    return { statusCode: 500, body: `Failed: ${e.message}` };
  }
};
