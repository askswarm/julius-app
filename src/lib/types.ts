export interface UserProfile {
  id: number;
  name: string;
  geschlecht: string;
  alter_jahre: number;
  gewicht_kg: number;
  groesse_cm: number;
  protein_ziel_g: number;
  kcal_training: number;
  kcal_ruhe: number;
  wasser_ziel_ml: number;
  essensfenster_start: string;
  essensfenster_ende: string;
}

export interface DailyScore {
  readiness: number | null;
  sleep: number | null;
  day_status: string;
}

export interface NutritionEntry {
  id: number;
  datum: string;
  mahlzeit_typ: string;
  gericht_name: string;
  kalorien: number | null;
  protein_g: number | null;
  kohlenhydrate_g: number | null;
  fett_g: number | null;
  ballaststoffe_g: number | null;
  quelle: string;
  created_at: string;
}

export interface TrainingEntry {
  id: number;
  datum: string;
  typ: string;
  name: string;
  dauer_min: number | null;
  rpe: number | null;
  notizen: string;
}

export interface HydrationEntry {
  datum: string;
  menge_ml: number;
  getraenk: string;
}

export interface MacroSummary {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fett_g: number;
  wasser_ml: number;
}
