import { NextResponse } from "next/server";
import { USERS } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const datum = new Date().toISOString().split("T")[0];

  for (const [, user] of Object.entries(USERS)) {
    const { data: meals } = await supabaseServer
      .from("nutrition_log")
      .select("protein_g")
      .eq("chat_id", user.id)
      .eq("datum", datum);

    const totalProtein = (meals || []).reduce((s, m) => s + (m.protein_g || 0), 0);
    const remaining = user.protein_ziel_g - totalProtein;

    if (remaining > 50) {
      await sendPushToUser(
        user.id,
        "Protein-Check",
        `Noch ${remaining}g Protein offen. Mittagessen proteinreich planen.`
      );
    }
  }

  return NextResponse.json({ sent: true });
}
