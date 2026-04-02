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

export interface SupplementItem {
  name: string;
  dosis: string;
  produkt: string;
  preis_monat: number;
  kategorie: string;
  warum: string;
  nur_training?: boolean;
  nur_maria?: boolean;
}

export const SUPPLEMENT_SCHEDULE: Record<string, { time: string; label: string; items: string[] }> = {
  nuechtern:  { time: "07:00", label: "Nuechtern",      items: ["Spermidin", "NAC", "Taurin"] },
  fruehstueck:{ time: "09:00", label: "Zum Fruehstueck", items: ["Omega-3", "Vitamin D Oel", "B-Komplex", "Ubiquinol", "Zink"] },
  pre_wo:     { time: "11:30", label: "Pre-Workout",     items: ["Citrullin", "Glutamin", "EAA"] },
  mittag:     { time: "13:00", label: "Mittag",          items: ["Selen + Vitamin C"] },
  abend:      { time: "19:00", label: "Abend",           items: ["Glycin", "Magnesium", "Ashwagandha", "Kupfer"] },
};

export const SUPPLEMENT_STACK: SupplementItem[] = [
  // Longevity Basis
  { name: "Spermidin", dosis: "2 Kaps morgens", produkt: "Sunday Natural", preis_monat: 18, kategorie: "Longevity", warum: "Autophagie-Aktivator. Verstaerkt den Fasten-Effekt." },
  { name: "Ubiquinol Q10", dosis: "100mg morgens", produkt: "Kaneka QH", preis_monat: 17, kategorie: "Longevity", warum: "Mitochondriale Energie. Reduzierte, aktive Form von CoQ10." },
  // Aminosaeuren
  { name: "EAA", dosis: "5g (2x an Trainingstagen)", produkt: "APOrtha Amino-9-Pattern", preis_monat: 21, kategorie: "Aminosaeuren", warum: "Essentielle Aminosaeuren. Muskelproteinsynthese, anti-katabol." },
  { name: "NAC", dosis: "600mg morgens", produkt: "Sunday Natural", preis_monat: 5, kategorie: "Aminosaeuren", warum: "Glutathion-Vorstufe. GlyNAC-Protokoll fuer Longevity." },
  { name: "Taurin", dosis: "1.5g morgens", produkt: "Sunday Natural", preis_monat: 3, kategorie: "Aminosaeuren", warum: "Zellschutz, Elektrolytbalance. Longevity-Marker in Studien." },
  { name: "Citrullin", dosis: "5g pre-WO", produkt: "Sunday Natural", preis_monat: 11, kategorie: "Aminosaeuren", warum: "NO-Booster. Durchblutung und Pump im Training." },
  { name: "Glutamin", dosis: "5-10g pre+post", produkt: "Sunday Natural", preis_monat: 11, kategorie: "Aminosaeuren", warum: "Darmbarriere, Immunschutz unter Belastung." },
  { name: "Glycin", dosis: "3g abends", produkt: "Sunday Natural", preis_monat: 4, kategorie: "Aminosaeuren", warum: "Schlafqualitaet, Kollagensynthese. GlyNAC-Protokoll." },
  // Vitamine & Mineralien
  { name: "Vitamin D Oel", dosis: "10.000 IE morgens", produkt: "D3+K2 Oel", preis_monat: 8, kategorie: "Vitamine", warum: "Immunsystem, Knochengesundheit. K2 fuer Kalzium-Transport." },
  { name: "B-Komplex", dosis: "1 Kaps morgens", produkt: "Sunday Natural", preis_monat: 10, kategorie: "Vitamine", warum: "Energiestoffwechsel, Nervensystem. Methylierte Formen." },
  { name: "Omega-3", dosis: "3-4 Kaps morgens", produkt: "Supplera PUR", preis_monat: 30, kategorie: "Vitamine", warum: "EPA+DHA. Anti-inflammatorisch, kardiovaskulaer." },
  { name: "Selen + Vitamin C", dosis: "mittags", produkt: "Sunday Natural", preis_monat: 6, kategorie: "Vitamine", warum: "Selen: Schilddruese, Antioxidans. Getrennt von Zink." },
  { name: "Zink", dosis: "30mg morgens", produkt: "L-OptiZinc", preis_monat: 5, kategorie: "Vitamine", warum: "Testosteron-Metabolismus, Immunsystem." },
  { name: "Magnesium", dosis: "3 Kaps abends", produkt: "Sunday Natural Mg11", preis_monat: 12, kategorie: "Vitamine", warum: "Schlaf, Muskelrelaxation, 300+ Enzymreaktionen." },
  { name: "Kupfer", dosis: "2mg abends", produkt: "Sunday Natural", preis_monat: 4, kategorie: "Vitamine", warum: "Getrennt von Zink. Kollagen, Eisenstoffwechsel." },
  // Adaptogene
  { name: "Ashwagandha", dosis: "600mg abends", produkt: "Sunday Natural", preis_monat: 10, kategorie: "Adaptogene", warum: "Stressreduktion, Cortisol senken, Schlafqualitaet." },
  // Nur Maria
  { name: "Kreatin", dosis: "3g morgens", produkt: "Creapure", preis_monat: 5, kategorie: "Nur Maria", warum: "Muskelaufbau + Knochengesundheit Frauen 40+.", nur_maria: true },
];

