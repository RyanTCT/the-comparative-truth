import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const runtime = "nodejs";

const limits = { name: 120, email: 200, topic: 200, background: 2000, perspective: 3000, sources: 2000 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const invalid = (message, status = 400) => NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });


async function notifyNewSubmission(type, fields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Submission saved; Resend notification is not configured.");
    return;
  }
  const label = type === "guest" ? "Guest Application" : "Investigation Suggestion";
  const safe = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const details = [
    ["Submission", label],
    ["Name", fields.name],
    ["Email", fields.email || "Not provided"],
    ["Topic", fields.topic],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#242424">
    <h1 style="color:#9d713c">New Incoming Lead</h1>
    <p>A new ${safe(label.toLowerCase())} was saved to The Comparative Truth.</p>
    ${details.map(([title,value]) => `<p><strong>${safe(title)}:</strong> ${safe(value)}</p>`).join("")}
    <p><a href="https://www.comparativetruth.com/admin">Open the Investigation Desk →</a></p>
    <p style="font-size:12px;color:#777">Sign in to review the complete submission and update its status.</p>
  </div>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Comparative Truth <notifications@comparativetruth.com>",
        to: ["jointheshow@comparativetruth.com"],
        subject: "Investigation Desk: New " + label,
        html,
      }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) {
      let code = "unknown";
      try { const data = await response.json(); code = data?.name || data?.statusCode || "unknown"; } catch {}
      console.error("Resend notification failed", { status: response.status, code });
    }
  } catch (error) {
    console.error("Resend notification request failed", error?.name || "unknown");
  }
}

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

  // Vercel supplies the client address through its trusted forwarding headers.
  // Reject requests with no usable address rather than sharing one global limit.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const visitorIp = [realIp, forwarded].find(value => value && isIP(value));
  if (!visitorIp) {
    console.error("Join submission missing valid visitor address.");
    return invalid("Submissions are temporarily unavailable. Please try again later.", 503);
  }

  // HMAC avoids storing raw visitor IPs; the existing server-only key is never sent.
  const visitorHash = createHmac("sha256", key)
    .update("join-show-rate-limit:v1:" + visitorIp).digest("hex");
  try {
    const check = await fetch(url.replace(/\/$/, "") + "/rest/v1/rpc/check_submission_rate_limit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": key },
      body: JSON.stringify({ p_visitor_hash: visitorHash }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!check.ok) {
      console.error("Submission rate-limit check failed", { status: check.status });
      return invalid("Submissions are temporarily unavailable. Please try again later.", 503);
    }
    const allowed = await check.json();
    if (allowed === false) {
      return NextResponse.json(
        { error: "You've reached the limit of five submissions per hour. Please try again later." },
        { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "3600" } }
      );
    }
    if (allowed !== true) {
      console.error("Submission rate-limit returned unexpected result.");
      return invalid("Submissions are temporarily unavailable. Please try again later.", 503);
    }
  } catch (error) {
    console.error("Submission rate-limit request failed", error?.name || "unknown");
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
      const diagnosticId = "SUPABASE_" + response.status;
      let errorCode = "unknown";
      try {
        const errorBody = await response.json();
        if (typeof errorBody?.code === "string" && /^[A-Za-z0-9_]{1,30}$/.test(errorBody.code)) errorCode = errorBody.code;
      } catch {}
      console.error("Join submission upstream failure", { status: response.status, code: errorCode });
      return invalid("We couldn't save your submission. Reference: " + diagnosticId + "_" + errorCode, 502);
    }
    await notifyNewSubmission(submission_type, fields);
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Join submission request failed:", error?.name || "unknown");
    return invalid("We couldn't save your submission. Reference: CONNECTION_ERROR", 502);
  }
}
