import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

  const [vials, cycles, logs] = await Promise.all([
    supabaseServer.from("peptide_vials").select("*").eq("chat_id", chatId).eq("active", true).order("created_at", { ascending: false }),
    supabaseServer.from("peptide_cycles").select("*").eq("chat_id", chatId).eq("status", "active"),
    supabaseServer.from("peptide_log").select("*").eq("chat_id", chatId).eq("datum", new Date().toISOString().split("T")[0]),
  ]);

  return NextResponse.json({
    vials: vials.data || [],
    cycles: cycles.data || [],
    todayLogs: logs.data || [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, chatId, ...data } = body;

    if (action === "log_injection") {
      const datum = new Date().toISOString().split("T")[0];
      await supabaseServer.from("peptide_log").insert({
        chat_id: chatId, datum,
        peptide_name: data.peptide_name,
        dosis_mcg: data.dosis_mcg,
        volume_ml: data.volume_ml,
        injection_site: data.injection_site,
        vial_id: data.vial_id,
        notizen: data.notizen || null,
      });

      // Update remaining volume
      if (data.vial_id && data.volume_ml) {
        const { data: vial } = await supabaseServer
          .from("peptide_vials")
          .select("remaining_volume_ml")
          .eq("id", data.vial_id)
          .single();

        if (vial) {
          await supabaseServer.from("peptide_vials")
            .update({ remaining_volume_ml: Math.max(0, (vial.remaining_volume_ml || 0) - data.volume_ml) })
            .eq("id", data.vial_id);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "add_vial") {
      await supabaseServer.from("peptide_vials").insert({
        chat_id: chatId,
        peptide_name: data.peptide_name,
        concentration_mg_ml: data.concentration_mg_ml,
        total_volume_ml: data.total_volume_ml,
        remaining_volume_ml: data.total_volume_ml,
        reconstitution_date: data.reconstitution_date || new Date().toISOString().split("T")[0],
        storage: data.storage || "Kuehlschrank",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "start_cycle") {
      await supabaseServer.from("peptide_cycles").insert({
        chat_id: chatId,
        peptide_name: data.peptide_name,
        cycle_start: data.cycle_start || new Date().toISOString().split("T")[0],
        planned_duration_days: data.planned_duration_days,
        frequency: data.frequency,
        status: "active",
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