export const BLOODWORK_MARKERS = [
  { group: "Hormone", markers: [
    { key: "testosteron_gesamt", label: "Testosteron gesamt", einheit: "ng/dl", opt_min: 500, opt_max: 900 },
    { key: "testosteron_frei", label: "Testosteron frei", einheit: "pg/ml", opt_min: 15, opt_max: 30 },
    { key: "oestradiol", label: "Oestradiol", einheit: "pg/ml", opt_min: 20, opt_max: 40 },
    { key: "shbg", label: "SHBG", einheit: "nmol/l", opt_min: 20, opt_max: 50 },
    { key: "tsh", label: "TSH", einheit: "mIU/l", opt_min: 0.5, opt_max: 2.5 },
  ]},
  { group: "Blutbild", markers: [
    { key: "haematokrit", label: "Haematokrit", einheit: "%", opt_min: 40, opt_max: 52 },
    { key: "haemoglobin", label: "Haemoglobin", einheit: "g/dl", opt_min: 14, opt_max: 17 },
    { key: "psa", label: "PSA", einheit: "ng/ml", opt_min: 0, opt_max: 2.5 },
  ]},
  { group: "Stoffwechsel", markers: [
    { key: "hba1c", label: "HbA1c", einheit: "%", opt_min: 4.0, opt_max: 5.3 },
    { key: "glukose", label: "Nuechtern-Glukose", einheit: "mg/dl", opt_min: 70, opt_max: 90 },
    { key: "insulin", label: "Insulin", einheit: "mIU/l", opt_min: 2, opt_max: 6 },
  ]},
  { group: "Lipide", markers: [
    { key: "ldl", label: "LDL", einheit: "mg/dl", opt_min: 0, opt_max: 100 },
    { key: "hdl", label: "HDL", einheit: "mg/dl", opt_min: 50, opt_max: 100 },
    { key: "triglyceride", label: "Triglyceride", einheit: "mg/dl", opt_min: 0, opt_max: 100 },
    { key: "apob", label: "ApoB", einheit: "mg/dl", opt_min: 0, opt_max: 80 },
    { key: "lpa", label: "Lp(a)", einheit: "nmol/l", opt_min: 0, opt_max: 75 },
  ]},
  { group: "Entzuendung", markers: [
    { key: "hscrp", label: "hsCRP", einheit: "mg/l", opt_min: 0, opt_max: 1.0 },
    { key: "homocystein", label: "Homocystein", einheit: "mcmol/l", opt_min: 5, opt_max: 10 },
    { key: "ferritin", label: "Ferritin", einheit: "ng/ml", opt_min: 40, opt_max: 150 },
  ]},
  { group: "Vitamine", markers: [
    { key: "vitamin_d", label: "Vitamin D 25-OH", einheit: "ng/ml", opt_min: 40, opt_max: 60 },
    { key: "b12", label: "Vitamin B12", einheit: "pg/ml", opt_min: 500, opt_max: 1000 },
    { key: "zink_blut", label: "Zink", einheit: "mcg/dl", opt_min: 80, opt_max: 120 },
    { key: "selen_blut", label: "Selen", einheit: "mcg/l", opt_min: 100, opt_max: 150 },
    { key: "magnesium_blut", label: "Magnesium", einheit: "mg/dl", opt_min: 2.0, opt_max: 2.5 },
  ]},
  { group: "Leber & Niere", markers: [
    { key: "got", label: "GOT/AST", einheit: "U/l", opt_min: 0, opt_max: 35 },
    { key: "gpt", label: "GPT/ALT", einheit: "U/l", opt_min: 0, opt_max: 35 },
    { key: "ggt", label: "GGT", einheit: "U/l", opt_min: 0, opt_max: 40 },
    { key: "kreatinin", label: "Kreatinin", einheit: "mg/dl", opt_min: 0.7, opt_max: 1.2 },
    { key: "egfr", label: "eGFR", einheit: "ml/min", opt_min: 90, opt_max: 120 },
  ]},
];

export const COLORS = {
  primary: "#3B82F6",
  green: "#10B981",
  orange: "#F97316",
  amber: "#F59E0B",
  red: "#EF4444",
  water: "#38BDF8",
};
