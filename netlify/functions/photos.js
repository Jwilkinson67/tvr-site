/**
 * TVR Photo Upload — Netlify Function
 * Lets customers upload before/after trailer photos via a signed link.
 *
 * GET  /.netlify/functions/photos?type=pickup|return&id=TVR-XXX&token=abc
 * POST { action:"upload",  id, token, type, slot, imageData }  -> upload one photo
 * POST { action:"confirm", id, token, type, paths }             -> mark complete
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SLOTS = [
  { key: "front",     label: "Front" },
  { key: "back",      label: "Back" },
  { key: "driver",    label: "Driver Side" },
  { key: "passenger", label: "Passenger Side" },
  { key: "hitch",     label: "Hitch & 7-Way Connection" },
  { key: "deck",      label: "Inside / Deck" },
];

function makeToken(action, bookingId) {
  return crypto
    .createHmac("sha256", process.env.BOOKING_SECRET || "dev-secret")
    .update(`${action}:${bookingId}`)
    .digest("hex");
}

const JSON_HEADERS = { "Content-Type": "application/json" };
function jsonOk(body)  { return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(body) }; }
function jsonErr(s, m) { return { statusCode: s,   headers: JSON_HEADERS, body: JSON.stringify({ error: m }) }; }

function simplePage(title, body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} - TVR</title></head>
<body style="margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:520px;width:100%;background:#fff;padding:48px;">${body}</div>
</body></html>`,
  };
}

function uploadPage({ booking, type, typeLabel, id, token }) {
  const camIcon = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="square"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  const chkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg>`;

  const slotCards = SLOTS.map(s => `
    <div class="card" id="card-${s.key}" onclick="document.getElementById('input-${s.key}').click()">
      <div class="card-row">
        <div class="ph" id="ph-${s.key}">${camIcon}</div>
        <img class="thumb" id="thumb-${s.key}">
        <div>
          <div class="lbl">${s.label}</div>
          <div class="hint">Tap to open camera</div>
        </div>
      </div>
      <div class="chk">${chkIcon}</div>
      <input type="file" id="input-${s.key}" accept="image/*" capture="environment" style="display:none"
        onchange="onFile('${s.key}', this)">
    </div>`).join("");

  const requiredKeys = JSON.stringify(SLOTS.map(s => s.key));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Upload ${typeLabel} Photos - TVR</title>
<style>
*{box-sizing:border-box}
body{margin:0;padding:0;background:#f6f7f9;font-family:Arial,sans-serif}
.wrap{max-width:540px;margin:0 auto;padding:0 0 40px}
.hdr{background:#1568be;padding:20px 20px 18px}
.inner{padding:20px}
.card{background:#fff;border:2px solid #e6e6e6;margin-bottom:10px;cursor:pointer;position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent}
.card.done{border-color:#1568be}
.card-row{display:flex;align-items:center;gap:14px;padding:14px}
.thumb{width:68px;height:68px;object-fit:cover;border-radius:3px;display:none;flex-shrink:0}
.ph{width:68px;height:68px;background:#f4f6f9;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0}
.lbl{font-weight:700;font-size:15px;color:#262626}
.hint{font-size:12px;color:#9a9a9a;margin-top:2px}
.chk{position:absolute;top:8px;right:8px;width:22px;height:22px;background:#1568be;border-radius:50%;display:none;align-items:center;justify-content:center}
.card.done .chk{display:flex}
.btn{width:100%;height:52px;background:#1568be;color:#fff;border:0;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:.3px;margin-top:8px}
.btn:disabled{opacity:.4;cursor:not-allowed}
#status{text-align:center;font-size:13px;color:#6b6b6b;min-height:20px;margin-top:12px}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div style="color:#fff;font-size:18px;font-weight:700;">Tennessee Valley Rentals</div>
    <div style="color:#a8c8f0;font-size:12px;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">Upload ${typeLabel} Photos</div>
  </div>
  <div class="inner">
    <div style="background:#fff;padding:14px;margin-bottom:14px;border:1px solid #e6e6e6;font-size:13px;color:#6b6b6b;">
      ${booking.trailer_name || booking.trailer_id} &middot; ${booking.pickup} &rarr; ${booking.dropoff}
      <span style="display:block;font-size:11px;color:#9a9a9a;margin-top:2px;">${id}</span>
    </div>
    <p style="font-size:14px;color:#3c3c3c;margin:0 0 14px;line-height:1.6;">
      Tap each card to take a photo. All ${SLOTS.length} are required before submitting.
    </p>

    ${slotCards}

    <div style="border:2px dashed #e6e6e6;padding:16px;margin-bottom:10px;cursor:pointer;-webkit-tap-highlight-color:transparent"
      onclick="document.getElementById('extra-input').click()">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:68px;height:68px;background:#f4f6f9;display:flex;align-items:center;justify-content:center;border-radius:3px;flex-shrink:0;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="square"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div>
          <div class="lbl">Additional Photos</div>
          <div class="hint">Optional &mdash; select as many as you like</div>
        </div>
      </div>
      <div id="extra-thumbs" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;"></div>
      <input type="file" id="extra-input" accept="image/*" multiple style="display:none" onchange="onExtra(this)">
    </div>

    <button id="submit-btn" class="btn" disabled onclick="handleSubmit()">Submit All Photos</button>
    <div id="status"></div>
  </div>
</div>

<script>
var files = {};
var extraFiles = [];
var REQUIRED = ${requiredKeys};
var ID = ${JSON.stringify(id)};
var TOKEN = ${JSON.stringify(token)};
var TYPE = ${JSON.stringify(type)};

function onFile(key, el) {
  var f = el.files[0];
  if (!f) return;
  files[key] = f;
  var r = new FileReader();
  r.onload = function(e) {
    var thumb = document.getElementById("thumb-" + key);
    thumb.src = e.target.result;
    thumb.style.display = "block";
    document.getElementById("ph-" + key).style.display = "none";
    document.getElementById("card-" + key).classList.add("done");
  };
  r.readAsDataURL(f);
  var allDone = REQUIRED.every(function(k) { return !!files[k]; });
  document.getElementById("submit-btn").disabled = !allDone;
}

function onExtra(el) {
  var newFiles = Array.from(el.files);
  if (!newFiles.length) return;
  extraFiles = extraFiles.concat(newFiles);
  var container = document.getElementById("extra-thumbs");
  newFiles.forEach(function(f) {
    var r = new FileReader();
    r.onload = function(e) {
      var img = document.createElement("img");
      img.src = e.target.result;
      img.style.cssText = "width:60px;height:60px;object-fit:cover;border-radius:3px;border:2px solid #1568be;";
      container.appendChild(img);
    };
    r.readAsDataURL(f);
  });
  el.value = "";
}

function resize(file) {
  return new Promise(function(res) {
    var r = new FileReader();
    r.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var MAX = 1920, w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        c.toBlob(res, "image/jpeg", 0.85);
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

function toB64(blob) {
  return new Promise(function(res) {
    var r = new FileReader();
    r.onload = function(e) { res(e.target.result.split(",")[1]); };
    r.readAsDataURL(blob);
  });
}

function setStatus(msg, color) {
  var el = document.getElementById("status");
  el.textContent = msg;
  el.style.color = color || "#6b6b6b";
}

async function handleSubmit() {
  var btn = document.getElementById("submit-btn");
  btn.disabled = true;
  var paths = {};

  for (var i = 0; i < REQUIRED.length; i++) {
    var key = REQUIRED[i];
    setStatus("Uploading photo " + (i + 1) + " of " + REQUIRED.length + "...");
    try {
      var blob = await resize(files[key]);
      var b64 = await toB64(blob);
      var res = await fetch("/.netlify/functions/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", id: ID, token: TOKEN, type: TYPE, slot: key, imageData: b64 })
      });
      if (!res.ok) throw new Error("failed");
      paths[key] = (await res.json()).path;
    } catch(e) {
      setStatus("Upload failed — check your connection and try again.", "#b5212b");
      btn.disabled = false;
      return;
    }
  }

  for (var j = 0; j < extraFiles.length; j++) {
    setStatus("Uploading extra photo " + (j + 1) + " of " + extraFiles.length + "...");
    try {
      var eblob = await resize(extraFiles[j]);
      var eb64 = await toB64(eblob);
      var eres = await fetch("/.netlify/functions/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", id: ID, token: TOKEN, type: TYPE, slot: "extra_" + j, imageData: eb64 })
      });
      if (!eres.ok) throw new Error("failed");
      paths["extra_" + j] = (await eres.json()).path;
    } catch(e) {
      setStatus("Extra photo upload failed — try again.", "#b5212b");
      btn.disabled = false;
      return;
    }
  }

  setStatus("Finalizing...");
  var cr = await fetch("/.netlify/functions/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "confirm", id: ID, token: TOKEN, type: TYPE, paths: paths })
  });
  if (cr.ok) {
    document.querySelector(".wrap").innerHTML =
      '<div style="text-align:center;padding:60px 24px;">' +
      '<div style="width:56px;height:56px;background:#22c55e;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<h2 style="color:#262626;margin:0 0 12px;font-size:24px;">Photos submitted!</h2>' +
      '<p style="color:#3c3c3c;line-height:1.6;">Your ' + TYPE + ' photos have been received.<br>' +
      '<span style="font-size:12px;color:#9a9a9a;">' + ID + '</span></p></div>';
  } else {
    setStatus("Could not finalize. Please try again.", "#b5212b");
    btn.disabled = false;
  }
}
</script>
</body>
</html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    const { type, id, token } = event.queryStringParameters || {};

    if (!type || !["pickup", "return"].includes(type)) {
      return simplePage("Invalid link", '<h2 style="color:#b5212b;">Invalid link.</h2>');
    }
    if (!id || !token || token !== makeToken("photos-" + type, id)) {
      return simplePage("Invalid link", '<h2 style="color:#b5212b;">Invalid or expired link.</h2>');
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, customer_name, trailer_name, trailer_id, pickup, dropoff, pickup_photos_at, return_photos_at")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return simplePage("Not found", '<h2 style="color:#b5212b;">Booking not found.</h2>');
    }

    const alreadyAt = type === "pickup" ? booking.pickup_photos_at : booking.return_photos_at;
    if (alreadyAt) {
      const lbl = type === "pickup" ? "Pickup" : "Return";
      return simplePage("Already received", `
        <div style="text-align:center;">
          <h2 style="color:#1568be;margin:0 0 12px;">${lbl} photos received</h2>
          <p style="color:#3c3c3c;">These photos have already been submitted. Thank you!</p>
          <p style="font-size:12px;color:#9a9a9a;">${id}</p>
        </div>`);
    }

    const typeLabel = type === "pickup" ? "Pickup" : "Return";
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: uploadPage({ booking, type, typeLabel, id, token }),
    };
  }

  if (event.httpMethod === "POST") {
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return jsonErr(400, "Bad JSON"); }

    const { action, id, token, type } = body;

    if (!type || !["pickup", "return"].includes(type)) return jsonErr(400, "Invalid type");
    if (!id || !token || token !== makeToken("photos-" + type, id)) return jsonErr(403, "Invalid token");

    if (action === "upload") {
      const { slot, imageData } = body;
      const validSlot = SLOTS.find(s => s.key === slot) || /^extra_\d+$/.test(slot);
      if (!slot || !validSlot || !imageData) return jsonErr(400, "Missing slot or imageData");

      const buffer = Buffer.from(imageData, "base64");
      const path = `${id}/${type}/${slot}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("rental-docs")
        .upload(path, buffer, { contentType: "image/jpeg", upsert: true });

      if (upErr) {
        console.error("Photo upload error:", upErr);
        return jsonErr(500, upErr.message);
      }

      return jsonOk({ ok: true, path });
    }

    if (action === "confirm") {
      const { paths } = body;
      const tsField   = type === "pickup" ? "pickup_photos_at"   : "return_photos_at";
      const pathField = type === "pickup" ? "pickup_photo_paths" : "return_photo_paths";

      await supabase.from("bookings").update({
        [tsField]:   new Date().toISOString(),
        [pathField]: paths,
      }).eq("id", id);

      try {
        const { data: booking } = await supabase
          .from("bookings")
          .select("customer_name, trailer_name, trailer_id, pickup, dropoff")
          .eq("id", id)
          .single();

        if (booking && process.env.RESEND_API_KEY && process.env.OWNER_EMAIL) {
          const typeLabel = type === "pickup" ? "Pickup" : "Return";
          const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
          const linkRows = [];
          for (const [slot, path] of Object.entries(paths || {})) {
            const { data } = await supabase.storage
              .from("rental-docs")
              .createSignedUrl(path, 60 * 60 * 24 * 7);
            if (data?.signedUrl) {
              const label = SLOTS.find(s => s.key === slot)?.label || slot;
              linkRows.push(
                `<a href="${data.signedUrl}" style="display:inline-block;margin:4px 8px 4px 0;color:#1568be;font-weight:700;font-size:14px;">${label} &rarr;</a>`
              );
            }
          }

          const refundSection = type === "return" ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#166534;margin-bottom:12px;">Trailer Returned — Next Step</div>
      <a href="${siteUrl}/.netlify/functions/refund?id=${id}&token=${makeToken("refund", id)}"
        style="display:inline-block;background:#1568be;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;font-size:14px;">
        Release Deposit &rarr;
      </a>
    </div>` : "";

          const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `Tennessee Valley Rentals <${from}>`,
              to: process.env.OWNER_EMAIL,
              subject: `${typeLabel} photos uploaded — ${booking.trailer_name || booking.trailer_id} — ${id}`,
              html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:#1568be;padding:20px 28px;">
    <div style="color:#fff;font-size:18px;font-weight:700;">${typeLabel} Photos Uploaded</div>
    <div style="color:#a8c8f0;font-size:12px;margin-top:4px;">Tennessee Valley Rentals</div>
  </div>
  <div style="padding:28px;">
    <p style="margin:0 0 20px;font-size:15px;color:#262626;">
      <strong>${booking.customer_name}</strong> has uploaded their <strong>${typeLabel.toLowerCase()}</strong> photos
      for <strong>${booking.trailer_name || booking.trailer_id}</strong>
      (${booking.pickup} &rarr; ${booking.dropoff}).
    </p>
    ${refundSection}
    <div style="background:#f4f6f9;padding:16px 20px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6b6b6b;margin-bottom:12px;">View Photos</div>
      ${linkRows.join("")}
    </div>
    <p style="font-size:12px;color:#9a9a9a;margin:0;">Links expire in 7 days &middot; Booking ID: ${id}</p>
  </div>
</div>`,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Owner photo notification failed:", emailErr);
      }

      return jsonOk({ ok: true });
    }

    return jsonErr(400, "Unknown action");
  }

  return { statusCode: 405, body: "Method not allowed" };
};
