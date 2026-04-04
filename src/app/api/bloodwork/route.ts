import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { chatId, datum, markers } = await req.json();
    for (const m of markers) {
      await supabaseServer.from("bloodwork").upsert(
        { chat_id: chatId, datum, marker: m.marker, wert: m.wert, einheit: m.einheit || "" },
        { onConflict: "chat_id,datum,marker" }
      );
    }
    return NextResponse.json({ success: true, count: markers.length });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const chatId = new URL(req.url).searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const { data } = await supabaseServer
    .from("bloodwork")
    .select("marker, wert, einheit, datum")
    .eq("chat_id", chatId)
    .order("datum", { ascending: false });

  // Group by marker, latest first
  const latest: Record<string, { wert: number; einheit: string; datum: string }> = {};
  (data || []).forEach((r) => {
    if (!latest[r.marker]) latest[r.marker] = { wert: r.wert, einheit: r.einheit, datum: r.datum };
  });

  return NextResponse.json({ bloodwork: latest, raw: data || [] });
}
