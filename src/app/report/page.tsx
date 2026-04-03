"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { useUser } from "@/lib/UserContext";
import { supabase } from "@/lib/supabase";
import FamilySwitcher from "@/components/FamilySwitcher";
import Card from "@/components/Card";
import ScoreRing from "@/components/ScoreRing";

interface WeekData {
  trainings: { typ: string; dauer_min: number | null; rpe: number | null; name: string }[];
  meals: { kalorien: number | null; protein_g: number | null; gericht_name: string | null }[];
  scores: { datum: string; sleep: number | null; readiness: number | null }[];
  supplements: { zeitpunkt: string }[];
  totalSlots: number;
}

export default function ReportPage() {
  const { user, userKey } = useUser();
  const [data, setData] = useState<WeekData | null>(null);

  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const sunday = endOfWeek(new Date(), { weekStartsOn: 1 });
  const mondayStr = format(monday, "yyyy-MM-dd");
  const sundayStr = format(sunday, "yyyy-MM-dd");

  useEffect(() => {
    const id = user.id;
    Promise.all([
      supabase.from("training_log").select("typ, dauer_min, rpe, name").eq("chat_id", id).gte("datum", mondayStr).lte("datum", sundayStr),
      supabase.from("nutrition_log").select("kalorien, protein_g, gericht_name, datum").eq("chat_id", id).gte("datum", mondayStr).lte("datum", sundayStr),
      supabase.from("daily_scores").select("datum, sleep, readiness").eq("chat_id", id).gte("datum", mondayStr).lte("datum", sundayStr),
      supabase.from("supplement_log").select("zeitpunkt, datum").eq("chat_id", id).gte("datum", mondayStr).lte("datum", sundayStr),
    ]).then(([t, m, s, sup]) => {
      setData({
        trainings: t.data || [],
        meals: m.data || [],
        scores: s.data || [],
        supplements: sup.data || [],
        totalSlots: 5 * 7, // 5 slots per day * 7 days
      });
    });
  }, [user.id, mondayStr, sundayStr]);

  if (!data) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/"><ArrowLeft size={20} style={{ color: "var(--text2)" }} /></Link>
          <h1 className="text-xl font-semibold">Wochen-Report</h1>
        </div>
        <Card><p className="text-sm text-center py-8" style={{ color: "var(--text3)" }}>Laden...</p></Card>
      </div>
    );
  }

  // Training
  const sessions = data.trainings.length;
  const totalMin = data.trainings.reduce((s, t) => s + (t.dauer_min || 0), 0);
  const byType: Record<string, number> = {};
  data.trainings.forEach((t) => { byType[t.typ] = (byType[t.typ] || 0) + 1; });
  const rpeVals = data.trainings.filter((t) => t.rpe).map((t) => t.rpe!);
  const avgRpe = rpeVals.length ? (rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length).toFixed(1) : "--";

  // Nutrition
  const mealDays = new Set(data.meals.map((m) => (m as unknown as { datum: string }).datum)).size || 1;
  const totalKcal = data.meals.reduce((s, m) => s + (m.kalorien || 0), 0);
  const totalProtein = data.meals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const avgKcal = Math.round(totalKcal / mealDays);
  const avgProtein = Math.round(totalProtein / mealDays);

  // Sleep
  const sleepVals = data.scores.filter((s) => s.sleep).map((s) => s.sleep!);
  const readyVals = data.scores.filter((s) => s.readiness).map((s) => s.readiness!);
  const avgSleep = sleepVals.length ? Math.round(sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length) : null;
  const avgReady = readyVals.length ? Math.round(readyVals.reduce((a, b) => a + b, 0) / readyVals.length) : null;
  const bestNight = data.scores.reduce((best, s) => (!best || (s.sleep && s.sleep > (best.sleep || 0)) ? s : best), null as (typeof data.scores[0]) | null);

  // Supplements
  const suppCompliance = data.totalSlots > 0 ? Math.round((data.supplements.length / data.totalSlots) * 100) : 0;

  // Insights
  const insights: string[] = [];
  if (sessions < 4) insights.push(`Nur ${sessions}/5 Sessions — naechste Woche mehr Konsistenz anstreben.`);
  if (avgProtein < user.protein_ziel_g * 0.9) insights.push(`Protein bei ${avgProtein}g — Ziel ${user.protein_ziel_g}g. Mehr proteinreiche Mahlzeiten planen.`);
  if (avgSleep && avgSleep < 75) insights.push("Schlaf-Score unter 75 — Glycin + Magnesium erhoehen, Bildschirme ab 21 Uhr aus.");
  if (suppCompliance < 70) insights.push(`Supplement-Compliance bei ${suppCompliance}% — Erinnerungen nutzen.`);
  if (sessions >= 5 && avgSleep && avgSleep >= 80) insights.push("Starke Woche — Training und Schlaf auf hohem Niveau. Weiter so.");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/"><ArrowLeft size={20} style={{ color: "var(--text2)" }} /></Link>
          <div>
            <h1 className="text-xl font-semibold">Wochen-Report</h1>
            <p className="text-xs" style={{ color: "var(--text3)" }}>
              {format(monday, "d. MMM", { locale: de })} – {format(sunday, "d. MMM yyyy", { locale: de })}
            </p>
          </div>
        </div>
        <FamilySwitcher />
      </div>

      {/* Training */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Training</p>
        <div className="flex items-center gap-4 mb-3">
          <ScoreRing value={Math.round((sessions / 5) * 100)} label={`${sessions}/5`} color="#F97316" size={64} />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div><p className="text-lg font-bold">{totalMin}</p><p className="text-[10px]" style={{ color: "var(--text3)" }}>Minuten</p></div>
            <div><p className="text-lg font-bold">{avgRpe}</p><p className="text-[10px]" style={{ color: "var(--text3)" }}>RPE Schnitt</p></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(byType).map(([typ, count]) => (
            <span key={typ} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.1)", color: "#F97316" }}>
              {typ}: {count}x
            </span>
          ))}
        </div>
      </Card>

      {/* Nutrition */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Ernaehrung</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold">{avgKcal} <span className="text-xs font-normal" style={{ color: "var(--text3)" }}>/ {user.kcal_training}</span></p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>kcal/Tag</p>
          </div>
          <div>
            <p className="text-lg font-bold">{avgProtein}<span className="text-xs font-normal">g</span> <span className="text-xs font-normal" style={{ color: "var(--text3)" }}>/ {user.protein_ziel_g}g</span></p>
            <p className="text-[10px]" style={{ color: "var(--text3)" }}>Protein/Tag</p>
          </div>
        </div>
      </Card>

      {/* Sleep */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Schlaf</p>
        <div className="flex items-center gap-4">
          <ScoreRing value={avgSleep} label="Schlaf" color="#79C0FF" size={64} />
          <ScoreRing value={avgReady} label="Readiness" color="#7EE2B8" size={64} />
          <div className="flex-1">
            {bestNight && bestNight.sleep && (
              <div>
                <p className="text-xs" style={{ color: "var(--text3)" }}>Beste Nacht</p>
                <p className="text-sm font-bold">{bestNight.sleep} <span className="text-xs font-normal" style={{ color: "var(--text3)" }}>{bestNight.datum?.slice(5)}</span></p>
              </div>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{sleepVals.length} Naechte getrackt</p>
          </div>
        </div>
      </Card>

      {/* Supplements */}
      <Card>
        <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Supplements</p>
        <div className="flex items-center gap-4">
          <ScoreRing value={suppCompliance} label="Compliance" color={suppCompliance >= 80 ? "#10B981" : "#F59E0B"} size={64} />
          <p className="text-sm" style={{ color: "var(--text2)" }}>{data.supplements.length} von ~{data.totalSlots} Einnahmen geloggt</p>
        </div>
      </Card>

      {/* Julius sagt */}
      {insights.length > 0 && (
        <Card>
          <p className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: "var(--text2)" }}>Julius sagt</p>
          <div className="flex flex-col gap-2">
            {insights.map((tip, i) => (
              <p key={i} className="text-sm" style={{ color: "var(--text)" }}>— {tip}</p>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
