import { NextResponse } from "next/server";
import { USERS } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const datum = new Date().toISOString().split("T")[0];

  for (const [, user] of Object.entries(USERS)) {
    const { data: meals } = await supabaseServer
      .from("nutrition_log")
      .select("kalorien, protein_g")
      .eq("chat_id", user.id)
      .eq("datum", datum);

    const { data: training } = await supabaseServer
      .from("training_log")
      .select("typ, dauer_min")
      .eq("chat_id", user.id)
      .eq("datum", datum);

    const kcal = (meals || []).reduce((s, m) => s + (m.kalorien || 0), 0);
    const protein = (meals || []).reduce((s, m) => s + (m.protein_g || 0), 0);
    const trained = (training || []).length > 0;

    await sendPushToUser(
      user.id,
      "Tages-Zusammenfassung",
      `${kcal} kcal, ${protein}g Protein. Training: ${trained ? "erledigt" : "nicht geloggt"}. Glycin + Magnesium nicht vergessen.`
    );
  }

  return NextResponse.json({ sent: true });
}
