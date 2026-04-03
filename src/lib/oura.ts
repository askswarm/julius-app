const BASE = "https://api.ouraring.com/v2/usercollection";

async function ouraFetch(token: string, endpoint: string, startDate: string, endDate: string) {
  const res = await fetch(`${BASE}/${endpoint}?start_date=${startDate}&end_date=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Oura API ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getOuraSleep(token: string, date: string) {
  const data = await ouraFetch(token, "daily_sleep", date, date);
  const entry = data.data?.[0];
  if (!entry) return null;
  return {
    score: entry.score,
    deep_sleep_min: Math.round((entry.contributors?.deep_sleep || 0) / 60),
    rem_sleep_min: Math.round((entry.contributors?.rem_sleep || 0) / 60),
    light_sleep_min: Math.round((entry.contributors?.light_sleep || 0) / 60),
    total_sleep_min: Math.round((entry.contributors?.total_sleep || 0) / 60),
    efficiency: entry.contributors?.efficiency || 0,
    latency: entry.contributors?.latency || 0,
  };
}

export async function getOuraReadiness(token: string, date: string) {
  const data = await ouraFetch(token, "daily_readiness", date, date);
  const entry = data.data?.[0];
  if (!entry) return null;
  return { score: entry.score, contributors: entry.contributors || {} };
}

export async function getOuraActivity(token: string, date: string) {
  const data = await ouraFetch(token, "daily_activity", date, date);
  const entry = data.data?.[0];
  if (!entry) return null;
  return {
    score: entry.score,
    active_calories: entry.active_calories || 0,
    total_calories: entry.total_calories || 0,
    steps: entry.steps || 0,
    high_activity_min: entry.high_activity_time ? Math.round(entry.high_activity_time / 60) : 0,
    medium_activity_min: entry.medium_activity_time ? Math.round(entry.medium_activity_time / 60) : 0,
    low_activity_min: entry.low_activity_time ? Math.round(entry.low_activity_time / 60) : 0,
  };
}

export async function getOuraHeartRate(token: string, date: string) {
  const data = await ouraFetch(token, "heartrate", date, date);
  const points = data.data || [];
  if (!points.length) return null;
  const bpms = points.map((p: { bpm: number }) => p.bpm).filter(Boolean);
  return {
    resting_hr: Math.min(...bpms),
    avg_hr: Math.round(bpms.reduce((a: number, b: number) => a + b, 0) / bpms.length),
    data_points: points.length,
  };
}

export async function getOuraWorkouts(token: string, date: string) {
  const data = await ouraFetch(token, "workout", date, date);
  return (data.data || []).map((w: { activity: string; calories: number; duration: number; distance: number; intensity: string; start_datetime: string; end_datetime: string }) => ({
    activity: w.activity,
    calories: w.calories || 0,
    duration_sec: w.duration || 0,
    distance_m: w.distance || 0,
    intensity: w.intensity || "unknown",
    start: w.start_datetime,
    end: w.end_datetime,
  }));
}
