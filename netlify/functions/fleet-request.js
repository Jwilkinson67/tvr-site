/* Fleet Request — POST { trailers: string[], other: string }
   Sends a simple notification email to the owner. */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Bad JSON" }; }

  const trailers = (body.trailers || []).filter(Boolean);
  const other    = (body.other || "").trim().slice(0, 300);

  if (trailers.length === 0 && !other) return { statusCode: 400, body: "Nothing selected" };

  const listHtml = trailers.map(t => `<li style="margin:4px 0;">${t}</li>`).join("");
  const otherHtml = other ? `<p style="margin-top:12px;"><strong>Other:</strong> ${other}</p>` : "";

  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#262626;">
  <h2 style="color:#1568be;margin-bottom:4px;">New Fleet Request</h2>
  <p style="color:#6b6b6b;margin-top:0;">A visitor requested trailer types not currently in your fleet:</p>
  <ul style="padding-left:20px;">${listHtml}</ul>
  ${otherHtml}
  <p style="margin-top:24px;font-size:12px;color:#9a9a9a;">Sent from rentwithtvr.com</p>
</div>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: process.env.OWNER_EMAIL,
        subject: "TVR Fleet Request",
        html,
      }),
    });
  } catch (e) {
    console.error("Resend error:", e);
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
