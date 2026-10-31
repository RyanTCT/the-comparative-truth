import { NextResponse } from "next/server";

export const runtime = "nodejs";

const limits = { name: 120, email: 200, topic: 200, background: 2000, perspective: 3000, sources: 2000 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalid = (message, status = 400) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://www.comparativetruth.com";
  if (!origin || origin !== allowedOrigin) return invalid("Submission origin not permitted.", 403);

  const size = Number(request.headers.get("content-length") || 0);
  if (size > 12000) return invalid("Submission is too large.", 413);

  let input;
  try {
    const raw = await request.text();
    if (raw.length > 12000) return invalid("Submission is too large.", 413);
    input = JSON.parse(raw);
  } catch {
    return invalid("Invalid submission.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid("Invalid submission.");
  // Hidden honeypot field: legitimate visitors leave it blank.
  if (input.website) return NextResponse.json({ ok: true }, { status: 200 });

  const submission_type = input.submission_type;
  if (!["guest", "idea"].includes(submission_type)) return invalid("Choose a submission type.");
  const fields = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = input[key] ?? "";
    if (typeof value !== "string" || value.length > max) return invalid("Please check the length of your answers.");
    fields[key] = value.trim();
  }
  if (!fields.name || !fields.topic || !fields.perspective) return invalid("Please complete all required fields.");
  if (submission_type === "guest" && (!fields.email || !fields.background)) return invalid("Please complete all guest application fields.");
  if (fields.email && !emailPattern.test(fields.email)) return invalid("Enter a valid email address.");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
    console.error("Join submission endpoint is not configured.");
    return invalid("Submissions are temporarily unavailable. Please try again later.", 503);
  }

  try {
    const response = await fetch(url.replace(/\/$/, "") + "/rest/v1/show_submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        submission_type,
        name: fields.name,
        email: fields.email || null,
        topic: fields.topic,
        background: submission_type === "guest" ? fields.background : null,
        perspective: fields.perspective,
        sources: submission_type === "idea" ? (fields.sources || null) : null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error("Supabase submission insert failed:", response.status);
      return invalid("We couldn't save your submission. Please try again later.", 502);
    }
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Join submission request failed:", error?.name || "unknown");
    return invalid("We couldn't save your submission. Please try again later.", 502);
  }
}
