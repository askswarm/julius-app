import { supabase } from "./supabase";
import type { DailyScore, NutritionEntry, TrainingEntry, MacroSummary } from "./types";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function mondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export async function getTodayScores(chatId: number): Promise<DailyScore | null> {
  const { data } = await supabase
    .from("daily_scores")
    .select("readiness, sleep, day_status")
    .eq("chat_id", chatId)
    .eq("datum", today())
    .maybeSingle();
  return data;
}

export async function getTodayMacros(chatId: number): Promise<MacroSummary> {
  const { data: meals } = await supabase
    .from("nutrition_log")
    .select("kalorien, protein_g, kohlenhydrate_g, fett_g")
    .eq("chat_id", chatId)
    .eq("datum", today());

  const { data: water } = await supabase
    .from("hydration_log")
    .select("menge_ml")
    .eq("chat_id", chatId)
    .eq("datum", today());

  const m = meals || [];
  const w = water || [];

  return {
    kcal: m.reduce((s, r) => s + (r.kalorien || 0), 0),
    protein_g: m.reduce((s, r) => s + (r.protein_g || 0), 0),
    carbs_g: m.reduce((s, r) => s + (r.kohlenhydrate_g || 0), 0),
    fett_g: m.reduce((s, r) => s + (r.fett_g || 0), 0),
    wasser_ml: w.reduce((s, r) => s + (r.menge_ml || 0), 0),
  };
}

export async function getTodayMeals(chatId: number): Promise<NutritionEntry[]> {
  const { data } = await supabase
    .from("nutrition_log")
    .select("*")
    .eq("chat_id", chatId)
    .eq("datum", today())
    .order("created_at");
  return data || [];
}

export async function getTodayTraining(chatId: number): Promise<TrainingEntry[]> {
  const { data } = await supabase
    .from("training_log")
    .select("*")
    .eq("chat_id", chatId)
    .eq("datum", today())
    .order("created_at");
  return data || [];
}

export async function getRecentTraining(chatId: number, days: number = 14): Promise<TrainingEntry[]> {
  const { data } = await supabase
    .from("training_log")
    .select("*")
    .eq("chat_id", chatId)
    .gte("datum", daysAgo(days))
    .order("datum", { ascending: false });
  return data || [];
}

export async function getTodaySupplements(chatId: number): Promise<string[]> {
  const { data } = await supabase
    .from("supplement_log")
    .select("zeitpunkt")
    .eq("chat_id", chatId)
    .eq("datum", today());
  return (data || []).map((r) => r.zeitpunkt);
}

export async function getTrainingLoad(chatId: number): Promise<number> {
  const { data } = await supabase
    .from("training_log")
    .select("rpe, dauer_min")
    .eq("chat_id", chatId)
    .gte("datum", daysAgo(2));
  return (data || []).reduce((s, r) => s + (r.rpe || 5) * (r.dauer_min || 45), 0);
}

export async function getWeekMeals(chatId: number): Promise<NutritionEntry[]> {
  const { data } = await supabase
    .from("nutrition_log")
    .select("*")
    .eq("chat_id", chatId)
    .gte("datum", mondayOfWeek())
    .order("datum")
    .order("created_at");
  return data || [];
}

export async function getScoreHistory(chatId: number, days: number = 14): Promise<DailyScore[]> {
  const { data } = await supabase
    .from("daily_scores")
    .select("datum, readiness, sleep, day_status")
    .eq("chat_id", chatId)
    .gte("datum", daysAgo(days))
    .order("datum");
  return (data || []) as DailyScore[];
}

export async function getLatestBloodwork(chatId: number): Promise<Record<string, { wert: number; datum: string }>> {
  const { data } = await supabase
    .from("bloodwork")
    .select("marker, wert, datum")
    .eq("chat_id", chatId)
    .order("datum", { ascending: false });
  const latest: Record<string, { wert: number; datum: string }> = {};
  (data || []).forEach((r) => {
    if (!latest[r.marker]) latest[r.marker] = { wert: r.wert, datum: r.datum };
  });
  return latest;
}

export async function getTodayOura(chatId: number) {
  const { data } = await supabase
    .from("oura_data")
    .select("*")
    .eq("chat_id", chatId)
    .eq("datum", today())
    .maybeSingle();
  return data;
}

export async function getOuraHistory(chatId: number, days: number = 14) {
  const { data } = await supabase
    .from("oura_data")
    .select("datum, sleep_score, readiness_score, deep_sleep_min, rem_sleep_min, light_sleep_min, total_sleep_min, sleep_efficiency, resting_hr, active_calories, steps, avg_hrv, lowest_hr, stress_score, vo2_max, cardiovascular_age, spo2_percentage, temperature_deviation, resilience_level")
    .eq("chat_id", chatId)
    .gte("datum", daysAgo(days))
    .order("datum");
  return data || [];
}

export async function getRecentAdaptations(chatId: number, days: number = 7): Promise<{ datum: string; trigger: string; category: string; description: string }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from("adaptations_log")
    .select("datum, trigger, category, description")
    .eq("chat_id", chatId)
    .gte("datum", since.toISOString().split("T")[0])
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

export async function getActiveSymptoms(chatId: number): Promise<{ symptom: string; severity: string; started_at: string }[]> {
  const { data } = await supabase
    .from("health_status")
    .select("symptom, severity, started_at")
    .eq("chat_id", chatId)
    .eq("active", true);
  return data || [];
}

export async function getTodayMacroAdjustment(chatId: number): Promise<{ kcal: number; protein: number }> {
  const { data } = await supabase
    .from("macro_adjustments")
    .select("kcal_adjustment, protein_adjustment")
    .eq("chat_id", chatId)
    .eq("datum", today())
    .maybeSingle();
  return { kcal: data?.kcal_adjustment || 0, protein: data?.protein_adjustment || 0 };
}

export async function getWeekTrainingCount(chatId: number): Promise<{total: number; byType: Record<string, number>}> {
  const { data } = await supabase
    .from("training_log")
    .select("typ")
    .eq("chat_id", chatId)
    .gte("datum", mondayOfWeek());
  const rows = data || [];
  const byType: Record<string, number> = {};
  rows.forEach((r) => { byType[r.typ] = (byType[r.typ] || 0) + 1; });
  return { total: rows.length, byType };
}
