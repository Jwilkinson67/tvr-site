/**
 * TVR Booking API — Netlify Function
 *
 * Handles two actions (sent as JSON body):
 *   { action: "availability", trailerId }
 *     → returns booked date ranges for that trailer from Supabase
 *
 *   { action: "book", trailerId, pickup, dropoff, paymentMethodId,
 *             depositAmount, customer: { name, email, phone } }
 *     → checks availability, charges Stripe, saves booking to Supabase
 *
 * Required environment variables (set in Netlify dashboard → Site settings → Env vars):
 *   STRIPE_SECRET_KEY      sk_live_... (or sk_test_... while testing)
 *   SUPABASE_URL           https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY   service_role key (NOT the anon key)
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

function ok(body) {
  return { statusCode: 200, headers: HEADERS, body: JSON.stringify(body) };
}
function err(status, message) {
  return { statusCode: status, headers: HEADERS, body: JSON.stringify({ error: message }) };
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: HEADERS, body: "" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return err(400, "Invalid JSON body.");
  }

  // ── coupon validation ─────────────────────────────────────────────────────
  if (body.action === "coupon") {
    const { code } = body;
    const adminCode = process.env.ADMIN_COUPON_CODE;
    if (adminCode && code === adminCode) {
      return ok({ valid: true });
    }
    return ok({ valid: false });
  }

  // ── availability ──────────────────────────────────────────────────────────
  if (body.action === "availability") {
    const { trailerId } = body;
    if (!trailerId) return err(400, "trailerId required.");

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("bookings")
      .select("id, pickup, dropoff")
      .eq("trailer_id", trailerId)
      .gte("dropoff", today); // only future + current bookings

    if (error) {
      console.error("Supabase availability error:", error);
      return err(500, "Could not load availability.");
    }

    return ok({ bookings: data || [] });
  }

  // ── book ──────────────────────────────────────────────────────────────────
  if (body.action === "book") {
    const { trailerId, pickup, dropoff, paymentMethodId, depositAmount, couponCode, customer } = body;

    // Admin coupon: override charge to $1 regardless of depositAmount from client.
    const adminCode = process.env.ADMIN_COUPON_CODE;
    const couponValid = adminCode && couponCode === adminCode;
    const chargeAmount = couponValid ? 1 : depositAmount;

    // Validate required fields
    if (!trailerId || !pickup || !dropoff || !paymentMethodId || !chargeAmount) {
      return err(400, "Missing required booking fields.");
    }
    if (!customer?.name || !customer?.email) {
      return err(400, "Customer name and email required.");
    }
    if (pickup > dropoff) {
      return err(400, "Pickup must be before dropoff.");
    }

    // 1. Authoritative conflict check in Supabase
    //    A conflict exists when: existing.pickup <= new.dropoff AND existing.dropoff >= new.pickup
    const { data: conflicts, error: conflictErr } = await supabase
      .from("bookings")
      .select("pickup, dropoff")
      .eq("trailer_id", trailerId)
      .lte("pickup", dropoff)
      .gte("dropoff", pickup);

    if (conflictErr) {
      console.error("Conflict check error:", conflictErr);
      return err(500, "Could not verify availability. Please try again.");
    }
    if (conflicts && conflicts.length > 0) {
      return err(409, `That trailer is already booked for those dates (${conflicts[0].pickup} – ${conflicts[0].dropoff}). Please choose different dates.`);
    }

    // 2. Charge the deposit via Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(chargeAmount * 100), // Stripe uses cents
        currency: "usd",
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        confirm: true,
        description: `TVR deposit — ${trailerId} ${pickup} → ${dropoff}`,
        receipt_email: customer.email,
        metadata: {
          trailer_id: trailerId,
          pickup,
          dropoff,
          customer_name: customer.name,
          customer_phone: customer.phone || "",
        },
      });
    } catch (stripeErr) {
      console.error("Stripe error:", stripeErr);
      return err(402, stripeErr.message || "Card was declined. Please try a different card.");
    }

    if (paymentIntent.status !== "succeeded") {
      return err(402, `Payment status: ${paymentIntent.status}. Please try again or use a different card.`);
    }

    // 3. Save confirmed booking to Supabase
    const bookingId = "TVR-" + Date.now().toString(36).toUpperCase();
    const { error: insertErr } = await supabase.from("bookings").insert({
      id: bookingId,
      trailer_id: trailerId,
      pickup,
      dropoff,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || "",
      payment_intent_id: paymentIntent.id,
      deposit_amount: chargeAmount,
    });

    if (insertErr) {
      // Payment succeeded but DB write failed — log for manual recovery.
      // Don't return an error to the customer; their card was charged successfully.
      console.error("BOOKING SAVE FAILED — NEEDS MANUAL ATTENTION", {
        bookingId,
        paymentIntentId: paymentIntent.id,
        trailerId,
        pickup,
        dropoff,
        customer,
        supabaseError: insertErr,
      });
    }

    return ok({ success: true, bookingId });
  }

  return err(400, `Unknown action: ${body.action}`);
};
