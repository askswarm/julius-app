import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { chatId, zeitpunkt, items } = await req.json();
    const datum = new Date().toISOString().split("T")[0];

    const { error } = await supabaseServer
      .from("supplement_log")
      .upsert(
        { chat_id: chatId, datum, zeitpunkt, items: items || [] },
        { onConflict: "chat_id,datum,zeitpunkt" }
      );

    if (error) {
      // Fallback: try insert
      await supabaseServer
        .from("supplement_log")
        .insert({ chat_id: chatId, datum, zeitpunkt });
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

  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const datum = new Date().toISOString().split("T")[0];

  const { data } = await supabaseServer
    .from("supplement_log")
    .select("zeitpunkt")
    .eq("chat_id", chatId)
    .eq("datum", datum);

  return NextResponse.json({ taken: (data || []).map((r) => r.zeitpunkt) });
}
