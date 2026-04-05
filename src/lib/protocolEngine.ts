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

  if (hasTRT) {
    if (bloodwork.haematokrit?.wert > 54) {
      alerts.push({ type: "critical", source: "trt", target: "trt",
        message: `Haematokrit ${bloodwork.haematokrit.wert}%`,
        action: `Die AUA Guidelines empfehlen aerztliche Ruecksprache ab 52%. Hast du diesen Wert mit deinem Arzt besprochen?` });
    } else if (bloodwork.haematokrit?.wert > 50) {
      alerts.push({ type: "warning", source: "trt", target: "trt",
        message: `Haematokrit ${bloodwork.haematokrit.wert}%`,
        action: `Werte ueber 50% werden in der Fachliteratur bei TRT-Patienten haeufig ueberwacht. Besprich deinen aktuellen Wert beim naechsten Arzttermin.` });
    }
    if (bloodwork.oestradiol?.wert > 40) {
      alerts.push({ type: "warning", source: "trt", target: "supplement",
        message: `Oestradiol ${bloodwork.oestradiol.wert} pg/mL`,
        action: `In der Literatur wird 20–35 pg/mL als Zielbereich fuer Maenner auf TRT diskutiert. Dein Arzt kann beurteilen ob eine Anpassung sinnvoll ist.` });
    }
    if (bloodwork.psa?.wert > 2.5) {
      alerts.push({ type: "warning", source: "trt", target: "trt",
        message: `PSA ${bloodwork.psa.wert} ng/mL`,
        action: `Die EAU-Leitlinien empfehlen regelmaessige urologische Kontrollen bei TRT. Hast du deinen PSA-Wert mit deinem Urologen besprochen?` });
    }
  }

  if (bloodwork.vitamin_d?.wert > 60) {
    alerts.push({ type: "info", source: "bloodwork", target: "supplement",
      message: "Vitamin D im optimalen Bereich",
      action: `Viele Fachgesellschaften betrachten Werte zwischen 40–60 ng/mL als optimal. Dein Arzt kann dich zur weiteren Supplementierung beraten.` });
  } else if (bloodwork.vitamin_d?.wert < 30) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement",
      message: `Vitamin D ${bloodwork.vitamin_d.wert} ng/mL`,
      action: `Viele Fachgesellschaften betrachten Werte ueber 40 ng/mL als optimal. Dein Arzt kann dich zu einer moeglichen Supplementierung beraten.` });
  }
  if (bloodwork.homocystein?.wert > 12) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement",
      message: `Homocystein ${bloodwork.homocystein.wert} umol/L`,
      action: `In der Fachliteratur werden B-Vitamine (B6, B9, B12) bei erhoehtem Homocystein diskutiert. Besprich deinen Wert beim naechsten Termin.` });
  }
  if (bloodwork.hscrp?.wert > 2) {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement",
      message: `hsCRP ${bloodwork.hscrp.wert} mg/L — Entzuendungsmarker`,
      action: `Omega-3 Fettsaeuren werden in Studien bei systemischer Entzuendung untersucht. Dies ist keine Empfehlung — besprich den Wert mit deinem Arzt.` });
  }
  if (bloodwork.ferritin?.wert < 30 && userGender === "F") {
    alerts.push({ type: "warning", source: "bloodwork", target: "supplement",
      message: `Ferritin ${bloodwork.ferritin.wert} ng/mL`,
      action: `Niedrige Ferritinwerte koennen auf Eisenmangel hinweisen. Dein Arzt kann abklaeren ob eine Supplementierung sinnvoll ist.` });
  }

  if (oura?.sleep_score != null && oura.sleep_score < 65) {
    alerts.push({ type: "warning", source: "oura", target: "supplement",
      message: `Schlaf-Score ${oura.sleep_score}`,
      action: `In der Schlafforschung werden Magnesium und Glycin als schlafunterstuetzend diskutiert. Besprich Nahrungsergaenzungen mit deinem Arzt.` });
  }
  if (oura?.readiness_score != null && oura.readiness_score < 60) {
    alerts.push({ type: "warning", source: "oura", target: "training",
      message: `Readiness ${oura.readiness_score}`,
      action: `Bei niedriger Recovery kann ein leichteres Trainingspensum sinnvoll sein. Hoere auf deinen Koerper.` });
  }
  if (oura?.temperature_deviation != null && oura.temperature_deviation > 0.5) {
    alerts.push({ type: "warning", source: "oura", target: "supplement",
      message: "Temperatur-Abweichung erhoeht",
      action: `Eine erhoehte Temperatur kann auf Immunaktivitaet hindeuten. In der Literatur wird empfohlen, intensive Protokolle in dieser Phase zu pausieren. Besprich das mit deinem Arzt.` });
  }

  return alerts;
}
