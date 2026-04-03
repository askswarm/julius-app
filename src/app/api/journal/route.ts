import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, ...fields } = body;
    const datum = new Date().toISOString().split("T")[0];

    const { error } = await supabaseServer
      .from("journal_entries")
      .upsert({ chat_id: chatId, datum, ...fields }, { onConflict: "chat_id,datum" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const days = parseInt(searchParams.get("days") || "30");

  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabaseServer
    .from("journal_entries")
    .select("*")
    .eq("chat_id", chatId)
    .gte("datum", since.toISOString().split("T")[0])
    .order("datum", { ascending: false });

  // Fetch scores for correlation
  const { data: scores } = await supabaseServer
    .from("daily_scores")
    .select("datum, sleep, readiness")
    .eq("chat_id", chatId)
    .gte("datum", since.toISOString().split("T")[0]);

  return NextResponse.json({ entries: data || [], scores: scores || [] });
}
