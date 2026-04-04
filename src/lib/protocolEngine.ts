export interface ProtocolAlert {
  type: "info" | "warning" | "critical";
  source: string;
  target: string;
  message: string;
  action: string;
}

interface BloodworkMap { [key: string]: { wert: number; datum: string } }
interface OuraBasic { sleep_score?: number | null; readiness_score?: number | null; temperature_deviation?: number | null }

export function analyzeProtocol(
  bloodwork: BloodworkMap,
  hasTRT: boolean,
  oura: OuraBasic | null,
  userGender: string,
): ProtocolAlert[] {
  const alerts: ProtocolAlert[] = [];

  // TRT → Bloodwork
  if (hasTRT) {
    if (bloodwork.haematokrit?.wert > 54) {
      alerts.push({ type: "critical", source: "trt", target: "trt", message: `Haematokrit ${bloodwork.haematokrit.wert}% — kritisch erhoeht`, action: "Aerztliche Ruecksprache dringend empfohlen. Bei TRT-bedingter Erhoehung sind Blutspenden eine gaengige Massnahme." });
    } else if (bloodwork.haematokrit?.wert > 52) {
      alerts.push({ type: "warning", source: "trt", target: "trt", message: `Haematokrit ${bloodwork.haematokrit.wert}% — erhoeht`, action: "Bei TRT-bedingter Haematokrit-Erhoehung sind regelmaessige Blutspenden eine gaengige Massnahme. Aerztliche Ruecksprache empfohlen." });
    }
    if (bloodwork.oestradiol?.wert > 40) {
      alerts.push({ type: "warning", source: "trt", target: "supplement", message: `Oestradiol ${bloodwork.oestradiol.wert} pg/mL — erhoeht`, action: "Zink und DIM werden haeufig bei erhoehtem Oestradiol eingesetzt. Dein Arzt kann beurteilen ob eine Anpassung sinnvoll ist." });
    }
    if (bloodwork.psa?.wert > 2.5) {
      alerts.push({ type: "warning", source: "trt", target: "trt", message: `PSA ${bloodwork.psa.wert} ng/mL — ueberwachen`, action: "Aerztliche Kontrolle empfohlen. Regelmaessige Urologische Untersuchung bei TRT." });
    }
  }

  // Bloodwork → Supplements
  if (bloodwork.vitamin_d?.wert > 60) {
    alerts.push({ type: "info", source: "bloodwork", target: "supplement", message: "Vitamin D im optimalen Bereich", action: "Eine Reduktion auf 5000 IE wird bei Werten ueber 60 ng/mL in der Literatur diskutiert." });
  } else if (bloodwork.vitamin_d?.wert < 30) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement", message: `Vitamin D niedrig (${bloodwork.vitamin_d.wert} ng/mL)`, action: "Bei niedrigem Vitamin D wird in der Literatur eine hoehere Supplementierung (bis 10000 IE) mit K2 diskutiert. Aerztliche Kontrolle empfohlen." });
  }
  if (bloodwork.homocystein?.wert > 12) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement", message: `Homocystein ${bloodwork.homocystein.wert} umol/L — erhoeht`, action: "B-Vitamine (B6, B9, B12, TMG) werden in der Literatur bei erhoehtem Homocystein eingesetzt." });
  }
  if (bloodwork.hscrp?.wert > 2) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement", message: `hsCRP ${bloodwork.hscrp.wert} mg/L — Entzuendungsmarker erhoeht`, action: "Omega-3 Erhoehung auf 4g/Tag wird in der Literatur bei erhoehtem hsCRP diskutiert. Kurkuma kann unterstuetzend wirken." });
  }
  if (bloodwork.ferritin?.wert < 30 && userGender === "F") {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement", message: `Ferritin ${bloodwork.ferritin.wert} ng/mL — niedrig`, action: "Eisen-Supplementierung mit Vitamin C fuer bessere Absorption wird haeufig empfohlen. Aerztliche Abklaerung sinnvoll." });
  }

  // Oura → Everything
  if (oura?.sleep_score != null && oura.sleep_score < 65) {
    alerts.push({ type: "warning", source: "oura", target: "supplement", message: `Schlaf-Score ${oura.sleep_score}`, action: "Glycin und Melatonin (retard) werden haeufig zur Unterstuetzung des Tiefschlafs eingesetzt. Bildschirmzeit ab 21 Uhr reduzieren kann hilfreich sein." });
  }
  if (oura?.readiness_score != null && oura.readiness_score < 60) {
    alerts.push({ type: "warning", source: "oura", target: "training", message: `Readiness ${oura.readiness_score} — niedrig`, action: "Bei niedriger Recovery kann leichteres Training sinnvoll sein." });
  }
  if (oura?.temperature_deviation != null && oura.temperature_deviation > 0.5) {
    alerts.push({ type: "warning", source: "oura", target: "supplement", message: "Temperatur erhoeht — Immunsystem moeglicherweise aktiv", action: "Zink und Vitamin C werden haeufig zur Immununterstuetzung eingesetzt. Eine Pause von GH-Peptiden bei erhoehter Temperatur wird in der Community haeufig praktiziert." });
  }

  return alerts;
}
