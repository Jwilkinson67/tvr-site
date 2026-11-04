/**
 * TVR Partial Booking — Netlify Function
 * Saves/updates a partial booking when a customer reaches the payment step.
 * Also serves a GET ?action=list endpoint for the admin dashboard.
 *
 * POST: saves partial booking (upsert on customer_email)
 * GET ?action=list: returns incomplete partial bookings (requires Authorization header)
 *
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_SECRET
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  // GET ?action=list — admin view of abandoned bookings
  if (event.httpMethod === "GET") {
    const auth = event.headers["authorization"] || "";
    const secret = process.env.ADMIN_SECRET;
    if (!secret || auth !== `Bearer ${secret}`) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const { data, error } = await supabase
      .from("partial_bookings")
      .select("*")
      .eq("completed", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("partial_bookings list failed:", error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partials: data || [] }),
    };
  }

  // POST — save partial booking from browser
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { trailerId, trailerName, name, email, phone, pickup, dropoff, days } = body;

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "email required" }) };
  }

  const { error } = await supabase.from("partial_bookings").upsert(
    {
      customer_email: email,
      trailer_id: trailerId || null,
      trailer_name: trailerName || null,
      customer_name: name || null,
      customer_phone: phone || null,
      pickup: pickup || null,
      dropoff: dropoff || null,
      days: days || null,
      completed: false,
      follow_up_sent: false,
    },
    { onConflict: "customer_email" }
  );

  if (error) {
    console.error("partial_bookings upsert failed:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
