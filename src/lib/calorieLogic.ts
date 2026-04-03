import type { UserProfile } from "./types";

export function calculateDynamicKcal(user: UserProfile, activeCalories: number, macroAdjKcal: number): {
  target: number;
  base: number;
  activityBonus: number;
  trainingBonus: number;
  label: string;
} {
  const base = user.kcal_training;
  const activityBonus = Math.round(activeCalories * 0.5); // 50% of active cals as extra allowance
  const trainingBonus = macroAdjKcal;
  const target = base + activityBonus + trainingBonus;

  const parts: string[] = [`${base} Basis`];
  if (activityBonus > 0) parts.push(`+${activityBonus} Aktivitaet`);
  if (trainingBonus > 0) parts.push(`+${trainingBonus} Training`);

  return { target, base, activityBonus, trainingBonus, label: parts.join(" ") };
}
