const ADJUSTMENTS: Record<string, { kcal: number; protein: number }> = {
  Kraft: { kcal: 250, protein: 20 },
  HYROX: { kcal: 250, protein: 20 },
  CrossFit: { kcal: 250, protein: 20 },
  TRX: { kcal: 200, protein: 15 },
  Yoga: { kcal: 50, protein: 0 },
  Mobility: { kcal: 50, protein: 0 },
  Stretching: { kcal: 50, protein: 0 },
  Meditation: { kcal: 0, protein: 0 },
  Sauna: { kcal: 50, protein: 0 },
};

export function calculateMacroAdjustment(typ: string, dauerMin: number): { kcal: number; protein: number } {
  const base = ADJUSTMENTS[typ];
  if (base) return base;

  // Cardio types based on duration
  if (["Laufen", "Schwimmen", "Radfahren", "Rudern"].includes(typ)) {
    if (dauerMin >= 60) return { kcal: 300, protein: 15 };
    if (dauerMin >= 30) return { kcal: 150, protein: 10 };
    return { kcal: 100, protein: 5 };
  }

  return { kcal: 150, protein: 10 };
}
