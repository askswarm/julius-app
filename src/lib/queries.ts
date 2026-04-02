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

export async function getTodaySupplements(chatId: number): Promise<string[]> {
  const { data } = await supabase
    .from("supplement_log")
    .select("zeitpunkt")
    .eq("chat_id", chatId)
    .eq("datum", today());
  return (data || []).map((r) => r.zeitpunkt);
}

export async function getTrainingLoad(chatId: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 2);
  const { data } = await supabase
    .from("training_log")
    .select("rpe, dauer_min")
    .eq("chat_id", chatId)
    .gte("datum", since.toISOString().split("T")[0]);
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
