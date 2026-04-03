import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, typ, name, dauer_min, rpe, notizen, uebungen } = body;

    const datum = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseServer
      .from("training_log")
      .insert({
        chat_id: chatId,
        datum,
        typ,
        name,
        dauer_min,
        rpe,
        notizen: notizen || null,
        uebungen: uebungen || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, training: data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const days = parseInt(searchParams.get("days") || "14");

  if (!chatId) {
    return NextResponse.json({ error: "chatId required" }, { status: 400 });
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseServer
    .from("training_log")
    .select("*")
    .eq("chat_id", chatId)
    .gte("datum", since.toISOString().split("T")[0])
    .order("datum", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ trainings: data });
}
