import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/oura/sync`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ cron: "oura", ...data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Cron failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
