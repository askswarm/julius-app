"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Dumbbell, ChevronRight, BarChart3, BookOpen, Footprints, Flame, Heart, Activity, Brain, Wind, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import { getTodayScores, getTodayMacros, getTodayTraining, getTodaySupplements, getTrainingLoad, getTodayMacroAdjustment, getTodayOura, getOuraHistory } from "@/lib/queries";
import { calculateDynamicKcal } from "@/lib/calorieLogic";
import { TRAINING_SCHEDULE } from "@/lib/constants";
import type { DailyScore, MacroSummary, TrainingEntry } from "@/lib/types";
import FamilySwitcher from "@/components/FamilySwitcher";
import ScoreRing from "@/components/ScoreRing";
import MacroBar from "@/components/MacroBar";
import Card from "@/components/Card";
import AutophagieTimer from "@/components/AutophagieTimer";
import SupplementStatus from "@/components/SupplementStatus";
import LifeTimeline from "@/components/LifeTimeline";

const GRADIENTS = {
  protein: "linear-gradient(90deg, #2EA67A, #7EE2B8)",
  carbs: "linear-gradient(90deg, #1D4ED8, #79C0FF)",
  fett: "linear-gradient(90deg, #D97706, #FBBF24)",
  wasser: "linear-gradient(90deg, #0284C7, #38BDF8)",
};

interface OuraToday {
  steps?: number; active_calories?: number; resting_hr?: number; total_calories?: number;
  avg_hrv?: number; lowest_hr?: number; stress_score?: number; vo2_max?: number;
  cardiovascular_age?: number; resilience_level?: string; spo2_percentage?: number;
}

function MetricCard({ icon: Icon, value, unit, label, color, trend }: {
  icon: typeof Heart; value: number | string | null; unit?: string; label: string; color: string; trend?: number | null;
}) {
  if (value == null) return null;
  return (
    <Card className="flex-1 min-w-0">
      <div className="flex items-start justify-between">
        <Icon size={14} style={{ color }} />
        {trend != null && trend !== 0 && (
          <div className="flex items-center gap-0.5">
            {trend > 0 ? <TrendingUp size={10} style={{ color: "#10B981" }} /> : <TrendingDown size={10} style={{ color: "#EF4444" }} />}
            <span className="text-[9px]" style={{ color: trend > 0 ? "#10B981" : "#EF4444" }}>{trend > 0 ? "+" : ""}{trend}</span>
          </div>
        )}
      </div>
      <p className="text-xl font-bold mt-1" style={{ color: "var(--text)" }}>{value}<span className="text-xs font-normal" style={{ color: "var(--text3)" }}>{unit ? ` ${unit}` : ""}</span></p>
      <p className="text-[10px]" style={{ color: "var(--text3)" }}>{label}</p>
    </Card>
  );
}

