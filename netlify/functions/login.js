const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function ok(body)         { return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) }; }
function err(status, msg) { return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: msg }) }; }

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: HEADERS, body: "" };
  if (event.httpMethod !== "POST") return err(405, "Method not allowed");

  let body;
  try { body = JSON.parse(event.body); } catch { return err(400, "Invalid JSON"); }

  const { email, password } = body;
  if (!email || !password) return err(400, "Email and password are required");

  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey":       process.env.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return err(401, data.error_description || "Invalid email or password.");
  }

  const data = await res.json();
  const meta = data.user?.user_metadata || {};

  return ok({
    name:            meta.name             || "",
    phone:           meta.phone            || "",
    address:         meta.address          || "",
    city:            meta.city             || "",
    stateZip:        meta.state_zip        || "",
    tow:             meta.tow              || "",
    hitch:           meta.hitch            || "",
    brakeController: meta.brake_controller || "",
  });
};
