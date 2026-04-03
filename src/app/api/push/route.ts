import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { chatId, subscription } = await req.json();

    const { error } = await supabaseServer
      .from("push_subscriptions")
      .upsert(
        { chat_id: chatId, subscription, updated_at: new Date().toISOString() },
        { onConflict: "chat_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
