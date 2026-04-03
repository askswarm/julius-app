import type { UserProfile } from "./types";

type Goal = "recomp" | "maintain" | "cut";

const GOAL_FACTOR: Record<Goal, number> = {
  recomp: 0.5,
  maintain: 0.8,
  cut: 0.3,
};

export function calculateDynamicKcal(
  user: UserProfile,
  activeCalories: number,
  macroAdjKcal: number,
  goal: Goal = "recomp",
): {
  target: number;
  base: number;
  activityBonus: number;
  trainingBonus: number;
  label: string;
} {
  const base = user.kcal_training;
  const factor = GOAL_FACTOR[goal];
  const activityBonus = Math.round(activeCalories * factor);
  const trainingBonus = macroAdjKcal;
  const target = base + activityBonus + trainingBonus;

  const parts: string[] = [`${base} Basis`];
  if (activityBonus > 0) parts.push(`+${activityBonus} Aktivitaet`);
  if (trainingBonus > 0) parts.push(`+${trainingBonus} Training`);

  return { target, base, activityBonus, trainingBonus, label: parts.join(" ") };
}

export function calculateDynamicProtein(baseProtein: number, trainingType: string | null): number {
  if (!trainingType) return baseProtein;
  const lower = trainingType.toLowerCase();
  if (["kraft", "hyrox", "crossfit", "trx"].some((t) => lower.includes(t))) return baseProtein + 20;
  if (["laufen", "schwimmen", "rudern", "radfahren"].some((t) => lower.includes(t))) return baseProtein + 10;
  return baseProtein;
}
