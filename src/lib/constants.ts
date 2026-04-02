import type { UserProfile } from "./types";

export const USERS: Record<string, UserProfile> = {
  vincent: {
    id: 1349433042,
    name: "Vincent",
    geschlecht: "M",
    alter_jahre: 38,
    gewicht_kg: 81,
    groesse_cm: 179.5,
    protein_ziel_g: 145,
    kcal_training: 2400,
    kcal_ruhe: 2100,
    wasser_ziel_ml: 3500,
    essensfenster_start: "09:00",
    essensfenster_ende: "18:30",
  },
  maria: {
    id: 1497724240,
    name: "Maria",
    geschlecht: "F",
    alter_jahre: 41,
    gewicht_kg: 49,
    groesse_cm: 158,
    protein_ziel_g: 100,
    kcal_training: 1650,
    kcal_ruhe: 1500,
    wasser_ziel_ml: 2500,
    essensfenster_start: "08:30",
    essensfenster_ende: "18:30",
  },
};

export const TRAINING_SCHEDULE: Record<number, { vincent: string; maria: string }> = {
  1: { vincent: "Kraft (Langhantel + KH)", maria: "Kraft (TRX)" },
  2: { vincent: "Ausdauer kurz (Laufen/Rower)", maria: "Ausdauer kurz (Laufen/Rower)" },
  3: { vincent: "Sauna + Mobilitaet", maria: "Sauna + Mobilitaet" },
  4: { vincent: "Kraft oder Urban Sports", maria: "TRX oder Yoga" },
  5: { vincent: "Ausdauer lang (Gravel/Schwimmen)", maria: "Schwimmen/Rower 60min" },
  6: { vincent: "HYROX (Urban Sports Club)", maria: "HYROX (Urban Sports Club)" },
  0: { vincent: "Sauna + Batch Prep", maria: "Sauna + Batch Prep" },
};

export const SUPPLEMENT_SLOTS = [
  { key: "nuechtern", label: "Nuechtern", time: "07:00" },
  { key: "fruehstueck", label: "Fruehstueck", time: "09:00" },
  { key: "pre_wo", label: "Pre-WO", time: "vor Training" },
  { key: "mittag", label: "Mittag", time: "12:00" },
  { key: "abend", label: "Abend", time: "19:00" },
];

export const COLORS = {
  primary: "#3B82F6",
  green: "#10B981",
  orange: "#F97316",
  amber: "#F59E0B",
  red: "#EF4444",
  water: "#38BDF8",
};
