import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { USERS } from "@/lib/constants";
import { getOuraSleep, getOuraReadiness, getOuraActivity, getOuraHeartRate, getOuraWorkouts } from "@/lib/oura";

export async function GET(req: NextRequest) {
  const token = process.env.OURA_PAT;
  if (!token) {
    return NextResponse.json({ error: "OURA_PAT not configured" }, { status: 501 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const datum = dateParam || new Date().toISOString().split("T")[0];

  // Sync for both users (same Oura token — Vincent's ring)
  const chatId = USERS.vincent.id;

  try {
    const [sleep, readiness, activity, hr, workouts] = await Promise.allSettled([
      getOuraSleep(token, datum),
      getOuraReadiness(token, datum),
      getOuraActivity(token, datum),
      getOuraHeartRate(token, datum),
      getOuraWorkouts(token, datum),
    ]);

    const sleepData = sleep.status === "fulfilled" ? sleep.value : null;
    const readinessData = readiness.status === "fulfilled" ? readiness.value : null;
    const activityData = activity.status === "fulfilled" ? activity.value : null;
    const hrData = hr.status === "fulfilled" ? hr.value : null;
    const workoutsData = workouts.status === "fulfilled" ? workouts.value : [];

    // Upsert oura_data
    await supabaseServer.from("oura_data").upsert({
      chat_id: chatId,
      datum,
      readiness_score: readinessData?.score || null,
      sleep_score: sleepData?.score || null,
      deep_sleep_min: sleepData?.deep_sleep_min || null,
      rem_sleep_min: sleepData?.rem_sleep_min || null,
      light_sleep_min: sleepData?.light_sleep_min || null,
      total_sleep_min: sleepData?.total_sleep_min || null,
      sleep_efficiency: sleepData?.efficiency || null,
      resting_hr: hrData?.resting_hr || null,
      active_calories: activityData?.active_calories || null,
      total_calories: activityData?.total_calories || null,
      steps: activityData?.steps || null,
      workouts: workoutsData.length > 0 ? workoutsData : null,
      raw_data: { sleep: sleepData, readiness: readinessData, activity: activityData, hr: hrData },
    }, { onConflict: "chat_id,datum" });

    // Also upsert daily_scores for backward compat
    const sleepScore = sleepData?.score || null;
    const readinessScore = readinessData?.score || null;
    let dayStatus = "GELB";
    if (readinessScore && readinessScore >= 85) dayStatus = "GRUEN";
    else if (readinessScore && readinessScore < 60) dayStatus = "ROT";
    else if (readinessScore && readinessScore < 40) dayStatus = "ALARM";

    await supabaseServer.from("daily_scores").upsert({
      chat_id: chatId,
      datum,
      sleep: sleepScore,
      readiness: readinessScore,
      day_status: dayStatus,
    }, { onConflict: "chat_id,datum" });

    return NextResponse.json({
      success: true,
      datum,
      sleep: sleepScore,
      readiness: readinessScore,
      steps: activityData?.steps,
      active_calories: activityData?.active_calories,
      workouts: workoutsData.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Oura sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
