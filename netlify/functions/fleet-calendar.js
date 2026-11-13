const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  const secret = event.headers["x-admin-secret"] || event.headers["authorization"]?.replace("Bearer ", "");
  if (!secret || secret !== (process.env.BOOKING_SECRET || "dev-secret")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_name, trailer_name, trailer_id, pickup, dropoff, status")
    .or("status.eq.completed,status.eq.approved")
    .order("pickup", { ascending: false });

  if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || []),
  };
};
