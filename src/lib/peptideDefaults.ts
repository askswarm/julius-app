export interface PeptidePreset {
  name: string;
  category: string;
  typical_dose_mcg: number;
  frequency: string;
  timing: string;
  fasting_required: boolean;
  cycle_on_days: number;
  cycle_off_days: number;
  typical_vial_mg: number;
  typical_recon_ml: number;
  storage: string;
  description: string;
  stacking_notes: string;
}

export const PEPTIDE_PRESETS: PeptidePreset[] = [
  { name: "BPC-157", category: "Healing", typical_dose_mcg: 250, frequency: "2x_daily", timing: "morning_evening", fasting_required: false, cycle_on_days: 28, cycle_off_days: 14, typical_vial_mg: 5, typical_recon_ml: 2, storage: "fridge", description: "Magen-Darm + Sehnen/Gelenke Heilung", stacking_notes: "Stackt gut mit TB-500" },
  { name: "TB-500", category: "Healing", typical_dose_mcg: 2000, frequency: "2x_week", timing: "morning", fasting_required: false, cycle_on_days: 42, cycle_off_days: 28, typical_vial_mg: 5, typical_recon_ml: 2, storage: "fridge", description: "Systemische Heilung + Flexibilitaet", stacking_notes: "Stackt gut mit BPC-157" },
  { name: "GHK-Cu", category: "Longevity", typical_dose_mcg: 200, frequency: "1x_daily", timing: "evening", fasting_required: false, cycle_on_days: 30, cycle_off_days: 30, typical_vial_mg: 50, typical_recon_ml: 2, storage: "fridge", description: "Kollagen + Haut + Haarwachstum + Anti-Aging", stacking_notes: "Kann mit Epitalon gestackt werden" },
  { name: "Epitalon", category: "Longevity", typical_dose_mcg: 5000, frequency: "1x_daily", timing: "evening", fasting_required: false, cycle_on_days: 10, cycle_off_days: 180, typical_vial_mg: 10, typical_recon_ml: 2, storage: "fridge", description: "Telomerase-Aktivierung, Anti-Aging", stacking_notes: "10 Tage Zyklus, 2x/Jahr" },
  { name: "CJC-1295 + Ipamorelin", category: "Growth Hormone", typical_dose_mcg: 200, frequency: "1x_daily", timing: "evening_fasted", fasting_required: true, cycle_on_days: 84, cycle_off_days: 28, typical_vial_mg: 5, typical_recon_ml: 2.5, storage: "fridge", description: "GH-Sekretagog, Schlaf + Recovery + Fettabbau", stacking_notes: "Abends auf leeren Magen, mind. 2h nach letzter Mahlzeit" },
  { name: "Semaglutid", category: "Metabolic", typical_dose_mcg: 250, frequency: "1x_week", timing: "morning", fasting_required: false, cycle_on_days: 0, cycle_off_days: 0, typical_vial_mg: 3, typical_recon_ml: 3, storage: "fridge", description: "GLP-1 Agonist, Appetit + Blutzucker", stacking_notes: "Dosis langsam steigern: 250 → 500 → 1000mcg" },
  { name: "NAD+ (SubQ)", category: "Longevity", typical_dose_mcg: 100000, frequency: "1x_daily", timing: "morning", fasting_required: false, cycle_on_days: 30, cycle_off_days: 30, typical_vial_mg: 100, typical_recon_ml: 1, storage: "fridge", description: "Zellulaere Energie + DNA-Reparatur", stacking_notes: "Kann brennen bei Injektion, langsam injizieren" },
  { name: "PT-141", category: "Sexual Health", typical_dose_mcg: 1000, frequency: "on_demand", timing: "2h_before", fasting_required: false, cycle_on_days: 0, cycle_off_days: 0, typical_vial_mg: 10, typical_recon_ml: 2, storage: "fridge", description: "Libido + sexuelle Funktion", stacking_notes: "Max 2x pro Woche, Uebelkeit moeglich" },
];

// Half-lives in hours for decay curves
export const PEPTIDE_HALFLIVES: Record<string, number> = {
  "BPC-157": 4,
  "TB-500": 8,
  "GHK-Cu": 4,
  "Epitalon": 3,
  "CJC-1295 + Ipamorelin": 192, // CJC-DAC ~8 days
  "Semaglutid": 168, // ~7 days
  "NAD+ (SubQ)": 0.5,
  "PT-141": 2,
};

export const CATEGORY_COLORS: Record<string, string> = {
  Healing: "#10B981",
  Longevity: "#7EE2B8",
  "Growth Hormone": "#8B5CF6",
  Metabolic: "#F59E0B",
  "Sexual Health": "#EC4899",
};

export const INJECTION_SITES = [
  "Bauch links", "Bauch rechts",
  "Oberschenkel links", "Oberschenkel rechts",
  "Deltoid links", "Deltoid rechts",
  "Gluteal links", "Gluteal rechts",
];

export const FREQUENCY_LABELS: Record<string, string> = {
  "1x_daily": "1x/Tag",
  "2x_daily": "2x/Tag",
  eod: "Jeden 2. Tag",
  "2x_week": "2x/Woche",
  "1x_week": "1x/Woche",
  on_demand: "Bei Bedarf",
};

export const TIMING_LABELS: Record<string, string> = {
  morning: "Morgens",
  evening: "Abends",
  morning_evening: "Morgens + Abends",
  evening_fasted: "Abends nuechtern",
  "2h_before": "2h vorher",
  pre_workout: "Vor Training",
};
