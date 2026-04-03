import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const chatId = new URL(req.url).searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const { data } = await supabaseServer.from("peptide_vials").select("*").eq("chat_id", chatId).eq("active", true);
  return NextResponse.json({ vials: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await supabaseServer.from("peptide_vials").insert(body);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...fields } = await req.json();
    await supabaseServer.from("peptide_vials").update(fields).eq("id", id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
