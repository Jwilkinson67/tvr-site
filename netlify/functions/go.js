/**
 * Short-link redirect: /b/:id → sign-agreement.html?id=...&token=...
 * Generates the HMAC token server-side so the shared URL stays short.
 */

const crypto = require("crypto");

function makeToken(action, id) {
  return crypto.createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${id}`).digest("hex");
}

exports.handler = async (event) => {
  const id = (event.queryStringParameters || {}).id || "";
  if (!id) {
    return { statusCode: 400, body: "Missing booking ID." };
  }

  const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
  const token   = makeToken("agreement", id);
  const dest    = `${siteUrl}/sign-agreement.html?id=${encodeURIComponent(id)}&token=${token}`;

  return {
    statusCode: 302,
    headers: { Location: dest, "Cache-Control": "no-store" },
    body: "",
  };
};
