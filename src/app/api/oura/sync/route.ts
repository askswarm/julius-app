import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { USERS } from "@/lib/constants";
import { fetchAllOuraData } from "@/lib/oura";

export async function GET(req: NextRequest) {
  const token = process.env.OURA_PAT;
  if (!token) {
    return NextResponse.json({ error: "OURA_PAT not configured" }, { status: 501 });
  }

  const { searchParams } = new URL(req.url);
  const datum = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const chatId = USERS.vincent.id;

  try {
    const d = await fetchAllOuraData(token, datum);

    // Upsert full oura_data
    await supabaseServer.from("oura_data").upsert({
      chat_id: chatId,
      datum,
      readiness_score: d.readiness?.score || null,
      sleep_score: d.sleep_score?.score || null,
      deep_sleep_min: d.sleep_detail?.deep_min || null,
      rem_sleep_min: d.sleep_detail?.rem_min || null,
      light_sleep_min: d.sleep_detail?.light_min || null,
      total_sleep_min: d.sleep_detail?.total_min || null,
      awake_min: d.sleep_detail?.awake_min || null,
      sleep_efficiency: d.sleep_detail?.efficiency || null,
      hypnogram: d.sleep_detail?.hypnogram || null,
      bedtime_start: d.sleep_detail?.bedtime_start || null,
      bedtime_end: d.sleep_detail?.bedtime_end || null,
      avg_hrv: d.sleep_detail?.avg_hrv || null,
      avg_hr_night: d.sleep_detail?.avg_hr || null,
      lowest_hr: d.sleep_detail?.lowest_hr || null,
      resting_hr: d.sleep_detail?.lowest_hr || null,
      active_calories: d.activity?.active_calories || null,
      total_calories: d.activity?.total_calories || null,
      steps: d.activity?.steps || null,
      distance_m: d.activity?.distance_m || null,
      high_activity_min: d.activity?.high_min || null,
      medium_activity_min: d.activity?.medium_min || null,
      low_activity_min: d.activity?.low_min || null,
      sedentary_min: d.activity?.sedentary_min || null,
      stress_score: d.stress?.score || null,
      stress_high_min: d.stress?.high_min || null,
      recovery_high_min: d.stress?.recovery_min || null,
      cardiovascular_age: d.cardiovascular_age || null,
      resilience_level: d.resilience?.level || null,
      vo2_max: d.vo2_max || null,
      spo2_percentage: d.spo2?.percentage || null,
      spo2_bdi: d.spo2?.bdi || null,
      recommended_bedtime: d.sleep_time?.optimal_bedtime || null,
      temperature_deviation: d.readiness?.temperature_deviation || null,
      workouts_data: d.workouts.length > 0 ? d.workouts : null,
      heart_rate_data: d.heart_rate.length > 0 ? d.heart_rate.slice(0, 100) : null,
      raw_data: { readiness: d.readiness, sleep_score: d.sleep_score, activity: d.activity, resilience: d.resilience },
    }, { onConflict: "chat_id,datum" });

    // Upsert daily_scores for backward compat
    const sleepScore = d.sleep_score?.score || null;
    const readinessScore = d.readiness?.score || null;
    let dayStatus = "GELB";
    if (readinessScore && readinessScore >= 85) dayStatus = "GRUEN";
    else if (readinessScore && readinessScore < 60) dayStatus = "ROT";
    else if (readinessScore && readinessScore < 40) dayStatus = "ALARM";

    await supabaseServer.from("daily_scores").upsert({
      chat_id: chatId, datum, sleep: sleepScore, readiness: readinessScore, day_status: dayStatus,
    }, { onConflict: "chat_id,datum" });

    return NextResponse.json({
      success: true, datum,
      sleep: sleepScore, readiness: readinessScore,
      steps: d.activity?.steps, active_calories: d.activity?.active_calories,
      vo2_max: d.vo2_max, cardiovascular_age: d.cardiovascular_age,
      workouts: d.workouts.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Oura sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
