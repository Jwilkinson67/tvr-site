/**
 * TVR Block Dates — Netlify Function
 * Owner-only admin page to block trailer dates (travel, maintenance, etc.)
 *
 * GET  /.netlify/functions/block?token=abc  → admin page
 * POST { action:"add",    token, trailerId, pickup, dropoff, note }
 * POST { action:"remove", token, id }
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function adminToken() {
  return crypto
    .createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update("block-admin:tvr")
    .digest("hex");
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function adminPage(blocks) {
  const blockRows = blocks.length === 0
    ? `<tr><td colspan="5" style="padding:16px;text-align:center;color:#9a9a9a;font-size:13px;">No dates currently blocked.</td></tr>`
    : blocks.map(b => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;">${b.trailer_id === "hauler" ? "Car Hauler" : b.trailer_id === "cargo" ? "Enclosed Cargo" : b.trailer_id}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;">${b.pickup}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;">${b.dropoff}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;font-size:13px;color:#6b6b6b;">${b.trip_purpose || "—"}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e6e6e6;">
          <button onclick="removeBlock('${b.id}')"
            style="background:#b5212b;color:#fff;border:0;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">
            Remove
          </button>
        </td>
      </tr>`).join("");

  const token = adminToken();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Block Dates · TVR Admin</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif}
.wrap{max-width:700px;margin:0 auto;padding:32px 16px}
.card{background:#fff;border:1px solid #e6e6e6;margin-bottom:24px}
.card-hdr{background:#1568be;padding:16px 20px;color:#fff;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
.card-body{padding:20px}
label{display:block;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#262626;margin-bottom:6px}
input,select{width:100%;height:44px;padding:0 12px;border:1px solid #e6e6e6;font-size:14px;color:#262626;outline:none;background:#fff}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.btn{width:100%;height:48px;background:#1568be;color:#fff;border:0;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px}
table{width:100%;border-collapse:collapse}
th{padding:10px 14px;background:#f4f6f9;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;text-align:left}
#msg{font-size:13px;margin-top:12px;min-height:18px;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div style="margin-bottom:24px;">
    <div style="font-size:22px;font-weight:700;color:#262626;">TVR Admin</div>
    <div style="font-size:13px;color:#6b6b6b;margin-top:2px;">Block Dates</div>
  </div>

  <div class="card">
    <div class="card-hdr">Current Blocks</div>
    <table>
      <thead>
        <tr>
          <th>Trailer</th>
          <th>Pickup</th>
          <th>Return</th>
          <th>Note</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="block-list">
        ${blockRows}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-hdr">Add Block</div>
    <div class="card-body">
      <div style="margin-bottom:16px;">
        <label>Trailer</label>
        <select id="trailer">
          <option value="both">Both Trailers</option>
          <option value="hauler">Car Hauler</option>
          <option value="cargo">Enclosed Cargo</option>
        </select>
      </div>
      <div class="grid" style="margin-bottom:16px;">
        <div>
          <label>Start Date</label>
          <input type="date" id="pickup">
        </div>
        <div>
          <label>End Date</label>
          <input type="date" id="dropoff">
        </div>
      </div>
      <div style="margin-bottom:8px;">
        <label>Note (optional)</label>
        <input type="text" id="note" placeholder="e.g. Traveling to Nashville">
      </div>
      <button class="btn" onclick="addBlock()">Block These Dates</button>
      <div id="msg"></div>
    </div>
  </div>
</div>

<script>
var TOKEN = ${JSON.stringify(token)};

function setMsg(text, color) {
  var el = document.getElementById("msg");
  el.textContent = text;
  el.style.color = color || "#1568be";
}

async function addBlock() {
  var trailer  = document.getElementById("trailer").value;
  var pickup   = document.getElementById("pickup").value;
  var dropoff  = document.getElementById("dropoff").value;
  var note     = document.getElementById("note").value;

  if (!pickup || !dropoff) { setMsg("Please select start and end dates.", "#b5212b"); return; }
  if (pickup > dropoff)    { setMsg("Start date must be before end date.", "#b5212b"); return; }

  setMsg("Saving...");
  var res = await fetch("/.netlify/functions/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "add", token: TOKEN, trailerId: trailer, pickup, dropoff, note })
  });
  if (res.ok) {
    setMsg("Dates blocked successfully.", "#22c55e");
    setTimeout(function() { location.reload(); }, 800);
  } else {
    var d = await res.json();
    setMsg("Error: " + (d.error || "unknown"), "#b5212b");
  }
}

async function removeBlock(id) {
  if (!confirm("Remove this block?")) return;
  var res = await fetch("/.netlify/functions/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", token: TOKEN, id })
  });
  if (res.ok) { location.reload(); }
  else { alert("Failed to remove block."); }
}
</script>
</body>
</html>`;
}

exports.handler = async (event) => {
  const token = adminToken();

  if (event.httpMethod === "GET") {
    const { token: t } = event.queryStringParameters || {};
    if (t !== token) {
      return { statusCode: 403, headers: { "Content-Type": "text/html" }, body: "<h2>Access denied.</h2>" };
    }

    const { data: blocks } = await supabase
      .from("bookings")
      .select("id, trailer_id, pickup, dropoff, trip_purpose")
      .eq("status", "blocked")
      .order("pickup", { ascending: true });

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: adminPage(blocks || []),
    };
  }

  if (event.httpMethod === "POST") {
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch {
      return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Bad JSON" }) };
    }

    if (body.token !== token) {
      return { statusCode: 403, headers: JSON_HEADERS, body: JSON.stringify({ error: "Forbidden" }) };
    }

    if (body.action === "add") {
      const { trailerId, pickup, dropoff, note } = body;
      if (!pickup || !dropoff) {
        return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Missing dates" }) };
      }

      const trailers = trailerId === "both" ? ["hauler", "cargo"] : [trailerId];
      for (const tid of trailers) {
        const blockId = "BLOCK-" + Date.now().toString(36).toUpperCase() + "-" + tid.toUpperCase();
        await supabase.from("bookings").insert({
          id: blockId,
          trailer_id: tid,
          trailer_name: tid === "hauler" ? "Car Hauler" : "Enclosed Cargo",
          pickup,
          dropoff,
          status: "blocked",
          customer_name: "TVR Block",
          customer_email: "",
          customer_phone: "",
          trip_purpose: note || "",
        });
      }
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    if (body.action === "remove") {
      const { id } = body;
      if (!id || !id.startsWith("BLOCK-")) {
        return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Invalid block ID" }) };
      }
      await supabase.from("bookings").delete().eq("id", id).eq("status", "blocked");
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Unknown action" }) };
  }

  return { statusCode: 405, body: "Method not allowed" };
};
