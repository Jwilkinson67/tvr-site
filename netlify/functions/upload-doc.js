/**
 * TVR Upload — Netlify Function
 * Receives a base64-encoded file from the booking form and stores it
 * in Supabase Storage under docs/{sessionId}/{docId}-{filename}.
 */

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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: HEADERS, body: "" };

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { file, filename, mimeType, docId, sessionId } = body;
  if (!file || !filename || !mimeType || !docId || !sessionId) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `docs/${sessionId}/${docId}-${safeName}`;
  const buffer = Buffer.from(file, "base64");

  const { error } = await supabase.storage
    .from("rental-docs")
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    console.error("Storage upload error:", error);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ path }) };
};
