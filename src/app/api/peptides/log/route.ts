import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  const peptide = searchParams.get("peptide");

  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  let query = supabaseServer.from("peptide_log").select("*").eq("chat_id", chatId).order("created_at", { ascending: false }).limit(20);
  if (peptide) query = query.eq("peptide_name", peptide);

  const { data } = await query;
  return NextResponse.json({ logs: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { chatId, peptide_name, dose_mcg, volume_ml, injection_site, vial_id, notes } = await req.json();

    await supabaseServer.from("peptide_log").insert({
      chat_id: chatId, peptide_name, dose_mcg, volume_ml, injection_site, vial_id, notes,
    });

    if (vial_id && volume_ml) {
      const { data: vial } = await supabaseServer.from("peptide_vials").select("remaining_volume_ml").eq("id", vial_id).single();
      if (vial) {
        await supabaseServer.from("peptide_vials").update({ remaining_volume_ml: Math.max(0, (vial.remaining_volume_ml || 0) - volume_ml) }).eq("id", vial_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
