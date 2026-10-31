import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
 return NextResponse.json({ error: "Analytics connection pending" }, { status: 503 });
}
