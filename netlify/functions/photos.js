/**
 * TVR Photo Upload — Netlify Function
 * Lets customers upload before/after trailer photos via a signed link.
 *
 * GET  /.netlify/functions/photos?type=pickup|return&id=TVR-XXX&token=abc
 * POST { action:"upload",  id, token, type, slot, imageData }  → upload one photo
 * POST { action:"confirm", id, token, type, paths }             → mark complete
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
  const slotsJson = JSON.stringify(SLOTS);
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
.btn{width:100%;height:52px;background:#1568be;color:#fff;border:0;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:.3px}
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
      Tap each card to take a photo. All 6 are required before submitting.
    </p>
    <div id="slots"></div>
    <button id="submit-btn" class="btn" disabled onclick="handleSubmit()">Submit All Photos</button>
    <div id="status"></div>
  </div>
</div>

<script>
(function(){
  var SLOTS=${slotsJson};
  var files={};
  var id=${JSON.stringify(id)};
  var token=${JSON.stringify(token)};
  var type=${JSON.stringify(type)};

  function build(){
    var h="";
    SLOTS.forEach(function(s){
      h+='<div class="card" id="card-'+s.key+'" onclick="pick(\''+s.key+'\')">';
      h+='<div class="card-row">';
      h+='<div class="ph" id="ph-'+s.key+'"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" stroke-linecap="square"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
      h+='<img class="thumb" id="thumb-'+s.key+'">';
      h+='<div><div class="lbl">'+s.label+'</div><div class="hint">Tap to open camera</div></div>';
      h+='</div>';
      h+='<div class="chk"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg></div>';
      h+='<input type="file" id="input-'+s.key+'" accept="image/*" capture="environment" style="display:none" onchange="onFile(\''+s.key+'\',this)">';
      h+='</div>';
    });
    document.getElementById("slots").innerHTML=h;
  }

  window.pick=function(k){ document.getElementById("input-"+k).click(); };

  window.onFile=function(k,el){
    var f=el.files[0]; if(!f) return;
    files[k]=f;
    var r=new FileReader();
    r.onload=function(e){
      var t=document.getElementById("thumb-"+k);
      t.src=e.target.result; t.style.display="block";
      document.getElementById("ph-"+k).style.display="none";
      document.getElementById("card-"+k).classList.add("done");
    };
    r.readAsDataURL(f);
    var all=SLOTS.every(function(s){return!!files[s.key];});
    document.getElementById("submit-btn").disabled=!all;
  };

  function resize(file){
    return new Promise(function(res){
      var r=new FileReader();
      r.onload=function(e){
        var img=new Image();
        img.onload=function(){
          var MAX=1920,w=img.width,h=img.height;
          if(w>h){if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}}
          else{if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}}
          var c=document.createElement("canvas");
          c.width=w;c.height=h;
          c.getContext("2d").drawImage(img,0,0,w,h);
          c.toBlob(res,"image/jpeg",0.85);
        };
        img.src=e.target.result;
      };
      r.readAsDataURL(file);
    });
  }

  function toB64(blob){
    return new Promise(function(res){
      var r=new FileReader();
      r.onload=function(e){res(e.target.result.split(",")[1]);};
      r.readAsDataURL(blob);
    });
  }

  function setStatus(msg,color){
    var el=document.getElementById("status");
    el.textContent=msg;
    el.style.color=color||"#6b6b6b";
  }

  window.handleSubmit=async function(){
    var btn=document.getElementById("submit-btn");
    btn.disabled=true;
    var paths={};
    for(var i=0;i<SLOTS.length;i++){
      var s=SLOTS[i];
      setStatus("Uploading "+s.label+"... ("+(i+1)+"/"+SLOTS.length+")");
      try{
        var blob=await resize(files[s.key]);
        var b64=await toB64(blob);
        var res=await fetch("/.netlify/functions/photos",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({action:"upload",id:id,token:token,type:type,slot:s.key,imageData:b64})
        });
        if(!res.ok) throw new Error("failed");
        var d=await res.json();
        paths[s.key]=d.path;
      }catch(e){
        setStatus("Upload failed — check your connection and try again.","#b5212b");
        btn.disabled=false;
        return;
      }
    }
    setStatus("Finalizing...");
    var cr=await fetch("/.netlify/functions/photos",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action:"confirm",id:id,token:token,type:type,paths:paths})
    });
    if(cr.ok){
      document.querySelector(".wrap").innerHTML=
        '<div style="text-align:center;padding:60px 24px;">'+
        '<div style="width:56px;height:56px;background:#22c55e;display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;">'+
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="square"><polyline points="20 6 9 17 4 12"/></svg></div>'+
        '<h2 style="color:#262626;margin:0 0 12px;font-size:24px;">Photos submitted!</h2>'+
        '<p style="color:#3c3c3c;line-height:1.6;">Your '+type+' photos have been received.<br><span style="font-size:12px;color:#9a9a9a;">'+id+'</span></p></div>';
    }else{
      setStatus("Could not finalize. Please try again.","#b5212b");
      btn.disabled=false;
    }
  };

  build();
})();
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

    // ── upload one photo ───────────────────────────────────────────────────
    if (action === "upload") {
      const { slot, imageData } = body;
      if (!slot || !SLOTS.find(s => s.key === slot) || !imageData) {
        return jsonErr(400, "Missing slot or imageData");
      }

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

    // ── confirm all uploaded ───────────────────────────────────────────────
    if (action === "confirm") {
      const { paths } = body;
      const tsField   = type === "pickup" ? "pickup_photos_at"    : "return_photos_at";
      const pathField = type === "pickup" ? "pickup_photo_paths"  : "return_photo_paths";

      await supabase.from("bookings").update({
        [tsField]:   new Date().toISOString(),
        [pathField]: paths,
      }).eq("id", id);

      // Notify owner with view links
      try {
        const { data: booking } = await supabase
          .from("bookings")
          .select("customer_name, trailer_name, trailer_id, pickup, dropoff")
          .eq("id", id)
          .single();

        if (booking && process.env.RESEND_API_KEY && process.env.OWNER_EMAIL) {
          const typeLabel = type === "pickup" ? "Pickup" : "Return";
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
