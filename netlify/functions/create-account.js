const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

  const { email, password, profile } = body;
  if (!email || !password) return err(400, "Email and password are required");
  if (password.length < 6) return err(400, "Password must be at least 6 characters");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name:            profile?.name            || "",
      phone:           profile?.phone           || "",
      address:         profile?.address         || "",
      city:            profile?.city            || "",
      state_zip:       profile?.stateZip        || "",
      tow:             profile?.tow             || "",
      hitch:           profile?.hitch           || "",
      brake_controller: profile?.brakeController || "",
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already been registered")) {
      return err(409, "An account with this email already exists.");
    }
    return err(400, error.message);
  }

  return ok({ success: true, userId: data.user.id });
};
