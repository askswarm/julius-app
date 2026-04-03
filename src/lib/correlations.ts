interface JournalEntry {
  datum: string;
  alkohol?: boolean;
  koffein_letzte?: string;
  sauna?: boolean;
  meditation?: boolean;
  bildschirm_spaet?: boolean;
  supplements_komplett?: boolean;
  stress_level?: number;
  outdoor_zeit?: string;
}

interface ScoreEntry {
  datum: string;
  sleep: number | null;
  readiness: number | null;
}

interface Insight {
  label: string;
  delta: number;
  metric: string;
  positive: boolean;
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function calculateCorrelations(entries: JournalEntry[], scores: ScoreEntry[]): Insight[] {
  if (entries.length < 7) return [];

  const scoreMap = new Map<string, ScoreEntry>();
  scores.forEach((s) => scoreMap.set(s.datum, s));

  const insights: Insight[] = [];

  function compare(filterFn: (e: JournalEntry) => boolean, label: string) {
    const withSleep: number[] = [];
    const withoutSleep: number[] = [];
    const withReady: number[] = [];
    const withoutReady: number[] = [];

    entries.forEach((e) => {
      const s = scoreMap.get(e.datum);
      if (!s) return;
      if (filterFn(e)) {
        if (s.sleep != null) withSleep.push(s.sleep);
        if (s.readiness != null) withReady.push(s.readiness);
      } else {
        if (s.sleep != null) withoutSleep.push(s.sleep);
        if (s.readiness != null) withoutReady.push(s.readiness);
      }
    });

    if (withSleep.length >= 2 && withoutSleep.length >= 2) {
      const delta = Math.round(avg(withSleep) - avg(withoutSleep));
      if (Math.abs(delta) >= 3) {
        insights.push({ label, delta, metric: "Schlaf", positive: delta > 0 });
      }
    }

    if (withReady.length >= 2 && withoutReady.length >= 2) {
      const delta = Math.round(avg(withReady) - avg(withoutReady));
      if (Math.abs(delta) >= 3) {
        insights.push({ label, delta, metric: "Readiness", positive: delta > 0 });
      }
    }
  }

  compare((e) => e.sauna === true, "Sauna");
  compare((e) => e.meditation === true, "Meditation");
  compare((e) => e.bildschirm_spaet === false, "Kein Bildschirm nach 21 Uhr");
  compare((e) => e.alkohol === false, "Kein Alkohol");
  compare((e) => e.supplements_komplett === true, "Supplements komplett");
  compare((e) => e.koffein_letzte === "vor_12" || e.koffein_letzte === "kein", "Koffein vor 12 Uhr / kein");
  compare((e) => e.outdoor_zeit === "ueber_60" || e.outdoor_zeit === "30_60", "30+ Min Outdoor");
  compare((e) => (e.stress_level || 3) <= 2, "Niedriger Stress");

  // Sort by absolute delta, take top 3
  insights.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return insights.slice(0, 3);
}
