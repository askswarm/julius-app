import { NextResponse } from "next/server";
import { USERS, TRAINING_SCHEDULE, SUPPLEMENT_SCHEDULE } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase-server";
import { analyzeAndAdapt } from "@/lib/adaptiveEngine";

export async function GET() {
  const dayOfWeek = new Date().getDay();
  const datum = new Date().toISOString().split("T")[0];
  const isTrainingDay = ![0, 3].includes(dayOfWeek);

  for (const [key, user] of Object.entries(USERS)) {
    const training = TRAINING_SCHEDULE[dayOfWeek]?.[key as "vincent" | "maria"] || "Ruhetag";

    // Auto-fill supplement_log: assume all taken
    const slots = Object.keys(SUPPLEMENT_SCHEDULE).filter(
      (k) => k !== "pre_wo" || isTrainingDay
    );
    for (const slot of slots) {
      await supabaseServer.from("supplement_log").upsert(
        { chat_id: user.id, datum, zeitpunkt: slot, eingenommen: true },
        { onConflict: "chat_id,datum,zeitpunkt" }
      );
    }

    // Fetch data for adaptive engine
    const { data: scores } = await supabaseServer
      .from("daily_scores")
      .select("readiness, sleep")
      .eq("chat_id", user.id)
      .eq("datum", datum)
      .maybeSingle();

    const { data: recentTraining } = await supabaseServer
      .from("training_log")
      .select("*")
      .eq("chat_id", user.id)
      .order("datum", { ascending: false })
      .limit(5);

    const { data: symptoms } = await supabaseServer
      .from("health_status")
      .select("symptom, severity, active")
      .eq("chat_id", user.id)
      .eq("active", true);

    const { data: bloodRows } = await supabaseServer
      .from("bloodwork")
      .select("marker, wert, datum")
      .eq("chat_id", user.id)
      .order("datum", { ascending: false });

    const bloodwork: Record<string, { wert: number; datum: string }> = {};
    (bloodRows || []).forEach((r) => {
      if (!bloodwork[r.marker]) bloodwork[r.marker] = { wert: r.wert, datum: r.datum };
    });

    const adaptations = analyzeAndAdapt(
      scores || null,
      recentTraining || [],
      (symptoms || []).map((s) => ({ ...s, active: s.active ?? true })),
      bloodwork,
    );

    // Log adaptations
    for (const a of adaptations) {
      await supabaseServer.from("adaptations_log").insert({
        chat_id: user.id, datum, trigger: a.trigger, category: a.category, description: a.message,
      });
    }

    // Build message
    const firstSupps = SUPPLEMENT_SCHEDULE.nuechtern.items.join(", ");
    let msg = `Heute: ${training}. Nuechtern-Supps: ${firstSupps}. Essensfenster ab ${user.essensfenster_start}.`;

    if (adaptations.length > 0) {
      const topAdapt = adaptations.slice(0, 2).map((a) => a.message).join(" ");
      msg += ` Anpassung: ${topAdapt}`;
    }

    await sendPushToUser(user.id, `Guten Morgen ${user.name}`, msg);
  }

  return NextResponse.json({ sent: true });
}
