import { NextResponse } from "next/server";
import { USERS } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const datum = new Date().toISOString().split("T")[0];

  for (const [, user] of Object.entries(USERS)) {
    const [mealsRes, trainingRes, ouraRes] = await Promise.all([
      supabaseServer.from("nutrition_log").select("kalorien, protein_g").eq("chat_id", user.id).eq("datum", datum),
      supabaseServer.from("training_log").select("typ, dauer_min").eq("chat_id", user.id).eq("datum", datum),
      supabaseServer.from("oura_data").select("active_calories, total_calories, steps").eq("chat_id", user.id).eq("datum", datum).maybeSingle(),
    ]);

    const meals = mealsRes.data || [];
    const training = trainingRes.data || [];
    const oura = ouraRes.data;

    const kcalEaten = meals.reduce((s, m) => s + (m.kalorien || 0), 0);
    const protein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
    const trained = training.length > 0;
    const totalBurned = oura?.total_calories || 0;
    const steps = oura?.steps || 0;

    let msg = `${kcalEaten} kcal gegessen, ${protein}g Protein. Training: ${trained ? "erledigt" : "nicht geloggt"}.`;

    if (totalBurned > 0) {
      const delta = totalBurned - kcalEaten;
      if (delta > 500) {
        msg += ` Verbrannt: ${totalBurned} kcal — Defizit ${delta} kcal. Zu viel — iss noch einen Quark oder Shake.`;
      } else if (delta > 0) {
        msg += ` Verbrannt: ${totalBurned} kcal — leichtes Defizit ${delta} kcal.`;
      } else {
        msg += ` Verbrannt: ${totalBurned} kcal — Surplus ${Math.abs(delta)} kcal.`;
      }
    }

    if (steps > 0) msg += ` ${steps.toLocaleString()} Schritte.`;
    msg += " Glycin + Magnesium nicht vergessen.";

    await sendPushToUser(user.id, "Tages-Zusammenfassung", msg);
  }

  return NextResponse.json({ sent: true });
}
