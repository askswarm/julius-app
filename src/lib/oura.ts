const BASE = "https://api.ouraring.com/v2/usercollection";

async function ouraFetch(token: string, endpoint: string, startDate: string, endDate: string) {
  const res = await fetch(`${BASE}/${endpoint}?start_date=${startDate}&end_date=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Oura API ${res.status}`);
  return res.json();
}

function first(data: { data?: unknown[] }) {
  return data.data?.[0] as Record<string, unknown> | undefined;
}

export interface OuraFullData {
  readiness: { score: number; temperature_deviation: number; contributors: Record<string, number> } | null;
  sleep_score: { score: number; contributors: Record<string, number> } | null;
  sleep_detail: {
    deep_min: number; rem_min: number; light_min: number; total_min: number; awake_min: number;
    hypnogram: string; bedtime_start: string; bedtime_end: string;
    avg_hrv: number; lowest_hr: number; avg_hr: number; efficiency: number;
  } | null;
  activity: {
    score: number; active_calories: number; total_calories: number; steps: number; distance_m: number;
    high_min: number; medium_min: number; low_min: number; sedentary_min: number;
  } | null;
  workouts: { activity: string; calories: number; duration_min: number; distance_m: number; intensity: string; start: string; end: string }[];
  heart_rate: { bpm: number; timestamp: string }[];
  stress: { score: number; high_min: number; recovery_min: number } | null;
  cardiovascular_age: number | null;
  resilience: { level: string; contributors: Record<string, number> } | null;
  vo2_max: number | null;
  spo2: { percentage: number; bdi: number } | null;
  sleep_time: { recommendation: string; optimal_bedtime: string } | null;
}

export async function fetchAllOuraData(token: string, date: string): Promise<OuraFullData> {
  const [
    readinessR, sleepScoreR, sleepDetailR, activityR, workoutsR,
    heartRateR, stressR, cvAgeR, resilienceR, vo2R, spo2R, sleepTimeR,
  ] = await Promise.allSettled([
    ouraFetch(token, "daily_readiness", date, date),
    ouraFetch(token, "daily_sleep", date, date),
    ouraFetch(token, "sleep", date, date),
    ouraFetch(token, "daily_activity", date, date),
    ouraFetch(token, "workout", date, date),
    ouraFetch(token, "heartrate", date, date),
    ouraFetch(token, "daily_stress", date, date),
    ouraFetch(token, "daily_cardiovascular_age", date, date),
    ouraFetch(token, "daily_resilience", date, date),
    ouraFetch(token, "vo2_max", date, date),
    ouraFetch(token, "daily_spo2", date, date),
    ouraFetch(token, "sleep_time", date, date),
  ]);

  const v = (r: PromiseSettledResult<{ data?: unknown[] }>) => r.status === "fulfilled" ? r.value : null;

  // Readiness
  const re = first(v(readinessR) || { data: [] });
  const readiness = re ? {
    score: (re.score as number) || 0,
    temperature_deviation: (re.temperature_deviation as number) || 0,
    contributors: (re.contributors as Record<string, number>) || {},
  } : null;

  // Sleep score
  const ss = first(v(sleepScoreR) || { data: [] });
  const sleep_score = ss ? {
    score: (ss.score as number) || 0,
    contributors: (ss.contributors as Record<string, number>) || {},
  } : null;

  // Sleep detail
  const sd = first(v(sleepDetailR) || { data: [] });
  const sleep_detail = sd ? {
    deep_min: Math.round(((sd.deep_sleep_duration as number) || 0) / 60),
    rem_min: Math.round(((sd.rem_sleep_duration as number) || 0) / 60),
    light_min: Math.round(((sd.light_sleep_duration as number) || 0) / 60),
    total_min: Math.round(((sd.total_sleep_duration as number) || 0) / 60),
    awake_min: Math.round(((sd.awake_time as number) || 0) / 60),
    hypnogram: (sd.sleep_phase_5_min as string) || "",
    bedtime_start: (sd.bedtime_start as string) || "",
    bedtime_end: (sd.bedtime_end as string) || "",
    avg_hrv: (sd.average_hrv as number) || 0,
    lowest_hr: (sd.lowest_heart_rate as number) || 0,
    avg_hr: (sd.average_heart_rate as number) || 0,
    efficiency: (sd.efficiency as number) || 0,
  } : null;

  // Activity
  const ac = first(v(activityR) || { data: [] });
  const activity = ac ? {
    score: (ac.score as number) || 0,
    active_calories: (ac.active_calories as number) || 0,
    total_calories: (ac.total_calories as number) || 0,
    steps: (ac.steps as number) || 0,
    distance_m: (ac.equivalent_walking_distance as number) || 0,
    high_min: Math.round(((ac.high_activity_time as number) || 0) / 60),
    medium_min: Math.round(((ac.medium_activity_time as number) || 0) / 60),
    low_min: Math.round(((ac.low_activity_time as number) || 0) / 60),
    sedentary_min: Math.round(((ac.sedentary_time as number) || 0) / 60),
  } : null;

  // Workouts
  const wData = v(workoutsR);
  const workouts = ((wData?.data || []) as Record<string, unknown>[]).map((w) => ({
    activity: (w.activity as string) || "unknown",
    calories: (w.calories as number) || 0,
    duration_min: Math.round(((w.duration as number) || 0) / 60),
    distance_m: (w.distance as number) || 0,
    intensity: (w.intensity as string) || "unknown",
    start: (w.start_datetime as string) || "",
    end: (w.end_datetime as string) || "",
  }));

  // Heart rate
  const hrData = v(heartRateR);
  const heart_rate = ((hrData?.data || []) as Record<string, unknown>[]).map((p) => ({
    bpm: (p.bpm as number) || 0,
    timestamp: (p.timestamp as string) || "",
  }));

  // Stress
  const st = first(v(stressR) || { data: [] });
  const stress = st ? {
    score: (st.stress_high as number) || 0,
    high_min: (st.stress_high as number) || 0,
    recovery_min: (st.recovery_high as number) || 0,
  } : null;

  // Cardiovascular age
  const cv = first(v(cvAgeR) || { data: [] });
  const cardiovascular_age = cv ? (cv.vascular_age as number) || null : null;

  // Resilience
  const rl = first(v(resilienceR) || { data: [] });
  const resilience = rl ? {
    level: (rl.level as string) || "unknown",
    contributors: (rl.contributors as Record<string, number>) || {},
  } : null;

  // VO2 max
  const vo = first(v(vo2R) || { data: [] });
  const vo2_max = vo ? (vo.vo2_max as number) || null : null;

  // SpO2
  const sp = first(v(spo2R) || { data: [] });
  const spo2 = sp ? {
    percentage: (sp.spo2_percentage as number) || 0,
    bdi: (sp.breathing_disturbance_index as number) || 0,
  } : null;

  // Sleep time recommendation
  const slTime = first(v(sleepTimeR) || { data: [] });
  const sleep_time = slTime ? {
    recommendation: (slTime.recommendation as string) || "",
    optimal_bedtime: ((slTime.optimal_bedtime as Record<string, string>)?.start) || "",
  } : null;

  return {
    readiness, sleep_score, sleep_detail, activity, workouts,
    heart_rate, stress, cardiovascular_age, resilience, vo2_max, spo2, sleep_time,
  };
}
