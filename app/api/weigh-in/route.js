import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function respond(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function db(path, method = "GET", body, prefer) {
  const headers = { apikey: secret, "Content-Type": "application/json" };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(base + "/rest/v1/" + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store"
  });
  if (!response.ok) {
    console.error("Weigh In database failure", path.split("?")[0], response.status, (await response.text()).slice(0, 200));
    throw new Error("Database unavailable");
  }
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

async function verifiedInvestigator(request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const response = await fetch(base + "/auth/v1/user", {
    headers: { apikey: publicKey, Authorization: "Bearer " + token },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!user.id || !user.email_confirmed_at) return null;
  const profiles = await db("investigator_profiles?user_id=eq." + encodeURIComponent(user.id) + "&select=user_id,display_name");
  return profiles[0]?.display_name?.trim() ? user : null;
}

export async function GET(request) {
  if (!base || !publicKey || !secret) return respond({ error: "Voting service unavailable." }, 503);
  try {
    const user = await verifiedInvestigator(request);
    const [questions, options, votes] = await Promise.all([
      db("weigh_in_questions?published=eq.true&select=id,episode_number,question,created_at&order=episode_number.desc,created_at.desc"),
      db("weigh_in_options?select=id,question_id,option_text,display_order&order=display_order.asc"),
      db("weigh_in_votes?select=question_id,option_id" + (user ? ",user_id" : ""))
    ]);
    const myVotes = {};
    if (user) {
      for (const vote of votes) {
        if (vote.user_id === user.id) myVotes[vote.question_id] = vote.option_id;
      }
    }
    const result = questions.map(question => {
      const questionVotes = votes.filter(vote => vote.question_id === question.id);
      const questionOptions = options
        .filter(option => option.question_id === question.id)
        .map(option => ({
          id: option.id,
          option_text: option.option_text,
          votes: questionVotes.filter(vote => vote.option_id === option.id).length
        }));
      return { ...question, options: questionOptions, totalVotes: questionVotes.length };
    });
    return respond({ questions: result, myVotes });
  } catch (error) {
    console.error("Weigh In read", error.message);
    return respond({ error: "Unable to load episode polls." }, 503);
  }
}

export async function POST(request) {
  if (!base || !publicKey || !secret) return respond({ error: "Voting service unavailable." }, 503);
  try {
    const user = await verifiedInvestigator(request);
    if (!user) return respond({ error: "Sign in with a verified Investigator account to vote." }, 401);
    const body = await request.json();
    if (!uuid.test(body?.question_id || "") || !uuid.test(body?.option_id || "")) {
      return respond({ error: "Invalid vote." }, 400);
    }
    const questions = await db("weigh_in_questions?id=eq." + encodeURIComponent(body.question_id) + "&published=eq.true&select=id");
    if (!questions.length) return respond({ error: "This poll is not available." }, 404);
    const options = await db("weigh_in_options?id=eq." + encodeURIComponent(body.option_id) + "&question_id=eq." + encodeURIComponent(body.question_id) + "&select=id");
    if (!options.length) return respond({ error: "Invalid answer choice." }, 400);
    await db(
      "weigh_in_votes?on_conflict=question_id,user_id",
      "POST",
      { question_id: body.question_id, option_id: body.option_id, user_id: user.id },
      "resolution=merge-duplicates,return=minimal"
    );
    return respond({ ok: true });
  } catch (error) {
    console.error("Weigh In vote", error.message);
    return respond({ error: "Unable to save your vote. Please try again." }, 503);
  }
}