export default function HomePage() {
  const { user, userKey } = useUser();
  const [scores, setScores] = useState<DailyScore | null>(null);
  const [macros, setMacros] = useState<MacroSummary>({ kcal: 0, protein_g: 0, carbs_g: 0, fett_g: 0, wasser_ml: 0 });
  const [training, setTraining] = useState<TrainingEntry[]>([]);
  const [supplements, setSupplements] = useState<string[]>([]);
  const [load, setLoad] = useState(0);
  const [macroAdj, setMacroAdj] = useState({ kcal: 0, protein: 0 });
  const [oura, setOura] = useState<OuraToday | null>(null);
  const [yesterday, setYesterday] = useState<OuraToday | null>(null);

  useEffect(() => {
    const id = user.id;
    getTodayScores(id).then(setScores);
    getTodayMacros(id).then(setMacros);
    getTodayTraining(id).then(setTraining);
    getTodaySupplements(id).then(setSupplements);
    getTrainingLoad(id).then(setLoad);
    getTodayMacroAdjustment(id).then(setMacroAdj);
    getTodayOura(id).then(setOura);
    // Yesterday for trends
    getOuraHistory(id, 2).then((h) => {
      if (h.length >= 2) setYesterday(h[0] as unknown as OuraToday);
    });

    // Auto-sync Oura (max once per hour)
    const lastSync = localStorage.getItem("julius-oura-sync");
    const oneHourAgo = Date.now() - 3600000;
    if (!lastSync || parseInt(lastSync) < oneHourAgo) {
      fetch("/api/oura/sync").then(() => {
        localStorage.setItem("julius-oura-sync", String(Date.now()));
        getTodayOura(id).then(setOura);
      }).catch(() => {});
    }
  }, [user.id]);

  const dynamicKcal = calculateDynamicKcal(user, oura?.active_calories || 0, macroAdj.kcal);
  const adjustedProtein = user.protein_ziel_g + macroAdj.protein;

  const today = new Date();
  const schedule = TRAINING_SCHEDULE[today.getDay()];
  const todayTraining = schedule ? schedule[userKey as "vincent" | "maria"] : "Ruhetag";

  // Trend calculation
  function trend(current: number | undefined | null, prev: number | undefined | null): number | null {
    if (current == null || prev == null) return null;
    return Math.round(current - prev);
  }

  // Stress color
  const stressColor = (oura?.stress_score || 0) < 30 ? "#10B981" : (oura?.stress_score || 0) < 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-xs font-medium uppercase tracking-[1px]" style={{ color: "var(--text3)" }}>
            {format(today, "EEEE, d. MMMM", { locale: de })}
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: "var(--text)" }}>Hallo {user.name}</h1>
        </div>
        <FamilySwitcher />
      </div>

      {/* Score Rings */}
      <Card className="flex justify-around animate-fade-in stagger-1" glow={scores != null}>
        <ScoreRing value={scores?.readiness ?? null} label="Readiness" color="#7EE2B8" />
        <ScoreRing value={scores?.sleep ?? null} label="Schlaf" color="#79C0FF" />
        <ScoreRing value={Math.min(load, 1000)} max={1000} label="Load 48h" color="#F97316" />
      </Card>

      {/* Cardiovascular Age — prominent */}
      {oura?.cardiovascular_age != null && (
        <Card className="animate-fade-in stagger-1" glow>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--accent)" }}>Biologisches Alter</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "var(--text)" }}>{oura.cardiovascular_age} <span className="text-sm font-normal" style={{ color: "var(--text3)" }}>Jahre</span></p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                Du bist {user.alter_jahre}. Dein Herz ist {oura.cardiovascular_age}.
                {oura.cardiovascular_age < user.alter_jahre && <span style={{ color: "#10B981" }}> ({user.alter_jahre - oura.cardiovascular_age} Jahre juenger)</span>}
              </p>
            </div>
            <Heart size={32} style={{ color: "var(--accent)", opacity: 0.3 }} />
          </div>
        </Card>
      )}

      {/* Oura Metric Cards — 2x3 Grid */}
      {oura && (
        <div className="grid grid-cols-3 gap-2 animate-fade-in stagger-2">
          <MetricCard icon={Activity} value={oura.avg_hrv ? Math.round(oura.avg_hrv) : null} unit="ms" label="HRV" color="#7EE2B8"
            trend={trend(oura.avg_hrv, yesterday?.avg_hrv)} />
          <MetricCard icon={Heart} value={oura.lowest_hr || oura.resting_hr || null} unit="bpm" label="Ruhepuls" color="#EF4444"
            trend={trend(oura.lowest_hr || oura.resting_hr, yesterday?.lowest_hr || yesterday?.resting_hr)} />
          <MetricCard icon={Footprints} value={oura.steps ? oura.steps.toLocaleString() : null} label="Schritte" color="var(--accent)" />
          <MetricCard icon={Flame} value={oura.active_calories || null} unit="kcal" label="Active" color="var(--orange)" />
          <MetricCard icon={Brain} value={oura.stress_score || null} label="Stress" color={stressColor} />
          {oura.vo2_max != null && (
            <MetricCard icon={Wind} value={oura.vo2_max} unit="ml" label="VO2max" color="#79C0FF" />
          )}
          {oura.resilience_level && (
            <MetricCard icon={Activity} value={oura.resilience_level} label="Resilience" color="#7EE2B8" />
          )}
        </div>
      )}

      {/* Life Timeline */}
      <Card className="animate-fade-in stagger-2">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] block mb-3" style={{ color: "var(--text2)" }}>Tagesverlauf</span>
        <LifeTimeline />
      </Card>

      <AutophagieTimer />

      {/* Makros */}
      <Card className="animate-fade-in stagger-3">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: "var(--text2)" }}>Makros heute</span>
          <span className="text-xs font-medium" style={{ color: "var(--text3)" }}>
            {macros.kcal} / {dynamicKcal.target} kcal
          </span>
        </div>
        {(dynamicKcal.activityBonus > 0 || dynamicKcal.trainingBonus > 0) && (
          <p className="text-[10px] mb-2" style={{ color: "var(--accent)" }}>{dynamicKcal.label}</p>
        )}
        <div className="flex flex-col gap-3">
          <MacroBar label="Protein" current={macros.protein_g} target={adjustedProtein} gradient={GRADIENTS.protein} />
          <MacroBar label="Carbs" current={macros.carbs_g} target={200} gradient={GRADIENTS.carbs} />
          <MacroBar label="Fett" current={macros.fett_g} target={80} gradient={GRADIENTS.fett} />
          <MacroBar label="Wasser" current={macros.wasser_ml} target={user.wasser_ziel_ml} gradient={GRADIENTS.wasser} unit="ml" />
        </div>
      </Card>

      {/* Training */}
      <Card className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Dumbbell size={20} style={{ color: "var(--orange)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold">{todayTraining}</p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>
                {training.length > 0 ? `${training[0].name} — RPE ${training[0].rpe || "?"}` : "Noch nicht geloggt"}
              </p>
            </div>
          </div>
          {training.length > 0 ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm glow-pulse"
              style={{ background: "rgba(126,226,184,0.15)", color: "var(--accent)" }}>✓</div>
          ) : (
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          )}
        </div>
      </Card>

      <Card className="animate-fade-in stagger-5">
        <span className="text-[11px] font-semibold uppercase tracking-[1px] block mb-3" style={{ color: "var(--text2)" }}>Supplements</span>
        <SupplementStatus takenSlots={supplements} />
      </Card>

      <Link href="/journal">
        <Card className="animate-fade-in stagger-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(126,226,184,0.1)" }}>
                <BookOpen size={20} style={{ color: "var(--accent)" }} />
              </div>
              <div><p className="text-sm font-semibold">Tages-Journal</p><p className="text-xs" style={{ color: "var(--text2)" }}>Gewohnheiten tracken</p></div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          </div>
        </Card>
      </Link>

      <Link href="/report">
        <Card className="animate-fade-in stagger-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(121,192,255,0.1)" }}>
                <BarChart3 size={20} style={{ color: "var(--accent2)" }} />
              </div>
              <div><p className="text-sm font-semibold">Wochen-Report</p><p className="text-xs" style={{ color: "var(--text2)" }}>Training, Ernaehrung, Schlaf</p></div>
            </div>
            <ChevronRight size={18} style={{ color: "var(--text3)" }} />
          </div>
        </Card>
      </Link>
    </div>
  );
}
