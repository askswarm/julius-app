import type { NutritionEntry, TrainingEntry } from "./types";

interface Bloodwork {
  [key: string]: { wert: number; datum: string };
}

export interface SupplementTip {
  text: string;
  reason: string;
  severity: "green" | "yellow" | "red";
}

export function generateSupplementTips(
  meals: NutritionEntry[],
  trainings: TrainingEntry[],
  bloodwork: Bloodwork,
  userKey: string,
): SupplementTip[] {
  const tips: SupplementTip[] = [];

  // --- Nutrition-based ---
  const days = new Set(meals.map((m) => m.datum)).size || 1;
  const fischCount = meals.filter((m) =>
    (m.gericht_name || "").toLowerCase().match(/fisch|lachs|salmon|dorade|makrele|thunfisch|forelle/)
  ).length;

  if (fischCount >= 3) {
    tips.push({ text: "Omega-3 Dosis beibehalten", reason: `${fischCount}x Fisch diese Woche — gute EPA/DHA Zufuhr`, severity: "green" });
  } else if (fischCount === 0) {
    tips.push({ text: "Omega-3 auf 4 Kapseln erhoehen", reason: "Kein Fisch diese Woche. Supplementierung wichtiger.", severity: "yellow" });
  }

  const avgProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0) / days;
  if (avgProtein > 160) {
    tips.push({ text: "EAA-Dosis kann reduziert werden", reason: `Protein-Schnitt ${Math.round(avgProtein)}g/Tag — ueber Ziel`, severity: "green" });
  } else if (avgProtein < 120) {
    tips.push({ text: "EAA an Trainingstagen erhoehen", reason: `Protein-Schnitt nur ${Math.round(avgProtein)}g/Tag`, severity: "yellow" });
  }

  // --- Bloodwork-based ---
  if (bloodwork.vitamin_d) {
    if (bloodwork.vitamin_d.wert > 60) {
      tips.push({ text: "D3 Dosis auf 5000 IE reduzieren", reason: `Vitamin D bei ${bloodwork.vitamin_d.wert} ng/ml — ueber Optimum`, severity: "yellow" });
    } else if (bloodwork.vitamin_d.wert < 30) {
      tips.push({ text: "D3 auf 10000 IE erhoehen", reason: `Vitamin D nur ${bloodwork.vitamin_d.wert} ng/ml — nach 8 Wochen kontrollieren`, severity: "red" });
    }
  }

  if (bloodwork.haematokrit && bloodwork.haematokrit.wert > 52) {
    tips.push({ text: "WARNUNG: Haematokrit erhoeht", reason: `${bloodwork.haematokrit.wert}% — TRT-Dosis mit Arzt besprechen, Blutspende erwaegen`, severity: "red" });
  }

  if (bloodwork.hscrp && bloodwork.hscrp.wert > 2.0) {
    tips.push({ text: "Entzuendungswert erhoeht", reason: `hsCRP ${bloodwork.hscrp.wert} mg/l — mehr Omega-3, Kurkuma, weniger Zucker`, severity: "red" });
  }

  if (bloodwork.ferritin && bloodwork.ferritin.wert < 30 && userKey === "maria") {
    tips.push({ text: "Eisen-Supplementierung empfohlen", reason: `Ferritin nur ${bloodwork.ferritin.wert} ng/ml`, severity: "red" });
  }

  // --- Training-based ---
  const weekSessions = trainings.length;
  if (weekSessions >= 5) {
    tips.push({ text: "Glutamin auf 10g/Tag erhoehen", reason: `${weekSessions} Sessions diese Woche — erhoehter Bedarf`, severity: "yellow" });
  }

  const saunaCount = trainings.filter((t) => t.typ === "Sauna" || (t.name || "").toLowerCase().includes("sauna")).length;
  if (saunaCount >= 2) {
    tips.push({ text: "Elektrolyte nach jeder Sauna", reason: `${saunaCount}x Sauna — Mineralverlust ausgleichen`, severity: "yellow" });
  }

  const avgRpe = trainings.filter((t) => t.rpe).reduce((s, t) => s + (t.rpe || 0), 0) / (trainings.filter((t) => t.rpe).length || 1);
  if (avgRpe > 8) {
    tips.push({ text: "Ashwagandha + Magnesium erhoehen", reason: `RPE-Schnitt ${avgRpe.toFixed(1)} — hohe Belastung, Cortisol senken`, severity: "yellow" });
  }

  // Sort: red first, then yellow, then green. Max 3.
  const order = { red: 0, yellow: 1, green: 2 };
  tips.sort((a, b) => order[a.severity] - order[b.severity]);
  return tips.slice(0, 3);
}
