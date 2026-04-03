import type { TrainingEntry } from "./types";

interface Scores {
  readiness: number | null;
  sleep: number | null;
}

interface HealthSymptom {
  symptom: string;
  severity: string;
  active: boolean;
}

interface BloodworkMap {
  [key: string]: { wert: number; datum: string };
}

export interface AdaptiveRecommendation {
  trigger: string;
  category: "training" | "supplements" | "nutrition" | "warning";
  message: string;
  severity: "info" | "warning" | "critical";
}

export function analyzeAndAdapt(
  scores: Scores | null,
  recentTraining: TrainingEntry[],
  activeSymptoms: HealthSymptom[],
  bloodwork: BloodworkMap,
): AdaptiveRecommendation[] {
  const recs: AdaptiveRecommendation[] = [];

  // 1. Sleep score low
  if (scores?.sleep != null && scores.sleep < 70) {
    recs.push({
      trigger: "sleep_score_low",
      category: "training",
      message: `Schlaf-Score ${scores.sleep} — heute nur Zone 2 oder Ruhe.`,
      severity: "warning",
    });
    recs.push({
      trigger: "sleep_score_low",
      category: "supplements",
      message: "Magnesium +1 Kapsel, Glycin 2g extra mittags, kein Koffein nach 12 Uhr.",
      severity: "warning",
    });
  }

  // 2. Readiness very low
  if (scores?.readiness != null && scores.readiness < 60) {
    recs.push({
      trigger: "readiness_low",
      category: "training",
      message: `Readiness ${scores.readiness} — kein Training heute. Nur Spaziergang und Sauna.`,
      severity: "warning",
    });
    recs.push({
      trigger: "readiness_low",
      category: "supplements",
      message: "Nur Basis-Supplements. Kein Pre-Workout. Extra Glycin + Magnesium abends.",
      severity: "warning",
    });
  }

  // 3. Overtraining: 3+ sessions RPE 8+ in a row
  const recentHighRpe = recentTraining
    .filter((t) => t.rpe && t.rpe >= 8)
    .slice(0, 5);
  if (recentHighRpe.length >= 3) {
    recs.push({
      trigger: "overtraining",
      category: "training",
      message: `${recentHighRpe.length}x RPE 8+ in Folge — Deload empfohlen. Leichtes Training oder Ruhe.`,
      severity: "warning",
    });
    recs.push({
      trigger: "overtraining",
      category: "supplements",
      message: "Glutamin auf 10g/Tag, extra EAA, Ashwagandha beibehalten.",
      severity: "info",
    });
  }

  // 4. Active symptoms
  for (const symptom of activeSymptoms) {
    const s = symptom.symptom.toLowerCase();
    if (s.includes("erkaelt") || s.includes("grippe") || s.includes("krank") || s.includes("hals")) {
      recs.push({
        trigger: "symptom_cold",
        category: "training",
        message: `Erkaeltung aktiv — Training pausiert bis Symptome abklingen.`,
        severity: "critical",
      });
      recs.push({
        trigger: "symptom_cold",
        category: "supplements",
        message: "Zink auf 50mg, Vitamin C 1g, Glutamin 10g. Warme Suppen und Ruhe.",
        severity: "critical",
      });
    } else if (s.includes("knie") || s.includes("schulter") || s.includes("rueck")) {
      const bodyPart = s.includes("knie") ? "Knie" : s.includes("schulter") ? "Schulter" : "Ruecken";
      recs.push({
        trigger: `symptom_${bodyPart.toLowerCase()}`,
        category: "training",
        message: `${bodyPart}-Beschwerden — betroffene Uebungen meiden. Alternative Muskelgruppen trainieren.`,
        severity: "warning",
      });
    } else if (s.includes("kopf")) {
      recs.push({
        trigger: "symptom_headache",
        category: "nutrition",
        message: "Kopfschmerzen — extra Wasser (500ml), Magnesium, kein intensives Training.",
        severity: "warning",
      });
    }
  }

  // 5. Bloodwork warnings
  if (bloodwork.haematokrit && bloodwork.haematokrit.wert > 52) {
    recs.push({
      trigger: "haematokrit_high",
      category: "warning",
      message: `Haematokrit ${bloodwork.haematokrit.wert}% — mit Arzt besprechen. TRT-Dosis ueberpruefen. Blutspende erwaegen.`,
      severity: "critical",
    });
  }

  if (bloodwork.hscrp && bloodwork.hscrp.wert > 3) {
    recs.push({
      trigger: "inflammation_high",
      category: "supplements",
      message: `hsCRP ${bloodwork.hscrp.wert} — Omega-3 erhoehen, Zucker reduzieren, Kurkuma ergaenzen.`,
      severity: "warning",
    });
  }

  return recs;
}
