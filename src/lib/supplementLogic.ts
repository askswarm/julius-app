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
    tips.push({ text: "Omega-3 Bedarf moeglicherweise erhoeht", reason: "Kein Fisch diese Woche — Supplementierung gewinnt an Bedeutung.", severity: "yellow" });
  }

  const avgProtein = meals.reduce((s, m) => s + (m.protein_g || 0), 0) / days;
  if (avgProtein > 160) {
    tips.push({ text: "EAA-Dosis kann reduziert werden", reason: `Protein-Schnitt ${Math.round(avgProtein)}g/Tag — ueber Ziel`, severity: "green" });
  } else if (avgProtein < 120) {
    tips.push({ text: "EAA-Bedarf ist an Trainingstagen typischerweise erhoeht", reason: `Protein-Schnitt nur ${Math.round(avgProtein)}g/Tag`, severity: "yellow" });
  }

  // --- Bloodwork-based ---
  if (bloodwork.vitamin_d) {
    if (bloodwork.vitamin_d.wert > 60) {
      tips.push({ text: "D3 Reduktion auf 5000 IE wird bei Werten ueber 60 diskutiert", reason: `Vitamin D bei ${bloodwork.vitamin_d.wert} ng/ml`, severity: "yellow" });
    } else if (bloodwork.vitamin_d.wert < 30) {
      tips.push({ text: "Hoehere D3-Supplementierung wird in der Literatur diskutiert", reason: `Vitamin D nur ${bloodwork.vitamin_d.wert} ng/ml — aerztliche Kontrolle nach 8 Wochen empfohlen`, severity: "red" });
    }
  }

  if (bloodwork.haematokrit && bloodwork.haematokrit.wert > 52) {
    tips.push({ text: "Haematokrit erhoeht — aerztliche Ruecksprache empfohlen", reason: `${bloodwork.haematokrit.wert}% — bei TRT sind regelmaessige Blutspenden eine gaengige Massnahme`, severity: "red" });
  }

  if (bloodwork.hscrp && bloodwork.hscrp.wert > 2.0) {
    tips.push({ text: "Entzuendungsmarker erhoeht", reason: `hsCRP ${bloodwork.hscrp.wert} mg/l — Omega-3 und Kurkuma werden in der Literatur bei Entzuendung diskutiert`, severity: "red" });
  }

  if (bloodwork.ferritin && bloodwork.ferritin.wert < 30 && userKey === "maria") {
    tips.push({ text: "Eisen-Supplementierung wird haeufig bei niedrigem Ferritin eingesetzt", reason: `Ferritin nur ${bloodwork.ferritin.wert} ng/ml — aerztliche Abklaerung sinnvoll`, severity: "red" });
  }

  // --- Training-based ---
  const weekSessions = trainings.length;
  if (weekSessions >= 5) {
    tips.push({ text: "Bei 5+ Sessions/Woche wird Glutamin-Zufuhr von 10g/Tag in der Literatur diskutiert", reason: `${weekSessions} Sessions diese Woche`, severity: "yellow" });
  }

  const saunaCount = trainings.filter((t) => t.typ === "Sauna" || (t.name || "").toLowerCase().includes("sauna")).length;
  if (saunaCount >= 2) {
    tips.push({ text: "Elektrolyte nach jeder Sauna", reason: `${saunaCount}x Sauna — Mineralverlust ausgleichen`, severity: "yellow" });
  }

  const avgRpe = trainings.filter((t) => t.rpe).reduce((s, t) => s + (t.rpe || 0), 0) / (trainings.filter((t) => t.rpe).length || 1);
  if (avgRpe > 8) {
    tips.push({ text: "Ashwagandha und Magnesium werden bei hoher Belastung haeufig eingesetzt", reason: `RPE-Schnitt ${avgRpe.toFixed(1)} — Cortisol-Management`, severity: "yellow" });
  }

  // Sort: red first, then yellow, then green. Max 3.
  const order = { red: 0, yellow: 1, green: 2 };
  tips.sort((a, b) => order[a.severity] - order[b.severity]);
  return tips.slice(0, 3);
}
