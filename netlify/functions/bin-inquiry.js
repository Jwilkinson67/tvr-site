/**
 * TVR Bin Inquiry — Netlify Function
 * Captures lead info for products not yet available (bins, bundle).
 *
 * POST { name, phone, email, product, message }
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

async function sendEmail({ to, subject, html }) {
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Tennessee Valley Rentals LLC <${from}>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Bad JSON" }) };
  }

  const { name, phone, email, product, message } = body;
  if (!name || !phone || !email) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "Owner email not configured" }) };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto">
      <div style="background:#1568be;padding:20px 24px">
        <div style="color:#fff;font-size:18px;font-weight:700">New Inquiry · TVR</div>
        <div style="color:#a8c8f0;font-size:13px;margin-top:4px">${product || "Bin/Bundle"}</div>
      </div>
      <div style="padding:24px;border:1px solid #e6e6e6;border-top:none">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#6b6b6b;width:100px">Name</td><td style="padding:8px 0;font-weight:700">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b6b6b">Phone</td><td style="padding:8px 0;font-weight:700">${phone}</td></tr>
          <tr><td style="padding:8px 0;color:#6b6b6b">Email</td><td style="padding:8px 0;font-weight:700">${email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b6b6b">Product</td><td style="padding:8px 0">${product || "—"}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;color:#6b6b6b;vertical-align:top">Message</td><td style="padding:8px 0">${message}</td></tr>` : ""}
        </table>
      </div>
    </div>`;

  try {
    await sendEmail({
      to: [ownerEmail],
      subject: `New inquiry: ${product || "Bin/Bundle"} — ${name}`,
      html,
    });
  } catch (err) {
    console.error("Email error:", err.message);
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "Email failed" }) };
  }

  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
};
