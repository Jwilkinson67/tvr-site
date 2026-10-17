/**
 * Short-link redirect for photo upload pages.
 * /p/:id/pickup  →  /.netlify/functions/photos?type=pickup&id=...&token=...
 * /p/:id/return  →  /.netlify/functions/photos?type=return&id=...&token=...
 */

const crypto = require("crypto");

function makeToken(action, id) {
  return crypto.createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${id}`).digest("hex");
}

exports.handler = async (event) => {
  const { id, type } = event.queryStringParameters || {};

  if (!id || !["pickup", "return"].includes(type)) {
    return { statusCode: 400, body: "Invalid link." };
  }

  const siteUrl = (process.env.SITE_URL || "https://rentwithtvr.com").replace(/\/$/, "");
  const token   = makeToken("photos-" + type, id);
  const dest    = `${siteUrl}/.netlify/functions/photos?type=${type}&id=${encodeURIComponent(id)}&token=${token}`;

  return {
    statusCode: 302,
    headers: { Location: dest, "Cache-Control": "no-store" },
    body: "",
  };
};
