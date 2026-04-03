import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { chatId, datum, dosis_mg, stelle, notizen } = await req.json();

    const { error } = await supabaseServer.from("trt_log").insert({
      chat_id: chatId,
      datum: datum || new Date().toISOString().split("T")[0],
      dosis_mg: dosis_mg || 60,
      stelle: stelle || "Bauch",
      notizen: notizen || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const { data } = await supabaseServer
    .from("trt_log")
    .select("*")
    .eq("chat_id", chatId)
    .order("datum", { ascending: false })
    .limit(10);

  return NextResponse.json({ logs: data || [] });
}
