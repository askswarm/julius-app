import { NextResponse } from "next/server";
import { USERS, SUPPLEMENT_SCHEDULE } from "@/lib/constants";
import { sendPushToUser } from "@/lib/push";
import { supabaseServer } from "@/lib/supabase-server";

const TRT_DAYS = [3, 6]; // Mi, Sa
const SLOT_HOURS: Record<string, number> = { nuechtern: 7, fruehstueck: 9, mittag: 13, abend: 19 };

export async function GET() {
  const now = new Date();
  const currentHour = now.getUTCHours() + 2; // Berlin = UTC+2
  const dayOfWeek = now.getDay();
  const datum = now.toISOString().split("T")[0];
  const sent: string[] = [];

  for (const [, user] of Object.entries(USERS)) {
    // Check notification preferences
    const { data: settings } = await supabaseServer
      .from("user_settings")
      .select("key, value")
      .eq("chat_id", user.id)
      .in("key", ["push_supplement", "push_trt", "push_peptide", "push_bloodwork"]);

    const prefs: Record<string, boolean> = {};
    (settings || []).forEach((s) => { prefs[s.key] = s.value !== "false"; });

    // Supplement reminders
    if (prefs.push_supplement !== false) {
      for (const [slot, hour] of Object.entries(SLOT_HOURS)) {
        if (Math.floor(currentHour) === hour) {
          const items = SUPPLEMENT_SCHEDULE[slot as keyof typeof SUPPLEMENT_SCHEDULE]?.items || [];
          if (items.length > 0) {
            await sendPushToUser(user.id, "Stack faellig", `${items.join(", ")}`);
            sent.push(`supps-${slot}-${user.name}`);
          }
        }
      }
    }

    // TRT reminders (9:00 on injection days)
    if (prefs.push_trt !== false && TRT_DAYS.includes(dayOfWeek) && Math.floor(currentHour) === 9) {
      await sendPushToUser(user.id, "TRT Injektion heute", "60mg Test Cypionate — SubQ");
      sent.push(`trt-${user.name}`);
    }

    // Peptide reminders (check active cycles)
    if (prefs.push_peptide !== false && Math.floor(currentHour) === 8) {
      const { data: cycles } = await supabaseServer
        .from("peptide_cycles")
        .select("peptide_name")
        .eq("chat_id", user.id)
        .eq("status", "active");
      if (cycles?.length) {
        await sendPushToUser(user.id, "Peptide faellig", cycles.map((c) => c.peptide_name).join(", "));
        sent.push(`peptide-${user.name}`);
      }
    }

    // Bloodwork reminder: check last entry, remind if >56 days old
    if (prefs.push_bloodwork !== false && Math.floor(currentHour) === 10 && dayOfWeek === 1) {
      const { data: lastBw } = await supabaseServer
        .from("bloodwork")
        .select("datum")
        .eq("chat_id", user.id)
        .order("datum", { ascending: false })
        .limit(1);
      const lastDate = lastBw?.[0]?.datum;
      if (!lastDate || (Date.now() - new Date(lastDate).getTime()) > 56 * 86400000) {
        await sendPushToUser(user.id, "Blutwerte faellig", "Dein letzter Bluttest ist ueber 8 Wochen her.");
        sent.push(`bloodwork-${user.name}`);
      }
    }
  }

  return NextResponse.json({ sent, timestamp: now.toISOString() });
}
